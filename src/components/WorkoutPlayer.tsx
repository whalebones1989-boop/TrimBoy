/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Routine, Exercise, IntervalItem } from '../types';
import { playBuzzer, playCountdownTick, playTransitionEndSound } from '../utils/audio';
import { Volume2, VolumeX } from 'lucide-react';

interface WorkoutPlayerProps {
  routine: Routine;
  onClose: () => void;
  onComplete: (durationMinutes: number, feedbackNotes: string) => void;
  theme?: string;
  defaultTransitionTime?: number;
  countdownSeconds?: number;
}

export default function WorkoutPlayer({ 
  routine, 
  onClose, 
  onComplete, 
  theme = 'minimalist',
  defaultTransitionTime = 5,
  countdownSeconds = 5
}: WorkoutPlayerProps) {
  const isIntervalWork = routine.intervals && routine.intervals.length > 0 && (!routine.exercises || routine.exercises.length === 0);
  const isMinimalist = theme === 'minimalist';
  
  // Safe backup list of exercises so playing simple or fallback routines works flawlessly
  const exercisesToUse = (routine.exercises && routine.exercises.length > 0)
    ? routine.exercises
    : [{
        id: 'default-ex-' + (routine.id || 'fallback'),
        name: routine.name || 'Perform Work',
        duration: (routine.duration || 10) * 60, // convert overall minutes to seconds!
        sets: 1,
        reps: undefined,
        weight: undefined
      }];

  // Generate Activity Run Queue for Circuit Execution
  const activityRunQueue = React.useMemo(() => {
    const queue: { exercise: Exercise; setNumber: number; totalSets: number }[] = [];
    if (isIntervalWork) return queue;
    const maxSets = Math.max(...exercisesToUse.map(e => e.sets || 1));
    for (let s = 1; s <= maxSets; s++) {
      for (const ex of exercisesToUse) {
        if (s <= (ex.sets || 1)) {
          const totalSets = ex.sets || 1;
          const setSuffix = totalSets > 1 ? ` - set ${s} of ${totalSets}` : '';
          const clonedEx = {
            ...ex,
            name: `${ex.name}${setSuffix}`
          };
          queue.push({
            exercise: clonedEx,
            setNumber: s,
            totalSets: totalSets
          });
        }
      }
    }
    return queue;
  }, [isIntervalWork, exercisesToUse]);

  // Settings & Modes
  const isRecoveryMode = routine.isRecovery;
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Stats
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const timerId = useRef<any>(null);

  // Interval Timing Status
  const [currentIntervalIdx, setCurrentIntervalIdx] = useState<number>(0);
  const [intervalTimeLeft, setIntervalTimeLeft] = useState<number>(
    isIntervalWork ? routine.intervals[0].duration : 0
  );

  // Physical Exercises Status (if not interval based)
  const [currentRunIdx, setCurrentRunIdx] = useState<number>(0);
  
  const activeQueueItem = !isIntervalWork ? activityRunQueue[currentRunIdx] : undefined;
  const activeExercise = activeQueueItem ? activeQueueItem?.exercise : undefined;
  const currentSetNum = activeQueueItem ? activeQueueItem?.setNumber : 1;
  const totalSetsNum = activeQueueItem ? activeQueueItem?.totalSets : 1;

  const [exerciseTimeLeft, setExerciseTimeLeft] = useState<number>(
    (!isIntervalWork && activeExercise) 
      ? activeExercise.duration || 60 
      : 0
  );
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

  // Additional Reps and Sets Interactive States
  const [isRestingStatus, setIsRestingStatus] = useState<boolean>(false);
  const [restTimeLeft, setRestTimeLeft] = useState<number>(0);

  // Get Ready Countdown & Transitions
  const [isPreparing, setIsPreparing] = useState<boolean>(true);
  const [prepareTimeLeft, setPrepareTimeLeft] = useState<number>(10);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [transitionTimeLeft, setTransitionTimeLeft] = useState<number>(defaultTransitionTime);
  const [nextActivityName, setNextActivityName] = useState<string>('');
  const [pendingTransitionAction, setPendingTransitionAction] = useState<(() => void) | null>(null);

  // Final flow state
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [feedbackNotes, setFeedbackNotes] = useState<string>('');
  const [starRating, setStarRating] = useState<number>(5);

  // Synchronize exercise status on sequence index updates
  useEffect(() => {
    setIsRestingStatus(false);
    setRestTimeLeft(0);
    if (!isIntervalWork && activeExercise) {
      setExerciseTimeLeft(activeExercise.duration || 60);
    }
  }, [currentRunIdx, isIntervalWork, activeExercise]);

  // --- INTERVAL MANAGEMENT & CLOCKS ---
  useEffect(() => {
    if (isPlaying && !isFinished) {
      timerId.current = setInterval(() => {
        // Only increment active seconds when not in initial prepare or transition state
        if (!isPreparing && !isTransitioning) {
          setElapsedSeconds(prev => prev + 1);
        }

        // 1. Initial 10-second Countdown Prep
        if (isPreparing) {
          setPrepareTimeLeft(prev => {
            if (prev <= 1) {
              if (soundEnabled) {
                try { playTransitionEndSound(); } catch(e){}
              }
              setIsPreparing(false);
              return 0;
            }
            const seconds = prev - 1;
            if (seconds > 0 && seconds <= countdownSeconds) {
              if (soundEnabled) {
                try { playCountdownTick(); } catch(e){}
              }
            }
            return prev - 1;
          });
          return;
        }

        // 2. Active Exercise / Activity Transition Timer
        if (isTransitioning) {
          setTransitionTimeLeft(prev => {
            if (prev <= 1) {
              if (soundEnabled) {
                try { playTransitionEndSound(); } catch(e){}
              }
              setIsTransitioning(false);
              if (pendingTransitionAction) {
                pendingTransitionAction();
                setPendingTransitionAction(null);
              }
              return 0;
            }
            const seconds = prev - 1;
            if (seconds > 0 && seconds <= countdownSeconds) {
              if (soundEnabled) {
                try { playCountdownTick(); } catch(e){}
              }
            }
            return prev - 1;
          });
          return;
        }

        if (isIntervalWork) {
          setIntervalTimeLeft(prev => {
            if (prev <= 1) {
              // Sound alert on round transition!
              if (soundEnabled) {
                try { playTransitionEndSound(); } catch(e){}
              }

              // Advance to next interval segment with transition
              if (currentIntervalIdx + 1 < routine.intervals.length) {
                const nextIdx = currentIntervalIdx + 1;
                const nextDuration = routine.intervals[nextIdx].duration;
                
                const triggerNextInt = () => {
                  setCurrentIntervalIdx(nextIdx);
                  setIntervalTimeLeft(nextDuration);
                };
                setIsTransitioning(true);
                setTransitionTimeLeft(defaultTransitionTime);
                setNextActivityName(routine.intervals[nextIdx].name);
                setPendingTransitionAction(() => triggerNextInt);
                return 0;
              } else {
                // Reached final interval! Complete automatically
                clearInterval(timerId.current);
                setIsFinished(true);
                return 0;
              }
            }
            const seconds = prev - 1;
            if (seconds > 0 && seconds <= countdownSeconds) {
              if (soundEnabled) {
                try { playCountdownTick(); } catch(e){}
              }
            }
            return prev - 1;
          });
        } else {
          // Guided Workout sequences/exercises list within circuit queue
          if (activeQueueItem && activeExercise) {
            if (activeExercise.duration) {
              // Only countdown automatically if of active timed duration
              setExerciseTimeLeft(prev => {
                if (prev <= 1) {
                  if (soundEnabled) {
                    try { playTransitionEndSound(); } catch(e){}
                  }

                  // Advance to next circuit queue item
                  if (currentRunIdx + 1 < activityRunQueue.length) {
                    const nextItem = activityRunQueue[currentRunIdx + 1];
                    const triggerNextRun = () => {
                      setCurrentRunIdx(prevIdx => prevIdx + 1);
                    };
                    setIsTransitioning(true);
                    setTransitionTimeLeft(defaultTransitionTime);
                    setNextActivityName(nextItem.exercise.name);
                    setPendingTransitionAction(() => triggerNextRun);
                    return 0;
                  } else {
                    clearInterval(timerId.current);
                    setIsFinished(true);
                    return 0;
                  }
                }
                const seconds = prev - 1;
                if (seconds > 0 && seconds <= countdownSeconds) {
                  if (soundEnabled) {
                    try { playCountdownTick(); } catch(e){}
                  }
                }
                return prev - 1;
              });
            }
          }
        }
      }, 1000);
    }

    return () => {
      if (timerId.current) clearInterval(timerId.current);
    };
  }, [isPlaying, currentIntervalIdx, currentRunIdx, isIntervalWork, soundEnabled, isFinished, activeQueueItem, activeExercise, activityRunQueue, isPreparing, isTransitioning, pendingTransitionAction, nextActivityName, defaultTransitionTime, countdownSeconds]);

  // Initial trigger
  useEffect(() => {
    if (isPlaying && isIntervalWork && currentIntervalIdx === 0 && intervalTimeLeft === routine.intervals[0].duration && !isPreparing) {
      if (soundEnabled) {
        try { playBuzzer(); } catch(e){}
      }
    }
  }, [isPreparing]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleResetInterval = () => {
    if (!isIntervalWork) return;
    setIntervalTimeLeft(routine.intervals[currentIntervalIdx].duration);
    setIsPlaying(false);
  };

  const handleSkipInterval = () => {
    if (!isIntervalWork) return;
    if (currentIntervalIdx + 1 < routine.intervals.length) {
      const nextIdx = currentIntervalIdx + 1;
      const nextDuration = routine.intervals[nextIdx].duration;
      
      const triggerNextInt = () => {
        setCurrentIntervalIdx(nextIdx);
        setIntervalTimeLeft(nextDuration);
      };
      setIsTransitioning(true);
      setTransitionTimeLeft(defaultTransitionTime);
      setNextActivityName(routine.intervals[nextIdx].name);
      setPendingTransitionAction(() => triggerNextInt);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrevInterval = () => {
    if (!isIntervalWork) return;
    if (currentIntervalIdx - 1 >= 0) {
      const prevIdx = currentIntervalIdx - 1;
      setCurrentIntervalIdx(prevIdx);
      setIntervalTimeLeft(routine.intervals[prevIdx].duration);
    }
  };

  const handleToggleExerciseCompleted = (exId: string) => {
    setCompletedExercises(prev => {
      const copy = { ...prev };
      copy[exId] = !copy[exId];
      return copy;
    });
  };

  const handleCompleteSet = () => {
    if (soundEnabled) {
      try { playBuzzer(); } catch(e){}
    }
    if (currentRunIdx + 1 < activityRunQueue.length) {
      const nextItem = activityRunQueue[currentRunIdx + 1];
      const triggerNextRun = () => {
        setCurrentRunIdx(prevIdx => prevIdx + 1);
      };
      setIsTransitioning(true);
      setTransitionTimeLeft(defaultTransitionTime);
      setNextActivityName(nextItem.exercise.name);
      setPendingTransitionAction(() => triggerNextRun);
    } else {
      setIsFinished(true);
    }
  };

  const handleSkipRest = () => {
    setIsRestingStatus(false);
    setRestTimeLeft(0);
    if (soundEnabled) {
      try { playBuzzer(); } catch(e){}
    }
  };

  const handleFinalSave = () => {
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const ratingStars = '★'.repeat(starRating) + '☆'.repeat(5 - starRating);
    const combinedNotes = feedbackNotes.trim() ? `[Rating: ${ratingStars}] ${feedbackNotes.trim()}` : `[Rating: ${ratingStars}] Routine complete.`;
    onComplete(elapsedMinutes, combinedNotes);
  };

  // --- RENDERING CONFIGS ---
  const currentInterval: IntervalItem | undefined = isIntervalWork 
    ? routine.intervals[currentIntervalIdx] 
    : undefined;

  let accentColorHex = isMinimalist ? "#2e2e2e" : "#10b981"; // Emerald / black
  let badgeColor = isMinimalist 
    ? "bg-slate-350 bg-[#2e2e2e]/5 text-[#2e2e2e] border-[#2e2e2e]/15" 
    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/35";

  if (currentInterval?.color === 'rose') {
    accentColorHex = isMinimalist ? "#2e2e2e" : "#f43f5e"; // Rose / black
    badgeColor = isMinimalist 
      ? "bg-[#2e2e2e]/5 text-[#2e2e2e] border-[#2e2e2e]/15" 
      : "bg-rose-500/10 text-rose-400 border-rose-500/30";
  } else if (currentInterval?.color === 'blue') {
    accentColorHex = isMinimalist ? "#2e2e2e" : "#3b82f6"; // Blue / black
    badgeColor = isMinimalist 
      ? "bg-[#2e2e2e]/5 text-[#2e2e2e] border-[#2e2e2e]/15" 
      : "bg-blue-500/10 text-blue-400 border-blue-500/30";
  }

  // Circular stroke percentage calculations
  const totalDuration = currentInterval?.duration || 1;
  const strokeDashoffset = isIntervalWork 
    ? (intervalTimeLeft / totalDuration) * 848 
    : 848;

  function formatMinSec(totSec: number) {
    const m = Math.floor(totSec / 60);
    const s = totSec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-y-auto flex flex-col justify-between ${
        isMinimalist ? 'bg-white text-[#2e2e2e] font-sans' : 'bg-slate-950 text-white font-sans'
      } transition-colors duration-500`} 
      id="trim-workout-player"
    >
      
      {/* HEADER BAR */}
      <header className={`px-6 py-4 flex items-center justify-between ${
        isMinimalist ? 'border-b border-slate-200 bg-white' : 'border-b border-white/5 bg-slate-950/70 backdrop-blur-md'
      } sticky top-0 z-10`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg flex items-center justify-center ${isMinimalist ? 'bg-slate-100 border border-slate-200' : 'bg-white/5'}`}>
            <span className={`text-base font-bold leading-none ${isMinimalist ? 'text-[#2e2e2e]' : isRecoveryMode ? 'text-indigo-400 animate-pulse' : 'text-emerald-400'}`}>●</span>
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight flex flex-wrap items-center gap-1.5">
              <span>{routine.name}</span>
              {routine.useEquipment && (
                <span className={`text-[9.5px] font-mono px-2 py-0.5 rounded-full uppercase font-bold tracking-wider shrink-0 ${
                  isMinimalist ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-indigo-500/20 text-indigo-300'
                }`} title={`Equipment: ${routine.equipmentDetails}`}>
                  🎒 {routine.equipmentDetails || 'Equipment'}
                </span>
              )}
            </h1>
            <span className={`text-xs font-mono font-medium ${isMinimalist ? 'text-slate-500' : 'text-slate-400'}`}>
              {isRecoveryMode ? '🧘 Recovery Active' : '💪 Routine Active'}
            </span>
          </div>
        </div>

        {/* CONTROLS RIGHT */}
        <div className="flex items-center space-x-3">
          {/* SOUND TOGGLE */}
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border text-xs font-bold transition-all ${
              soundEnabled 
                ? isMinimalist ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white/10 border-white/10 text-white' 
                : isMinimalist ? 'bg-transparent border-slate-200 text-slate-400' : 'bg-white/5 border-white/5 text-slate-500'
            }`}
            title={soundEnabled ? "Mute Buzzer" : "Unmute Buzzer"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* EXIT WORKOUT ACTION */}
          <button 
            onClick={onClose}
            className={`py-1.5 px-3 rounded-lg font-mono text-xs font-bold uppercase transition-all ${
              isMinimalist 
                ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-650 text-red-600' 
                : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 hover:text-red-350 text-red-300'
            }`}
          >
            <span>Quit</span>
          </button>
        </div>
      </header>

      {/* CORE TIMER BODY */}
      {!isFinished ? (
        <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-6 py-8">
          
          {isPreparing ? (
            /* STARTUP COUNTDOWN GET READY SCREEN */
            <div className={`flex flex-col items-center justify-center text-center max-w-md mx-auto py-12 px-8 border rounded-3xl ${
              isMinimalist ? 'bg-slate-50 border-slate-200 text-[#2e2e2e]' : 'bg-slate-900 border border-white/5 text-white'
            } shadow-md animate-fade-in my-auto w-full`}>
              <span className={`text-[10.5px] font-mono font-black tracking-widest ${isMinimalist ? 'text-[#2e2e2e]/60' : 'text-indigo-400'} uppercase mb-2 block`}>
                Workout Initiating
              </span>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-6 font-sans">
                GET READY
              </h2>
              <div className={`text-8xl font-black font-mono leading-none ${isMinimalist ? 'text-[#2e2e2e]' : 'text-indigo-400'} tracking-tighter mb-8`}>
                {prepareTimeLeft}
              </div>
              
              <div className={`mb-8 p-4 rounded-2xl w-full border text-left ${
                isMinimalist ? 'bg-white border-slate-200' : 'bg-black/20 border-white/5'
              }`}>
                <span className={`text-[9px] font-mono tracking-widest ${isMinimalist ? 'text-slate-400' : 'text-slate-500'} uppercase block mb-1`}>
                  Starting with activity:
                </span>
                <span className="text-sm font-bold leading-tight block">
                  {isIntervalWork ? routine.intervals[0]?.name : exercisesToUse[0]?.name}
                </span>
                {routine.useEquipment && routine.equipmentDetails && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center space-x-1.5 text-xs">
                    <span className="text-base">🎒</span>
                    <span className="font-medium text-slate-500"><strong className="text-slate-700">Gear Outfitted:</strong> {routine.equipmentDetails}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (soundEnabled) {
                    try { playBuzzer(); } catch(e){}
                  }
                  setIsPreparing(false);
                }}
                className={`w-full py-3 text-xs font-extrabold tracking-wider uppercase rounded-xl transition shadow-sm ${
                  isMinimalist ? 'bg-[#2e2e2e] hover:bg-black text-white hover:shadow' : 'bg-indigo-600 text-white'
                }`}
              >
                Skip countdown & begin →
              </button>
            </div>
          ) : isTransitioning ? (
            /* TRANSITION TIME BETWEEN ACTIVITIES SCREEN */
            <div className={`flex flex-col items-center justify-center text-center max-w-md mx-auto py-12 px-8 border rounded-3xl ${
              isMinimalist ? 'bg-slate-50 border-slate-200 text-[#2e2e2e]' : 'bg-slate-900 border border-white/5 text-white'
            } shadow-md animate-fade-in my-auto w-full`}>
              <span className={`text-[10.5px] font-mono font-extrabold tracking-widest ${isMinimalist ? 'text-amber-600' : 'text-amber-400'} uppercase mb-2 block`}>
                Transitions...
              </span>
              <h2 className="text-2xl font-black uppercase tracking-tight mb-5 font-sans whitespace-nowrap">
                Switching Activities
              </h2>
              <div className={`text-7xl font-black font-mono leading-none ${isMinimalist ? 'text-[#2e2e2e]' : 'text-amber-500'} tracking-tighter mb-8`}>
                {transitionTimeLeft}s
              </div>
              
              <div className={`mb-8 p-4 rounded-xl w-full border text-left ${
                isMinimalist ? 'bg-white border-slate-200' : 'bg-black/20 border-white/5'
              }`}>
                <span className={`text-[9px] font-mono tracking-widest ${isMinimalist ? 'text-slate-400' : 'text-slate-500'} uppercase block mb-1`}>
                  Next up:
                </span>
                <span className="text-sm font-bold leading-tight block">
                  {nextActivityName || 'Next Activity'}
                </span>
              </div>

              <button
                onClick={() => {
                  if (soundEnabled) {
                    try { playBuzzer(); } catch(e){}
                  }
                  setIsTransitioning(false);
                  if (pendingTransitionAction) {
                    pendingTransitionAction();
                    setPendingTransitionAction(null);
                  }
                }}
                className={`w-full py-3 text-xs font-extrabold tracking-wider uppercase rounded-xl transition shadow-sm ${
                  isMinimalist ? 'bg-[#2e2e2e] hover:bg-black text-white' : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                Skip transition →
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-center">
            
            {/* TIMER COLUMN */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center text-center">
              
              {isIntervalWork ? (
                /* INTERVAL TIMING CAPILLARY */
                <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="135"
                      className={isMinimalist ? 'stroke-slate-300/50' : 'stroke-slate-800'}
                      strokeWidth={isMinimalist ? "3" : "10"}
                      fill="transparent"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="135"
                      stroke={accentColorHex}
                      strokeWidth={isMinimalist ? "3" : "12"}
                      fill="transparent"
                      strokeDasharray="848"
                      strokeDashoffset={848 - strokeDashoffset}
                      className="transition-all duration-1000 ease-linear"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* INTERNAL CLOCK TEXT */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-xs tracking-widest ${isMinimalist ? 'text-slate-600' : 'text-slate-400'} font-mono font-medium uppercase`}>
                      {currentInterval?.name || 'Interval'}
                    </span>
                    <span className={`text-6xl md:text-7xl font-bold font-mono tracking-tight my-1 ${isMinimalist ? 'text-[#2e2e2e]' : 'text-white'}`}>
                      {formatMinSec(intervalTimeLeft)}
                    </span>
                    <div className={`px-3 py-1 ${isMinimalist ? 'bg-[#2e2e2e]/5 border border-[#2e2e2e]/10' : 'bg-white/5 border border-white/10'} rounded-full`}>
                      <span className={`text-[11px] font-mono ${isMinimalist ? 'text-slate-600' : 'text-slate-350'} font-bold uppercase`}>
                        Round {currentIntervalIdx + 1} of {routine.intervals.length}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* PHYSICAL EXERCISES COUNTDOWN & REPS-SETS PLAYER */
                <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center">
                  {activeExercise?.sets && activeExercise.sets! >= 1 && !activeExercise.duration ? (
                    // REPS & SETS INTERACTIVE SCREEN (WITHOUT COUNTDOWN DETECTOR)
                    <>
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="135"
                          className={isMinimalist ? 'stroke-slate-200/50' : 'stroke-slate-800'}
                          strokeWidth={isMinimalist ? "3" : "10"}
                          fill="transparent"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="135"
                          stroke={isMinimalist ? '#4f46e5' : '#6366f1'}
                          strokeWidth={isMinimalist ? "3" : "12"}
                          fill="transparent"
                          strokeDasharray="848"
                          strokeDashoffset={848 - (848 * (currentSetNum / totalSetsNum))}
                          className="transition-all duration-300"
                          strokeLinecap="round"
                        />
                      </svg>

                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <span className={`text-[10px] tracking-widest ${isMinimalist ? 'text-indigo-600' : 'text-indigo-400'} font-mono font-bold uppercase mb-1`}>
                          SET {currentSetNum} OF {totalSetsNum}
                        </span>
                        <span className={`text-sm font-extrabold ${isMinimalist ? 'text-[#2e2e2e]' : 'text-slate-100'} leading-tight px-3 line-clamp-2 min-h-[36px] flex items-center justify-center`}>
                          {activeExercise.name}
                        </span>
                        <span className={`text-4xl md:text-5xl font-extrabold font-mono tracking-tight my-1 ${isMinimalist ? 'text-indigo-600' : 'text-white'}`}>
                          {activeExercise.reps ? `${activeExercise.reps} REPS` : 'GO TO LIMIT'}
                        </span>
                        {activeExercise.weight && (
                          <span className="text-[11px] font-mono font-semibold text-slate-500 mt-0.5">
                            Weight: {activeExercise.weight}
                          </span>
                        )}

                        <button
                          onClick={handleCompleteSet}
                          className="mt-3.5 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold uppercase rounded-xl transition shadow-sm font-sans tracking-wide cursor-pointer"
                        >
                          {currentRunIdx < activityRunQueue.length - 1 ? 'Complete Set ✓' : 'Finish Workout ✓'}
                        </button>
                      </div>
                    </>
                  ) : (
                    // STANDARD AUTOMATIC TIMER OR DURATION SCREEN
                    <>
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="50%"
                          cy="50%"
                          r="135"
                          className={isMinimalist ? 'stroke-slate-300/50' : 'stroke-slate-800'}
                          strokeWidth={isMinimalist ? "3" : "10"}
                          fill="transparent"
                        />
                        <circle
                          cx="50%"
                          cy="50%"
                          r="135"
                          stroke={isMinimalist ? '#2e2e2e' : '#6366f1'}
                          strokeWidth={isMinimalist ? "3" : "12"}
                          fill="transparent"
                          strokeDasharray="848"
                          strokeDashoffset={
                            activeExercise?.duration 
                              ? 848 - (848 * (exerciseTimeLeft / (activeExercise.duration || 1)))
                              : 0
                          }
                          className="transition-all duration-1000 ease-linear"
                          strokeLinecap="round"
                        />
                      </svg>

                      {/* INTERNAL CLOCK TEXT */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <span className={`text-[10px] tracking-widest ${isMinimalist ? 'text-slate-600' : 'text-indigo-400'} font-mono font-bold uppercase mb-1`}>
                          {activeExercise?.sets ? `SET ${currentSetNum} OF ${totalSetsNum}` : 'Active Exercise'}
                        </span>
                        <span className={`text-sm font-bold ${isMinimalist ? 'text-[#2e2e2e]' : 'text-slate-100'} leading-tight px-3 line-clamp-2 min-h-[36px] flex items-center justify-center`}>
                          {activeExercise?.name || 'Enjoy Recovery'}
                        </span>
                        <span className={`text-5xl font-bold font-mono tracking-tight my-1 ${isMinimalist ? 'text-[#2e2e2e]' : 'text-white'}`}>
                          {formatMinSec(exerciseTimeLeft)}
                        </span>
                        
                        {(activeExercise?.reps || activeExercise?.weight) && (
                          <div className="text-[11px] font-mono font-semibold text-slate-500 mb-1">
                            {activeExercise.reps && <span>{activeExercise.reps} Reps </span>}
                            {activeExercise.weight && <span>@ {activeExercise.weight}</span>}
                          </div>
                        )}

                        <div className={`px-3 py-1 ${isMinimalist ? 'bg-[#2e2e2e]/5 border border-[#2e2e2e]/10' : 'bg-white/5 border border-white/10'} rounded-full mt-1.5`}>
                          <span className={`text-[10px] font-mono ${isMinimalist ? 'text-slate-600' : 'text-slate-400'} font-bold uppercase`}>
                            Round {currentRunIdx + 1} of {activityRunQueue.length}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TIMING CONTROL BUTTONS */}
              <div className="mt-8 flex items-center space-x-4">
                {isIntervalWork ? (
                  <button 
                    onClick={handlePrevInterval}
                    className={`px-4 py-2 text-xs font-mono font-bold rounded-xl transition duration-200 disabled:opacity-40 border ${
                      isMinimalist 
                        ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800' 
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20'
                    }`}
                    disabled={currentIntervalIdx === 0}
                    title="Previous round"
                  >
                    PREV
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      if (currentRunIdx > 0) {
                        setCurrentRunIdx(currentRunIdx - 1);
                      }
                    }}
                    className={`px-4 py-2 text-xs font-mono font-bold rounded-xl transition duration-200 disabled:opacity-40 border ${
                      isMinimalist 
                        ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800' 
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20'
                    }`}
                    disabled={currentRunIdx === 0}
                    title="Previous stretch"
                  >
                    PREV
                  </button>
                )}

                <button 
                  onClick={handlePlayPause}
                  className={`px-8 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest text-white shadow-md transition-all duration-300 transform active:scale-95 ${
                    isMinimalist 
                      ? 'bg-[#2e2e2e] hover:bg-black text-white font-extrabold shadow-sm' 
                      : isPlaying 
                        ? 'bg-amber-500 hover:bg-amber-600' 
                        : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                  title={isPlaying ? "Pause Player" : "Resume Player"}
                >
                  {isPlaying ? 'PAUSE' : 'PLAY'}
                </button>

                {isIntervalWork ? (
                  <>
                    <button 
                      onClick={handleResetInterval}
                      className={`px-4 py-2 text-xs font-mono font-bold rounded-xl transition duration-200 border ${
                        isMinimalist 
                          ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800' 
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20'
                      }`}
                      title="Restart current segment"
                    >
                      RESET
                    </button>
                    <button 
                      onClick={handleSkipInterval}
                      className={`px-4 py-2 text-xs font-mono font-bold rounded-xl transition duration-200 border ${
                        isMinimalist 
                          ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800' 
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20'
                      }`}
                      title="Skip segment"
                    >
                      SKIP
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleCompleteSet}
                    className={`px-4 py-2 text-xs font-mono font-bold rounded-xl transition duration-200 border ${
                      isMinimalist 
                        ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800' 
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20'
                    }`}
                    title="Skip current exercise round"
                  >
                    SKIP
                  </button>
                )}
              </div>

              {/* ESTIMATED REMAINING TIME */}
              <div className={`mt-6 text-xs ${isMinimalist ? 'text-slate-600' : 'text-slate-400'} font-mono`}>
                Total Elapsed: {formatMinSec(elapsedSeconds)} / Est: {routine.duration} mins
              </div>

            </div>

            {/* PROGRESSION COLLATERAL LIST */}
            <div className={`lg:col-span-5 flex flex-col h-full max-h-[480px] border rounded-2xl p-5 overflow-hidden ${
              isMinimalist ? 'bg-white border-slate-205 border-slate-200' : 'bg-slate-900/50 border-white/5'
            }`}>
              
              <div className={`flex items-center justify-between mb-4 pb-2 border-b ${isMinimalist ? 'border-slate-100' : 'border-white/5'} shrink-0`}>
                <span className={`text-xs font-semibold uppercase tracking-wider ${isMinimalist ? 'text-slate-700' : 'text-slate-300'}`}>
                  {isIntervalWork ? 'Interval Order' : 'Circuit Order'}
                </span>
                <span className={`text-xs font-mono px-2 py-0.5 ${isMinimalist ? 'bg-slate-50 border border-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400'} rounded`}>
                  {isIntervalWork ? `${routine.intervals.length} segments` : `${activityRunQueue.length} segments`}
                </span>
              </div>

              {/* LIST DISPLAY */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                
                {isIntervalWork ? (
                  /* INTERVAL RENDERING */
                  routine.intervals.map((item, idx) => {
                    const isActive = idx === currentIntervalIdx;
                    const isDone = idx < currentIntervalIdx;
                    
                    let statusLabelColor = isMinimalist ? "text-slate-800" : "text-slate-300";
                    let rowBg = isMinimalist ? "bg-white border-slate-200" : "bg-white/5 border-white/5";
                    let stateBadge = null;

                    if (isActive) {
                      rowBg = isMinimalist 
                        ? "bg-[#2e2e2e]/5 border-slate-400 font-bold" 
                        : "bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/25";
                      statusLabelColor = isMinimalist ? "text-[#2e2e2e] font-extrabold" : "text-emerald-300 font-medium";
                      stateBadge = <span className={`text-[10px] font-mono ${isMinimalist ? 'bg-[#2e2e2e] text-white' : 'bg-emerald-500/20 text-emerald-400'} px-1.5 py-0.5 rounded`}>ACTIVE</span>;
                    } else if (isDone) {
                      rowBg = isMinimalist ? "bg-slate-50 border-slate-200 opacity-50" : "bg-white/2 border-white/2 opacity-50";
                      statusLabelColor = isMinimalist ? "text-slate-500 line-through" : "text-slate-400 line-through";
                      stateBadge = <span className={isMinimalist ? "text-slate-900 font-black font-mono text-xs" : "text-emerald-400 font-bold font-mono text-xs"}>✓</span>;
                    }

                    return (
                      <div 
                        key={item.id || idx}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all duration-300 ${rowBg}`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`text-xs font-mono ${isActive ? isMinimalist ? 'text-slate-900 font-black' : 'text-emerald-400' : 'text-slate-500'}`}>
                            {idx + 1 < 10 ? '0' : ''}{idx + 1}
                          </span>
                          <span className={`text-sm ${statusLabelColor}`}>{item.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {stateBadge}
                          <span className={`text-xs font-mono font-medium ${isMinimalist ? 'text-slate-655 text-slate-600' : 'text-slate-300'}`}>{item.duration}s</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* PHYSICAL EXERCISES SEQUENCE RENDERING IN ORDER of CIRCUIT */
                  activityRunQueue.map((item, idx) => {
                    const isCompleted = idx < currentRunIdx;
                    const isCurrent = idx === currentRunIdx;

                    return (
                      <div 
                        key={idx}
                        className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer text-left ${
                          isCompleted 
                            ? isMinimalist ? 'bg-slate-50 border-slate-200 opacity-55' : 'bg-emerald-950/20 border-emerald-900/30 opacity-60' 
                            : isCurrent
                              ? isMinimalist ? 'bg-[#2e2e2e]/5 border-slate-400 font-bold' : 'bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/25'
                              : isMinimalist ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                        onClick={() => {
                          if (idx <= currentRunIdx) {
                            setCurrentRunIdx(idx);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex space-x-3">
                            <div 
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                                isCompleted 
                                  ? isMinimalist ? 'bg-[#2e2e2e] border-[#2e2e2e] text-white font-bold text-xs' : 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold text-xs' 
                                  : isMinimalist ? 'border-slate-300 bg-white' : 'border-white/20'
                              }`}
                            >
                              {isCompleted && "✓"}
                            </div>
                            <div>
                              <p className={`text-sm leading-snug ${isCompleted ? isMinimalist ? 'line-through text-slate-500 font-normal' : 'line-through text-slate-500' : isMinimalist ? 'text-slate-900 font-bold' : 'text-slate-200 font-medium'}`}>
                                {item.exercise.name}
                              </p>
                              {/* EX DETAILS */}
                              <div className={`flex flex-wrap items-center gap-1.5 mt-1 text-[10px] ${isMinimalist ? 'text-slate-500' : 'text-slate-400'} font-mono`}>
                                <span className="bg-slate-100 text-slate-700 font-extrabold px-1.5 py-0.2 rounded uppercase">Set {item.setNumber} of {item.totalSets}</span>
                                {item.exercise.reps && <span>• {item.exercise.reps} reps</span>}
                                {item.exercise.weight && <span>• {item.exercise.weight}</span>}
                                {item.exercise.duration && <span>• {item.exercise.duration}s</span>}
                              </div>
                            </div>
                          </div>
                          
                          {isCurrent && (
                            <span className={`text-[9px] font-mono shrink-0 ${isMinimalist ? 'bg-[#2e2e2e] text-white font-black' : 'bg-indigo-500/20 text-indigo-400'} px-1.5 py-0.5 rounded`}>
                              CURRENT
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

              </div>

              {/* EXERCISE COMPLETED MANUAL FINISHER */}
              {!isIntervalWork && (
                <div className={`mt-4 pt-3 border-t ${isMinimalist ? 'border-slate-100' : 'border-white/5'} shrink-0`}>
                  <button 
                    onClick={() => setIsFinished(true)}
                    className={`w-full py-3 font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center shadow-sm rounded-xl cursor-pointer ${
                      isMinimalist 
                        ? 'bg-[#2e2e2e] hover:bg-black text-white font-extrabold' 
                        : 'bg-indigo-650 hover:bg-indigo-505 bg-indigo-600 border border-indigo-500/30 text-white'
                    }`}
                  >
                    <span>Conclude Workout Session</span>
                  </button>
                </div>
              )}

            </div>

          </div>

          {/* DOCUMENTED INSTRUCTIONS BOX */}
          <div className={`mt-10 p-5 rounded-2xl border w-full flex items-start space-x-4 ${
            isMinimalist ? 'bg-white border-slate-200' : 'bg-white/3 border-white/5'
          }`}>
            <div className="text-left">
              <h4 className={`text-sm font-bold ${isMinimalist ? 'text-[#2e2e2e]' : 'text-slate-200'}`}>Execution Directives</h4>
              <p className={`text-xs ${isMinimalist ? 'text-slate-700' : 'text-slate-300'} mt-1 leading-relaxed`}>{routine.instructions || 'Review form guidelines and perform exercises at designated pace.'}</p>
              {routine.notes && (
                <p className={`text-xs italic ${isMinimalist ? 'text-slate-655 text-slate-600 font-bold' : 'text-indigo-300'} font-mono mt-2`}>*{routine.notes}</p>
              )}
            </div>
          </div>
            </>
          )}

        </main>
      ) : (
        /* WORKOUT FINISHED CONGRATULATORY CARD BOARD */
        <main className="flex-1 max-w-lg mx-auto w-full flex flex-col justify-center px-6 py-12 text-center animate-fade-in" id="trim-workout-celebration">
          
          <div className={`border rounded-3xl p-8 shadow-md relative overflow-hidden ${
            isMinimalist ? 'bg-[#ffffff] border-slate-205 border-slate-200' : 'bg-slate-900 border border-white/5'
          }`}>
            
            {/* AMBIENT GLOW BACK (ONLY CLASSIC) */}
            {!isMinimalist && (
              <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-35 ${
                isRecoveryMode ? 'bg-indigo-500' : 'bg-emerald-500'
              }`}></div>
            )}

            <div className="relative z-10 text-center">
              <div className="flex justify-center mb-4">
                <span className={`text-4xl ${isMinimalist ? 'text-[#2e2e2e]' : 'text-emerald-400'}`}>★</span>
              </div>

              {/* One line Routine complete */}
              <h2 className={`text-2xl font-black uppercase tracking-tight font-sans ${isMinimalist ? 'text-slate-900' : 'text-white'} leading-none mb-6`}>
                Routine complete
              </h2>

              {/* Stats workout time and A star rating */}
              <div className={`border rounded-2xl p-6 mb-6 text-left space-y-4 ${
                isMinimalist ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-white/5 text-white'
              }`}>
                {/* Stat: Workout time */}
                <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-200/50">
                  <span className={`text-xs font-mono uppercase tracking-wider ${isMinimalist ? 'text-slate-550 text-slate-500 font-bold' : 'text-slate-400'}`}>
                    Workout Time
                  </span>
                  <span className={`text-lg font-bold font-mono ${isMinimalist ? 'text-slate-900' : 'text-white'}`}>
                    {formatMinSec(elapsedSeconds)}
                  </span>
                </div>

                {/* Star rating selection */}
                <div className="flex flex-col space-y-1.5">
                  <span className={`text-xs font-mono uppercase tracking-wider ${isMinimalist ? 'text-slate-550 text-slate-500 font-bold' : 'text-slate-400'}`}>
                    Vibe & Progress Rating
                  </span>
                  <div className="flex items-center space-x-1.5">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setStarRating(num)}
                        className="text-2xl transition-all duration-150 transform hover:scale-115 focus:outline-none"
                      >
                        {num <= starRating ? (
                          <span className="text-yellow-500">★</span>
                        ) : (
                          <span className={isMinimalist ? "text-slate-300" : "text-slate-650 text-slate-500"}>☆</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* JOURNAL FEEDBACK / NOTES */}
              <div className="text-left mb-6">
                <label className={`block text-xs font-mono mb-2 uppercase font-bold ${
                  isMinimalist ? 'text-slate-650 text-slate-500' : 'text-slate-400'
                }`}>
                  Notes (Fed into weekly review to discreetly discuss progress/vibes)
                </label>
                <textarea
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="How was your energy and recovery? Added notes feed discreetly into reviews..."
                  className={`w-full text-base md:text-xs p-3.5 focus:outline-none focus:ring-1 transition-all rounded-xl font-mono ${
                    isMinimalist 
                      ? 'bg-white border border-slate-205 border-slate-200 hover:border-slate-300 focus:border-slate-500 text-slate-800 focus:ring-slate-400/50' 
                      : 'bg-slate-950 border border-white/10 hover:border-white/20 focus:border-indigo-500 text-slate-200 placeholder-slate-600 focus:ring-indigo-500'
                  }`}
                  rows={3}
                />
              </div>

              {/* FINISHED CONCLUDE */}
              <button 
                onClick={handleFinalSave}
                className={`w-full py-3.5 font-bold text-xs tracking-wider uppercase rounded-xl transition duration-300 shadow-sm transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer ${
                  isMinimalist 
                    ? 'bg-[#2e2e2e] hover:bg-black text-white font-extrabold' 
                    : isRecoveryMode 
                      ? 'bg-indigo-400 hover:bg-indigo-500 text-slate-950 font-extrabold' 
                      : 'bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-extrabold'
                }`}
              >
                Log to Trim History
              </button>
            </div>

          </div>

        </main>
      )}

      {/* FOOTER BAR */}
      <footer className={`px-6 py-4 border-t font-mono text-[10px] flex flex-col md:flex-row md:items-center justify-between text-center md:text-left space-y-2 md:space-y-0 shrink-0 ${
        isMinimalist ? 'border-slate-200 bg-white text-slate-500' : 'border-white/5 bg-slate-950 text-slate-500'
      }`}>
        <span>© 2026 Trim Player Engine • Version 2.1 • Offline Local Cache Enabled</span>
        <div className="flex items-center justify-center space-x-4">
          <span className="flex items-center space-x-1">
            <span className={`w-2 h-2 rounded-full ${isMinimalist ? 'bg-[#2e2e2e]' : 'bg-emerald-500'}`}></span>
            <span>PCM Synthesizer Connected</span>
          </span>
          <span>•</span>
          <span>Local Time: {new Date().toLocaleTimeString()}</span>
        </div>
      </footer>

    </div>
  );
}
