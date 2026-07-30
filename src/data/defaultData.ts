import { Routine, Program } from '../types';

export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: "routine-tabata",
    name: "Full Body Tabata",
    duration: 4,
    instructions: "High-intensity aerobic interval workout. Perform maximum effort during the active periods and fully relax during the rest phases.",
    notes: "Perfect for fat burner stimulation. Focus on speed and solid form.",
    isFavourite: true,
    recentlyUsedAt: null,
    isRecovery: false,
    tags: ["tabata", "strength"],
    exercises: [
      { id: "e1", name: "Jumping Jacks", reps: null, sets: null, weight: null, duration: 20 },
      { id: "e2", name: "Bodyweight Squats", reps: null, sets: null, weight: null, duration: 20 },
      { id: "e3", name: "Push-ups", reps: null, sets: null, weight: null, duration: 20 },
      { id: "e4", name: "High Knees", reps: null, sets: null, weight: null, duration: 20 }
    ],
    intervals: [
      { id: "i1", name: "Warm-up Phase", duration: 10, color: "blue" },
      { id: "i2", name: "Work Round 1", duration: 20, color: "emerald" },
      { id: "i3", name: "Rest Round 1", duration: 10, color: "rose" },
      { id: "i4", name: "Work Round 2", duration: 20, color: "emerald" },
      { id: "i5", name: "Rest Round 2", duration: 10, color: "rose" },
      { id: "i6", name: "Work Round 3", duration: 20, color: "emerald" },
      { id: "i7", name: "Rest Round 3", duration: 10, color: "rose" },
      { id: "i8", name: "Work Round 4", duration: 20, color: "emerald" },
      { id: "i9", name: "Rest Round 4", duration: 10, color: "rose" },
      { id: "i10", name: "Cool-down stretch", duration: 20, color: "blue" }
    ]
  },
  {
    id: "routine-strength",
    name: "Upper Body Strength Circuit",
    duration: 35,
    instructions: "Designed for progressive muscular development. Perform each set back-to-back with 60-90 seconds of rest in between.",
    notes: "Keep weights heavy but controlled. Maintain neutral core stability.",
    isFavourite: true,
    recentlyUsedAt: null,
    isRecovery: false,
    tags: ["strength"],
    exercises: [
      { id: "s1", name: "Dumbbell Chest Press", reps: 10, sets: 4, weight: "40 lbs", duration: null },
      { id: "s2", name: "Bent-Over Rows", reps: 12, sets: 4, weight: "35 lbs", duration: null },
      { id: "s3", name: "Seated Overhead Press", reps: 8, sets: 3, weight: "25 lbs", duration: null },
      { id: "s4", name: "Dumbbell Bicep Curls", reps: 12, sets: 3, weight: "15 lbs", duration: null }
    ],
    intervals: []
  },
  {
    id: "routine-pool",
    name: "Pool Recovery Session",
    duration: 20,
    instructions: "Under-water active decompression workout. Uses water density buoyancy to stretch active muscles without heavy load.",
    notes: "Focus on slow breathing, letting the water take the strain off your joints.",
    isFavourite: false,
    recentlyUsedAt: null,
    isRecovery: true,
    tags: ["recovery", "mobility"],
    exercises: [
      { id: "p1", name: "Water float relaxation", reps: null, sets: null, weight: null, duration: 120 },
      { id: "p2", name: "Pool-side kick mobility", reps: null, sets: null, weight: null, duration: 180 },
      { id: "p3", name: "Aquatic leg swings", reps: 15, sets: 2, weight: "Water depth", duration: null }
    ],
    intervals: [
      { id: "pi1", name: "Buoyancy Float", duration: 60, color: "blue" },
      { id: "pi2", name: "Decompression Drag", duration: 120, color: "blue" },
      { id: "pi3", name: "Dynamic Stretches", duration: 120, color: "emerald" }
    ]
  },
  {
    id: "routine-rowing",
    name: "Rowing Intervals",
    duration: 10,
    instructions: "High aerobic rowing sequences. Drive hard in work phases pushing split times, hold steady pace in recovery lines.",
    notes: "Ensure complete extension of legs before leaning torso back.",
    isFavourite: false,
    recentlyUsedAt: null,
    isRecovery: false,
    tags: ["tabata"],
    exercises: [
      { id: "r1", name: "High Drag Row", reps: null, sets: null, weight: "Resistance 8", duration: null }
    ],
    intervals: [
      { id: "ri1", name: "Steady Row Warmup", duration: 60, color: "blue" },
      { id: "ri2", name: "Sprint Drive 1", duration: 60, color: "emerald" },
      { id: "ri3", name: "Active Rest 1", duration: 30, color: "rose" },
      { id: "ri4", name: "Sprint Drive 2", duration: 60, color: "emerald" },
      { id: "ri5", name: "Active Rest 2", duration: 30, color: "rose" },
      { id: "ri6", name: "Cooldown Glide", duration: 60, color: "blue" }
    ]
  },
  {
    id: "routine-yoga",
    name: "Sunset Yoga Stretch Flow",
    duration: 15,
    instructions: "A restorative, breathing-centered yoga sequence to mobilize full-body joint complexes.",
    notes: "Sync long inhales and slow exhales to release tension.",
    isFavourite: false,
    recentlyUsedAt: null,
    isRecovery: true,
    tags: ["yoga", "mobility"],
    exercises: [
      { id: "y1", name: "Sun Salutation Transitions", reps: 5, sets: 1, weight: "bodyweight", duration: null },
      { id: "y2", name: "Warrior I to Warrior II", reps: null, sets: 2, weight: "bodyweight", duration: 60 },
      { id: "y3", name: "Extended Cobra Hold", reps: null, sets: 1, weight: "bodyweight", duration: 90 }
    ],
    intervals: []
  },
  {
    id: "routine-hip-restoration",
    name: "Deep Hip Mobility Release",
    duration: 12,
    instructions: "Focused decompression for lower back, glutes, and hips. Beneficial for desktop-bound workers.",
    notes: "Hold static positions for full structural release, avoiding bounce stretches.",
    isFavourite: false,
    recentlyUsedAt: null,
    isRecovery: true,
    tags: ["mobility", "recovery"],
    exercises: [
      { id: "h1", name: "90/90 Hip Mobilization", reps: 10, sets: 3, weight: "bodyweight", duration: null },
      { id: "h2", name: "Deep Pigeon Stretch Hold", reps: null, sets: 2, weight: "bodyweight", duration: 120 }
    ],
    intervals: []
  }
];

