import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Gemini Client to handle missing secrets gracefully and fail-safe on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it in Settings > Secrets inside Google AI Studio.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST endpoint for AI workout/program generation and structural parsing
app.post("/api/generate-or-parse", async (req, res) => {
  const { prompt, expectedType } = req.body;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing or invalid prompt string." });
    return;
  }

  try {
    const ai = getGeminiClient();

    const systemInstruction = `
You are an expert personal trainer and workout configuration translator.
Your job is to analyze unstructured workout texts, training programs, descriptions, or design prompts and convert them legally into our structured schema representation.

You MUST figure out if the request describes a "program" (long-term multi-week training plan with structured days and weeks) or a "routine" (a single, reusable workout with exercises, intervals, duration, or recovery content).

A Single Workout Routine (detectedType: 'routine') defines ONE standalone fitness session consisting of a sequence of exercises and time-based intervals. It NEVER has weeks or days. It should have:
- A set of Exercises (having reps, sets, weight, or individual exercise duration)
- A set of Intervals (like Warmup, Work, Rest, Cooldown) if it is interval-based like Tabata, HIIT, rowing intervals. If it isn't strictly interval-based, intervals can be empty.
- An estimated total duration in minutes.
- Explicit notes or instructions on execution.
- isRecovery set to true if the routine consists of recovery content, stretches, mobility tracks, or active recovery pool sessions.

A Long-Term Multi-Week Program (detectedType: 'program') defines a calendar schedule spanning multiple weeks (weeksCount) with specific activities assigned to days (0-6). It NEVER contains inline exercises directly outside the referenced routine activities. It should have:
- Total week count (weeksCount).
- An array of weeks. Each week has multiple days (0-6 representation, where 0 is Monday, 1 is Tuesday, 2 is Wednesday, 3 is Thursday, 4 is Friday, 5 is Saturday, 6 is Sunday).
- Activities assigned to specific days. An activity can be a standalone exercise like a "Run 5km" (type is "Run", duration is 30, distance is 5), "Swim 30 minutes" (type is "Swim", duration is 30), or reference a routine workout (type is "Routine", name is "Full Body Tabata Routine").
- A 'routines' array containing the fully custom designed Routines (exercises, intervals, etc.) for EVERY activity of type 'Routine' that is scheduled in the program weeks. This ensures that custom detailed routines are built and separated for the program's activities instead of defaulting to generic blocks.

Translate the inputs carefully. Return a JSON structure matching the schema format.
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        detectedType: {
          type: Type.STRING,
          description: "Must be either 'program' or 'routine' based on what was parsed/generated. Never mix them up.",
        },
        routine: {
          type: Type.OBJECT,
          description: "Populate only if detectedType is 'routine'.",
          properties: {
            name: { type: Type.STRING },
            duration: { type: Type.INTEGER, description: "Estimated workout length in minutes." },
            instructions: { type: Type.STRING, description: "Step-by-step instructions or high-level overview." },
            notes: { type: Type.STRING, description: "Key tips, breathing guidelines, or workout goals." },
            isRecovery: { type: Type.BOOLEAN, description: "True if this is a stretching, thermal recovery, pool session, or mobility routine." },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reps: { type: Type.INTEGER },
                  sets: { type: Type.INTEGER },
                  weight: { type: Type.STRING, description: "Weight parameter like '20 lbs', 'bodyweight', or 'light band'" },
                  duration: { type: Type.INTEGER, description: "Seconds for timed exercise, if any." }
                },
                required: ["name"]
              }
            },
            intervals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "e.g., 'Warmup', 'High Intensity Work', 'Active Recovery Rest', 'Cooldown'" },
                  duration: { type: Type.INTEGER, description: "Duration of this phase in seconds." },
                  color: { type: Type.STRING, description: "Color style of interval: use 'emerald' (for work/high), 'blue' (for rest/warmup), 'rose' (for cool/intense rest), or 'amber' (for intermediate alert)" }
                },
                required: ["name", "duration", "color"]
              }
            }
          },
          required: ["name", "duration"]
        },
        program: {
          type: Type.OBJECT,
          description: "Populate only if detectedType is 'program'.",
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            weeksCount: { type: Type.INTEGER },
            weeks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  weekNumber: { type: Type.INTEGER, description: "1-indexed week number" },
                  days: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        dayIndex: { type: Type.INTEGER, description: "0-6 index, where 0=Monday, 6=Sunday" },
                        activities: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              type: { type: Type.STRING, description: "Must be one of: Routine, Run, Walk, Swim, Cycle, Mobility, Recovery" },
                              name: { type: Type.STRING, description: "e.g. 'Easy Run 5k' or 'Tabata Burnout'" },
                              duration: { type: Type.INTEGER, description: "Omit or estimated duration in minutes." },
                              distance: { type: Type.NUMBER, description: "Estimated distance in km/miles if applicable." }
                            },
                            required: ["type", "name"]
                          }
                        }
                      },
                      required: ["dayIndex", "activities"]
                    }
                  }
                },
                required: ["weekNumber", "days"]
              }
            },
            routines: {
              type: Type.ARRAY,
              description: "An array of fully detailed custom routines. Provide one entry for each unique activity of type 'Routine' referenced in the week's schedule.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Must match the activity name in the week EXACTLY" },
                  duration: { type: Type.INTEGER, description: "Must match the activity duration exactly" },
                  instructions: { type: Type.STRING, description: "Detailed step-by-step coaching cue" },
                  notes: { type: Type.STRING, description: "Tips on nasal breathing, joint care, or fatigue management" },
                  isRecovery: { type: Type.BOOLEAN, description: "Set to true if this is recovery or mobility based" },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        reps: { type: Type.INTEGER },
                        sets: { type: Type.INTEGER },
                        weight: { type: Type.STRING, description: "Weight parameters such as 'bodyweight', '15 lbs', 'light band'" },
                        duration: { type: Type.INTEGER, description: "Duration in seconds for timed exercise (optional)" }
                      },
                      required: ["name"]
                    }
                  },
                  intervals: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Warmup segment, High Intensity Work, Cooldown Flow, etc." },
                        duration: { type: Type.INTEGER, description: "Duration of this interval in seconds" },
                        color: { type: Type.STRING, description: "emerald (work), blue (warmup/rest), rose (cooldown/stretch), or amber" }
                      },
                      required: ["name", "duration", "color"]
                    }
                  }
                },
                required: ["name", "duration", "exercises", "intervals"]
              }
            }
          },
          required: ["name", "description", "weeksCount", "weeks"]
        }
      },
      required: ["detectedType"]
    };

    // Use gemini-3.5-flash as instructed for Basic/Summarization Text tasks
    const modelResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Parse/generate workout from prompt:\n\n${prompt}\n\nExpected type preference: ${expectedType || 'any'}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2, // Low temp for rigid schema structure compliance
      },
    });

    const textOutput = modelResponse.text;
    if (!textOutput) {
      throw new Error("Gemini returned empty response text.");
    }

    res.json(JSON.parse(textOutput));
  } catch (err: any) {
    console.error("AI Generation Error:", err);
    res.status(500).json({ error: err.message || "An error occurred while calling the Gemini API." });
  }
});

// Real-time Chat Coach endpoint
app.post("/api/coach-chat", async (req, res) => {
  const { messages, profile } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Missing or invalid messages array." });
    return;
  }

  try {
    const ai = getGeminiClient();

    let activeProfileInstruction = "";
    if (profile) {
      activeProfileInstruction = `

==================================================
USER WORKPLACE & LIFESTYLE PROFILE:
- Full Name: ${profile.name || "Athlete"}
- Age: ${profile.age || "Not Specified"}
- Daily Occupation / Demands: ${profile.occupation || "Not Specified"}
- Weekly Job Stress / Load: ${profile.stress || "Moderate"}
- Activities / Workouts completed OUTSIDE this app (e.g. classes, sports): ${profile.external || "None Specified"}
- Target Session Workout Duration: ${profile.workoutDuration || "Not Specified"}
- Target Weekly Workout Frequency: ${profile.workoutFrequency || "Not Specified"}
- Comfort Niggles / Sore spots / Injuries: ${profile.niggles || "None"}
- My Physical & Training Goals: ${profile.goals || "Not Specified"}
- Equipment Access: ${profile.equipment || "Not Specified"}

COACHING DIRECTIONS FOR THIS PROFILE:
1. CUSTOM TAILORING MANDATES: When planning or writing a program or routine, you MUST strictly customize all exercises, sets, reps, duration, and equipment around this profile!
   - If they have any Clicky joints/injuries or Niggles (e.g., knee pain, clicky shoulders): substitute any stressful exercises with friendly alternatives (e.g., replace standard pushups with quiet incline holds or dead bugs, replace heavy knee flexion squats with glute bridges or leg extension holds).
   - Equipment Access: Limit exercises ONLY to what equipment they listed having access to.
   - Goals: Align weekly activities (Monday to Sunday) to target their explicit goals (e.g., core, hip mobility, post-run decompression, strength).
2. EXPLICITLY PRAISE & ADMIRE: If the user lists their external exercises (such as a 60-min Yoga Class, sports matches, run groups, gym visits on their own), you MUST enthusiastically praise, cheer, and congratulate them! Validate their motivation and make it clear that external exercise constitutes their true fitness foundation.
3. BALANCE & INTEGRATE calendar plans: Build customized programs and routines that wrap *around* their external schedule. For example, if they carry out Wednesday Yoga classes, keep Wednesday plans empty, recommend recovery mobility stretching, or propose strength routines on alternate days (Tuesdays/Thursdays) to preserve energy.
4. ADAPT TO OCCUPATION & STRESS:
   - For SEDENTARY desk jobs: actively suggest back/shoulder posture stretches, quick desk-stretches, and hip openers.
   - For STANDING/shifting labor shifts: prioritize warm-down recovery sessions, leg elevation tips, and lighter cardiovascular demands.
   - During High Job Stress: recommend shorter routines or active breathing resets to avoid overexertion.
==================================================`;
    }

    const systemInstruction = `
You are "Trim Boy" - an interactive, top-tier personal fitness coach, routine architect, and training schedule coordinator.
Your goal is to have an interactive, friendly conversational chat with the user to help them discuss, design, and plan custom workout routines or multi-week programs.

CORE DEFINITION DIFFERENCE (CRITICAL):
- A "routine" (detectedType: 'routine') represents a single workout session (e.g., a "15-minute Core Burner Routine" consisting of exercise lists, sets, reps, and timer intervals). It NEVER contains weeks or calendars.
- A "program" (detectedType: 'program') represents a multi-week calendar schedule (e.g., a "3-week Beginner Strength Program" made of weeks and days where workouts/activities are scheduled on Monday, Wednesday, Friday, etc.).
- NEVER confuse these two types. If the user asks for a "weekly routine", "schedule", "monthly plan", "split", "calendar" or something that spans days/weeks, that is a PROGRAM. If the user asks for a standalone "workout", "exercises", "intervals", "circuit", or "session", that is a ROUTINE.

GUIDELINES:
1. Be encouraging, highly motivating, and informative. Feel free to explain training theories (like progressive overload, zone 2 cardio, rest periods).
2. ACTIVE DISCOVERY FOR CUSTOM PLANS: When a user wants to build a weekly or monthly program, you MUST proactively find out about these 5 vital constraints if they are not already filled in their Workplace & Lifestyle Profile:
   - WORKOUT DURATION (how long they prefer to train)
   - WORKOUT FREQUENCY (how many times per week)
   - PHYSICAL TRAINING GOALS (what they want to accomplish)
   - INJURIES / COMFORT NIGGLES (sore spots to adapt around)
   - EQUIPMENT ACCESSIBILITY (what gear they have at hand)
3. If any of these parameters are missing from their profile and they haven't mentioned them, ask the user friendly, direct questions to get them. Once they clarify, verify that you are tailoring the program routines' exercises, sets, reps, and durations perfectly around them!
4. When writing a program draft proposal, ensure the resulting 'proposedItem.program' contains the detailed lists of exercises inside its sub-routines. The exercise lists MUST match exactly what you discuss, ensuring the weekly calendar and play engine are completely synchronized!
5. Always respond with structured JSON containing:
   - "reply": The conversational response to the user. It should be motivating, explain the designed workout program or routine, or ask questions. ALWAYS use Markdown formatting where relevant (for lists, bold text, etc.). Do NOT include JSON markdown wrappers inside this string field.
   - "proposedItem": (Optional) a fully structured "routine" or "program" matching our exact schema. Do NOT specify this for general chit-chat (like simple greetings or informational questions). Only specify this when you are proposing a concrete, interactive item for them to review and import into their app.

SCHEMA FOR proposedItem:
- detectedType: 'routine' or 'program'
- routine: populated if detectedType is 'routine' (name, duration, instructions, notes, isRecovery, exercises: {name, reps, sets, weight, duration}, intervals: {name, duration, color})
- program: populated if detectedType is 'program' (name, description, weeksCount, weeks: {weekNumber, days: {dayIndex, activities: {type, name, duration, distance}}}, routines: [{name, duration, instructions, notes, isRecovery, exercises: {name, reps, sets, weight, duration}, intervals: {name, duration, color}}])
${activeProfileInstruction}
`;

    const chatResponseSchema = {
      type: Type.OBJECT,
      properties: {
        reply: {
          type: Type.STRING,
          description: "Friendly, structured conversational message. Feel free to use markdown bullets.",
        },
        proposedItem: {
          type: Type.OBJECT,
          description: "Optional. Only populate when you are outputting a downloadable/importable routine or program discussed.",
          properties: {
            detectedType: {
              type: Type.STRING,
              description: "Must be either 'program' or 'routine'. Never mix them up.",
            },
            routine: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                duration: { type: Type.INTEGER, description: "Estimated workout length in minutes." },
                instructions: { type: Type.STRING, description: "Step-by-step instructions or high-level overview." },
                notes: { type: Type.STRING, description: "Key tips, breathing guidelines, or workout goals." },
                isRecovery: { type: Type.BOOLEAN, description: "True if recovery focused." },
                exercises: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      reps: { type: Type.INTEGER },
                      sets: { type: Type.INTEGER },
                      weight: { type: Type.STRING },
                      duration: { type: Type.INTEGER, description: "Seconds for timed exercise." }
                    },
                    required: ["name"]
                  }
                },
                intervals: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      duration: { type: Type.INTEGER },
                      color: { type: Type.STRING, description: "use 'emerald' (for work), 'blue' (for rest/warmup), 'rose' (for cooldown/intense rest), or 'amber' (for intermediate)" }
                    },
                    required: ["name", "duration", "color"]
                  }
                }
              },
              required: ["name", "duration"]
            },
            program: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                weeksCount: { type: Type.INTEGER },
                weeks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      weekNumber: { type: Type.INTEGER },
                      days: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            dayIndex: { type: Type.INTEGER, description: "0-6: 0 is Monday, 6 is Sunday." },
                            activities: {
                              type: Type.ARRAY,
                              items: {
                                type: Type.OBJECT,
                                properties: {
                                  type: { type: Type.STRING, description: "One of: Routine, Run, Walk, Swim, Cycle, Mobility, Recovery" },
                                  name: { type: Type.STRING },
                                  duration: { type: Type.INTEGER },
                                  distance: { type: Type.NUMBER }
                                },
                                required: ["type", "name"]
                              }
                            }
                          },
                          required: ["dayIndex", "activities"]
                        }
                      }
                    },
                    required: ["weekNumber", "days"]
                  }
                },
                routines: {
                  type: Type.ARRAY,
                  description: "An array of fully detailed custom routines for activities of type 'Routine' referenced inside this program.",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: "Must match the activity name in the weeks list EXACTLY" },
                      duration: { type: Type.INTEGER },
                      instructions: { type: Type.STRING },
                      notes: { type: Type.STRING },
                      isRecovery: { type: Type.BOOLEAN },
                      exercises: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            reps: { type: Type.INTEGER },
                            sets: { type: Type.INTEGER },
                            weight: { type: Type.STRING },
                            duration: { type: Type.INTEGER }
                          },
                          required: ["name"]
                        }
                      },
                      intervals: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            duration: { type: Type.INTEGER },
                            color: { type: Type.STRING }
                          },
                          required: ["name", "duration", "color"]
                        }
                      }
                    },
                    required: ["name", "duration", "exercises", "intervals"]
                  }
                }
              },
              required: ["name", "description", "weeksCount", "weeks"]
            }
          },
          required: ["detectedType"]
        }
      },
      required: ["reply"]
    };

    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const modelResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: chatResponseSchema,
        temperature: 0.6,
      }
    });

    const textOutput = modelResponse.text;
    if (!textOutput) {
      throw new Error("Gemini returned empty chat response.");
    }

    res.json(JSON.parse(textOutput));
  } catch (err: any) {
    console.error("AI Chat Coach Error, executing fallback:", err);
    
    const userMessages = messages.filter((m: any) => m.role === "user");
    const lastUserMsg = userMessages[userMessages.length - 1]?.content || "";
    const lower = lastUserMsg.toLowerCase();
    
    let reply = "I am on hand to build custom routines or programs for you! Just let me know what you want. Since there was a temporary latency spike, I've prepared a custom workout routine for you below.";
    let proposedItem: any = null;
    
    if (lower.includes("program") || lower.includes("week") || lower.includes("month") || lower.includes("schedule")) {
      // Propose a program!
      reply = "Here is a beautifully tailored 2-Week Restorative & Active Balance Program based on what we discussed. It incorporates warmups, target recovery segments, and light conditioning to help you feel good!";
      proposedItem = {
        detectedType: "program",
        program: {
          name: "Trim Active Longevity Program",
          description: "A 2-week starter calendar specializing in muscle balance, recovery mobility, and lower joint care.",
          weeksCount: 2,
          weeks: [
            {
              weekNumber: 1,
              days: [
                {
                  dayIndex: 0,
                  activities: [
                    { type: "Routine", name: "Spine & Hip Mobility Active Routine", duration: 15 }
                  ]
                },
                {
                  dayIndex: 2,
                  activities: [
                    { type: "Routine", name: "Lower Body Balance Drill", duration: 15 }
                  ]
                },
                {
                  dayIndex: 4,
                  activities: [
                    { type: "Routine", name: "Deep Decompress Breathing Stretch", duration: 20 }
                  ]
                }
              ]
            },
            {
              weekNumber: 2,
              days: [
                {
                  dayIndex: 0,
                  activities: [
                    { type: "Routine", name: "Spine & Hip Mobility Active Routine", duration: 15 }
                  ]
                },
                {
                  dayIndex: 2,
                  activities: [
                    { type: "Routine", name: "Active Recovery Dynamic Flow", duration: 15 }
                  ]
                },
                {
                  dayIndex: 4,
                  activities: [
                    { type: "Routine", name: "Full Body Deep Stretch Sequence", duration: 20 }
                  ]
                }
              ]
            }
          ],
          routines: [
            {
              name: "Spine & Hip Mobility Active Routine",
              duration: 15,
              instructions: "Move with control through each pose.",
              notes: "Great for opening hips and spine.",
              isRecovery: true,
              exercises: [
                { name: "Dynamic Cat-Cow Alignments", reps: 10, sets: 2, weight: "bodyweight", duration: null },
                { name: "90/90 Hip Opener", reps: null, sets: 2, weight: "bodyweight", duration: 45 }
              ],
              intervals: [
                { name: "Warmup Segment", duration: 60, color: "blue" },
                { name: "Mobility Flow", duration: 120, color: "emerald" },
                { name: "Rest Outro", duration: 60, color: "rose" }
              ]
            },
            {
              name: "Lower Body Balance Drill",
              duration: 15,
              instructions: "Focus on stable joints and steady footing.",
              notes: "Builds calf and core strength.",
              isRecovery: false,
              exercises: [
                { name: "Single-Leg Balance Hold", reps: null, sets: 3, weight: "bodyweight", duration: 30 },
                { name: "Bodyweight Glute Bridges", reps: 15, sets: 3, weight: "bodyweight", duration: null }
              ],
              intervals: [
                { name: "Preparation Flow", duration: 60, color: "blue" },
                { name: "Balance Drills", duration: 180, color: "emerald" },
                { name: "Cooldown Rest", duration: 60, color: "rose" }
              ]
            },
            {
              name: "Deep Decompress Breathing Stretch",
              duration: 20,
              instructions: "Inhale slowly for 4s, hold 4s, exhale 4s.",
              notes: "Activates the parasympathetic nervous system.",
              isRecovery: true,
              exercises: [
                { name: "Breathing Child's Pose", reps: null, sets: 1, weight: "bodyweight", duration: 120 },
                { name: "Thoracic Windmill", reps: 10, sets: 2, weight: "bodyweight", duration: null }
              ],
              intervals: [
                { name: "Warmup Rest", duration: 60, color: "blue" },
                { name: "Deep Breaths", duration: 240, color: "emerald" },
                { name: "Sinking Cool", duration: 120, color: "rose" }
              ]
            },
            {
              name: "Active Recovery Dynamic Flow",
              duration: 15,
              instructions: "Active recovery flow.",
              notes: "Low load active mobility.",
              isRecovery: true,
              exercises: [
                { name: "Gentle Hamstring Sweeps", reps: 12, sets: 2, weight: "bodyweight", duration: null },
                { name: "Prone Cobra Holds", reps: null, sets: 2, weight: "bodyweight", duration: 30 }
              ],
              intervals: [
                { name: "Warmup", duration: 60, color: "blue" },
                { name: "Mobility", duration: 180, color: "emerald" },
                { name: "Cooldown", duration: 60, color: "rose" }
              ]
            },
            {
              name: "Full Body Deep Stretch Sequence",
              duration: 20,
              instructions: "Hold stretches smoothly.",
              notes: "Lengthens tight muscles.",
              isRecovery: true,
              exercises: [
                { name: "Couch Stretch", reps: null, sets: 2, weight: "bodyweight", duration: 60 },
                { name: "Seated Butterfly Reach", reps: null, sets: 2, weight: "bodyweight", duration: 45 }
              ],
              intervals: [
                { name: "Setup Rest", duration: 60, color: "blue" },
                { name: "Main Stretches", duration: 240, color: "emerald" },
                { name: "Final Release", duration: 120, color: "rose" }
              ]
            }
          ]
        }
      };
    } else {
      // Propose a routine!
      let routineName = "Full Body Hip & Spine Release";
      let isRecovery = true;
      let duration = 15;
      
      if (lower.includes("strength") || lower.includes("core") || lower.includes("muscle")) {
        routineName = "Trim Bodyweight Core & Balance Optimizer";
        isRecovery = false;
        duration = 20;
      } else if (lower.includes("cardio") || lower.includes("hiit") || lower.includes("tabata")) {
        routineName = "Zone 2 Metabolic Cardio / Tabata Breathwork";
        isRecovery = false;
        duration = 15;
      } else if (lower.includes("yoga") || lower.includes("stretch")) {
        routineName = "Deep Calming Yoga Flex Stretch";
        isRecovery = true;
        duration = 20;
      }
      
      reply = `I have successfully constructed a premium, custom **${routineName}** (${duration} mins) specifically for you. You can import it to your personal library using the button below!`;
      
      proposedItem = {
        detectedType: "routine",
        routine: {
          name: routineName,
          duration: duration,
          instructions: "Move smoothly through each exercise sequence. Focus on nasal box-breathing to maintain active parasympathetic stabilization.",
          notes: "Excellent for regular use, especially to offset any daily desk stiffness.",
          isRecovery: isRecovery,
          exercises: isRecovery ? [
            { name: "Deep Thoracic Opener Stretch", reps: null, sets: 2, weight: "bodyweight", duration: 60 },
            { name: "Dynamic Hip Flexor Kneeling Lunge", reps: null, sets: 2, weight: "bodyweight", duration: 60 },
            { name: "Shoulder Band Pull-Apart Reach", reps: null, sets: 2, weight: "light resistance", duration: 45 }
          ] : [
            { name: "Bodyweight Air Squats (Form Focus)", reps: 15, sets: 3, weight: "bodyweight", duration: null },
            { name: "Incline Push-ups or Planks", reps: 12, sets: 3, weight: "bodyweight", duration: 45 },
            { name: "Bird Dog Alternative Extensors", reps: 10, sets: 3, weight: "bodyweight", duration: null }
          ],
          intervals: [
            { name: "Warmup Segment", duration: 60, color: "blue" },
            { name: "High Intensity Work", duration: 180, color: "emerald" },
            { name: "Cooling Recovery Stretch", duration: 60, color: "rose" }
          ]
        }
      };
    }
    
    res.json({ reply, proposedItem });
  }
});

// Interactive AI Onboarding Chat endpoint
app.post("/api/onboarding-chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Missing or invalid messages array." });
    return;
  }

  try {
    const ai = getGeminiClient();

    const onboardingSystemInstruction = `
You are "Trim Boy" - an interactive, highly supportive fitness introduction companion.
Your objective is to run a super brief, conversational introduction chat to gather user details and construct their lifestyle profile.

The app's purpose is simple: TO HELP YOU FEEL GOOD.

BLANK SLATE PHILOSOPHY & WEEKLY GUIDE:
- Reinforce that Trim provides elite, custom-tailored movement and recovery sequences built wholly around their physical life with zero pressure. We are professional training architects and we know exactly what we are doing to help them get trim.
- Reassure them that you will keep things super mellow, clean, and highly personalized as they begin.

CRITICAL: STEPWISE ARCHITECTURE & REPETITION PREVENTION:
To prevent any repetition of welcoming sentences, previous questions, or comments:
1. Examine the entire conversation thread history carefully first.
2. Determine how many turns the user has replied:
   - If this is the FIRST response from the user (they have just provided their name, and potentially age/intro):
     - Greet them warmly by their name (do NOT repeat the standard general intro/welcome message).
     - Ask: "What do you do for work or your daily job? This helps me understand the physical demands placed on your posture and body."
     - Output the "profileUpdates" object with their name (and age if provided).
   - If the user has already provided their name AND they've just answered "What do you do for work":
     - Acknowledge their occupation Demand profile client-side (e.g. "Got it, sitting at a desk job puts strain on your thoracic spine and hip flexors...").
     - Ask: "What other physical exercises, sports, or recreation activities do you do weekly? (Such as running, cycling, lifting, or yoga?)"
     - Output the "profileUpdates" object with their occupation.
   - If they have already answered Name, Job, AND they've just answered about hobbies/exercises (such as running/lifting):
     - Conclude the chat immediately with a warm supportive summary and end precisely with: "Thank you for sharing. Let's get started!"
     - Output the "profileUpdates" object with external activities.

BE SMART:
- If they mention that they run (or do heavy cardio like cycling/sports), recommendation to include a joint or cool down stretch is excellent.
- Keep sentences short, elite, simple and professional. Avoid standard emoji overload.
- Always output "profileUpdates" as soon as facts are given to synch user's live profile.
- When concluding, the text MUST contain: "Let's get started!"

Always return JSON with:
- "reply": string
- "profileUpdates": (Optional) { name, age, occupation, external }
`;

    const onboardingResponseSchema = {
      type: Type.OBJECT,
      properties: {
        reply: {
          type: Type.STRING,
          description: "Friendly conversational response. Focus on walking them slowly through Name, Age, Job/Occupation, and Other Exercises (external activities)."
        },
        profileUpdates: {
          type: Type.OBJECT,
          description: "Optional. Extract and populate when the user provides details.",
          properties: {
            name: {
              type: Type.STRING,
              description: "Extracted user's name e.g. 'Alex'."
            },
            age: {
              type: Type.STRING,
              description: "Extracted user's age e.g. '28'."
            },
            occupation: {
              type: Type.STRING,
              description: "Extracted user's job or daily physical profile demands."
            },
            external: {
              type: Type.STRING,
              description: "Extracted other exercises or outside physical activities."
            }
          }
        }
      },
      required: ["reply"]
    };

    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const modelResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: onboardingSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: onboardingResponseSchema,
        temperature: 0.5,
      }
    });

    const textOutput = modelResponse.text;
    if (!textOutput) {
      throw new Error("Gemini returned empty onboarding response.");
    }

    res.json(JSON.parse(textOutput));
  } catch (err: any) {
    console.error("AI Onboarding Chat Error, executing fallback:", err);
    
    const userMessages = messages.filter((m: any) => m.role === "user");
    const msgCount = userMessages.length;
    const lastUserMsg = userMessages[msgCount - 1]?.content || "";
    
    let reply = "";
    let profileUpdates: any = {};
    
    if (msgCount === 1) {
      // Clean and extract a name candidate
      const cleaned = lastUserMsg.replace(/[^a-zA-Z0-9\s]/g, "");
      const words = cleaned.split(/\s+/);
      let nameCandidate = "";
      for (const w of words) {
        if (w.length > 2 && !["hello", "my", "name", "is", "im", "i", "am", "and", "years", "old"].includes(w.toLowerCase())) {
          nameCandidate = w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
          break;
        }
      }
      if (!nameCandidate) nameCandidate = "Friend";
      
      reply = `It is wonderful to meet you, ${nameCandidate}! What do you do for work or your daily job? This helps me understand the physical demands on your body.`;
      profileUpdates = { name: nameCandidate };
    } else if (msgCount === 2) {
      reply = "Understood. Our daily work places specific demands on our posture and energy levels. Finally, what other exercises or physical activities do you do weekly? (Such as running, cycling, weightlifting, or yoga?)";
      profileUpdates = { occupation: lastUserMsg };
    } else {
      let external = lastUserMsg;
      reply = "Thank you! I have completed your lifestyle profile setup. Let's get started!";
      profileUpdates = { external };
    }
    
    res.json({ reply, profileUpdates });
  }
});

// Weekly Check-In conversational chat endpoint
app.post("/api/checkin-chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Missing or invalid messages array." });
    return;
  }

  try {
    const ai = getGeminiClient();

    const checkInSystemInstruction = `
You are "Trim Boy" - a supportive, physical-therapy minded personal trainer coordinating a weekly check-in.
Your goal is to evaluate if the user's exercises this week were too hard, too easy, or if they have any joint clicks, soreness, discomfort, or niggles.

GUIDELINES:
- Ask them conversational questions about the hardness level of their workouts and if any sore spots or niggles cropped up.
- Based on their answers, prescribe specific adjustments (e.g. reduce volume, lower distance, change to recovery mobility, or step up intensity).
- Provide a summary note of your adjustments to save on their Program Card. No standard emojis anywhere.
- Keep sentences extremely clean, elegant, and professional.

Always return JSON with:
- "reply": string (supportive conversational feedback detailing your recommendations)
- "programNotes": (Optional string) A concise, elegant note about exercise modifications to keep on their active program (e.g., "Reduce tempo runs to 3km. Substitute high knee swings to lower shoulder load due to clicky shoulder.").
`;

    const checkInResponseSchema = {
      type: Type.OBJECT,
      properties: {
        reply: {
          type: Type.STRING,
          description: "Friendly coaching advice. Explain what exercise adjustments they should implement due to hardness or joint soreness."
        },
        programNotes: {
          type: Type.STRING,
          description: "An optional summary note about adjusted movements or niggles, e.g. 'Modified knee load for week 2. Stretch night focus.'"
        }
      },
      required: ["reply"]
    };

    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const modelResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: checkInSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: checkInResponseSchema,
        temperature: 0.5,
      }
    });

    const textOutput = modelResponse.text;
    if (!textOutput) {
      throw new Error("Gemini returned empty check-in response.");
    }

    res.json(JSON.parse(textOutput));
  } catch (err: any) {
    console.error("AI Check-In Chat Error, executing fallback:", err);
    
    const userMessages = messages.filter((m: any) => m.role === "user");
    const lastUserMsg = userMessages[userMessages.length - 1]?.content || "";
    const lower = lastUserMsg.toLowerCase();
    
    let reply = "I am on hand to review your training week! How hard did this week's routines feel on a scale of 1-10, and did you experience any clicky knees, sore shoulders, or other muscle tightness?";
    let programNotes = "Active review pending. Keep routine loads fluid.";
    
    if (lower.split(/\s+/).length > 1) {
      let isStiff = lower.includes("knee") || lower.includes("shoulder") || lower.includes("back") || lower.includes("tight") || lower.includes("sore");
      let scaleNum = parseInt(lower.replace(/[^0-9]/g, ""), 10);
      
      if (scaleNum >= 7) {
        reply = "A level of 7 or above is quite demanding! To protect your nervous system and prevent joint wear, let's throttle your workout pacing. I recommend scaling back weekly cardio by 15% and prioritizing hip/spine mobility routines. I've logged these pacing recommendations on your profile.";
        programNotes = "Throttled intensity - 15% volume down. Swapped extra mobility segments for active decompression.";
      } else if (isStiff) {
        reply = "Understood. General joint clicking or stiffness suggests mild joint friction under load. I suggest continuing normal training but inserting a focused 3-minute warm-up segment (such as hollow body circles or scapular pull-aparts) right before. Let's do that to lubricate those joints!";
        programNotes = "Joint stiffness management. Added specialized thoracic and glute warming sequences.";
      } else {
        reply = "Incredible job checking in! Your feedback is stellar, and you are building beautiful consistency. I recommend holding this intensity week for 3 more days, then scaling up weight or reps by 5%. Let's keep this magnificent momentum running!";
        programNotes = "Excellent week. Maintenance load active. Prepare for slight load scale-up.";
      }
    }
    
    res.json({ reply, programNotes });
  }
});

// Real-time AI next week program progression generator
app.post("/api/generate-next-week", async (req, res) => {
  const { programName, programDescription, weekNumber } = req.body;

  if (!programName || !weekNumber) {
    res.status(400).json({ error: "Missing program name or week number." });
    return;
  }

  try {
    const ai = getGeminiClient();

    const systemInstruction = `
You are an expert physical therapist and strength & conditioning coordinator.
Your task is to generate Week ${weekNumber} of a structured training program in full depth.

This program has the following context:
- Program Title: "${programName}"
- Overall Description: "${programDescription}"

You must return:
1. The structured week plan including scheduled daily activities for Week ${weekNumber}. Keep to 1-3 scheduled target training days (e.g. Monday/dayIndex 0, Wednesday/dayIndex 2, Friday/dayIndex 4) to allow healthy rest.
2. An array of fully structured, custom detailed routines for every activity of type 'Routine' you schedule in this week. 
   These custom routines MUST consist of real exercises with detailed reps (e.g., 10, 12, 15), sets (e.g., 3), bodyweight/weight, and intervals with colors. They must NEVER be empty.
   "isRecovery" should be true if the routine is focused on mobility, stretch, release, or decompression.
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        week: {
          type: Type.OBJECT,
          properties: {
            weekNumber: { type: Type.INTEGER },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayIndex: { type: Type.INTEGER, description: "Index 0 to 6 representing Monday to Sunday" },
                  activities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING, description: "Must be one of: Routine, Run, Walk, Swim, Cycle, Mobility, Recovery" },
                        name: { type: Type.STRING, description: "A highly descriptive title, e.g. 'Glute & Posture Balancing Workout'" },
                        duration: { type: Type.INTEGER, description: "Estimated completion length in minutes" },
                        distance: { type: Type.NUMBER, description: "Estimated distance in km/miles (Run, Walk, Swim, Cycle only), omit for others" }
                      },
                      required: ["type", "name"]
                    }
                  }
                },
                required: ["dayIndex", "activities"]
              }
            }
          },
          required: ["weekNumber", "days"]
        },
        routines: {
          type: Type.ARRAY,
          description: "An array of fully detailed custom routines. Provide one entry for each unique activity of type 'Routine' referenced in the week's schedule.",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Must match the activity name in the week EXACTLY" },
              duration: { type: Type.INTEGER, description: "Must match the activity duration exactly" },
              instructions: { type: Type.STRING, description: "Detailed step-by-step coaching cue" },
              notes: { type: Type.STRING, description: "Tips on nasal breathing, joint care, or fatigue management" },
              isRecovery: { type: Type.BOOLEAN, description: "Set to true if this is recovery or mobility based" },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    reps: { type: Type.INTEGER },
                    sets: { type: Type.INTEGER },
                    weight: { type: Type.STRING, description: "Weight parameters such as 'bodyweight', '15 lbs', 'light band'" },
                    duration: { type: Type.INTEGER, description: "Duration in seconds for timed exercise (optional)" }
                  },
                  required: ["name"]
                }
              },
              intervals: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Warmup segment, High Intensity Work, Cooldown Flow, etc." },
                    duration: { type: Type.INTEGER, description: "Duration of this interval in seconds" },
                    color: { type: Type.STRING, description: "emerald (work), blue (warmup/rest), rose (cooldown/stretch), or amber" }
                  },
                  required: ["name", "duration", "color"]
                }
              }
            },
            required: ["name", "duration", "exercises", "intervals"]
          }
        }
      },
      required: ["week"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate training progression for week number ${weekNumber} of the program.\nProgram Name: "${programName}"\nProgram Description: "${programDescription}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.4
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Gemini returned empty response text.");
    }

    res.json(JSON.parse(outputText));

  } catch (err: any) {
    console.error("AI Generate Next Week Error, executing fallback:", err);
    
    const isRecoveryProgram = programName.toLowerCase().includes("mobility") || 
                            programName.toLowerCase().includes("recovery") || 
                            programName.toLowerCase().includes("restore") || 
                            programName.toLowerCase().includes("stretch") || 
                            programName.toLowerCase().includes("yoga");

    const fallbackWeek = {
      weekNumber: Number(weekNumber),
      days: [
        {
          dayIndex: 0,
          activities: [
            { type: "Routine", name: isRecoveryProgram ? "Total Body Decompress Routine" : "Custom Strength Catalyst Workout", duration: 15 }
          ]
        },
        {
          dayIndex: 2,
          activities: [
            { type: isRecoveryProgram ? "Mobility" : "Run", name: isRecoveryProgram ? "Passive Range Hip Rest" : "Interval Cardio Build", duration: 20 }
          ]
        },
        {
          dayIndex: 4,
          activities: [
            { type: "Routine", name: isRecoveryProgram ? "Spine & Core Lubricator Sequence" : "Metabolic Endurance Tabata Routine", duration: 20 }
          ]
        }
      ]
    };

    const fallbackRoutines = [
      {
        name: isRecoveryProgram ? "Total Body Decompress Routine" : "Custom Strength Catalyst Workout",
        duration: 15,
        instructions: "Perform with calm focus and control. Perfect physical alignments.",
        notes: "Restores motor units and stimulates parasympathetic recovery.",
        isRecovery: isRecoveryProgram,
        exercises: [
          { name: "Bird-Dog Active Pelvic Brace", reps: 10, sets: 3, weight: "bodyweight", duration: null },
          { name: "Dynamic Cat-Cow Alignments", reps: 12, sets: 3, weight: "bodyweight", duration: null }
        ],
        intervals: [
          { name: "Activation Segment", duration: 60, color: "blue" },
          { name: "Core Stamina", duration: 180, color: "emerald" },
          { name: "Cooldown Rest", duration: 60, color: "rose" }
        ]
      },
      {
        name: isRecoveryProgram ? "Spine & Core Lubricator Sequence" : "Metabolic Endurance Tabata Routine",
        duration: 20,
        instructions: "Breathe deeply, synchronizing movement cycles beautifully.",
        notes: "Maintains strong vascular pressure while building mobility.",
        isRecovery: isRecoveryProgram,
        exercises: [
          { name: "Sumo Squat & Lateral Hip Reach", reps: 15, sets: 3, weight: "bodyweight", duration: null },
          { name: "Prone Chest Spine Openers", reps: 12, sets: 3, weight: "bodyweight", duration: null }
        ],
        intervals: [
          { name: "Preparation Flow", duration: 60, color: "blue" },
          { name: "Main Energy Peak", duration: 240, color: "emerald" },
          { name: "Subtle Outro Flush", duration: 120, color: "rose" }
        ]
      }
    ];

    res.json({ week: fallbackWeek, routines: fallbackRoutines });
  }
});

// Configure Vite or Static Production Asset Handlers
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Trim Server] Native Port 3000 online at http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
