/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routine, Exercise, IntervalItem } from '../types';

export function generateRoutineFromActivity(name: string, durationMin: number = 15, idOverride?: string): Routine {
  const seed = idOverride 
    ? idOverride.replace(/[^a-zA-Z0-9]/g, '').slice(-6) 
    : Math.random().toString(36).substr(2, 9);
  const id = idOverride || `ai-routine-${seed}`;
  const lowercaseName = name.toLowerCase();

  let exercises: Exercise[] = [];
  let intervals: IntervalItem[] = [];
  let instructions = "";
  let notes = "";
  let isRecovery = false;

  if (
    lowercaseName.includes('spine') || 
    lowercaseName.includes('hip') || 
    lowercaseName.includes('mobility') || 
    lowercaseName.includes('stretch') || 
    lowercaseName.includes('decompress') || 
    lowercaseName.includes('recovery') || 
    lowercaseName.includes('yoga') || 
    lowercaseName.includes('flex') || 
    lowercaseName.includes('foam') || 
    lowercaseName.includes('joint') || 
    lowercaseName.includes('back') || 
    lowercaseName.includes('neck') || 
    lowercaseName.includes('hamstring') || 
    lowercaseName.includes('glute') || 
    lowercaseName.includes('flow') || 
    lowercaseName.includes('restorative') ||
    lowercaseName.includes('warm') ||
    lowercaseName.includes('cool')
  ) {
    isRecovery = true;
    exercises = [
      { id: `ex-gen-${seed}-0`, name: "Cat-Cow Dynamic Warmup Spine Lubrication", reps: null, sets: 2, duration: 45, weight: "bodyweight" },
      { id: `ex-gen-${seed}-1`, name: "90/90 Hips Mobilizer Sequence", reps: null, sets: 2, duration: 60, weight: "bodyweight" },
      { id: `ex-gen-${seed}-2`, name: "Thoracic Windmill Rotation Stretch", reps: null, sets: 2, duration: 45, weight: "bodyweight" },
      { id: `ex-gen-${seed}-3`, name: "Deep Couch Hip Flexor Release", reps: null, sets: 2, duration: 60, weight: "bodyweight" },
      { id: `ex-gen-${seed}-4`, name: "Child's Pose Diaphragmatic Breath Expansion", reps: null, sets: 1, duration: 90, weight: "bodyweight" }
    ];
    intervals = [
      { id: `int-gen-${seed}-0`, name: "Nervous System & Base Setup", duration: 60, color: "blue" },
      { id: `int-gen-${seed}-1`, name: "Dynamic Articulation Segments", duration: 180, color: "blue" },
      { id: `int-gen-${seed}-2`, name: "Targeted Tissue Decompression", duration: 240, color: "emerald" },
      { id: `int-gen-${seed}-3`, name: "Deep Restful Parasympathetic Outro", duration: 120, color: "rose" }
    ];
    instructions = `Move slowly and focus on complete nasal breathing. Never force joints past their sweet spot.`;
    notes = `Excellent recovery sequence to melt desk-worker stiffness, clicking knees, and upper back stress.`;
  } else if (
    lowercaseName.includes('strength') || 
    lowercaseName.includes('core') || 
    lowercaseName.includes('abs') || 
    lowercaseName.includes('muscle') || 
    lowercaseName.includes('upper') || 
    lowercaseName.includes('lower') || 
    lowercaseName.includes('bodyweight') || 
    lowercaseName.includes('push') || 
    lowercaseName.includes('pull') || 
    lowercaseName.includes('squat') || 
    lowercaseName.includes('conditioning') || 
    lowercaseName.includes('kettlebell') || 
    lowercaseName.includes('dumbbell') || 
    lowercaseName.includes('athlete') || 
    lowercaseName.includes('power') ||
    lowercaseName.includes('tier') ||
    lowercaseName.includes('burnout')
  ) {
    exercises = [
      { id: `ex-gen-${seed}-0`, name: "Bird-Dog Alternating Extensors (Bracing)", reps: 10, sets: 3, duration: null, weight: "bodyweight" },
      { id: `ex-gen-${seed}-1`, name: "Tempo Air Squats (Glutes & Quads)", reps: 15, sets: 3, duration: null, weight: "bodyweight" },
      { id: `ex-gen-${seed}-2`, name: "Dead-Bug Alternate Arm/Leg Core Bracing", reps: 8, sets: 3, duration: null, weight: "bodyweight" },
      { id: `ex-gen-${seed}-3`, name: "Slow Negative Push-ups (Chest & Shoulders)", reps: 12, sets: 3, duration: null, weight: "bodyweight" },
      { id: `ex-gen-${seed}-4`, name: "Plank Shoulder Tap Rotations", reps: 15, sets: 3, duration: null, weight: "bodyweight" }
    ];
    intervals = [
      { id: `int-gen-${seed}-0`, name: "Dynamic Mobility Activation", duration: 90, color: "blue" },
      { id: `int-gen-${seed}-1`, name: "Core & Pelvis Activation Set", duration: 120, color: "amber" },
      { id: `int-gen-${seed}-2`, name: "Strength Work Intervals", duration: 450, color: "emerald" },
      { id: `int-gen-${seed}-3`, name: "Deep Core Compression Hold", duration: 120, color: "rose" }
    ];
    instructions = `Keep a rock-solid core spine brace throughout. Move with slow eccentric pacing for ultimate control.`;
    notes = `Core-centric bodyweight resistance sequence to safely build joint stability and physical endurance.`;
  } else if (
    lowercaseName.includes('cardio') || 
    lowercaseName.includes('hiit') || 
    lowercaseName.includes('tabata') || 
    lowercaseName.includes('interval') || 
    lowercaseName.includes('metabolic') || 
    lowercaseName.includes('zone 2') || 
    lowercaseName.includes('aerobic') || 
    lowercaseName.includes('sprint') || 
    lowercaseName.includes('heart') ||
    lowercaseName.includes('stamina')
  ) {
    exercises = [
      { id: `ex-gen-${seed}-0`, name: "Jumping Jacks (Steady Aerobic Stamina)", reps: null, sets: 3, duration: 45, weight: "bodyweight" },
      { id: `ex-gen-${seed}-1`, name: "High Knees Pump (Heart Rate Spike)", reps: null, sets: 3, duration: 30, weight: "bodyweight" },
      { id: `ex-gen-${seed}-2`, name: "Lateral Side-Skater Shuffles", reps: null, sets: 3, duration: 45, weight: "bodyweight" },
      { id: `ex-gen-${seed}-3`, name: "Mountain Climber Interval Sprint", reps: null, sets: 3, duration: 30, weight: "bodyweight" },
      { id: `ex-gen-${seed}-4`, name: "Shadow Boxing Pace Rest", reps: null, sets: 1, duration: 60, weight: "bodyweight" }
    ];
    intervals = [
      { id: `int-gen-${seed}-0`, name: "Heart Rate Step Warmup", duration: 90, color: "blue" },
      { id: `int-gen-${seed}-1`, name: "High Intensity Work Interval", duration: 45, color: "emerald" },
      { id: `int-gen-${seed}-2`, name: "Low-Intensity Active Rest Step", duration: 45, color: "blue" },
      { id: `int-gen-${seed}-3`, name: "Metabolic Outro Flush", duration: 120, color: "rose" }
    ];
    instructions = `Focus on fast nose-only recovery inhales/exhales during the active recovery intervals.`;
    notes = `Designed to elevate cardiovascular efficiency and expand active lung capacity.`;
  } else {
    // Default tailored balance routine
    exercises = [
      { id: `ex-gen-${seed}-0`, name: "Active Hamstring Sweeps Warmup", reps: null, sets: 1, duration: 60, weight: "bodyweight" },
      { id: `ex-gen-${seed}-1`, name: "Sumo Squat & Lateral Shoulder Reach", reps: null, sets: 2, duration: 60, weight: "bodyweight" },
      { id: `ex-gen-${seed}-2`, name: "Glute Bridge Single-Leg Holds", reps: null, sets: 2, duration: 45, weight: "bodyweight" },
      { id: `ex-gen-${seed}-3`, name: "Prone Cobra Dynamic Hold Extension", reps: null, sets: 2, duration: 45, weight: "bodyweight" }
    ];
    intervals = [
      { id: `int-gen-${seed}-0`, name: "Dynamic Alignment Setup", duration: 60, color: "blue" },
      { id: `int-gen-${seed}-1`, name: "Full Body Sequence Flow", duration: 240, color: "emerald" },
      { id: `int-gen-${seed}-2`, name: "Stamina Maintenance Section", duration: 180, color: "amber" },
      { id: `int-gen-${seed}-3`, name: "Acoustic Parasympathetic Recovery", duration: 120, color: "rose" }
    ];
    instructions = `Sync each movement with deep box-breathing to maintain balanced cardiovascular pressure.`;
    notes = `A classic active lifestyle routine to sustain peak joint freedom and movement efficiency.`;
  }

  // Calculate approximate intervals total duration if needed, 
  // or adjust interval times to match estimated duration.
  // We can scale the main work interval to loosely fit the desired durationMin.
  const intervalsTotalS = intervals.reduce((acc, curr) => acc + curr.duration, 0);
  const targetTotalS = durationMin * 60;
  if (Math.abs(intervalsTotalS - targetTotalS) > 60) {
    // scale intervals to fit the desired durationMin beautifully!
    const ratio = targetTotalS / intervalsTotalS;
    intervals = intervals.map(item => ({
      ...item,
      duration: Math.max(15, Math.round(item.duration * ratio))
    }));
  }

  return {
    id,
    name: name,
    duration: durationMin,
    isFavourite: false,
    recentlyUsedAt: null,
    isRecovery,
    exercises,
    intervals: [], // Ensure dynamic routines play their exact physical exercises in player
    instructions,
    notes
  };
}

export function findMatchingRoutine(routines: Routine[], actName: string, routineId?: string | null): Routine | undefined {
  if (routineId) {
    const byId = routines.find(r => r.id === routineId);
    if (byId) return byId;
  }
  
  const simplify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const simplifiedTarget = simplify(actName);
  if (!simplifiedTarget) return undefined;

  // 1. Try exact after simplification
  let matched = routines.find(r => simplify(r.name) === simplifiedTarget);
  if (matched) return matched;

  // 2. Try partial match (target inside routine name or vice-versa)
  matched = routines.find(r => {
    const sName = simplify(r.name);
    return sName.length > 2 && (sName.includes(simplifiedTarget) || simplifiedTarget.includes(sName));
  });
  if (matched) return matched;

  return undefined;
}

