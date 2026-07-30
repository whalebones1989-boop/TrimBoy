/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Exercise {
  id: string;
  name: string;
  reps: number | null;
  sets: number | null;
  weight: string | null; // e.g. "20 lbs" or "bodyweight"
  duration: number | null; // in seconds
}

export interface IntervalItem {
  id: string;
  name: string; // e.g. "Work", "Rest", "Warmup", "Cooldown"
  duration: number; // in seconds
  color: string; // e.g. "emerald", "rose", "blue", "amber"
}

export interface Routine {
  id: string;
  name: string;
  exercises: Exercise[];
  intervals: IntervalItem[];
  duration: number; // estimated duration in minutes
  instructions: string;
  notes: string;
  isFavourite: boolean;
  recentlyUsedAt: string | null; // ISO string
  isRecovery: boolean; // Flag if routine contains recovery content 
  tags?: string[]; // Tag category list: strength, mobility, recovery, tabata, yoga, etc.
  isAiGenerated?: boolean;
  useEquipment?: boolean;
  equipmentDetails?: string;
}

export type ActivityType = 'Routine' | 'Run' | 'Walk' | 'Swim' | 'Cycle' | 'Mobility' | 'Recovery';

export interface Activity {
  id: string;
  type: ActivityType;
  name: string; // e.g. "Full Body Tabata Routine" or "Run 5km" or "Swim 30 mins"
  routineId: string | null; // Referenced routine if type === 'Routine'
  duration: number | null; // Duration in minutes for standalone, or fetched on load
  distance: number | null; // Distance in km/miles for Runs/Cycle/Walks
  completed: boolean;
  completedAt: string | null; // ISO string when completed
}

export interface Day {
  dayIndex: number; // 0 = Monday, 1 = Tuesday ... 6 = Sunday
  activities: Activity[];
}

export interface Week {
  weekNumber: number; // 1-indexed
  days: Day[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  weeksCount: number;
  weeks: Week[];
  isArchived: boolean;
  sharedFrom?: string; // Optional indicator of source
  notes?: string; // Optional coach check-in notes
  isAiGenerated?: boolean;
}

export interface WorkoutHistory {
  id: string;
  routineId?: string;
  programId?: string;
  activityId?: string;
  name: string;
  type: ActivityType | 'Routine';
  durationCompleted: number; // in minutes/seconds
  completedAt: string;
  notes?: string;
}