export const DEFAULT_PROGRAMS: Program[] = [
  {
    id: "program-fatloss",
    name: "12 Week Fat Loss Program",
    description: "A comprehensive core conditioning schedule prioritizing interval fat-burning Tabatas mixed with standalone outdoor cardio and swimming routines.",
    weeksCount: 12,
    isArchived: false,
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            dayIndex: 0, // Monday
            activities: [
              { id: "act1", type: "Routine", name: "Full Body Tabata", routineId: "routine-tabata", duration: 4, distance: null, completed: false, completedAt: null }
            ]
          },
          {
            dayIndex: 2, // Wednesday
            activities: [
              { id: "act2", type: "Run", name: "Outdoor steady-state 5km run", routineId: null, duration: 30, distance: 5.0, completed: false, completedAt: null }
            ]
          },
          {
            dayIndex: 4, // Friday
            activities: [
              { id: "act3", type: "Swim", name: "Cardio pool laps 30 min", routineId: null, duration: 30, distance: null, completed: false, completedAt: null }
            ]
          }
        ]
      },
      {
        weekNumber: 2,
        days: [
          {
            dayIndex: 0, // Monday
            activities: [
              { id: "act4", type: "Routine", name: "Full Body Tabata with progression", routineId: "routine-tabata", duration: 4, distance: null, completed: false, completedAt: null }
            ]
          },
          {
            dayIndex: 2, // Wednesday
            activities: [
              { id: "act5", type: "Run", name: "Fartlek Hill Run 6km", routineId: null, duration: 35, distance: 6.0, completed: false, completedAt: null }
            ]
          },
          {
            dayIndex: 4, // Friday
            activities: [
              { id: "act6", type: "Swim", name: "Sprint laps pool 35 min", routineId: null, duration: 35, distance: null, completed: false, completedAt: null }
            ]
          }
        ]
      },
      {
        weekNumber: 3,
        days: [
          {
            dayIndex: 0, // Monday
            activities: [
              { id: "act7", type: "Routine", name: "Full Body Tabata max output", routineId: "routine-tabata", duration: 4, distance: null, completed: false, completedAt: null }
            ]
          },
          {
            dayIndex: 2, // Wednesday
            activities: [
              { id: "act8", type: "Run", name: "Aerobic Base 7km run Plan", routineId: null, duration: 45, distance: 7.0, completed: false, completedAt: null }
            ]
          },
          {
            dayIndex: 4, // Friday
            activities: [
              { id: "act9", type: "Swim", name: "Recovery Breaststroke Swim", routineId: null, duration: 30, distance: null, completed: false, completedAt: null }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "program-running",
    name: "Beginner Running Program",
    description: "An easy-entry structural run plan utilizing dynamic run/walk protocols, physical recovery stretches, and water-based buoyancy routines.",
    weeksCount: 3,
    isArchived: false,
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            dayIndex: 0, // Monday
            activities: [
              { id: "act10", type: "Walk", name: "Warmup walk with high knees 2km", routineId: null, duration: 20, distance: 2.0, completed: false, completedAt: null }
            ]
          },
          {
            dayIndex: 2, // Wednesday
            activities: [
              { id: "act11", type: "Mobility", name: "Joint dynamic warm stretch", routineId: null, duration: 15, distance: null, completed: false, completedAt: null }
            ]
          },
          {
            dayIndex: 5, // Saturday
            activities: [
              { id: "act12", type: "Run", name: "Steady slow beginner block 3km", routineId: null, duration: 25, distance: 3.0, completed: false, completedAt: null }
            ]
          }
        ]
      },
      {
        weekNumber: 2,
        days: [
          {
            dayIndex: 0, // Monday
            activities: [
              { id: "act13", type: "Walk", name: "Interval Walk/Shuffle 3km", routineId: null, duration: 25, distance: 3.0, completed: false, completedAt: null }
            ]
          },
          {
            dayIndex: 2, // Wednesday
            activities: [
              { id: "act14", type: "Recovery", name: "Deep static stretching", routineId: null, duration: 20, distance: null, completed: false, completedAt: null }
            ]
          },
          {
            dayIndex: 5, // Saturday
            activities: [
              { id: "act15", type: "Run", name: "Continuous stride run 3.5km", routineId: null, duration: 28, distance: 3.5, completed: false, completedAt: null }
            ]
          }
        ]
      },
      {
        weekNumber: 3,
        days: [
          {
            dayIndex: 0, // Monday
            activities: [
              { id: "act16", type: "Walk", name: "Active recovery tempo walk 4km", routineId: null, duration: 35, distance: 4.0, completed: false, completedAt: null }
            ]
          },
          {
            dayIndex: 2, // Wednesday
            activities: [
              { id: "act17", type: "Routine", name: "Pool Decompression Recovery Session", routineId: "routine-pool", duration: 20, distance: null, completed: false, completedAt: null }
            ]
          },
          {
            dayIndex: 5, // Saturday
            activities: [
              { id: "act18", type: "Run", name: "Performance running benchmark 5km", routineId: null, duration: 32, distance: 5.0, completed: false, completedAt: null }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "program-strength-builder",
    name: "Strength Builder",
    description: "Organized long-term routine scheduling to drive compound upper-body load combined with rowing threshold intervals and recovery mobility layers.",
    weeksCount: 4,
    isArchived: false,
    weeks: [
      {
        weekNumber: 1,
        days: [
          {
            dayIndex: 0, // Monday
            activities: [
              { id: "act19", type: "Routine", name: "Upper Body Strength Circuit", routineId: "routine-strength", duration: 35, distance: null, completed: false, completedAt: null }
            ]
          },
          {
            dayIndex: 2, // Wednesday
            activities: [
              { id: "act20", type: "Mobility", name: "Spine & chest extension yoga", routineId: null, duration: 20, distance: null, completed: false, completedAt: null }
            ]
          },
          {
            dayIndex: 4, // Friday
            activities: [
              { id: "act21", type: "Routine", name: "Rowing Intervals Session", routineId: "routine-rowing", duration: 10, distance: null, completed: false, completedAt: null }
            ]
          }
        ]
      }
    ]
  }
];
