/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Flame,
  Dumbbell,
  Calendar,
  History,
  Sparkles,
  Smile,
  Trophy,
  Play,
  Pause,
  Clock,
  Star,
  Share2,
  Clipboard,
  ChevronRight,
  CornerDownRight,
  HelpCircle,
  Archive,
  Plus,
  Trash2,
  Heart,
  Edit3,
  Copy,
  Info,
  AlertCircle,
  CheckCircle2,
  Moon,
  Volume2,
  Search,
  ArrowRight,
  Save,
  X,
  User,
  Activity,
  MessageSquare,
  SlidersHorizontal,
  Check,
  EyeOff,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Data & Models
import { Routine, Program, WorkoutHistory } from "./types";
import { DEFAULT_ROUTINES, DEFAULT_PROGRAMS } from "./data/defaultData";
import {
  generateRoutineFromActivity,
  findMatchingRoutine,
} from "./utils/routineGenerator";

// Audio Synthesizer Controls
import {
  playCoinSound,
  playLevelUpSound,
  playLoseHeartSound,
  playPowerUpSound,
  playComboBeeps,
  playBuzzer,
} from "./utils/audio";

// Subcomponents
import WorkoutPlayer from "./components/WorkoutPlayer";
import ProgramViewer from "./components/ProgramViewer";
import AiImporter from "./components/AiImporter";
import RoutineForm from "./components/RoutineForm";
import ProgramForm from "./components/ProgramForm";
import OnboardingChatModal from "./components/OnboardingChatModal";
import WeeklyCheckInModal from "./components/WeeklyCheckInModal";
import BreathingCanvas from "./components/BreathingCanvas";
import trimBoySprite from "./assets/images/trim_boy_sprite_1781086910401.png";

export default function App() {
  // --- CORE STATE PERSISTED VIA LOCALSTORAGE ---
  const [routines, setRoutines] = useState<Routine[]>(() => {
    const saved = localStorage.getItem("trim_routines");
    return saved ? JSON.parse(saved) : [];
  });

  const [programs, setPrograms] = useState<Program[]>(() => {
    const saved = localStorage.getItem("trim_programs");
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState<WorkoutHistory[]>(() => {
    const saved = localStorage.getItem("trim_history");
    return saved ? JSON.parse(saved) : [];
  });

  // --- PERSISTENCE SYNCS ---
  useEffect(() => {
    localStorage.setItem("trim_routines", JSON.stringify(routines));
  }, [routines]);

  useEffect(() => {
    localStorage.setItem("trim_programs", JSON.stringify(programs));
  }, [programs]);

  useEffect(() => {
    localStorage.setItem("trim_history", JSON.stringify(history));
  }, [history]);

  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState<
    "home" | "library" | "recovery" | "history" | "ai-importer" | "breath"
  >("home");
  const handleNavigateToTab = (
    tab: "home" | "library" | "recovery" | "history" | "ai-importer" | "breath",
  ) => {
    setActiveTab(tab);
    setSelectedProgram(null);
  };

  useEffect(() => {
    setSelectedProgram(null);
  }, [activeTab]);

  const [librarySubTab, setLibrarySubTab] = useState<"routines" | "programs">(
    "routines",
  );
  const [activeLibraryTab, setActiveLibraryTab] = useState<
    "all" | "favourites" | "recent"
  >("all");
  const [routineSearch, setRoutineSearch] = useState<string>("");
  const [activeRoutineTag, setActiveRoutineTag] = useState<string>("all");
  const [showTagFilters, setShowTagFilters] = useState<boolean>(false);

  // --- CUSTOMIZATION & PROFILE SETTINGS STATES ---
  const [minimizedProgramIds, setMinimizedProgramIds] = useState<string[]>(
    () => {
      try {
        const saved = localStorage.getItem("trim_minimized_programs");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    },
  );

  useEffect(() => {
    localStorage.setItem(
      "trim_minimized_programs",
      JSON.stringify(minimizedProgramIds),
    );
  }, [minimizedProgramIds]);

  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [primaryColorTheme, setPrimaryColorTheme] = useState<string>(() => {
    const saved = localStorage.getItem("trim_color_theme");
    return saved === "minimalist" || saved === "dark" ? saved : "minimalist";
  });
  const [workoutToneType, setWorkoutToneType] = useState<string>(
    () => localStorage.getItem("trim_workout_tone_type") || "sine",
  );

  const themeColor = {
    theme: primaryColorTheme,
    bg: primaryColorTheme === "dark" ? "bg-indigo-600" : "bg-slate-900",
    text: primaryColorTheme === "dark" ? "text-indigo-400" : "text-slate-900",
    lightBg: primaryColorTheme === "dark" ? "bg-slate-900" : "bg-white",
    border:
      primaryColorTheme === "dark" ? "border-slate-800" : "border-slate-200",
    activeTabBg:
      primaryColorTheme === "dark"
        ? "bg-slate-805 border border-slate-700 text-white font-extrabold"
        : "bg-slate-900 border border-slate-950 text-white font-extrabold",
  };

  // --- RECOVERY BREATHING STATES ---
  const BREATHWORK_ROUTINES = [
    {
      id: "box",
      name: "Box Breathing Regulator",
      description:
        "The tactical physical standard for stress reduction. 4s inhale, 4s hold, 4s exhale, 4s hold.",
      benefits:
        "Clears lactic acids, stabilizes focus, and lowers sympathetic tones.",
      cycles: [
        { phase: "Inhale", duration: 4 },
        { phase: "Hold (Full)", duration: 4 },
        { phase: "Exhale", duration: 4 },
        { phase: "Hold (Empty)", duration: 4 },
      ],
    },
    {
      id: "co2",
      name: "Apnea CO₂ Hold Trainer",
      description:
        "Slowly hyper-satures CO₂ compatibility to improve lung capacity and anaerobic stamina.",
      benefits:
        "Increases breath-hold threshold, raises anaerobic tolerance capacity, and stretches lungs.",
      cycles: [
        { phase: "Deep Inhale", duration: 5 },
        { phase: "Breath Hold (Full)", duration: 15 },
        { phase: "Releasing Exhale", duration: 8 },
        { phase: "Rest Pattern", duration: 4 },
      ],
    },
    {
      id: "coherent",
      name: "Coherent Pranayama",
      description:
        "Coordinated 1:1 balance to optimize Heart Rate Variability (HRV) and balance nervous zones.",
      benefits:
        "Balances autonomic subdivisions, stabilizes vagal tones, and calms systemic anxiety.",
      cycles: [
        { phase: "Symmetrical Inhale", duration: 6 },
        { phase: "Symmetrical Exhale", duration: 6 },
      ],
    },
    {
      id: "478",
      name: "4-7-8 Decompress Sleep Shift",
      description:
        "Deep parasympathetic trigger. Inhale through nose, hold deep, exhale with slow release.",
      benefits:
        "Sedates racing central neurons, triggers muscle relaxation, and induces rest states.",
      cycles: [
        { phase: "Quiet Nose Inhale", duration: 4 },
        { phase: "Heavy Retain Hold", duration: 7 },
        { phase: "Audible Mouth Exhale", duration: 8 },
      ],
    },
  ];

  const [selectedBreathwork, setSelectedBreathwork] = useState(
    BREATHWORK_ROUTINES[0],
  );
  const [breathCycleIdx, setBreathCycleIdx] = useState(0);
  const [phase, setPhase] = useState<string>(
    BREATHWORK_ROUTINES[0].cycles[0].phase,
  );
  const [timeLeft, setTimeLeft] = useState(
    BREATHWORK_ROUTINES[0].cycles[0].duration,
  );
  const [isBreathingRunning, setIsBreathingRunning] = useState(false);
  const [activeRecoveryTab, setActiveRecoveryTab] = useState<
    "stretches" | "breathe"
  >("stretches");

  const [breathingSessionDuration, setBreathingSessionDuration] =
    useState<number>(3); // chosen minutes
  const [breathingTotalSecLeft, setBreathingTotalSecLeft] =
    useState<number>(180); // overall seconds remaining

  const cycleIdxRef = useRef(0);
  const timeLeftRef = useRef(BREATHWORK_ROUTINES[0].cycles[0].duration);
  const selectedCyclesRef = useRef(BREATHWORK_ROUTINES[0].cycles);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    cycleIdxRef.current = breathCycleIdx;
  }, [breathCycleIdx]);

  useEffect(() => {
    selectedCyclesRef.current = selectedBreathwork.cycles;
  }, [selectedBreathwork]);

  useEffect(() => {
    let interval: any = null;
    if (isBreathingRunning) {
      interval = setInterval(() => {
        // Decrease total session time left
        setBreathingTotalSecLeft((totalLeft) => {
          if (totalLeft <= 1) {
            setIsBreathingRunning(false);

            // Increment breath streak
            setBreathworkStreak((b) => {
              const nextStreak = b + 1;
              localStorage.setItem(
                "trim_breathwork_streak",
                String(nextStreak),
              );
              return nextStreak;
            });

            awardXpAndCoins(
              0,
              0,
              "Breathing focus target achieved! Focus and state regulation set successfully.",
            );
            updateQuestProgress("breath", 1);

            return 0;
          }
          return totalLeft - 1;
        });

        // Compute next timeLeft tick
        const nextTime = timeLeftRef.current - 1;
        if (nextTime <= 0) {
          // Time to transition to the next phase
          const cycles = selectedCyclesRef.current;
          const nextIdx = (cycleIdxRef.current + 1) % cycles.length;
          const nextCycle = cycles[nextIdx];

          cycleIdxRef.current = nextIdx;
          setBreathCycleIdx(nextIdx);
          setPhase(nextCycle.phase);
          setTimeLeft(nextCycle.duration);
          timeLeftRef.current = nextCycle.duration;
        } else {
          setTimeLeft(nextTime);
          timeLeftRef.current = nextTime;
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isBreathingRunning]);

  const handleSelectBreathwork = (r: (typeof BREATHWORK_ROUTINES)[0]) => {
    setIsBreathingRunning(false);
    setSelectedBreathwork(r);
    setBreathCycleIdx(0);
    cycleIdxRef.current = 0;
    setPhase(r.cycles[0].phase);
    setTimeLeft(r.cycles[0].duration);
    timeLeftRef.current = r.cycles[0].duration;
    setBreathingTotalSecLeft(breathingSessionDuration * 60);
  };

  const handleResetBreathing = () => {
    setIsBreathingRunning(false);
    setBreathCycleIdx(0);
    cycleIdxRef.current = 0;
    setPhase(selectedBreathwork.cycles[0].phase);
    setTimeLeft(selectedBreathwork.cycles[0].duration);
    timeLeftRef.current = selectedBreathwork.cycles[0].duration;
    setBreathingTotalSecLeft(breathingSessionDuration * 60);
  };

  const handleStartBreathing = () => {
    setBreathCycleIdx(0);
    cycleIdxRef.current = 0;
    setPhase(selectedBreathwork.cycles[0].phase);
    setTimeLeft(selectedBreathwork.cycles[0].duration);
    timeLeftRef.current = selectedBreathwork.cycles[0].duration;
    setBreathingTotalSecLeft(breathingSessionDuration * 60);
    setIsBreathingRunning(true);
  };

  // --- VIEWERS / HELPERS / OVERLAYS STATE ---
  const [breathworkStreak, setBreathworkStreak] = useState<number>(() => {
    const saved = localStorage.getItem("trim_breathwork_streak");
    return saved ? parseInt(saved, 10) : 5; // discrete 5-day streak default
  });

  // --- 8-BIT GAMIFICATION & DUOLINGO ENGINE ---
  const [xp, setXp] = useState<number>(() => {
    const saved = localStorage.getItem("trim_xp");
    return saved ? parseInt(saved, 10) : 35; // default 35 XP to start
  });
  const [hearts, setHearts] = useState<number>(() => {
    const saved = localStorage.getItem("trim_hearts");
    return saved ? parseInt(saved, 10) : 5; // max 5 hearts
  });
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem("trim_coins");
    return saved ? parseInt(saved, 10) : 60; // 60 coins to start
  });
  const [streakFreezes, setStreakFreezes] = useState<number>(() => {
    const saved = localStorage.getItem("trim_streak_freezes");
    return saved ? parseInt(saved, 10) : 1; // start with 1 streak freeze
  });
  const [activeSkin, setActiveSkin] = useState<string>(() => {
    return localStorage.getItem("trim_active_skin") || "classic_red";
  });
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    const saved = localStorage.getItem("trim_unlocked_skins");
    return saved ? JSON.parse(saved) : ["classic_red"];
  });
  const [levelUpTrigger, setLevelUpTrigger] = useState<boolean>(false);
  const [congratsQuest, setCongratsQuest] = useState<string | null>(null);

  const isQuietMode = false;
  const [minimizeTrainingLodge, setMinimizeTrainingLodge] = useState<boolean>(
    () => {
      return localStorage.getItem("trim_minimize_training_lodge") === "true";
    },
  );

  const [countdownSeconds, setCountdownSeconds] = useState<number>(() => {
    const saved = localStorage.getItem("trim_countdown_seconds");
    return saved ? parseInt(saved, 10) : 5; // default 5 seconds
  });

  useEffect(() => {
    localStorage.setItem(
      "trim_minimize_training_lodge",
      String(minimizeTrainingLodge),
    );
  }, [minimizeTrainingLodge]);

  // Derive levels
  const currentLevel = Math.floor(xp / 100) + 1;
  const xpNeededForNextLevel = 100;
  const xpInCurrentLevel = xp % 100;

  // Daily Quest structure
  interface Quest {
    id: string;
    text: string;
    target: number;
    current: number;
    completed: boolean;
    xpReward: number;
    coinReward: number;
    type: "workout" | "breath" | "checkin" | "favourite";
  }

  const [dailyQuests, setDailyQuests] = useState<Quest[]>(() => {
    const todayStr = new Date().toDateString();
    const savedDate = localStorage.getItem("trim_last_quest_date");
    const savedQuests = localStorage.getItem("trim_daily_quests");

    if (savedQuests && savedDate === todayStr) {
      try {
        return JSON.parse(savedQuests);
      } catch (e) {}
    }

    return [
      {
        id: "quest-workout-" + todayStr,
        text: "Finish any workout routine",
        target: 1,
        current: 0,
        completed: false,
        xpReward: 50,
        coinReward: 20,
        type: "workout",
      },
      {
        id: "quest-breath-" + todayStr,
        text: "Take a Zen breath control",
        target: 1,
        current: 0,
        completed: false,
        xpReward: 30,
        coinReward: 15,
        type: "breath",
      },
      {
        id: "quest-checkin-" + todayStr,
        text: "Post your daily Check-In log",
        target: 1,
        current: 0,
        completed: false,
        xpReward: 30,
        coinReward: 15,
        type: "checkin",
      },
    ];
  });

  // Sync state values to local storage
  useEffect(() => {
    localStorage.setItem("trim_xp", String(xp));
  }, [xp]);
  useEffect(() => {
    localStorage.setItem("trim_hearts", String(hearts));
  }, [hearts]);
  useEffect(() => {
    localStorage.setItem("trim_coins", String(coins));
  }, [coins]);
  useEffect(() => {
    localStorage.setItem("trim_streak_freezes", String(streakFreezes));
  }, [streakFreezes]);
  useEffect(() => {
    localStorage.setItem("trim_active_skin", activeSkin);
  }, [activeSkin]);
  useEffect(() => {
    localStorage.setItem("trim_unlocked_skins", JSON.stringify(unlockedSkins));
  }, [unlockedSkins]);
  useEffect(() => {
    localStorage.setItem("trim_daily_quests", JSON.stringify(dailyQuests));
    localStorage.setItem("trim_last_quest_date", new Date().toDateString());
  }, [dailyQuests]);

  // Handle active triggers
  const awardXpAndCoins = (
    xpAmt: number,
    coinAmt: number,
    messageContext?: string,
  ) => {
    playCoinSound();

    if (messageContext) {
      // Clean up XP and Coins representation from messages
      let displayMessage = messageContext
        .replace(/\s*[|+-]\s*\d+\s*XP\s*/gi, "")
        .replace(/\s*[|+-]\s*\d+\s*Coins\s*🪙/gi, "")
        .replace(/^[|+-]\s*XP\s*/gi, "")
        .replace(/^[|+-]\s*Coins\s*🪙/gi, "")
        .trim();

      setCongratsQuest(displayMessage);
      setTimeout(() => setCongratsQuest(null), 5000);
    }
  };

  const updateQuestProgress = (
    type: "workout" | "breath" | "checkin" | "favourite",
    amount: number,
  ) => {
    setDailyQuests((prev) => {
      const next = prev.map((q) => {
        if (q.type === type && !q.completed) {
          const nextCurrent = Math.min(q.target, q.current + amount);
          const isNowCompleted = nextCurrent >= q.target;
          if (isNowCompleted) {
            setTimeout(() => {
              awardXpAndCoins(
                q.xpReward,
                q.coinReward,
                `Daily Quest Completed: "${q.text}"!`,
              );
            }, 100);
            return { ...q, current: nextCurrent, completed: true };
          }
          return { ...q, current: nextCurrent };
        }
        return q;
      });
      return next;
    });
  };

  // Streak check (non-gamified recovery reminder)
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const lastActive = localStorage.getItem("trim_last_active_date");
    if (lastActive && lastActive !== todayStr) {
      const lastDate = new Date(lastActive);
      const todayDate = new Date();
      lastDate.setHours(0, 0, 0, 0);
      todayDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays > 1) {
        // user missed a day!
        setCongratsQuest(
          "Welcome back to Trim! Consistent training is the key to recovery.",
        );
        setTimeout(() => setCongratsQuest(null), 5000);
      }
    }
    localStorage.setItem("trim_last_active_date", todayStr);
  }, []);

  const [showCheckInModal, setShowCheckInModal] = useState<boolean>(false);
  const [checkInProgram, setCheckInProgram] = useState<Program | null>(null);

  const [activePlayingRoutine, setActivePlayingRoutine] =
    useState<Routine | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [playingProgramActivity, setPlayingProgramActivity] = useState<{
    programId: string;
    weekNumber: number;
    dayIndex: number;
    activityId: string;
  } | null>(null);

  // Forms overlays
  const [showRoutineForm, setShowRoutineForm] = useState<
    Routine | null | "new"
  >(null);
  const [showProgramForm, setShowProgramForm] = useState<boolean>(false);

  // Incoming Shared links alert helper
  const [incomingImport, setIncomingImport] = useState<{
    type: "routine" | "program";
    data: any;
  } | null>(null);

  // Active copy deep link toast/modal variables
  const [sharedLinkData, setSharedLinkData] = useState<{
    name: string;
    link: string;
    type: "routine" | "program";
  } | null>(null);
  const [clipboardCopied, setClipboardCopied] = useState<boolean>(false);

  // Archive accordion flag for programs section
  const [showArchivedPrograms, setShowArchivedPrograms] =
    useState<boolean>(false);

  // User Workplace & Lifestyle Profile configuration states
  const [profileName, setProfileName] = useState<string>(
    () => localStorage.getItem("trim_profile_name") || "Athlete",
  );
  const [profileAge, setProfileAge] = useState<string>(
    () => localStorage.getItem("trim_profile_age") || "30",
  );
  const [profileGoals, setProfileGoals] = useState<string>(
    () =>
      localStorage.getItem("trim_profile_goals") ||
      "Feel good, improve posture, build base strength",
  );
  const [profileEquipment, setProfileEquipment] = useState<string>(
    () =>
      localStorage.getItem("trim_profile_equipment") || "Dumbbells, Resistance Bands",
  );
  const [defaultUseEquipment, setDefaultUseEquipment] = useState<boolean>(() => {
    const saved = localStorage.getItem("trim_default_use_equipment");
    return saved === "true";
  });
  const [profileGender, setProfileGender] = useState<string>(
    () => localStorage.getItem("trim_profile_gender") || "Male",
  );
  const [profileLocation, setProfileLocation] = useState<string>(
    () => localStorage.getItem("trim_profile_location") || "San Francisco, CA",
  );
  const [transitionTime, setTransitionTime] = useState<number>(() => {
    const saved = localStorage.getItem("trim_transition_time");
    return saved ? parseInt(saved, 10) : 5;
  });
  const [profileBirthday, setProfileBirthday] = useState<string>(
    () => localStorage.getItem("trim_profile_birthday") || "",
  );
  const [profileOccupation, setProfileOccupation] = useState<string>(
    () => localStorage.getItem("trim_profile_occupation") || "",
  );
  const [profileStress, setProfileStress] = useState<string>(
    () => localStorage.getItem("trim_profile_stress") || "Moderate",
  );
  const [profileExternal, setProfileExternal] = useState<string>(
    () =>
      localStorage.getItem("trim_profile_external") ||
      "Yoga class on Wednesdays, weekend hiking",
  );
  const [profileWorkoutDuration, setProfileWorkoutDuration] = useState<string>(
    () => localStorage.getItem("trim_profile_workout_duration") || "20-30 mins",
  );
  const [profileWorkoutFrequency, setProfileWorkoutFrequency] =
    useState<string>(
      () =>
        localStorage.getItem("trim_profile_workout_frequency") ||
        "3 times per week",
    );
  const [profileNiggles, setProfileNiggles] = useState<string>(
    () => localStorage.getItem("trim_profile_niggles") || "None",
  );
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // States for home tab AI builder shortcuts
  const [homeRoutineTitle, setHomeRoutineTitle] = useState("");
  const [homeRoutinePrompt, setHomeRoutinePrompt] = useState("");
  const [homeRoutineTime, setHomeRoutineTime] = useState(15);

  const [homeProgramWeeks, setHomeProgramWeeks] = useState(3);
  const [homeProgramSessions, setHomeProgramSessions] = useState(3);
  const [homeProgramSessionTime, setHomeProgramSessionTime] = useState(30);
  const [homeProgramNotes, setHomeProgramNotes] = useState("");
  const [homeProgramNiggles, setHomeProgramNiggles] = useState("");

  const [aiBuilderTrigger, setAiBuilderTrigger] = useState<{
    builderType: "routine" | "program";
    routinePrompt?: string;
    routineTime?: number;
    routineEquipment?: string;
    routineTitle?: string;
    programWeeks?: number;
    programSessions?: number;
    programSessionTime?: number;
    programNotes?: string;
    programNiggles?: string;
  } | null>(null);

  const handleUpdateProfile = (
    updatedData: Partial<{
      occupation: string;
      stress: string;
      external: string;
      name: string;
      age: string | number;
      goals: string;
      equipment: string;
      birthday: string;
      gender: string;
      location: string;
      workoutDuration: string;
      workoutFrequency: string;
      niggles: string;
    }>,
  ) => {
    if (updatedData.occupation !== undefined) {
      setProfileOccupation(updatedData.occupation);
      localStorage.setItem("trim_profile_occupation", updatedData.occupation);
    }
    if (updatedData.stress !== undefined) {
      setProfileStress(updatedData.stress);
      localStorage.setItem("trim_profile_stress", updatedData.stress);
    }
    if (updatedData.external !== undefined) {
      setProfileExternal(updatedData.external);
      localStorage.setItem("trim_profile_external", updatedData.external);
    }
    if (updatedData.name !== undefined) {
      setProfileName(updatedData.name);
      localStorage.setItem("trim_profile_name", updatedData.name);
    }
    if (updatedData.age !== undefined) {
      const ageStr = String(updatedData.age);
      setProfileAge(ageStr);
      localStorage.setItem("trim_profile_age", ageStr);
    }
    if (updatedData.goals !== undefined) {
      setProfileGoals(updatedData.goals);
      localStorage.setItem("trim_profile_goals", updatedData.goals);
    }
    if (updatedData.equipment !== undefined) {
      setProfileEquipment(updatedData.equipment);
      localStorage.setItem("trim_profile_equipment", updatedData.equipment);
    }
    if (updatedData.birthday !== undefined) {
      setProfileBirthday(updatedData.birthday);
      localStorage.setItem("trim_profile_birthday", updatedData.birthday);
    }
    if (updatedData.gender !== undefined) {
      setProfileGender(updatedData.gender);
      localStorage.setItem("trim_profile_gender", updatedData.gender);
    }
    if (updatedData.location !== undefined) {
      setProfileLocation(updatedData.location);
      localStorage.setItem("trim_profile_location", updatedData.location);
    }
    if (updatedData.workoutDuration !== undefined) {
      setProfileWorkoutDuration(updatedData.workoutDuration);
      localStorage.setItem(
        "trim_profile_workout_duration",
        updatedData.workoutDuration,
      );
    }
    if (updatedData.workoutFrequency !== undefined) {
      setProfileWorkoutFrequency(updatedData.workoutFrequency);
      localStorage.setItem(
        "trim_profile_workout_frequency",
        updatedData.workoutFrequency,
      );
    }
    if (updatedData.niggles !== undefined) {
      setProfileNiggles(updatedData.niggles);
      localStorage.setItem("trim_profile_niggles", updatedData.niggles);
    }
  };

  const handleResetAllData = () => {
    if (
      confirm(
        "Are you sure you want to completely reset all app data? This will restore initial default training programs, the routines library, clear your workout logs, and restart your onboarding assistant. This action cannot be undone.",
      )
    ) {
      localStorage.clear();
      setRoutines(DEFAULT_ROUTINES);
      setPrograms(DEFAULT_PROGRAMS);
      setHistory([]);
      setSelectedProgram(null);
      localStorage.setItem("trim_onboard_completed", "false");
      setShowOnboarding(true);
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  const handleExportDataToHardDrive = () => {
    try {
      const dataToExport = {
        routines,
        programs,
        history,
        profile: {
          name: profileName,
          age: profileAge,
          goals: profileGoals,
          equipment: profileEquipment,
          gender: profileGender,
          location: profileLocation,
          birthday: profileBirthday,
          occupation: profileOccupation,
          stress: profileStress,
          external: profileExternal,
          workoutDuration: profileWorkoutDuration,
          workoutFrequency: profileWorkoutFrequency,
          niggles: profileNiggles,
        },
        stats: {
          xp: localStorage.getItem("trim_xp") || "0",
          coins: localStorage.getItem("trim_coins") || "0",
          hearts: localStorage.getItem("trim_hearts") || "5",
          streak: localStorage.getItem("trim_breathwork_streak") || "0",
        },
        version: "7.0",
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(dataToExport, null, 2),
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute(
        "download",
        `trim_workout_backup_${new Date().toISOString().split("T")[0]}.json`,
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("Error exporting data: " + err);
    }
  };

  const handleImportDataFromHardDrive = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (parsed.routines) {
            setRoutines(parsed.routines);
            localStorage.setItem(
              "trim_routines",
              JSON.stringify(parsed.routines),
            );
          }
          if (parsed.programs) {
            setPrograms(parsed.programs);
            localStorage.setItem(
              "trim_programs",
              JSON.stringify(parsed.programs),
            );
          }
          if (parsed.history) {
            setHistory(parsed.history);
            localStorage.setItem(
              "trim_history",
              JSON.stringify(parsed.history),
            );
          }
          if (parsed.profile) {
            const p = parsed.profile;
            if (p.name !== undefined) {
              setProfileName(p.name);
              localStorage.setItem("trim_profile_name", p.name);
            }
            if (p.age !== undefined) {
              setProfileAge(p.age);
              localStorage.setItem("trim_profile_age", p.age);
            }
            if (p.goals !== undefined) {
              setProfileGoals(p.goals);
              localStorage.setItem("trim_profile_goals", p.goals);
            }
            if (p.equipment !== undefined) {
              setProfileEquipment(p.equipment);
              localStorage.setItem("trim_profile_equipment", p.equipment);
            }
            if (p.gender !== undefined) {
              setProfileGender(p.gender);
              localStorage.setItem("trim_profile_gender", p.gender);
            }
            if (p.location !== undefined) {
              setProfileLocation(p.location);
              localStorage.setItem("trim_profile_location", p.location);
            }
            if (p.birthday !== undefined) {
              setProfileBirthday(p.birthday);
              localStorage.setItem("trim_profile_birthday", p.birthday);
            }
            if (p.occupation !== undefined) {
              setProfileOccupation(p.occupation);
              localStorage.setItem("trim_profile_occupation", p.occupation);
            }
            if (p.stress !== undefined) {
              setProfileStress(p.stress);
              localStorage.setItem("trim_profile_stress", p.stress);
            }
            if (p.external !== undefined) {
              setProfileExternal(p.external);
              localStorage.setItem("trim_profile_external", p.external);
            }
            if (p.workoutDuration !== undefined) {
              setProfileWorkoutDuration(p.workoutDuration);
              localStorage.setItem(
                "trim_profile_workout_duration",
                p.workoutDuration,
              );
            }
            if (p.workoutFrequency !== undefined) {
              setProfileWorkoutFrequency(p.workoutFrequency);
              localStorage.setItem(
                "trim_profile_workout_frequency",
                p.workoutFrequency,
              );
            }
            if (p.niggles !== undefined) {
              setProfileNiggles(p.niggles);
              localStorage.setItem("trim_profile_niggles", p.niggles);
            }
          }
          if (parsed.stats) {
            const s = parsed.stats;
            if (s.xp !== undefined) localStorage.setItem("trim_xp", s.xp);
            if (s.coins !== undefined)
              localStorage.setItem("trim_coins", s.coins);
            if (s.hearts !== undefined)
              localStorage.setItem("trim_hearts", s.hearts);
            if (s.streak !== undefined)
              localStorage.setItem("trim_breathwork_streak", s.streak);
          }
          alert(
            "Backup successfully imported and database restored! Reloading...",
          );
          window.location.reload();
        } catch (err) {
          alert(
            "Error importing file. Make sure it's a valid Trim backup JSON file.",
          );
        }
      };
    }
  };

  // Check first-startup onboarding
  useEffect(() => {
    const onboardCompleted = localStorage.getItem("trim_onboard_completed");
    if (onboardCompleted !== "true") {
      setShowOnboarding(true);
    }
  }, []);

  // Custom standalone workout complete logger triggers (history only)
  const [standaloneLoggingGoal, setStandaloneLoggingGoal] =
    useState<boolean>(false);
  const [manualLogName, setManualLogName] = useState<string>("");
  const [manualLogType, setManualLogType] = useState<string>("Run");
  const [manualLogDuration, setManualLogDuration] = useState<number>(30);
  const [manualLogNotes, setManualLogNotes] = useState<string>("");

  // Calendar states for Completed training logs view
  const [calendarYear, setCalendarYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [calendarMonth, setCalendarMonth] = useState<number>(
    new Date().getMonth(),
  );
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(
    null,
  );
  const [showCalendar, setShowCalendar] = useState<boolean>(() => {
    return localStorage.getItem("trim_show_calendar") !== "false";
  });
  const [showJournalArchive, setShowJournalArchive] = useState<boolean>(() => {
    return localStorage.getItem("trim_show_journal_archive") !== "false";
  });

  // Delete Routine confirm state helper
  const [deletingRoutineId, setDeletingRoutineId] = useState<string | null>(
    null,
  );

  // --- CHECK AND HANDOFF INCOMING SHARED BASE64 LINKS ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareType = params.get("shareType");
    const shareData = params.get("shareData");

    if (shareType && shareData) {
      try {
        const decodedString = decodeURIComponent(atob(shareData));
        const parsedPayload = JSON.parse(decodedString);

        if (shareType === "routine" && parsedPayload.name) {
          setIncomingImport({ type: "routine", data: parsedPayload });
        } else if (shareType === "program" && parsedPayload.name) {
          setIncomingImport({ type: "program", data: parsedPayload });
        }
      } catch (e) {
        console.error("Deep link parser warning:", e);
      }
    }
  }, []);

  // --- ACTION RESOLUTIONS ---
  const handleAcceptIncomingShared = () => {
    if (!incomingImport) return;

    const seed = Math.random().toString(36).substr(2, 4);
    if (incomingImport.type === "routine") {
      const routineObj: Routine = {
        ...incomingImport.data,
        id: `shared-routine-${seed}-${Date.now()}`,
        isFavourite: false,
        recentlyUsedAt: null,
      };
      setRoutines((prev) => [routineObj, ...prev]);
      setActiveTab("library");
    } else if (incomingImport.type === "program") {
      const programObj: Program = {
        ...incomingImport.data,
        id: `shared-program-${seed}-${Date.now()}`,
        isArchived: false,
      };
      setPrograms((prev) => [programObj, ...prev]);
      setActiveTab("library");
      setLibrarySubTab("programs");
    }

    // Clear URL query parameters completely
    window.history.replaceState({}, document.title, window.location.pathname);
    setIncomingImport(null);
  };

  const handleDeclineIncomingShared = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setIncomingImport(null);
  };

  // --- GENERATING SHARE DEEP LINKS ---
  const handleTriggerShareRoutine = (e: React.MouseEvent, r: Routine) => {
    e.stopPropagation();
    try {
      const rawData = btoa(encodeURIComponent(JSON.stringify(r)));
      const link = `${window.location.origin}${window.location.pathname}?shareType=routine&shareData=${rawData}`;

      setSharedLinkData({
        name: r.name,
        link: link,
        type: "routine",
      });
      setClipboardCopied(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerShareProgram = (p: Program) => {
    try {
      const rawData = btoa(encodeURIComponent(JSON.stringify(p)));
      const link = `${window.location.origin}${window.location.pathname}?shareType=program&shareData=${rawData}`;

      setSharedLinkData({
        name: p.name,
        link: link,
        type: "program",
      });
      setClipboardCopied(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLinkToClipboard = () => {
    if (!sharedLinkData) return;
    navigator.clipboard
      .writeText(sharedLinkData.link)
      .then(() => {
        setClipboardCopied(true);
        setTimeout(() => setClipboardCopied(false), 2000);
      })
      .catch(() => {
        alert(
          "Clipboard access disabled. Copy link directly from input text box.",
        );
      });
  };

  // --- STATS CALCS ---
  const computedTotalSessions = history.length;
  const computedTotalMinutes = history.reduce(
    (acc, curr) => acc + (curr.durationCompleted || 0),
    0,
  );

  // Calculate Streak State
  const computedStreak = (() => {
    if (history.length === 0) return 0;
    const sortedDates = [...history]
      .map((h) => new Date(h.completedAt).toDateString())
      .filter((value, index, self) => self.indexOf(value) === index)
      .map((d) => new Date(d))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    let yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (sortedDates.length === 0) return 0;

    // Check if most recent is today or yesterday to preserve streak
    const mostRecent = sortedDates[0];
    mostRecent.setHours(0, 0, 0, 0);

    if (
      mostRecent.getTime() !== today.getTime() &&
      mostRecent.getTime() !== yesterday.getTime()
    ) {
      return 0; // Streak broken/not started
    }

    let compareDate = new Date(mostRecent);
    for (let i = 0; i < sortedDates.length; i++) {
      const d = sortedDates[i];
      d.setHours(0, 0, 0, 0);

      if (d.getTime() === compareDate.getTime()) {
        streak++;
        compareDate.setDate(compareDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  })();

  // --- ROUTINE ACTIONS ---
  const handleLaunchRoutinePlayer = (
    r: Routine,
    programActivityBind?: {
      programId: string;
      weekNumber: number;
      dayIndex: number;
      activityId: string;
    },
  ) => {
    // Save to recently used list
    setRoutines((prev) =>
      prev.map((item) => {
        if (item.id === r.id) {
          return { ...item, recentlyUsedAt: new Date().toISOString() };
        }
        return item;
      }),
    );
    setActivePlayingRoutine(r);
    if (programActivityBind) {
      setPlayingProgramActivity(programActivityBind);
    } else {
      setPlayingProgramActivity(null);
    }
  };

  const handleCompleteActiveWorkout = (
    elapsedMins: number,
    notesFeedback: string,
  ) => {
    if (!activePlayingRoutine) return;

    const newLog: WorkoutHistory = {
      id: `history-${Date.now()}`,
      routineId: activePlayingRoutine.id,
      name: activePlayingRoutine.name,
      type: "Routine",
      durationCompleted: elapsedMins,
      completedAt: new Date().toISOString(),
      notes: notesFeedback,
    };

    setHistory((prev) => [newLog, ...prev]);

    // Advance daily quest progress
    awardXpAndCoins(
      0,
      0,
      `Workout Completed: Completed "${activePlayingRoutine.name}"! Outstanding work on preserving consistency.`,
    );
    updateQuestProgress("workout", 1);

    // Update state inside running active Program as completed
    if (playingProgramActivity) {
      const { programId, weekNumber, dayIndex, activityId } =
        playingProgramActivity;
      setPrograms((prev) =>
        prev.map((p) => {
          if (p.id !== programId) return p;
          const updated = {
            ...p,
            weeks: p.weeks.map((wk) => {
              if (wk.weekNumber !== weekNumber) return wk;
              return {
                ...wk,
                days: wk.days.map((day) => {
                  if (day.dayIndex !== dayIndex) return day;
                  return {
                    ...day,
                    activities: day.activities.map((act) => {
                      if (act.id === activityId) {
                        return {
                          ...act,
                          completed: true,
                          completedAt: new Date().toISOString(),
                        };
                      }
                      return act;
                    }),
                  };
                }),
              };
            }),
          };
          // Also sync state if it is currently selected/viewed
          if (selectedProgram && selectedProgram.id === programId) {
            setTimeout(() => setSelectedProgram(updated), 0);
          }
          return updated;
        }),
      );
      setPlayingProgramActivity(null);
    } else if (selectedProgram) {
      const updatedWeeks = selectedProgram.weeks.map((wk) => ({
        ...wk,
        days: wk.days.map((day) => ({
          ...day,
          activities: day.activities.map((act) => {
            if (
              act.type === "Routine" &&
              act.routineId === activePlayingRoutine.id &&
              !act.completed
            ) {
              return {
                ...act,
                completed: true,
                completedAt: new Date().toISOString(),
              };
            }
            return act;
          }),
        })),
      }));

      const nextProgramState = { ...selectedProgram, weeks: updatedWeeks };
      setSelectedProgram(nextProgramState);
      setPrograms((prev) =>
        prev.map((p) => (p.id === selectedProgram.id ? nextProgramState : p)),
      );
    }

    setActivePlayingRoutine(null);
  };

  const handleSaveRoutineBluePrint = (payload: Routine) => {
    const exists = routines.some((r) => r.id === payload.id);
    if (exists) {
      setRoutines((prev) =>
        prev.map((r) => (r.id === payload.id ? payload : r)),
      );
    } else {
      setRoutines((prev) => [payload, ...prev]);
    }
    setShowRoutineForm(null);
  };

  const handleDuplicateRoutine = (e: React.MouseEvent, r: Routine) => {
    e.stopPropagation();
    const copy: Routine = {
      ...r,
      id: `routine-copy-${Date.now()}`,
      name: `${r.name} (Copy)`,
      isFavourite: false,
      recentlyUsedAt: null,
      exercises: r.exercises.map((ex, i) => ({
        ...ex,
        id: `ex-copy-${Date.now()}-${i}`,
      })),
      intervals: r.intervals.map((int, i) => ({
        ...int,
        id: `int-copy-${Date.now()}-${i}`,
      })),
    };
    setRoutines((prev) => [copy, ...prev]);
  };

  const handleToggleFavouriteRoutine = (e: React.MouseEvent, rId: string) => {
    e.stopPropagation();
    setRoutines((prev) =>
      prev.map((item) => {
        if (item.id === rId) {
          return { ...item, isFavourite: !item.isFavourite };
        }
        return item;
      }),
    );
  };

  const handleDeleteRoutine = (rId: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== rId));
    setDeletingRoutineId(null);
  };

  // --- PROGRAM ACTIONS ---
  const handleSaveProgramBase = (payload: Program) => {
    setPrograms((prev) => [payload, ...prev]);
    setShowProgramForm(false);
    setSelectedProgram(payload); // Select instantly to view calendar assigner
  };

  const handleDuplicateProgram = (p: Program) => {
    // Duplicate structure, reset calendar completions
    const copy: Program = {
      ...p,
      id: `program-copy-${Date.now()}`,
      name: `${p.name} (Copy)`,
      isArchived: false,
      weeks: p.weeks.map((wk) => ({
        ...wk,
        days: wk.days.map((day) => ({
          ...day,
          activities: day.activities.map((act) => ({
            ...act,
            id: `act-copy-${Date.now()}-${Math.random()}`,
            completed: false,
            completedAt: null,
          })),
        })),
      })),
    };
    setPrograms((prev) => [copy, ...prev]);
  };

  const handleToggleMinimizeProgram = (pId: string) => {
    setMinimizedProgramIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId],
    );
  };

  const handleArchiveProgramToggle = (pId: string, archiveStatus: boolean) => {
    setPrograms((prev) =>
      prev.map((p) => (p.id === pId ? { ...p, isArchived: archiveStatus } : p)),
    );
    if (selectedProgram && selectedProgram.id === pId) {
      setSelectedProgram((prev) =>
        prev ? { ...prev, isArchived: archiveStatus } : null,
      );
    }
  };

  const handleDeleteProgram = (pId: string) => {
    setPrograms((prev) => prev.filter((p) => p.id !== pId));
    if (selectedProgram && selectedProgram.id === pId) {
      setSelectedProgram(null);
    }
  };

  // Manual history logger submit
  const handleAddManualLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLogName.trim()) return;

    const newLog: WorkoutHistory = {
      id: `history-manual-${Date.now()}`,
      name: manualLogName.trim(),
      type: manualLogType as any,
      durationCompleted: Number(manualLogDuration),
      completedAt: new Date().toISOString(),
      notes: manualLogNotes.trim(),
    };

    setHistory((prev) => [newLog, ...prev]);
    setStandaloneLoggingGoal(false);
    setManualLogName("");
    setManualLogNotes("");
    setManualLogDuration(30);
  };

  // Filtering routines inside Library representation
  const filteredRoutines = routines
    .filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(routineSearch.toLowerCase()) ||
        r.instructions.toLowerCase().includes(routineSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (activeRoutineTag !== "all") {
        if (!r.tags || !r.tags.includes(activeRoutineTag)) {
          return false;
        }
      }

      if (activeLibraryTab === "favourites") {
        return r.isFavourite;
      }
      if (activeLibraryTab === "recent") {
        return !!r.recentlyUsedAt;
      }
      return true;
    })
    .sort((a, b) => {
      if (activeLibraryTab === "recent") {
        const aTime = a.recentlyUsedAt
          ? new Date(a.recentlyUsedAt).getTime()
          : 0;
        const bTime = b.recentlyUsedAt
          ? new Date(b.recentlyUsedAt).getTime()
          : 0;
        return bTime - aTime;
      }
      return 0;
    });

  const activePrograms = programs.filter((p) => !p.isArchived);
  const archivedPrograms = programs.filter((p) => p.isArchived);

  return (
    <div
      className={`min-h-screen ${
        primaryColorTheme === "dark"
          ? "theme-dark bg-slate-950 text-slate-100 font-sans"
          : "bg-white text-slate-900 font-sans"
      } flex flex-col justify-between selection:bg-slate-900 selection:text-white`}
      id="trim-application-root"
    >
      {/* NATIVE HEADER WITH ANCHORED HUD */}
      <header
        className={`backdrop-blur-md z-30 py-2 px-6 sticky top-0 ${
          primaryColorTheme === "dark"
            ? "bg-slate-950/95 border-b border-slate-800 text-white shadow-none"
            : "bg-white/95 border-b border-slate-200 text-slate-900 shadow-none"
        }`}
        id="trim-main-header"
      >
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-1 md:gap-3 relative">
          {/* BRAND (No frame, pure typography) */}
          <div
            className="flex items-center cursor-pointer select-none shrink-0"
            onClick={() => handleNavigateToTab("home")}
          >
            <div className="flex items-center space-x-1.5">
              <span className="text-xl font-black tracking-tight font-display text-slate-900 dark:text-white uppercase">
                TRIM
              </span>
              <span className="text-[10px] uppercase text-indigo-500 font-mono font-bold tracking-wider">
                v8
              </span>
            </div>
          </div>

          {/* NAVIGATION CONSOLE NAVIGATION (Centered in header on md+ & frameless) */}
          <div className="flex items-center justify-center gap-0.5 md:absolute md:left-1/2 md:-translate-x-1/2 z-10 overflow-x-auto scrollbar-none max-w-[50%] xs:max-w-none">
            <button
              onClick={() => handleNavigateToTab("home")}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold font-display transition duration-200 ${
                activeTab === "home"
                  ? `${themeColor.text} bg-slate-100/85 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold`
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span>Home</span>
            </button>

            <button
              onClick={() => handleNavigateToTab("library")}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold font-display transition duration-200 ${
                activeTab === "library"
                  ? `${themeColor.text} bg-slate-100/85 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold`
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span>Library</span>
            </button>

            <button
              onClick={() => handleNavigateToTab("breath")}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-bold font-display transition duration-200 ${
                activeTab === "breath"
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950 font-extrabold"
                  : "text-slate-500 hover:text-indigo-550 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span>Breath</span>
            </button>
          </div>

          {/* RIGHT SIDE PROFILE ACTION (Minimal & clean, no gamification stats) */}
          <div className="flex items-center space-x-2.5 shrink-0 justify-end ml-auto md:ml-0">
            {/* FIRE STREAK COUNTER - Any activity counts */}
            <div
              className="flex items-center space-x-1 py-1 px-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/40 rounded-xl transition cursor-pointer"
              title="Consecutive Day Streak"
              onClick={() => handleNavigateToTab("history")}
            >
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              <span className="text-xs font-black text-amber-700 dark:text-amber-400 font-mono tracking-tight leading-none">
                {computedStreak}
              </span>
            </div>

            {/* PROFILE BUTTON - Trim boy sprite with user name underneath */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex flex-col items-center justify-center py-1 px-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-150 transition"
              title="Preferences and Profile"
            >
              <img
                src={trimBoySprite}
                alt="Profile Avatar"
                className="w-6.5 h-6.5 object-contain rounded-full bg-transparent shadow-none"
                referrerPolicy="no-referrer"
              />
              <span className="text-[9px] font-black text-slate-700 font-display mt-0.5 max-w-[65px] truncate uppercase tracking-tight font-sans">
                {profileName}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD GRID CONTAINER */}
      <main
        className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 md:px-8 space-y-8"
        id="trim-dashboard-viewport"
      >
        {selectedProgram ? (
          <div className="animate-fade-in" id="selected-program-portal">
            <div className="mb-6">
              <button
                onClick={() => setSelectedProgram(null)}
                className="group inline-flex items-center space-x-2 text-xs font-extrabold font-sans tracking-wider text-slate-500 hover:text-indigo-650 transition uppercase select-none cursor-pointer"
              >
                <span className="text-sm font-bold">←</span>
                <span>Back to Trim Dashboard</span>
              </button>
            </div>
            <ProgramViewer
              program={selectedProgram}
              routines={routines}
              onClose={() => setSelectedProgram(null)}
              onUpdateProgram={(updated) => {
                setSelectedProgram(updated);
                setPrograms((prev) =>
                  prev.map((p) => (p.id === updated.id ? updated : p)),
                );
              }}
              onAddRoutine={(newRoutine) => {
                setRoutines((prev) => [newRoutine, ...prev]);
              }}
              onDuplicateProgram={handleDuplicateProgram}
              onArchiveProgram={handleArchiveProgramToggle}
              onDeleteProgram={handleDeleteProgram}
              onShareProgram={handleTriggerShareProgram}
              onLaunchRoutine={handleLaunchRoutinePlayer}
            />
          </div>
        ) : (
          <>
            {/* ACTIVE CONTENT VIEWPORTS */}

            {/* 0. HOME TAB */}
            {activeTab === "home" && !showProgramForm && !showRoutineForm && (
              <div
                className="space-y-6 text-left animate-fade-in"
                id="trim-tab-home"
              >
                {/* GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* CURRENT ACTIVE PROGRAMS AND SCHEDULE */}
                  <div className="lg:col-span-8 space-y-6">
                    <div>
                      <h3 className="text-xs font-black font-display text-slate-400 uppercase tracking-widest mb-3 flex items-center space-x-2 flex-wrap gap-2">
                        <span>
                          Current Active Programs ({activePrograms.length})
                        </span>
                        {activePrograms.length > 2 && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold font-mono uppercase">
                            Showing Top 2 (Limit active)
                          </span>
                        )}
                      </h3>

                      {activePrograms.length > 0 ? (
                        <div className="space-y-4">
                          {activePrograms.slice(0, 2).map((p) => {
                            let tot = 0;
                            let comp = 0;
                            p.weeks.forEach((w) =>
                              w.days.forEach((d) =>
                                d.activities.forEach((a) => {
                                  tot++;
                                  if (a.completed) comp++;
                                }),
                              ),
                            );
                            const pPercent =
                              tot > 0 ? Math.round((comp / tot) * 100) : 0;

                            // Determine the active week (the first week with an incomplete activity)
                            const activeWeekInfo = (() => {
                              for (const wk of p.weeks) {
                                for (const day of wk.days) {
                                  if (
                                    day.activities.some((a) => !a.completed)
                                  ) {
                                    return wk;
                                  }
                                }
                              }
                              return p.weeks[0] || null;
                            })();

                            const daysOfWeek = [
                              "Monday",
                              "Tuesday",
                              "Wednesday",
                              "Thursday",
                              "Friday",
                              "Saturday",
                              "Sunday",
                            ];

                            // Flatten all activities in natural chronological order to locate "currently on" (first incomplete) and "whats coming up next" (right after)
                            const allActivitiesList: any[] = [];
                            p.weeks.forEach((wk) => {
                              wk.days.forEach((dy) => {
                                dy.activities.forEach((act) => {
                                  allActivitiesList.push({
                                    week: wk,
                                    day: dy,
                                    activity: act,
                                    dayName:
                                      daysOfWeek[dy.dayIndex] ||
                                      `Day ${dy.dayIndex + 1}`,
                                  });
                                });
                              });
                            });

                            const currentCalendarDayIndex =
                              (new Date().getDay() + 6) % 7; // Monday = 0, Sunday = 6
                            const activeWeek =
                              p.weeks.find((wk) => {
                                return wk.days.some((dy) =>
                                  dy.activities.some((act) => !act.completed),
                                );
                              }) || p.weeks[0];

                            const todayCalendarDay = activeWeek
                              ? activeWeek.days.find(
                                  (dy) =>
                                    dy.dayIndex === currentCalendarDayIndex,
                                )
                              : null;
                            const todayActivity =
                              todayCalendarDay?.activities.find(
                                (act) => !act.completed,
                              ) || todayCalendarDay?.activities[0];

                            const currentlyOn = todayActivity
                              ? {
                                  week: activeWeek,
                                  day: todayCalendarDay,
                                  activity: todayActivity,
                                  dayName:
                                    daysOfWeek[currentCalendarDayIndex] ||
                                    `Day ${currentCalendarDayIndex + 1}`,
                                }
                              : null;

                            const comingUpNext = (() => {
                              // Find next incomplete activity scheduled for calendar days later this week
                              const futureInWeek = allActivitiesList.find(
                                (item) => {
                                  return (
                                    item.week.weekNumber ===
                                      activeWeek.weekNumber &&
                                    item.day.dayIndex >
                                      currentCalendarDayIndex &&
                                    !item.activity.completed
                                  );
                                },
                              );
                              if (futureInWeek) return futureInWeek;

                              // Find incomplete activity in subsequent weeks
                              const futureInNextWeeks = allActivitiesList.find(
                                (item) => {
                                  return (
                                    item.week.weekNumber >
                                      activeWeek.weekNumber &&
                                    !item.activity.completed
                                  );
                                },
                              );
                              if (futureInNextWeeks) return futureInNextWeeks;

                              // Fallback to any generic active incomplete item that is not today's
                              return (
                                allActivitiesList.find(
                                  (item) =>
                                    !item.activity.completed &&
                                    item.activity.id !== todayActivity?.id,
                                ) || null
                              );
                            })();

                            const isMinimized = minimizedProgramIds.includes(
                              p.id,
                            );

                            if (isMinimized) {
                              return (
                                <div
                                  key={p.id}
                                  className="bg-slate-50 border border-slate-200 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-200 text-left"
                                >
                                  <div className="flex items-center space-x-3 truncate">
                                    <span className="p-2.5 bg-slate-200 text-slate-600 rounded-2xl shrink-0">
                                      <Calendar className="w-5 h-5 opacity-70" />
                                    </span>
                                    <div className="truncate">
                                      <h4
                                        className="font-extrabold text-slate-800 text-sm truncate cursor-pointer hover:text-slate-950 transition duration-155"
                                        onClick={() => setSelectedProgram(p)}
                                      >
                                        {p.name}
                                      </h4>
                                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                        {p.weeksCount} WEEKS PROGRESS •{" "}
                                        <span className="font-bold text-slate-700 bg-slate-200/50 px-1.5 py-0.5 rounded text-[9.5px] font-mono">
                                          {pPercent}% Completed (Minimized)
                                        </span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleMinimizeProgram(p.id)
                                      }
                                      className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 rounded-full text-slate-850 shadow-xs transition cursor-pointer select-none"
                                      title="Expand card"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={p.id}
                                className="bg-white border border-slate-150 p-6 rounded-3xl hover:shadow-md transition duration-200 text-left relative"
                              >
                                {/* MINIMISE ICON BUTTON TOP RIGHT */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleMinimizeProgram(p.id)
                                  }
                                  className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-full text-slate-800 transition cursor-pointer select-none"
                                  title="Minimize card"
                                >
                                  <span className="text-base font-extrabold leading-none block mb-0.5">
                                    —
                                  </span>
                                </button>

                                {/* HEADER WITH TITLE & MAIN PERCENTAGE */}
                                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-4 pr-10">
                                  <div
                                    className="cursor-pointer"
                                    onClick={() => setSelectedProgram(p)}
                                  >
                                    <h4 className="font-extrabold text-slate-850 text-base font-display truncate hover:text-slate-900 transition">
                                      {p.name}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <span className="text-[10px] text-slate-400 font-mono uppercase">
                                        {p.weeksCount} WEEKS PROGRESS
                                      </span>
                                      <span className="text-[10px] text-slate-300">
                                        •
                                      </span>
                                      <span className="text-[10px] text-indigo-600 font-bold font-mono uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 transition">
                                        VIEW PROGRAM
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCheckInProgram(p);
                                          setShowCheckInModal(true);
                                        }}
                                        className="py-0.5 px-2 bg-slate-900 hover:bg-black text-white rounded font-bold text-[9px] uppercase transition tracking-tight duration-100 font-mono select-none"
                                      >
                                        ✓ Weekly Check-in
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setManualLogName("");
                                          setManualLogNotes(
                                            "Log of sport training session (surfing, running, skating, yoga) done today.",
                                          );
                                          setManualLogDuration(45);
                                          setManualLogType("Run");
                                          setStandaloneLoggingGoal(true);
                                        }}
                                        className="py-0.5 px-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-indigo-750 dark:text-indigo-300 border border-indigo-250 dark:border-indigo-900/60 rounded font-bold text-[9px] uppercase transition tracking-tight duration-100 font-mono select-none"
                                        title="Log surfing, running, skating, yoga, etc."
                                      >
                                        ⊕ Log External Activity
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 self-end xl:self-auto shrink-0">
                                    <span className="text-sm font-bold font-mono text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
                                      {pPercent}% Completed
                                    </span>
                                  </div>
                                </div>

                                {/* COACH NOTES / ADVICE REMINDER */}
                                {p.notes && (
                                  <div className="mb-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11.5px] text-slate-800 font-sans leading-relaxed">
                                    <span className="font-bold block text-[9.5px] text-slate-500 uppercase font-mono tracking-wider mb-1">
                                      Active Program modification Note
                                    </span>
                                    {p.notes}
                                  </div>
                                )}

                                {/* Progress bar */}
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-6">
                                  <div
                                    className="bg-sky-500 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${pPercent}%` }}
                                  ></div>
                                </div>

                                {/* WEEKLY GUIDE BOX (7 Days Grid) */}
                                {activeWeekInfo && (
                                  <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                                        WEEK {activeWeekInfo.weekNumber}{" "}
                                        SCHEDULE GUIDE
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-450 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                                        {
                                          activeWeekInfo.days.filter((d) =>
                                            d.activities.every(
                                              (a) => a.completed,
                                            ),
                                          ).length
                                        }{" "}
                                        of 7 Days Done
                                      </span>
                                    </div>

                                    <div className="flex overflow-x-auto pb-2 gap-2.5 snap-x snap-mandatory scrollbar-none md:grid md:grid-cols-7">
                                      {daysOfWeek.map((dayName, dIdx) => {
                                        const dayData =
                                          activeWeekInfo.days.find(
                                            (d) => d.dayIndex === dIdx,
                                          );
                                        const dayActivities = dayData
                                          ? dayData.activities
                                          : [];
                                        const isDayCurrentlyOn =
                                          currentlyOn &&
                                          currentlyOn.week.weekNumber ===
                                            activeWeekInfo.weekNumber &&
                                          currentlyOn.day.dayIndex === dIdx;
                                        const isDayCompleted =
                                          dayActivities.length > 0 &&
                                          dayActivities.every(
                                            (a) => a.completed,
                                          );

                                        return (
                                          <div
                                            key={dIdx}
                                            className={`p-3 rounded-2xl border text-center transition-all duration-200 flex flex-col justify-between min-w-[105px] md:min-w-0 snap-center ${
                                              isDayCurrentlyOn
                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md ring-4 ring-indigo-505/20 scale-[1.02]"
                                                : isDayCompleted
                                                  ? "bg-emerald-50/40 border-emerald-200 text-emerald-800"
                                                  : dayActivities.length > 0
                                                    ? "bg-slate-50/90 border-slate-200"
                                                    : "bg-slate-50/20 border-dashed border-slate-200 text-slate-400"
                                            }`}
                                          >
                                            <span
                                              className={`block text-[9px] font-mono uppercase font-black tracking-widest ${
                                                isDayCurrentlyOn
                                                  ? "text-indigo-200"
                                                  : "text-slate-500"
                                              }`}
                                            >
                                              {dayName.substring(0, 3)}
                                            </span>
                                            <div className="my-2.5 flex justify-center items-center">
                                              {isDayCompleted ? (
                                                <span
                                                  className={
                                                    isDayCurrentlyOn
                                                      ? "text-white font-black text-xs"
                                                      : "text-emerald-500 font-bold text-xs"
                                                  }
                                                >
                                                  ✓
                                                </span>
                                              ) : isDayCurrentlyOn ? (
                                                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                                              ) : dayActivities.length > 0 ? (
                                                <span className="text-[9px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-black font-mono">
                                                  {dayActivities.length}
                                                </span>
                                              ) : (
                                                <span className="text-[9px] font-mono tracking-tight text-slate-400">
                                                  Rest
                                                </span>
                                              )}
                                            </div>
                                            <span
                                              className={`block text-[8px] font-semibold truncate leading-tight font-sans ${
                                                isDayCurrentlyOn
                                                  ? "text-white"
                                                  : "text-slate-500"
                                              }`}
                                            >
                                              {dayActivities.length > 0
                                                ? dayActivities[0].name
                                                : "Rest Day"}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* CURRENTLY ON & WHAT'S COMING UP DOUBLE DETAIL WINDOWS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* CURRENTLY ON CARD */}
                                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-850 flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center space-x-1.5 mb-2.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                                        <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#2e2e2e]">
                                          Today
                                        </span>
                                      </div>

                                      {currentlyOn ? (
                                        <>
                                          <h5 className="font-extrabold text-sm leading-snug font-display text-slate-950">
                                            {currentlyOn.activity.name}
                                          </h5>
                                          <p className="text-[11px] text-slate-600 mt-1 font-mono">
                                            Week {currentlyOn.week.weekNumber} •{" "}
                                            {currentlyOn.dayName} •{" "}
                                            {currentlyOn.activity.duration} Mins{" "}
                                            {currentlyOn.activity.distance
                                              ? `• ${currentlyOn.activity.distance}km`
                                              : ""}
                                          </p>
                                        </>
                                      ) : (
                                        <p className="text-[11px] text-slate-500 italic">
                                          All scheduled target activities
                                          completed for this week!
                                        </p>
                                      )}
                                    </div>

                                    {currentlyOn && (
                                      <div className="mt-4 pt-3 border-t border-slate-150 flex items-center justify-between gap-2">
                                        <span className="text-[10px] text-slate-500 font-mono uppercase">
                                          {currentlyOn.activity.type}
                                        </span>

                                        <div className="flex items-center space-x-2">
                                          {currentlyOn.activity.type ===
                                            "Routine" ||
                                          currentlyOn.activity.type ===
                                            "Mobility" ||
                                          currentlyOn.activity.type ===
                                            "Recovery" ||
                                          currentlyOn.activity.name
                                            .toLowerCase()
                                            .includes("stretch") ||
                                          currentlyOn.activity.name
                                            .toLowerCase()
                                            .includes("workout") ? (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Try to match by routineId or name (using fuzzy matching)
                                                const foundRoutine =
                                                  findMatchingRoutine(
                                                    routines,
                                                    currentlyOn.activity.name,
                                                    currentlyOn.activity
                                                      .routineId,
                                                  );

                                                const finalRoutine =
                                                  foundRoutine ||
                                                  generateRoutineFromActivity(
                                                    currentlyOn.activity.name,
                                                    currentlyOn.activity
                                                      .duration || 15,
                                                    currentlyOn.activity.id,
                                                  );

                                                handleLaunchRoutinePlayer(
                                                  finalRoutine,
                                                  {
                                                    programId: p.id,
                                                    weekNumber:
                                                      currentlyOn.week
                                                        .weekNumber,
                                                    dayIndex:
                                                      currentlyOn.day.dayIndex,
                                                    activityId:
                                                      currentlyOn.activity.id,
                                                  },
                                                );
                                              }}
                                              className="w-8 h-8 rounded-full bg-slate-900 hover:bg-black text-white flex items-center justify-center transition-all duration-150 active:scale-95 shadow-xs shrink-0 cursor-pointer"
                                              title="Play Routine"
                                            >
                                              <Play className="w-3.5 h-3.5 fill-current text-white" />
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const updated = { ...p };
                                                for (const wk of updated.weeks) {
                                                  for (const day of wk.days) {
                                                    const act =
                                                      day.activities.find(
                                                        (a) =>
                                                          a.id ===
                                                          currentlyOn.activity
                                                            .id,
                                                      );
                                                    if (act) {
                                                      act.completed = true;
                                                      act.completedAt =
                                                        new Date().toISOString();

                                                      // Log into general history
                                                      const newLog: WorkoutHistory =
                                                        {
                                                          id:
                                                            "history-item-" +
                                                            Date.now(),
                                                          name: `${p.name} - ${act.name}`,
                                                          type: "Routine", // Keep compatible with WorkoutHistory type
                                                          completedAt:
                                                            act.completedAt,
                                                          durationCompleted:
                                                            act.duration || 10,
                                                          notes: `Logged completed directly from the home dashboard.`,
                                                        };
                                                      setHistory((prev) => [
                                                        newLog,
                                                        ...prev,
                                                      ]);
                                                      break;
                                                    }
                                                  }
                                                }
                                                setPrograms((prev) =>
                                                  prev.map((pr) =>
                                                    pr.id === p.id
                                                      ? updated
                                                      : pr,
                                                  ),
                                                );
                                              }}
                                              className="w-8 h-8 rounded-full bg-white border border-slate-300 text-slate-800 flex items-center justify-center hover:bg-slate-50 hover:border-slate-500 transition-all duration-150 active:scale-95 shrink-0 cursor-pointer"
                                              title="Mark as Done"
                                            >
                                              <Check className="w-4 h-4 stroke-[3]" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* WHAT'S COMING UP CARD */}
                                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-850 flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center space-x-1.5 mb-2.5">
                                        <span className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400 block">
                                          Up Next
                                        </span>
                                      </div>

                                      {comingUpNext ? (
                                        <>
                                          <h5 className="font-extrabold text-sm leading-snug font-display text-slate-700">
                                            {comingUpNext.activity.name}
                                          </h5>
                                          <p className="text-[11px] text-slate-500 mt-1 font-mono">
                                            Week {comingUpNext.week.weekNumber}{" "}
                                            • {comingUpNext.dayName} •{" "}
                                            {comingUpNext.activity.type}
                                          </p>
                                        </>
                                      ) : (
                                        <p className="text-[11px] text-slate-500 italic mt-1 leading-normal">
                                          This concludes all active program
                                          sessions. Ready to archive or draft a
                                          new weekly cycle!
                                        </p>
                                      )}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] font-mono text-slate-400 flex justify-between items-center leading-none">
                                      <span>Program Schedule Order</span>
                                      <span>Upcoming</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div
                          className="bg-white border border-slate-200 rounded-3xl p-8 text-slate-850 relative flex flex-col items-center justify-center text-center w-full max-w-md mx-auto"
                          id="empty-programs-builder-redirect-card"
                        >
                          <div className="w-16 h-16 rounded-full bg-[#f0f4ff] flex items-center justify-center mb-6 text-indigo-600 shrink-0 font-bold">
                            <span className="text-2xl select-none">✨</span>
                          </div>
                          <h4 className="font-extrabold text-[#0f172a] text-sm md:text-base font-display tracking-wide uppercase mb-3">
                            Build Training Program with AI
                          </h4>
                          <p className="text-[11.5px] md:text-xs text-[#64748b] mb-6 leading-relaxed font-sans max-w-xs">
                            You don't have an active training program running.
                            Open our interactive AI Program Builder to
                            synthesize a comprehensive multi-week calendar
                            tailored around your schedule, goals, and training
                            load.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setAiBuilderTrigger({
                                builderType: "program",
                                programWeeks: 4,
                                programSessions: 3,
                                programSessionTime: 30,
                                programNotes: "",
                                programNiggles: "",
                              });
                              setActiveTab("ai-importer");
                            }}
                            className="py-3 px-6 bg-[#0f172a] hover:bg-black text-white font-extrabold text-xs rounded-2xl transition duration-150 cursor-pointer select-none uppercase tracking-wider"
                          >
                            Open AI Program Builder &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT COLUMN: QUICK WORKOUT ACTIONS & FAVORITE ROUTINES */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* FAVORITE ROUTINES WIDGET */}
                    {routines.length > 0 ? (
                      <div
                        className="bg-white rounded-3xl p-5 shadow-xs text-left"
                        id="trim-favourite-routines-widget"
                      >
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2.5 shrink-0">
                          <h3 className="text-xs font-black font-display text-slate-800 uppercase tracking-widest flex items-center space-x-1.5">
                            <span className="text-yellow-405 font-bold">★</span>
                            <span>Favourite Routines</span>
                          </h3>
                          <button
                            onClick={() => setActiveTab("library")}
                            className="text-[10px] text-sky-600 hover:underline font-mono font-bold uppercase"
                          >
                            Library &rarr;
                          </button>
                        </div>

                        {routines.filter((r) => r.isFavourite).length > 0 ? (
                          <div className="space-y-3.5">
                            {routines
                              .filter((r) => r.isFavourite)
                              .slice(0, 3)
                              .map((r) => (
                                <div
                                  key={r.id}
                                  className="bg-slate-50 hover:bg-slate-100 hover:shadow-xs transition border border-slate-150/50 rounded-2xl p-4 flex flex-col justify-between text-left cursor-pointer"
                                  onClick={() => handleLaunchRoutinePlayer(r)}
                                >
                                  <div className="flex items-start justify-between min-w-0 gap-2 mb-1">
                                    <h4 className="font-extrabold text-xs text-slate-800 font-display truncate leading-tight">
                                      {r.name}
                                    </h4>
                                    <span className="text-yellow-405 text-[11px] shrink-0 font-bold">
                                      ★
                                    </span>
                                  </div>

                                  <p className="text-[10.5px] text-slate-500 leading-normal line-clamp-2 mb-3.5 italic font-sans">
                                    "
                                    {r.instructions ||
                                      "Custom structured physical workout template."}
                                    "
                                  </p>

                                  <div className="flex items-center justify-between shrink-0 pt-2 border-t border-slate-150/40 text-[10px] font-mono leading-none">
                                    <span className="text-slate-400 font-semibold uppercase">
                                      {r.duration} Mins • {r.exercises.length}{" "}
                                      Exs
                                    </span>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLaunchRoutinePlayer(r);
                                      }}
                                      className="py-1 px-2.5 bg-yellow-50 hover:bg-yellow-105 border border-yellow-200 text-yellow-800 rounded-lg font-bold flex items-center space-x-1"
                                    >
                                      <Play className="w-2 h-2 fill-current" />
                                      <span>Play</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div
                            className="bg-white rounded-3xl p-8 text-slate-850 relative flex flex-col items-center justify-center text-center w-full max-w-md mx-auto"
                            id="empty-favourites-redirect-card"
                          >
                            <div className="w-16 h-16 rounded-full bg-[#f0f4ff] flex items-center justify-center mb-6 text-indigo-600 shrink-0 font-bold animate-pulse">
                              <span className="text-2xl select-none">★</span>
                            </div>
                            <h4 className="font-extrabold text-[#0f172a] text-sm md:text-base font-display tracking-wide uppercase mb-3">
                              No Favourite Routines Starred
                            </h4>
                            <p className="text-[11.5px] md:text-xs text-[#64748b] mb-6 leading-relaxed font-sans max-w-xs">
                              Select and toggle the star icon on any custom
                              fitness routine from your library directory to pin
                              it directly to your home layout.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab("library");
                                setLibrarySubTab("routines");
                              }}
                              className="py-3 px-6 bg-[#0f172a] hover:bg-black text-white font-extrabold text-xs rounded-2xl transition duration-150 cursor-pointer select-none uppercase tracking-wider"
                            >
                              Explore Library &rarr;
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="bg-white rounded-3xl p-8 text-slate-850 relative flex flex-col items-center justify-center text-center w-full max-w-md mx-auto"
                        id="empty-routines-ai-builder-card"
                      >
                        <div className="w-16 h-16 rounded-full bg-[#f0f4ff] flex items-center justify-center mb-6 text-indigo-600 shrink-0 font-bold">
                          <span className="text-2xl select-none">✨</span>
                        </div>
                        <h4 className="font-extrabold text-[#0f172a] text-sm md:text-base font-display tracking-wide uppercase mb-3">
                          Build Routine with AI
                        </h4>
                        <p className="text-[11.5px] md:text-xs text-[#64748b] mb-6 leading-relaxed font-sans max-w-xs">
                          You don't have any workout routines in your library.
                          Open our interactive AI Routine Builder to synthesize
                          single workouts (e.g. Tabata burners, strength
                          circuits, desk-stretches) with exercises, intervals,
                          and custom equipment.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setAiBuilderTrigger({
                              builderType: "routine",
                              routineTitle: "",
                              routineTime: 15,
                              routinePrompt: "",
                              routineEquipment: "",
                            });
                            setActiveTab("ai-importer");
                          }}
                          className="py-3 px-6 bg-[#0f172a] hover:bg-black text-white font-extrabold text-xs rounded-2xl transition duration-150 cursor-pointer select-none uppercase tracking-wider"
                        >
                          Open AI Routine Builder &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* RECOVERY SUITE TAB */}
            {activeTab === "recovery" &&
              !showProgramForm &&
              !showRoutineForm && (
                <div
                  className="space-y-6 text-left animate-fade-in"
                  id="trim-tab-recovery"
                >
                  <div className="bg-gradient-to-r from-sky-50 to-indigo-100/30 p-6 rounded-3xl border border-sky-100/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl md:text-2xl font-black font-display text-slate-800 flex items-center space-x-2">
                        <Moon className="w-6 h-6 text-indigo-600" />
                        <span>Physical Recovery Suite</span>
                      </h2>
                    </div>

                    <button
                      onClick={() =>
                        setShowRoutineForm({
                          id: "new-recovery-" + Date.now(),
                          name: "Custom Restorative Stretch",
                          duration: 15,
                          instructions:
                            "Slow breathing holds. Target tense muscle complexes.",
                          notes: "Bodyweight only",
                          isRecovery: true,
                          isFavourite: false,
                          recentlyUsedAt: null,
                          exercises: [
                            {
                              id: "stretch-" + Date.now() + "-1",
                              name: "Extended Child Pose Hold",
                              reps: null,
                              sets: 1,
                              weight: "bodyweight",
                              duration: 90,
                            },
                            {
                              id: "stretch-" + Date.now() + "-2",
                              name: "Thoracic Thread the Needle",
                              reps: null,
                              sets: 1,
                              weight: "bodyweight",
                              duration: 90,
                            },
                          ],
                          intervals: [],
                        })
                      }
                      className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Restoration Routine</span>
                    </button>
                  </div>

                  {/* SECTION 1: BUILT-IN MAINTENANCE STRETCHES */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black font-display text-slate-800 uppercase tracking-widest leading-none">
                        🧘 Built-In Maintenance stretches
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Preserve joint dynamics and relieve chronic posture
                        stiffness
                      </span>
                    </div>

                    {/* STRETCH CARD ROWS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* 3 static programs list */}
                      {[
                        {
                          id: "morning-stretch",
                          title: "Morning Energizer Prep",
                          time: 8,
                          focus:
                            "Spine mobilization, cat-cow, overhead reaches, thoracic turns",
                          badge: "Morning Maintenance",
                          badgeStyle:
                            "bg-yellow-50 text-amber-700 border-yellow-200",
                          description:
                            "Perform on waking. Moves primary axial line to wake up nervous system and reduce morning stiffness.",
                        },
                        {
                          id: "day-stretch",
                          title: "Mid-Day Office Posture Reboot",
                          time: 5,
                          focus:
                            "Chest expander, back twists, seated hamstring release, face/wrist relax",
                          badge: "Day Desk Reset",
                          badgeStyle: "bg-sky-50 text-sky-700 border-sky-100",
                          description:
                            "Ideal for desk workers. Counteracts typing desk hunch, releases shoulder drag and wrist strain.",
                        },
                        {
                          id: "night-stretch",
                          title: "Night Meltdown Sleep Prep",
                          time: 12,
                          focus:
                            "Deep static child's pose, butterfly press, pigeon pose, calves slow hold",
                          badge: "Night Recharge",
                          badgeStyle:
                            "bg-[#eef2ff] text-indigo-700 border-indigo-150 border-indigo-100",
                          description:
                            "Slow, long passive holds. Signals physical parasympathetic shift to support deep tissue growth sleep cycles.",
                        },
                      ].map((sc) => (
                        <div
                          key={sc.id}
                          className="bg-white border border-sky-100/50 p-4 rounded-2xl hover:shadow-md transition duration-200 text-left"
                        >
                          <div className="flex items-start justify-between gap-2.5 mb-1">
                            <div className="space-y-0.5">
                              <span
                                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${sc.badgeStyle}`}
                              >
                                {sc.badge}
                              </span>
                              <h4 className="font-bold text-slate-800 text-[14.5px] font-display mt-1">
                                {sc.title}
                              </h4>
                            </div>
                            <span className="text-xs font-mono font-bold text-sky-600 shrink-0 bg-sky-50/50 px-2.5 py-0.5 rounded-lg">
                              ★ {sc.time} Mins
                            </span>
                          </div>

                          <p className="text-slate-500 text-xs my-2 leading-relaxed">
                            {sc.description}
                          </p>

                          <div className="text-[10px] font-mono text-slate-500 bg-slate-50 rounded-xl p-2.5 leading-normal">
                            <span className="font-bold block text-[8.5px] uppercase tracking-wide text-slate-400 mb-1">
                              Stretches Sequence Focus:
                            </span>
                            {sc.focus}
                          </div>

                          <div className="flex justify-end mt-3 pt-2.5 border-t border-slate-100 shrink-0 font-semibold">
                            <button
                              onClick={() => {
                                const exerciseMap: Record<string, string[]> = {
                                  "morning-stretch": [
                                    "Spine mobilization (cat-cow) - Axial warmup",
                                    "Overhead reach-ups - Upper core opening",
                                    "Thoracic spine rotations - Lateral thoracic flow",
                                    "Deep static child pose - Lower back traction decompression",
                                  ],
                                  "day-stretch": [
                                    "Seated chest expanders - Typing slouch correction",
                                    "Spine twist release - Seated lumbar mobility",
                                    "Seated hamstring decompression - Tight glute release",
                                    "Forearm and wrist extensions - Anti-RSI strain rolls",
                                  ],
                                  "night-stretch": [
                                    "Deep static child's pose passive stretch",
                                    "Butterfly hip opener - Lower body decompression",
                                    "Pigeon pose (Left leg) - Gluteus minimus stretch",
                                    "Pigeon pose (Right leg) - Gluteus minimus stretch",
                                    "Slow calf stretch (Left side)",
                                    "Slow calf stretch (Right side)",
                                  ],
                                };
                                const routineExs = (
                                  exerciseMap[sc.id] || []
                                ).map((exName, idx) => ({
                                  id: `${sc.id}-ex-${idx}`,
                                  name: exName,
                                  reps: null,
                                  sets: 1,
                                  weight: "bodyweight",
                                  duration: Math.round(
                                    (sc.time * 60) /
                                      (exerciseMap[sc.id]?.length || 4),
                                  ),
                                }));
                                const playRoutine: Routine = {
                                  id: sc.id,
                                  name: sc.title,
                                  exercises: routineExs,
                                  intervals: [],
                                  duration: sc.time,
                                  instructions: sc.description,
                                  notes: "Maintenance guided stretch session",
                                  isFavourite: false,
                                  recentlyUsedAt: new Date().toISOString(),
                                  isRecovery: true,
                                };
                                handleLaunchRoutinePlayer(playRoutine);
                              }}
                              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center shadow-xs transition mr-2"
                              title="Play Guided Stretch"
                            >
                              <Play className="w-4 h-4 fill-current" />
                            </button>
                            <button
                              onClick={() => {
                                const newLog: WorkoutHistory = {
                                  id: "history-item-" + Date.now(),
                                  name: sc.title,
                                  type: "Mobility" as any,
                                  completedAt: new Date().toISOString(),
                                  durationCompleted: sc.time,
                                  notes:
                                    "Completed controlled guided stretch sequence.",
                                };
                                setHistory((prev) => [newLog, ...prev]);
                                alert(
                                  `Completed stretching! Logged "${sc.title}" (${sc.time} minutes) directly to your training history! Streak preserved.`,
                                );
                              }}
                              className="p-2 bg-yellow-50 hover:bg-yellow-105 border border-yellow-250 border-yellow-200 text-yellow-805 text-yellow-800 rounded-lg flex items-center justify-center shadow-xs transition"
                              title="Mark Completed"
                            >
                              <CheckCircle2 className="w-4 h-4 text-yellow-600 fill-yellow-100" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 2: CUSTOM RESTORATIVE SEQUENCES */}
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black font-display text-slate-800 uppercase tracking-widest leading-none">
                        🧬 Custom Restorative Sequences
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Tailored stretches designed for your trigger points
                      </span>
                    </div>

                    {routines.filter((r) => r.isRecovery).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {routines
                          .filter((r) => r.isRecovery)
                          .map((r) => (
                            <div
                              key={r.id}
                              className="bg-white border border-slate-150 p-4 rounded-2xl hover:shadow-md transition duration-200 text-left flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2.5 mb-1">
                                  <h4 className="font-extrabold text-slate-800 text-sm font-display leading-tight">
                                    {r.name}
                                  </h4>
                                  <span className="text-xs font-mono font-bold text-indigo-605 shrink-0 bg-indigo-50 px-2 rounded-lg">
                                    {r.duration} Mins
                                  </span>
                                </div>

                                <p className="text-slate-500 text-xs my-2 leading-relaxed">
                                  {r.instructions ||
                                    "Custom designed stretching movements sequence."}
                                </p>

                                <div className="text-[10.5px] font-mono text-indigo-900 bg-indigo-50/40 rounded-xl p-2.5 leading-normal mb-3">
                                  <span className="font-bold block text-[8.5px] uppercase tracking-wide text-indigo-400 mb-1">
                                    Stretches Included ({r.exercises.length}):
                                  </span>
                                  {r.exercises
                                    .map(
                                      (ex) =>
                                        `${ex.name} ${ex.duration ? `(${ex.duration}s)` : ""}`,
                                    )
                                    .join(", ")}
                                </div>
                              </div>

                              <div className="flex justify-between items-center mt-2 pt-2.5 border-t border-slate-100 gap-1 shrink-0 text-xs text-slate-500">
                                <div className="flex space-x-1.5">
                                  <button
                                    onClick={() => setShowRoutineForm(r)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition"
                                    title="Edit Stretch"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (
                                        confirm(
                                          `Are you sure you want to delete this custom restorative routine "${r.name}"?`,
                                        )
                                      ) {
                                        setRoutines((prev) =>
                                          prev.filter(
                                            (item) => item.id !== r.id,
                                          ),
                                        );
                                      }
                                    }}
                                    className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition"
                                    title="Delete Stretch"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex space-x-1.5 font-semibold">
                                  <button
                                    onClick={() => handleLaunchRoutinePlayer(r)}
                                    className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-550 text-white rounded-lg flex items-center space-x-1 shadow-sm text-xs"
                                  >
                                    <Play className="w-3 h-3 text-white fill-current" />
                                    <span>Play</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newLog: WorkoutHistory = {
                                        id: "history-item-" + Date.now(),
                                        name: r.name,
                                        type: "Mobility" as any,
                                        completedAt: new Date().toISOString(),
                                        durationCompleted: r.duration,
                                        notes:
                                          "Completed user custom restorative stretching sequence.",
                                      };
                                      setHistory((prev) => [newLog, ...prev]);
                                      alert(
                                        `Completed recovery! Logged "${r.name}" (${r.duration} minutes) directly to your training history.`,
                                      );
                                    }}
                                    className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-850 rounded-lg flex items-center space-x-1 shadow-xs text-xs"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                                    <span>Mark Done</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-8 text-center text-slate-405">
                        <Moon className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                        <p className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">
                          No Custom Stretches Yet
                        </p>
                        <p className="text-[11.5px] text-slate-500 mt-1 max-w-sm mx-auto">
                          Click the "+ Add Restoration Routine" button above to
                          design a custom stretching workflow tailored for your
                          trouble zones!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* BREATH SUITE TAB */}
            {activeTab === "breath" && (
              <div
                className="space-y-6 text-left animate-fade-in"
                id="trim-tab-breath"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-fade-in">
                  {/* BOX BREATHING MODULE */}
                  <div
                    className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between"
                    id="trim-breathwork-loaded-module"
                  >
                    {/* Top Header: Title Left, Pattern Right */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <div className="text-left">
                        <h3 className="text-lg font-black font-display text-slate-900 uppercase tracking-tight">
                          {selectedBreathwork.name}
                        </h3>
                        <p className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase mt-0.5">
                          Active Breathing Exercise
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          Pattern
                        </span>
                        <span className="inline-block text-xs font-bold font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg mt-0.5">
                          {selectedBreathwork.cycles
                            .map((c) => c.duration)
                            .join(", ")}
                        </span>
                      </div>
                    </div>

                    {/* Center: Breathing Circle */}
                    <div className="flex-1 flex flex-col items-center justify-center py-6">
                      <div
                        onClick={() => {
                          if (isBreathingRunning) {
                            setIsBreathingRunning(false);
                          } else {
                            if (
                              breathingTotalSecLeft <
                                breathingSessionDuration * 60 &&
                              breathingTotalSecLeft > 0
                            ) {
                              setIsBreathingRunning(true);
                            } else {
                              handleStartBreathing();
                            }
                          }
                        }}
                        className="relative flex items-center justify-center w-[220px] h-[220px] cursor-pointer group pointer-events-auto select-none rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500/40 transition-transform active:scale-98"
                        title={
                          isBreathingRunning
                            ? "Click Center to Pause"
                            : "Click Center to Begin"
                        }
                      >
                        <BreathingCanvas
                          isBreathingRunning={isBreathingRunning}
                          phase={phase}
                          theme={primaryColorTheme}
                          timeLeft={timeLeft}
                          duration={
                            selectedBreathwork.cycles[breathCycleIdx]
                              ?.duration || 4
                          }
                        />

                        {/* Inside circle display */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                          <span className="text-[8px] uppercase font-mono font-black tracking-widest text-slate-600">
                            {isBreathingRunning ? phase : "READY"}
                          </span>
                          <span className="text-xl font-black font-mono mt-0.5 text-slate-900">
                            {isBreathingRunning ? timeLeft + "s" : "START"}
                          </span>
                          {!isBreathingRunning && (
                            <span className="text-[8px] font-mono text-sky-600 font-bold mt-1 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
                              Tap Circle
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Clean Countdown session indicator */}
                      <div className="mt-4 text-center h-8 flex flex-col justify-center">
                        {isBreathingRunning ? (
                          <div className="animate-pulse">
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                              Session Remaining
                            </span>
                            <span className="block text-sm font-black font-mono text-indigo-600">
                              {Math.floor(breathingTotalSecLeft / 60)}:
                              {breathingTotalSecLeft % 60 < 10 ? "0" : ""}
                              {breathingTotalSecLeft % 60}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-50 border border-slate-150 px-3 py-1 rounded-full">
                            Session: {breathingSessionDuration} Minutes
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Below: Pause, Reset, and Length selectors */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Left: Duration Selector */}
                      {!isBreathingRunning ? (
                        <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                          {[1, 2, 3, 5].map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => {
                                setBreathingSessionDuration(mins);
                                setBreathingTotalSecLeft(mins * 60);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold transition-all ${
                                breathingSessionDuration === mins
                                  ? "bg-sky-600 text-white shadow-xs"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
                              }`}
                            >
                              {mins}M
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-steel-500 flex items-center space-x-1.5 font-bold">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                          <span className="text-slate-400">
                            Restoration Mode Active
                          </span>
                        </div>
                      )}

                      {/* Right: Actions */}
                      <div className="flex items-center space-x-2 shrink-0 font-bold">
                        {!isBreathingRunning ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                breathingTotalSecLeft <
                                  breathingSessionDuration * 60 &&
                                breathingTotalSecLeft > 0
                              ) {
                                setIsBreathingRunning(true);
                              } else {
                                handleStartBreathing();
                              }
                            }}
                            className="py-1.5 px-3.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer select-none uppercase tracking-wider"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span>
                              {breathingTotalSecLeft <
                                breathingSessionDuration * 60 &&
                              breathingTotalSecLeft > 0
                                ? "Resume"
                                : "Start"}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsBreathingRunning(false)}
                            className="py-1.5 px-3.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer select-none uppercase tracking-wider"
                          >
                            <Pause className="w-3 h-3 fill-current" />
                            <span>Pause</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleResetBreathing}
                          className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SELECTABLE BREATHWORK LIST */}
                  <div className="lg:col-span-5 space-y-4 text-left">
                    <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest leading-none mb-3">
                      Select Breathwork Training Plan
                    </h3>

                    <div className="space-y-3">
                      {BREATHWORK_ROUTINES.map((routine) => {
                        const isSelected = selectedBreathwork.id === routine.id;
                        return (
                          <div
                            key={routine.id}
                            onClick={() => handleSelectBreathwork(routine)}
                            className={`w-full p-4 rounded-2xl border text-left transition duration-200 group relative block cursor-pointer ${
                              isSelected
                                ? "bg-indigo-50/50 border-indigo-200 shadow-sm"
                                : "bg-white border-slate-100 hover:border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm font-display group-hover:text-indigo-650 tracking-tight transition">
                                  {routine.name}
                                </h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-sans">
                                  {routine.description}
                                </p>
                              </div>
                              {isSelected && (
                                <span className="bg-indigo-600 text-white rounded-lg px-2 py-0.5 text-[8.5px] font-mono tracking-wide font-bold uppercase shrink-0">
                                  Active
                                </span>
                              )}
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between text-[10px] text-slate-400 gap-1.5 font-mono">
                              <span>
                                <b>Sequence:</b>{" "}
                                {routine.cycles
                                  .map((c) => `${c.phase} (${c.duration}s)`)
                                  .join(" → ")}
                              </span>
                            </div>

                            <div className="mt-1.5 text-[10px] text-slate-500 font-semibold font-sans">
                              <span>
                                <b>Benefits:</b> {routine.benefits}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 1. PROGRAMS GRID TAB */}
            {activeTab === "programs" && null && (
              <div className="space-y-6 text-left" id="trim-tab-programs">
                {/* PRIMARY ACTIVE PLANS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-md font-bold font-display text-slate-700 uppercase tracking-widest text-[11px] flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
                      <span>Active Calendars ({activePrograms.length})</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono font-bold leading-none">
                      Programs = Long-term progression goals
                    </span>
                  </div>

                  {activePrograms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activePrograms.map((p) => {
                        // Calc active completion
                        let tot = 0;
                        let comp = 0;
                        p.weeks.forEach((w) =>
                          w.days.forEach((d) =>
                            d.activities.forEach((a) => {
                              tot++;
                              if (a.completed) comp++;
                            }),
                          ),
                        );
                        const pct =
                          tot > 0 ? Math.round((comp / tot) * 100) : 0;

                        return (
                          <div
                            key={p.id}
                            className="bg-white border border-sky-100/70 rounded-2xl hover:border-sky-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between group overflow-hidden pointer-events-auto cursor-pointer"
                            onClick={() => setSelectedProgram(p)}
                          >
                            <div className="p-5">
                              <div className="flex items-start justify-between">
                                <h4 className="text-base font-bold font-display text-slate-800 group-hover:text-sky-600 transition leading-tight truncate pr-2">
                                  {p.name}
                                </h4>
                                <span className="text-[10.5px] font-mono bg-sky-50 text-sky-600 font-bold px-2 py-0.5 rounded-md min-w-[70px] text-center shrink-0">
                                  {p.weeksCount} Wks
                                </span>
                              </div>

                              <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                                {p.description ||
                                  "Review multi-week assignments schedule and goals map."}
                              </p>
                            </div>

                            {/* BAR METRICS */}
                            <div className="px-5 pb-4 shrink-0">
                              <div className="flex items-center justify-between text-[11px] text-slate-505 font-mono mb-1 border-t border-slate-100 pt-3">
                                <span>Completed activities</span>
                                <span className="font-bold text-slate-700">
                                  {comp} / {tot} ({pct}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-sky-500 transition-all duration-550"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* FOOTER ACTIONS STRIP */}
                            <div className="px-5 py-3 bg-slate-50 border-t border-slate-105 flex items-center justify-between shrink-0 font-semibold text-[10.5px]">
                              <span className="text-sky-600 font-bold hover:text-sky-700 flex items-center space-x-0.5">
                                <span>Open Calendar</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>

                              <div className="flex items-center space-x-3 text-slate-400">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTriggerShareProgram(p);
                                  }}
                                  className="hover:text-sky-600 transition"
                                  title="Share plan"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleArchiveProgramToggle(p.id, true);
                                  }}
                                  className="hover:text-amber-605 hover:text-amber-600 transition"
                                  title="Archive program"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      confirm(
                                        `Are you sure you want to permanently delete program "${p.name}"? This cannot be undone.`,
                                      )
                                    ) {
                                      handleDeleteProgram(p.id);
                                    }
                                  }}
                                  className="hover:text-red-650 hover:text-red-600 transition ml-1"
                                  title="Delete program"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-900/40 rounded-2xl border border-slate-800 border-dashed p-10 text-center text-slate-500">
                      <Calendar className="w-12 h-12 stroke-[1.5] text-slate-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                        No Active Programs
                      </p>
                      <p className="text-[11.5px] mt-1 text-slate-500">
                        Assign standard cardio/routines or write custom drafts
                        to initialize timeline tracking.
                      </p>
                    </div>
                  )}
                </div>

                {/* ARCHIVED SECTION ACCORDION */}
                <div className="pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      setShowArchivedPrograms(!showArchivedPrograms)
                    }
                    className="py-2 px-3.5 bg-slate-900 hover:bg-slate-805 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition text-[11px] font-bold font-mono tracking-wider uppercase flex items-center space-x-2 shadow-sm cursor-pointer select-none"
                  >
                    {showArchivedPrograms ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                    <span>Archived Programs ({archivedPrograms.length})</span>
                  </button>

                  {showArchivedPrograms && (
                    <div className="mt-4 animate-fade-in">
                      {archivedPrograms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {archivedPrograms.map((p) => (
                            <div
                              key={p.id}
                              className="bg-slate-900 border border-slate-800 rounded-2xl opacity-75 hover:opacity-100 hover:shadow transition p-5 text-left flex flex-col justify-between"
                            >
                              <div>
                                <h4 className="text-sm font-bold font-display text-slate-200 truncate">
                                  {p.name}
                                </h4>
                                <p className="text-[11.5px] mt-1.5 text-slate-400 font-mono">
                                  Length: {p.weeksCount} Weeks (Archived)
                                </p>
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
                                <button
                                  onClick={() =>
                                    handleArchiveProgramToggle(p.id, false)
                                  }
                                  className="text-emerald-400 text-[10.5px] font-bold hover:underline"
                                >
                                  Restore to Active
                                </button>
                                <button
                                  onClick={() => handleDeleteProgram(p.id)}
                                  className="text-red-400 hover:text-red-350 hover:text-red-300 text-[10.5px] font-bold"
                                >
                                  Delete Plan
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic block mt-2 font-mono">
                          No archived training plans stored.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. LIBRARY TAB (Unified Routines & Programs) */}
            {activeTab === "library" &&
              !showRoutineForm &&
              !showProgramForm && (
                <div className="space-y-6" id="trim-tab-library">
                  {/* PRIMARY SUB-TAB NAVIGATION TOGGLE: ROUTINES vs PROGRAMS */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1 shrink-0">
                    <div className="flex space-x-6">
                      <button
                        type="button"
                        onClick={() => setLibrarySubTab("routines")}
                        className={`pb-2 text-sm font-bold font-display relative transition focus:outline-none ${
                          librarySubTab === "routines"
                            ? "text-sky-600 border-b-2 border-sky-500"
                            : "text-slate-400 hover:text-slate-800"
                        }`}
                      >
                        Routines
                      </button>
                      <button
                        type="button"
                        onClick={() => setLibrarySubTab("programs")}
                        className={`pb-2 text-sm font-bold font-display relative transition focus:outline-none ${
                          librarySubTab === "programs"
                            ? "text-sky-600 border-b-2 border-sky-500"
                            : "text-slate-400 hover:text-slate-800"
                        }`}
                      >
                        Programs
                      </button>
                    </div>

                    {/* Local Action Button */}
                    {librarySubTab === "routines" ? (
                      <button
                        onClick={() => setShowRoutineForm("new")}
                        className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white rounded-xl transition border border-indigo-200 shadow-sm flex items-center space-x-1"
                      >
                        <span>+ Construct Workout</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowProgramForm(true)}
                        className="py-1.5 px-3 bg-sky-600 hover:bg-sky-500 font-bold text-xs text-white rounded-xl transition border border-sky-200 shadow-sm flex items-center space-x-1"
                      >
                        <span>+ Draft Program</span>
                      </button>
                    )}
                  </div>

                  {librarySubTab === "routines" ? (
                    <div className="space-y-6 animate-fade-in">
                      {/* SUBTABS BAR */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sky-100 pb-3 shrink-0">
                        <div className="flex space-x-1 bg-white border border-sky-100/70 p-1 rounded-xl self-start">
                          <button
                            onClick={() => setActiveLibraryTab("all")}
                            className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition duration-155 ${
                              activeLibraryTab === "all"
                                ? "bg-sky-500 border border-sky-400 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            }`}
                          >
                            All Routines
                          </button>
                          <button
                            onClick={() => setActiveLibraryTab("favourites")}
                            className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition duration-155 flex items-center space-x-1 ${
                              activeLibraryTab === "favourites"
                                ? "bg-sky-505 bg-sky-500 border border-sky-400 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            }`}
                          >
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            <span>Favourites</span>
                          </button>
                          <button
                            onClick={() => setActiveLibraryTab("recent")}
                            className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition duration-155 flex items-center space-x-1 ${
                              activeLibraryTab === "recent"
                                ? "bg-sky-500 border border-sky-400 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Recently Used</span>
                          </button>
                        </div>

                        {/* SEARCH FILTER */}
                        <div className="relative w-full max-w-xs shrink-0 self-start flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={routineSearch}
                              onChange={(e) => setRoutineSearch(e.target.value)}
                              placeholder="Search workouts or directions..."
                              className="w-full text-base md:text-xs pl-9 pr-10 py-2 border border-slate-200 bg-white rounded-xl focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/30 transition text-slate-805 placeholder-slate-400 font-mono"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowTagFilters(!showTagFilters)}
                            className={`p-2 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                              showTagFilters
                                ? primaryColorTheme === "minimalist"
                                  ? "bg-[#2e2e2e] text-white border-[#2e2e2e]"
                                  : "bg-sky-500 text-white border-sky-400"
                                : primaryColorTheme === "minimalist"
                                  ? "bg-white text-slate-800 hover:bg-slate-50 border-slate-200"
                                  : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-slate-200"
                            }`}
                            title="Toggle Tag Filters"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* TAG FILTERS BAR */}
                      {showTagFilters && (
                        <div
                          className={`flex flex-wrap items-center gap-2 mb-4 p-2.5 rounded-2xl shrink-0 ${
                            primaryColorTheme === "minimalist"
                              ? "bg-white border border-slate-200"
                              : "bg-slate-50 border border-slate-100"
                          }`}
                        >
                          <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold px-1.5 mr-2">
                            Tag Categories:
                          </span>
                          <button
                            onClick={() => setActiveRoutineTag("all")}
                            className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase transition ${
                              activeRoutineTag === "all"
                                ? "bg-slate-900 border border-slate-900 text-white"
                                : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800"
                            }`}
                          >
                            All Tags
                          </button>
                          {["strength", "mobility", "tabata", "yoga"].map(
                            (tag) => (
                              <button
                                key={tag}
                                onClick={() => setActiveRoutineTag(tag)}
                                className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase transition ${
                                  activeRoutineTag === tag
                                    ? "bg-slate-900 border border-slate-900 text-white"
                                    : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800"
                                }`}
                              >
                                #{tag}
                              </button>
                            ),
                          )}
                        </div>
                      )}

                      {/* CONSOLE FEED CLASSIFICATION */}
                      <div className="flex items-center justify-between text-[11px] text-slate-505 font-mono uppercase font-bold leading-none shrink-0 mb-4 font-semibold">
                        <span>
                          Library Storage • Workout Templates (
                          {filteredRoutines.length})
                        </span>
                        <span className="text-yellow-800 bg-yellow-50 rounded px-1.5 py-0.5 border border-yellow-205">
                          Templates Library
                        </span>
                      </div>

                      {/* LIST GRID */}
                      {filteredRoutines.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredRoutines.map((r) => (
                            <div
                              key={r.id}
                              className="bg-white border border-sky-100/70 rounded-2xl p-5 hover:border-sky-305 hover:border-sky-300 hover:shadow-md transition-all duration-300 flex flex-col justify-between group text-left pb-4 cursor-pointer"
                              onClick={() => handleLaunchRoutinePlayer(r)}
                            >
                              <div>
                                {/* FIRST ROW ICON & OPTION */}
                                <div className="flex items-start justify-between min-w-0 mb-2">
                                  <span
                                    className={`text-[9px] font-mono tracking-wider font-bold px-2 py-0.5 rounded-full uppercase ${
                                      r.isRecovery
                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                        : "bg-sky-50 text-sky-700 border border-sky-100"
                                    }`}
                                  >
                                    {r.isRecovery
                                      ? "🧘 Recovery Activity"
                                      : "🔌 Workout Grid"}
                                  </span>

                                  <div className="flex items-center space-x-1 shrink-0">
                                    <button
                                      onClick={(e) =>
                                        handleToggleFavouriteRoutine(e, r.id)
                                      }
                                      className="p-1 rounded-lg hover:bg-slate-50 transition text-slate-400 hover:text-yellow-500 shrink-0"
                                      title="Favourite workout"
                                    >
                                      <Star
                                        className={`w-4 h-4 ${r.isFavourite ? "text-yellow-500 fill-yellow-500" : ""}`}
                                      />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowRoutineForm(r);
                                      }}
                                      className="p-1 rounded-lg hover:bg-slate-50 transition text-slate-400 hover:text-sky-600 shrink-0"
                                      title="Edit workout"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) =>
                                        handleDuplicateRoutine(e, r)
                                      }
                                      className="p-1 rounded-lg hover:bg-slate-50 transition text-slate-400 hover:text-slate-600 shrink-0"
                                      title="Duplicate workout"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingRoutineId(r.id);
                                      }}
                                      className="p-1 rounded-lg hover:bg-slate-50 transition text-slate-400 hover:text-red-650 shrink-0"
                                      title="Delete workout"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* NAME */}
                                <h4 className="text-base font-bold font-display text-slate-800 group-hover:text-sky-600 transition leading-tight mt-1 truncate">
                                  {r.name}
                                </h4>

                                {/* SPECS */}
                                <div className="flex items-center space-x-3 mt-2.5 text-xs text-slate-505 font-mono">
                                  <span className="flex items-center text-slate-600 font-semibold">
                                    <Clock className="w-3.5 h-3.5 text-slate-400 mr-1" />
                                    <span>{r.duration} Mins</span>
                                  </span>
                                  <span>•</span>
                                  <span>{r.exercises.length} Exercises</span>
                                  {r.intervals.length > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-sky-605 text-sky-600 font-semibold">
                                        {r.intervals.length} Intervals
                                      </span>
                                    </>
                                  )}
                                </div>

                                {/* SHORT LOG instructions */}
                                <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                                  {r.instructions ||
                                    "Review detail lists and trigger local PCM audio player."}
                                </p>
                              </div>

                              {/* INLINE DELETE CONFIRM IN CARD */}
                              {deletingRoutineId === r.id && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl mt-3 text-xs text-left">
                                  <p className="font-bold text-red-800 flex items-center space-x-1">
                                    <AlertCircle className="w-4 h-4 text-red-500" />
                                    <span>Confirm deletion?</span>
                                  </p>
                                  <div className="flex items-center justify-end space-x-2 mt-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingRoutineId(null);
                                      }}
                                      className="py-1 px-2.5 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-600"
                                    >
                                      No
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteRoutine(r.id);
                                      }}
                                      className="py-1 px-2.5 bg-red-600 hover:bg-red-550 text-white border rounded text-[10px] font-bold"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* ACTION TRIGGERS BAR */}
                              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 font-semibold text-[11px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleLaunchRoutinePlayer(r);
                                  }}
                                  className={`py-1.5 px-3 rounded-lg text-[10px] font-display font-semibold text-white shadow-xs transition flex items-center space-x-1 ${
                                    r.isRecovery
                                      ? "bg-indigo-600 hover:bg-indigo-500 shadow-sm"
                                      : "bg-sky-505 bg-sky-600 hover:bg-sky-500 shadow-sm"
                                  }`}
                                >
                                  <Play className="w-2.5 h-2.5 fill-white" />
                                  <span>Start Routine</span>
                                </button>

                                <button
                                  onClick={(e) =>
                                    handleTriggerShareRoutine(e, r)
                                  }
                                  className="p-1 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl flex items-center space-x-1 font-mono text-[9px] transition shadow-sm"
                                >
                                  <Share2 className="w-3 h-3 text-slate-400" />
                                  <span>Share workout</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          className="bg-white border border-slate-200 rounded-3xl p-6 text-slate-850 text-left relative flex flex-col items-center justify-center text-center max-w-md mx-auto"
                          id="library-routines-empty-card"
                        >
                          <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3 text-indigo-600 shrink-0 font-bold">
                            <span className="text-xl">✨</span>
                          </div>
                          <h4 className="font-extrabold text-slate-900 text-sm font-display tracking-tight uppercase mb-2">
                            Build Routine with AI
                          </h4>
                          <p className="text-[11.5px] text-slate-500 mb-5 leading-relaxed font-sans max-w-sm">
                            You don't have any workout routines in your
                            register. Start discussing and crafting
                            single-session templates tailored exactly around
                            your focus and custom gear.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setAiBuilderTrigger({
                                builderType: "routine",
                                routineTitle: "",
                                routineTime: 15,
                                routinePrompt: "",
                                routineEquipment: "",
                              });
                              setActiveTab("ai-importer");
                            }}
                            className="py-2.5 px-6 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-3xs transition cursor-pointer select-none uppercase tracking-wider"
                          >
                            Open AI Routine Builder →
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fade-in text-left">
                      {/* HELPER HEADING */}
                      <div className="flex items-center justify-between shrink-0 mb-4 border-b border-sky-100 pb-2.5">
                        <h3 className="text-[11px] font-bold font-mono text-slate-450 text-slate-400 uppercase tracking-widest flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                          <span>Manage Long-term Progress Calendars</span>
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Programs schedule activities over weeks
                        </span>
                      </div>

                      {/* ACTIVE CALENDARS GRID list */}
                      {activePrograms.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {activePrograms.map((p) => {
                            let tot = 0;
                            let comp = 0;
                            p.weeks.forEach((w) =>
                              w.days.forEach((d) =>
                                d.activities.forEach((a) => {
                                  tot++;
                                  if (a.completed) comp++;
                                }),
                              ),
                            );
                            const pct =
                              tot > 0 ? Math.round((comp / tot) * 100) : 0;

                            return (
                              <div
                                key={p.id}
                                className="bg-white border border-sky-100/70 rounded-2xl hover:border-sky-305 hover:shadow-md transition-all duration-300 flex flex-col justify-between group overflow-hidden cursor-pointer"
                                onClick={() => setSelectedProgram(p)}
                              >
                                <div className="p-5">
                                  <div className="flex items-start justify-between">
                                    <h4 className="text-base font-bold font-display text-slate-800 group-hover:text-sky-600 transition leading-tight truncate pr-2 flex items-center space-x-1.5 min-w-0">
                                      <span
                                        className="w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full inline-block animate-pulse shrink-0"
                                        title="Active"
                                      ></span>
                                      <span className="truncate">{p.name}</span>
                                    </h4>
                                    <span className="text-[10.5px] font-mono bg-sky-50 text-sky-600 font-bold px-2 py-0.5 rounded-md text-center shrink-0">
                                      {p.weeksCount} Wks
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                                    {p.description ||
                                      "Review multi-week assignments schedule and goals map."}
                                  </p>
                                </div>

                                <div className="px-5 pb-4 shrink-0">
                                  <div className="flex items-center justify-between text-[11px] text-slate-555 text-slate-500 font-mono mb-1 border-t border-slate-100 pt-3">
                                    <span>Completed activities</span>
                                    <span className="font-bold text-slate-700">
                                      {comp} / {tot} ({pct}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-sky-500 transition-all duration-550"
                                      style={{ width: `${pct}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0 font-semibold text-[10.5px]">
                                  <span className="text-sky-600 font-bold hover:text-sky-700 flex items-center space-x-0.5">
                                    <span>Open Calendar</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </span>

                                  <div className="flex items-center space-x-3 text-slate-400">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTriggerShareProgram(p);
                                      }}
                                      className="hover:text-sky-600 transition"
                                      title="Share plan"
                                    >
                                      <Share2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleArchiveProgramToggle(p.id, true);
                                      }}
                                      className="w-6 h-6 flex items-center justify-center bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-full transition-all"
                                      title="Deactivate & Eject Program"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="w-2.5 h-2.5"
                                      >
                                        <path d="M12 5l-7 8h14l-7-8zM5 16h14v2H5v-2z" />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (
                                          confirm(
                                            `Are you sure you want to permanently delete program "${p.name}"? This cannot be undone.`,
                                          )
                                        ) {
                                          handleDeleteProgram(p.id);
                                        }
                                      }}
                                      className="hover:text-red-655 hover:text-red-600 transition ml-1"
                                      title="Delete program"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-slate-50 rounded-2xl border border-slate-200 border-dashed p-10 text-center text-slate-400">
                          <Calendar className="w-12 h-12 stroke-[1.5] text-slate-350 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                            No Active Programs
                          </p>
                          <p className="text-[11.5px] mt-1 text-slate-500">
                            Assign standard cardio/routines or write custom
                            drafts to initialize timeline tracking.
                          </p>
                        </div>
                      )}

                      {/* ARCHIVED SECTION ACCORDION */}
                      <div className="pt-4 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() =>
                            setShowArchivedPrograms(!showArchivedPrograms)
                          }
                          className="py-2 px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 transition text-[11px] font-bold font-mono tracking-wider uppercase flex items-center space-x-2 shadow-sm cursor-pointer select-none"
                        >
                          {showArchivedPrograms ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                          <span>
                            Archived Programs ({archivedPrograms.length})
                          </span>
                        </button>

                        {showArchivedPrograms && (
                          <div className="mt-4 animate-fade-in text-left">
                            {archivedPrograms.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {archivedPrograms.map((p) => {
                                  let tot = 0;
                                  let comp = 0;
                                  p.weeks.forEach((w) =>
                                    w.days.forEach((d) =>
                                      d.activities.forEach((a) => {
                                        tot++;
                                        if (a.completed) comp++;
                                      }),
                                    ),
                                  );
                                  const pct =
                                    tot > 0
                                      ? Math.round((comp / tot) * 100)
                                      : 0;

                                  return (
                                    <div
                                      key={p.id}
                                      className="bg-slate-50 border border-slate-200 rounded-2xl hover:border-slate-350 hover:shadow-xs transition duration-300 flex flex-col justify-between overflow-hidden cursor-pointer opacity-85 hover:opacity-100"
                                      onClick={() => setSelectedProgram(p)}
                                    >
                                      <div className="p-5">
                                        <div className="flex items-start justify-between">
                                          <h4 className="text-base font-bold font-display text-slate-800 leading-tight truncate pr-2">
                                            {p.name}
                                          </h4>
                                          <span className="text-[10px] font-mono bg-slate-200/60 text-slate-600 font-bold px-2 py-0.5 rounded-md text-center shrink-0 uppercase tracking-tight">
                                            Archived
                                          </span>
                                        </div>

                                        <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
                                          {p.description ||
                                            "Review multi-week assignments schedule and goals map."}
                                        </p>
                                      </div>

                                      <div className="px-5 pb-4 shrink-0">
                                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-1 border-t border-slate-200 pt-3">
                                          <span>Completion progress</span>
                                          <span className="font-bold text-slate-700">
                                            {comp} / {tot} ({pct}%)
                                          </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-slate-400 transition-all duration-300"
                                            style={{ width: `${pct}%` }}
                                          ></div>
                                        </div>
                                      </div>

                                      <div className="px-5 py-3 bg-slate-100/60 border-t border-slate-250/50 flex items-center justify-between shrink-0 font-semibold text-[10.5px]">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleArchiveProgramToggle(
                                              p.id,
                                              false,
                                            );
                                          }}
                                          className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg font-bold text-[9.5px] uppercase transition flex items-center space-x-1 font-mono shadow-xs"
                                          title="Activate Program"
                                        >
                                          <Play className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                                          <span>Activate</span>
                                        </button>

                                        <div className="flex items-center space-x-3 text-slate-400">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTriggerShareProgram(p);
                                            }}
                                            className="hover:text-sky-600 transition"
                                            title="Share plan"
                                          >
                                            <Share2 className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (
                                                confirm(
                                                  `Are you sure you want to permanently delete program "${p.name}"? This cannot be undone.`,
                                                )
                                              ) {
                                                handleDeleteProgram(p.id);
                                              }
                                            }}
                                            className="hover:text-red-600 transition"
                                            title="Delete program"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 italic block mt-2 font-mono">
                                No archived training plans stored.
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* 3. HISTORY COMPLETED LOGS VIEW TAB */}
            {activeTab === "history" && (
              <div
                className="space-y-6 text-left animate-fade-in"
                id="trim-tab-history"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-md font-bold font-display text-slate-705 text-slate-800 uppercase tracking-widest text-[11px]">
                      Completed training journals
                    </h3>
                    <span className="text-xs font-mono text-sky-600 font-bold">
                      Streak preserved: {computedStreak} days
                    </span>
                  </div>
                  <button
                    onClick={() => setStandaloneLoggingGoal(true)}
                    className="py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 font-bold text-xs text-sky-600 rounded-xl transition flex items-center space-x-1 shadow-sm shrink-0"
                  >
                    <span>+ Log Completed Activity</span>
                  </button>
                </div>

                {/* CALENDAR VIEW WIDGET */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                  <div
                    onClick={() => {
                      setShowCalendar((prev) => {
                        const newVal = !prev;
                        localStorage.setItem(
                          "trim_show_calendar",
                          String(newVal),
                        );
                        return newVal;
                      });
                    }}
                    className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100 cursor-pointer select-none group"
                    style={{ marginBottom: showCalendar ? "1.25rem" : "0" }}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">📅</span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.55">
                        Training Calendar
                        <span className="text-[9px] font-mono lowercase bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-655 px-1.5 py-0.5 rounded transition">
                          {showCalendar ? "hide" : "show"}
                        </span>
                      </h4>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Calendar Month Navigation Controls */}
                      {showCalendar && (
                        <div
                          className="flex items-center space-x-1.5 bg-slate-50 p-1 border border-slate-200 rounded-xl font-mono text-[11px]"
                          onClick={
                            (e) =>
                              e.stopPropagation() /* Prevent collapse when navigating months */
                          }
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (calendarMonth === 0) {
                                setCalendarMonth(11);
                                setCalendarYear((y) => y - 1);
                              } else {
                                setCalendarMonth((m) => m - 1);
                              }
                              setSelectedCalendarDay(null);
                            }}
                            className="p-1 px-2.5 hover:bg-white rounded-lg hover:shadow-xs transition font-black text-slate-600"
                          >
                            ◀
                          </button>
                          <span className="font-bold text-slate-800 min-w-[120px] text-center">
                            {new Date(
                              calendarYear,
                              calendarMonth,
                            ).toLocaleString("default", {
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (calendarMonth === 11) {
                                setCalendarMonth(0);
                                setCalendarYear((y) => y + 1);
                              } else {
                                setCalendarMonth((m) => m + 1);
                              }
                              setSelectedCalendarDay(null);
                            }}
                            className="p-1 px-2.5 hover:bg-white rounded-lg hover:shadow-xs transition font-black text-slate-600"
                          >
                            ▶
                          </button>
                        </div>
                      )}

                      {!showCalendar && (
                        <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-50 border border-slate-150 px-2.5 py-0.5 rounded-lg select-none">
                          {history.length} workout
                          {history.length === 1 ? "" : "s"} logged
                        </span>
                      )}

                      {/* Discreet Minimize Icon Accordion */}
                      <div className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-all">
                        {showCalendar ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                        )}
                      </div>
                    </div>
                  </div>

                  {showCalendar && (
                    <>
                      {/* Weeks Days Headings */}
                      <div className="grid grid-cols-7 gap-1 text-center font-mono font-bold text-[9.5px] text-slate-400 uppercase mb-2 animate-fade-in">
                        <span>Sun</span>
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                      </div>

                      {/* Calendar Days Matrix */}
                      <div className="grid grid-cols-7 gap-1.5 text-center animate-fade-in">
                        {(() => {
                          const startDay = new Date(
                            calendarYear,
                            calendarMonth,
                            1,
                          ).getDay();
                          const daysInMonth = new Date(
                            calendarYear,
                            calendarMonth + 1,
                            0,
                          ).getDate();
                          const blanks = Array.from(
                            { length: startDay },
                            (_, idx) => null,
                          );
                          const days = Array.from(
                            { length: daysInMonth },
                            (_, idx) => idx + 1,
                          );
                          const cells = [...blanks, ...days];

                          return cells.map((day, idx) => {
                            if (day === null) {
                              return (
                                <div
                                  key={`blank-${idx}`}
                                  className="aspect-square opacity-0"
                                ></div>
                              );
                            }

                            const dateKey = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                            const dayActivities = history.filter((item) => {
                              const d = new Date(item.completedAt);
                              return (
                                d.getFullYear() === calendarYear &&
                                d.getMonth() === calendarMonth &&
                                d.getDate() === day
                              );
                            });

                            const hasActivities = dayActivities.length > 0;
                            const isSelected = selectedCalendarDay === dateKey;

                            // Highlight styles based on activity completion
                            let cellClass =
                              "aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-semibold transition relative select-none cursor-pointer ";
                            if (isSelected) {
                              cellClass +=
                                "bg-indigo-650 text-white font-extrabold ring-4 ring-indigo-150/80 border border-indigo-600";
                            } else if (hasActivities) {
                              cellClass +=
                                "bg-emerald-50 text-emerald-700 font-extrabold border-2 border-emerald-300 hover:bg-emerald-100";
                            } else {
                              cellClass +=
                                "text-slate-450 hover:bg-slate-50 text-slate-500 border border-slate-100";
                            }

                            return (
                              <div
                                key={`day-${day}`}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedCalendarDay(null);
                                  } else {
                                    setSelectedCalendarDay(dateKey);
                                  }
                                }}
                                className={cellClass}
                                title={
                                  hasActivities
                                    ? `${dayActivities.length} logs completed on this date`
                                    : "No logs recorded"
                                }
                              >
                                <span>{day}</span>
                                {hasActivities && !isSelected && (
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-0.5 absolute bottom-1.5"></span>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Selected Day Status Bar */}
                      {selectedCalendarDay && (
                        <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-150 rounded-2xl flex items-center justify-between text-xs text-indigo-850 font-sans leading-none animate-fade-in">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm">🎯</span>
                            <span>
                              Filtered to:{" "}
                              <b>
                                {new Date(
                                  selectedCalendarDay,
                                ).toLocaleDateString(undefined, {
                                  dateStyle: "long",
                                })}
                              </b>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedCalendarDay(null)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-[10px] rounded-lg shadow-xs cursor-pointer"
                          >
                            ✕ Clear Filter
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* LIST OF CHRONICLED COMPLETIONS (JOURNAL ARCHIVE CARD) */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                  <div
                    onClick={() => {
                      setShowJournalArchive((prev) => {
                        const newVal = !prev;
                        localStorage.setItem(
                          "trim_show_journal_archive",
                          String(newVal),
                        );
                        return newVal;
                      });
                    }}
                    className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100 cursor-pointer select-none group"
                    style={{
                      marginBottom: showJournalArchive ? "1.25rem" : "0",
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">🗄️</span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1.5">
                        Completed Journals Archive
                        <span className="text-[9px] font-mono lowercase bg-slate-100 text-slate-450 group-hover:bg-indigo-50 group-hover:text-indigo-650 px-1.5 py-0.5 rounded transition">
                          {showJournalArchive ? "hide" : "show"}
                        </span>
                      </h4>
                    </div>

                    <div className="flex items-center space-x-3">
                      {!showJournalArchive && (
                        <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-50 border border-slate-150 px-2.5 py-0.5 rounded-lg select-none">
                          {history.length} workout
                          {history.length === 1 ? "" : "s"} logged
                        </span>
                      )}

                      {/* Discreet Minimize Icon Accordion */}
                      <div className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-all">
                        {showJournalArchive ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                        )}
                      </div>
                    </div>
                  </div>

                  {showJournalArchive && (
                    <div className="animate-fade-in mt-2">
                      {(() => {
                        const filteredHistory = history.filter((item) => {
                          if (!selectedCalendarDay) return true;
                          const d = new Date(item.completedAt);
                          const itemKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                          return itemKey === selectedCalendarDay;
                        });

                        if (filteredHistory.length > 0) {
                          return (
                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                              <div className="divide-y divide-slate-100">
                                {filteredHistory.map((item) => (
                                  <div
                                    key={item.id}
                                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between text-left gap-4 hover:bg-slate-50 transition"
                                  >
                                    <div className="flex items-start space-x-3">
                                      <div
                                        className={`p-2 rounded-xl shrink-0 ${
                                          item.type === "Routine"
                                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                            : [
                                                  "Yoga",
                                                  "GymStrength",
                                                  "Sports",
                                                  "Other",
                                                ].includes(item.type)
                                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                                              : "bg-sky-50 text-sky-700 border border-sky-100"
                                        }`}
                                      >
                                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                                      </div>
                                      <div>
                                        <h4 className="text-sm font-bold text-slate-800 leading-tight">
                                          {item.name}
                                          {[
                                            "Yoga",
                                            "GymStrength",
                                            "Sports",
                                            "Other",
                                          ].includes(item.type) && (
                                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-yellow-100 text-yellow-850 border border-yellow-200">
                                              Lifestyle Choice ★
                                            </span>
                                          )}
                                        </h4>
                                        <div className="flex items-center space-x-2 mt-1 font-mono text-[10px] text-slate-400">
                                          <span className="font-semibold uppercase">
                                            {item.type === "GymStrength"
                                              ? "🏋️ Strength Gym"
                                              : item.type === "Yoga"
                                                ? "🧘 Yoga Class"
                                                : item.type === "Sports"
                                                  ? "⚽ Sports Match"
                                                  : item.type === "Other"
                                                    ? "🏃 External Training"
                                                    : item.type}
                                          </span>
                                          <span>•</span>
                                          <span>
                                            Logged:{" "}
                                            {new Date(
                                              item.completedAt,
                                            ).toLocaleString()}
                                          </span>
                                        </div>
                                        {[
                                          "Yoga",
                                          "GymStrength",
                                          "Sports",
                                          "Other",
                                        ].includes(item.type) && (
                                          <div className="text-[10px] text-sky-700 bg-sky-50/70 py-1.5 px-3 border border-sky-100/55 rounded-xl mt-1.5 leading-tight flex items-center space-x-1">
                                            <Sparkles className="w-3 h-3 text-sky-500 shrink-0" />
                                            <span>
                                              <b>Active Lifestyle Praise:</b>{" "}
                                              Doing training outside the app
                                              integrates fitness perfectly with
                                              your everyday life. Brilliant
                                              effort!
                                            </span>
                                          </div>
                                        )}
                                        {item.notes && (
                                          <p className="text-xs italic text-indigo-700 font-sans mt-2 bg-indigo-50 p-2 border border-indigo-100 rounded-xl leading-relaxed">
                                            "{item.notes}"
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* DUR ACTIONS STAT */}
                                    <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto font-mono">
                                      <div className="text-right">
                                        <span className="text-[9px] text-slate-400 block uppercase font-bold">
                                          Duration
                                        </span>
                                        <span className="text-sm font-bold text-slate-700">
                                          {item.durationCompleted} Mins
                                        </span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (
                                            confirm(
                                              "Delete this completion entry?",
                                            )
                                          ) {
                                            setHistory((prev) =>
                                              prev.filter(
                                                (h) => h.id !== item.id,
                                              ),
                                            );
                                          }
                                        }}
                                        className="p-2 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                                        title="Delete entry"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-10 text-center text-slate-400">
                              <History className="w-12 h-12 stroke-[1.5] text-slate-300 mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                                {selectedCalendarDay
                                  ? "No activities completed on this day"
                                  : "No History entries logged"}
                              </p>
                              <p className="text-[11.5px] mt-1 text-slate-500">
                                {selectedCalendarDay
                                  ? "Select another active highlighted day on your training calendar."
                                  : "Complete or manually log workouts to accumulate stats and streaks."}
                              </p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. AI IMPORTER INTERACTIVE PAGE TAB */}
            {activeTab === "ai-importer" && (
              <div className="animate-fade-in" id="trim-tab-importer">
                <AiImporter
                  profileOccupation={profileOccupation}
                  profileStress={profileStress}
                  profileExternal={profileExternal}
                  profileName={profileName}
                  profileAge={profileAge}
                  profileWorkoutDuration={profileWorkoutDuration}
                  profileWorkoutFrequency={profileWorkoutFrequency}
                  profileNiggles={profileNiggles}
                  profileGoals={profileGoals}
                  profileEquipment={defaultUseEquipment ? profileEquipment : "Bodyweight only (No equipment)"}
                  initialBuilderType={aiBuilderTrigger?.builderType}
                  initialRoutinePrompt={aiBuilderTrigger?.routinePrompt}
                  initialRoutineTime={aiBuilderTrigger?.routineTime}
                  initialRoutineEquipment={aiBuilderTrigger?.routineEquipment}
                  initialRoutineTitle={aiBuilderTrigger?.routineTitle}
                  initialProgramWeeks={aiBuilderTrigger?.programWeeks}
                  initialProgramSessions={aiBuilderTrigger?.programSessions}
                  initialProgramSessionTime={
                    aiBuilderTrigger?.programSessionTime
                  }
                  initialProgramNotes={aiBuilderTrigger?.programNotes}
                  initialProgramNiggles={aiBuilderTrigger?.programNiggles}
                  onImportRoutine={(newRoutine) => {
                    setRoutines((prev) => [newRoutine, ...prev]);
                    setAiBuilderTrigger(null);
                    // trigger toast success
                    alert(
                      `Imported Routine "${newRoutine.name}" successfully! It is now stored in your Library.`,
                    );
                    setActiveTab("library");
                  }}
                  onImportProgram={(newProgram) => {
                    // Pre-built or AI-created programs may have empty/unreferenced generic routine activities.
                    // We'll generate dedicated, fully tailored target routines for each of these activities,
                    // register them to the user's routines list, and link them properly.
                    // Under user guidelines: subsequent weeks start empty and generate dynamically when unlocked!
                    const createdRoutines: Routine[] = [];
                    const updatedWeeks = newProgram.weeks.map((wk) => {
                      if (wk.weekNumber > 1) {
                        return {
                          ...wk,
                          days: [], // Start as empty to decrease AI loading, generated week-by-week!
                        };
                      }
                      return {
                        ...wk,
                        days: wk.days.map((day) => ({
                          ...day,
                          activities: day.activities.map((act) => {
                            if (
                              act.type === "Routine" &&
                              (!act.routineId ||
                                act.routineId.includes("temp") ||
                                act.routineId === "null")
                            ) {
                              const seed = Math.random()
                                .toString(36)
                                .substr(2, 9);
                              const newId = `ai-routine-${seed}`;

                              // Check if we have a matching custom routine provided in the program's routines
                              const customRoutineDetails = findMatchingRoutine(
                                (newProgram as any).routines || [],
                                act.name,
                              );

                              let customRoutine: Routine;
                              if (customRoutineDetails) {
                                customRoutine = {
                                  id: newId,
                                  name: customRoutineDetails.name,
                                  duration:
                                    customRoutineDetails.duration ||
                                    act.duration ||
                                    15,
                                  isFavourite: false,
                                  recentlyUsedAt: null,
                                  isRecovery:
                                    customRoutineDetails.isRecovery || false,
                                  instructions:
                                    customRoutineDetails.instructions ||
                                    "Follow routine pacing meticulously.",
                                  notes: customRoutineDetails.notes || "",
                                  exercises: (
                                    customRoutineDetails.exercises || []
                                  ).map((ex: any, exIdx: number) => ({
                                    ...ex,
                                    id: `ex-gen-${seed}-${exIdx}`,
                                    reps:
                                      ex.reps !== undefined ? ex.reps : null,
                                    sets:
                                      ex.sets !== undefined ? ex.sets : null,
                                    weight:
                                      ex.weight !== undefined
                                        ? ex.weight
                                        : null,
                                    duration:
                                      ex.duration !== undefined
                                        ? ex.duration
                                        : null,
                                  })),
                                  intervals: (
                                    customRoutineDetails.intervals || []
                                  ).map((int: any, intIdx: number) => ({
                                    ...int,
                                    id: `int-gen-${seed}-${intIdx}`,
                                  })),
                                };
                              } else {
                                customRoutine = generateRoutineFromActivity(
                                  act.name,
                                  act.duration || 15,
                                  newId,
                                );
                              }

                              createdRoutines.push(customRoutine);
                              return {
                                ...act,
                                routineId: newId,
                              };
                            }
                            return act;
                          }),
                        })),
                      };
                    });

                    const fullyLinkedProgram: Program = {
                      ...newProgram,
                      weeks: updatedWeeks,
                    };

                    if (createdRoutines.length > 0) {
                      setRoutines((prev) => [...createdRoutines, ...prev]);
                    }
                    setPrograms((prev) => [fullyLinkedProgram, ...prev]);
                    setAiBuilderTrigger(null);
                    alert(
                      `Imported Multi-Week Program (${newProgram.name}) successfully! We generated ${createdRoutines.length} active custom routines and saved them to your library!`,
                    );
                    setActiveTab("library");
                    setLibrarySubTab("programs");
                    setSelectedProgram(fullyLinkedProgram); // auto view calendar detail
                  }}
                  onClose={() => {
                    setAiBuilderTrigger(null);
                    setActiveTab("library");
                    setLibrarySubTab("programs");
                  }}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL / BOTTOM SLIDE: MANUAL ROUTINE BLUEPRINTER */}
      {showRoutineForm && (
        <section className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="animate-fade-in max-w-full w-full max-h-[90vh] overflow-y-auto rounded-3xl shrink-0">
            <RoutineForm
              initialRoutine={
                showRoutineForm === "new" ? undefined : showRoutineForm
              }
              onClose={() => setShowRoutineForm(null)}
              onSave={handleSaveRoutineBluePrint}
              onStartWithAi={(title, duration, prompt) => {
                setShowRoutineForm(null);
                setAiBuilderTrigger({
                  builderType: "routine",
                  routineTitle: title,
                  routineTime: duration,
                  routinePrompt: prompt,
                });
                setActiveTab("ai-importer");
              }}
            />
          </div>
        </section>
      )}

      {/* MODAL / BOTTOM SLIDE: MANUAL PROGRAM DRAFTER */}
      {showProgramForm && (
        <section className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="animate-fade-in max-w-full rounded-3xl shrink-0">
            <ProgramForm
              onClose={() => setShowProgramForm(false)}
              onSave={handleSaveProgramBase}
              onStartWithAi={(weeks, sessions, notes) => {
                setShowProgramForm(false);
                setAiBuilderTrigger({
                  builderType: "program",
                  programWeeks: weeks,
                  programSessions: sessions,
                  programSessionTime: 30,
                  programNotes: notes,
                  programNiggles: "",
                });
                setActiveTab("ai-importer");
              }}
            />
          </div>
        </section>
      )}

      {/* PORTAL OVERLAY: FULLSCREEN ACTIVE TIMERS WORKOUT PLAYER */}
      {activePlayingRoutine && (
        <section
          className="fixed inset-0 z-50 overflow-hidden"
          id="active-player-fullscreen"
        >
          <WorkoutPlayer
            routine={activePlayingRoutine}
            onClose={() => {
              setActivePlayingRoutine(null);
            }}
            onComplete={handleCompleteActiveWorkout}
            theme={primaryColorTheme}
            defaultTransitionTime={transitionTime}
            countdownSeconds={countdownSeconds}
          />
        </section>
      )}

      {/* POPUP TRIGGER MODAL: SHARED LINK DEEP IMPORT */}
      {incomingImport && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 p-6 rounded-3xl max-w-md w-full shadow-2xl text-left font-sans">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-indigo-500">
              Deep-link Recipient
            </span>
            <h3 className="text-lg font-bold text-slate-950 font-display mt-0.5 mb-1.5">
              Shared workout protocol pending!
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Someone has shared a custom crafted <b>{incomingImport.type}</b>{" "}
              with you:
              <br />
              <span className="font-mono bg-slate-100 px-2 py-1 rounded inline-block text-[11px] text-slate-800 font-bold mt-2">
                "{incomingImport.data?.name || "Unnamed shared asset"}"
              </span>
            </p>

            <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-150 mb-6 leading-relaxed">
              If accepted, this payload will bypass server compiling and write
              directly into your local storage in Trim.
            </div>

            <div className="flex space-x-3 shrink-0">
              <button
                onClick={handleDeclineIncomingShared}
                className="flex-1 py-2.5 text-xs border border-slate-200 hover:border-slate-300 font-medium text-slate-600 rounded-xl transition"
              >
                Reject Shared Draft
              </button>
              <button
                onClick={handleAcceptIncomingShared}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white rounded-xl shadow transition"
              >
                Import Draft to Trim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP EX-DEEP SHARING LOG LINK PORTAL */}
      {sharedLinkData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl text-left">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center space-x-1.5 mb-1.5">
              <Share2 className="w-4.5 h-4.5 text-indigo-500 mt-0.5" />
              <span>Deep-Link Shared Code</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Copy this compiled standalone link. Anyone clicking it will be
              prompted to import your <b>{sharedLinkData.type}</b> "
              {sharedLinkData.name}"!
            </p>

            <input
              type="text"
              readOnly
              value={sharedLinkData.link}
              className="w-full text-xs p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-mono mb-4 focus:outline-none"
              onClick={(e) => (e.target as any).select()}
            />

            <div className="flex space-x-3 shrink-0 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSharedLinkData(null)}
                className="flex-1 py-2 text-xs border border-slate-205 rounded-xl font-medium"
              >
                Dismiss Window
              </button>
              <button
                onClick={handleCopyLinkToClipboard}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
              >
                {clipboardCopied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Copy Deep-Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP STANDALONE LOG FORM METRICS */}
      {standaloneLoggingGoal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddManualLogSubmit}
            className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl text-left"
          >
            <div className="flex items-start justify-between mb-4 border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-950 font-display leading-tight">
                Log Standalone Activity
              </h3>
              <button
                type="button"
                onClick={() => setStandaloneLoggingGoal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-left">
              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-slate-405 text-slate-400 mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  value={manualLogName}
                  onChange={(e) => setManualLogName(e.target.value)}
                  placeholder="e.g. 60-Min Vinyasa Flow Yoga"
                  className="w-full p-2 border border-slate-200 rounded-xl text-base md:text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-slate-405 text-slate-400 mb-1">
                  Target Modality
                </label>
                <select
                  value={manualLogType}
                  onChange={(e) => setManualLogType(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-xl font-mono text-slate-800 bg-white font-semibold text-base md:text-xs"
                >
                  <option value="Surfing">🏄 Surfing Session</option>
                  <option value="Skating">🛹 Skating Session</option>
                  <option value="Run">🏃 Running / Jog</option>
                  <option value="Yoga">🧘 Yoga Class / Practice</option>
                  <option value="GymStrength">
                    🏋️ Gym / Strength Training
                  </option>
                  <option value="Walk">🚶 Walking / Hiking</option>
                  <option value="Swim">🏊 Swimming Laps</option>
                  <option value="Cycle">🚴 Cycling / Ride</option>
                  <option value="Mobility">🤸 Mobility / Stretches</option>
                  <option value="Recovery">🧘 Active Decompress</option>
                  <option value="Sports">⚽ Sports / Recreation</option>
                  <option value="Other animate-pulse">✨ Other Activity</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-slate-405 text-slate-400 mb-1">
                  Time Elapsed (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={manualLogDuration}
                  onChange={(e) =>
                    setManualLogDuration(parseInt(e.target.value) || 30)
                  }
                  className="w-full p-2 border border-slate-200 rounded-xl font-mono text-base md:text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-bold text-slate-405 text-slate-400 mb-1">
                  Journal comments
                </label>
                <textarea
                  value={manualLogNotes}
                  onChange={(e) => setManualLogNotes(e.target.value)}
                  placeholder="e.g. Heart rate stable, pace slightly accelerated. Muscles relaxed."
                  className="w-full text-base md:text-xs p-2 border border-slate-205 rounded-xl h-16 resize-none focus:outline-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setStandaloneLoggingGoal(false)}
                className="flex-1 py-2 text-xs border border-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow"
              >
                Submit Entry Log
              </button>
            </div>
          </form>
        </div>
      )}

      {/* INTERACTIVE COACH ONBOARDING OVERLAY */}
      {showOnboarding && (
        <OnboardingChatModal
          onClose={() => setShowOnboarding(false)}
          onUpdateProfile={handleUpdateProfile}
          profileWorkoutDuration={profileWorkoutDuration}
          profileWorkoutFrequency={profileWorkoutFrequency}
          profileExternal={profileExternal}
          profileNiggles={profileNiggles}
        />
      )}

      {/* WEEKLY CHECK-IN CHAT MODAL */}
      {showCheckInModal && checkInProgram && (
        <WeeklyCheckInModal
          onClose={() => {
            setShowCheckInModal(false);
            setCheckInProgram(null);
          }}
          programNotes={checkInProgram.notes || ""}
          recentLogs={history.filter(
            (h) =>
              Date.now() - new Date(h.completedAt).getTime() <=
              7 * 24 * 3600 * 1000,
          )}
          onSaveProgramNotes={(updatedNotes) => {
            const updated = programs.map((p) => {
              if (p.id === checkInProgram.id) {
                return { ...p, notes: updatedNotes };
              }
              return p;
            });
            setPrograms(updated);
            localStorage.setItem("trim_programs", JSON.stringify(updated));

            awardXpAndCoins(
              0,
              0,
              "Check-In program adjustments note saved! Well done on completing this week's review.",
            );

            setShowCheckInModal(false);
            setCheckInProgram(null);
          }}
        />
      )}

      {/* PROFILE & SETTINGS MODAL */}
      {showProfileModal && (
        <div
          className="fixed inset-0 bg-slate-950/65 z-50 backdrop-blur-xs flex items-center justify-center p-4"
          id="trim-profile-modal-root"
        >
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl text-left font-sans animate-fade-in">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black font-display text-slate-900 uppercase tracking-widest">
                My Profile & settings
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-slate-600 transition text-sm font-black font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-xs font-sans max-h-[70vh] overflow-y-auto pr-1">
              {/* LIFESTYLE PROFILE FORM */}
              <div>
                <p className="text-[10px] text-slate-400 font-mono uppercase font-black tracking-wider mb-2">
                  1. Profile Details & Preferences
                </p>
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9.5px] font-mono uppercase font-bold text-slate-500 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) =>
                          handleUpdateProfile({ name: e.target.value })
                        }
                        placeholder="e.g. Liam"
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-base md:text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-mono uppercase font-bold text-slate-500 mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        value={profileAge}
                        onChange={(e) =>
                          handleUpdateProfile({ age: e.target.value })
                        }
                        placeholder="e.g. 29"
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-base md:text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9.5px] font-mono uppercase font-bold text-slate-500 mb-1">
                        Gender
                      </label>
                      <select
                        value={profileGender}
                        onChange={(e) =>
                          handleUpdateProfile({ gender: e.target.value })
                        }
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-base md:text-xs shrink-0"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">
                          Prefer not to say
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-mono uppercase font-bold text-slate-500 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profileLocation}
                        onChange={(e) =>
                          handleUpdateProfile({ location: e.target.value })
                        }
                        placeholder="e.g. Tokyo, JP"
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-base md:text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-1 select-none">
                    <span className="text-[9px] font-mono block text-slate-400 uppercase tracking-widest mb-0.5">
                      Time Zone Association
                    </span>
                    <div className="p-2 border border-dashed border-indigo-150 bg-indigo-50/45 rounded-xl flex items-center space-x-1.5 text-indigo-950 font-semibold text-[10px]">
                      <span className="text-sm">🌐</span>
                      <span>
                        Time Zone:{" "}
                        <strong>
                          {Intl.DateTimeFormat().resolvedOptions().timeZone}
                        </strong>{" "}
                        (for {profileLocation || "your location"})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PERSONALISATION */}
              <div>
                <p className="text-[10px] text-slate-400 font-mono uppercase font-black tracking-wider mb-2">
                  2. Workout Customisation
                </p>
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <label className="block text-[9.5px] font-mono uppercase font-bold text-slate-500 mb-1 leading-tight">
                        Default Transition
                      </label>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={transitionTime}
                          onChange={(e) => {
                            const val = Math.max(
                              1,
                              parseInt(e.target.value, 10) || 5,
                            );
                            setTransitionTime(val);
                            localStorage.setItem(
                              "trim_transition_time",
                              String(val),
                            );
                          }}
                          className="w-full p-2 border border-slate-205 border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-base md:text-xs text-center font-mono"
                        />
                        <span className="text-[9px] text-slate-500 font-bold font-mono">
                          secs
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-mono uppercase font-bold text-slate-500 mb-1 leading-tight">
                        Countdown Cues
                      </label>
                      <select
                        value={countdownSeconds}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setCountdownSeconds(val);
                          localStorage.setItem(
                            "trim_countdown_seconds",
                            String(val),
                          );
                        }}
                        className="w-full p-2 border border-slate-250 border-slate-200 rounded-xl bg-white focus:outline-none text-base md:text-xs"
                      >
                        <option value="3">3 Seconds</option>
                        <option value="5">5 Seconds</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-mono uppercase font-bold text-slate-500 mb-1">
                      Color Theme
                    </label>
                    <select
                      value={primaryColorTheme}
                      onChange={(e) => {
                        setPrimaryColorTheme(e.target.value);
                        localStorage.setItem(
                          "trim_color_theme",
                          e.target.value,
                        );
                      }}
                      className="w-full p-2 border border-slate-205 border-slate-200 rounded-xl bg-white focus:outline-none text-base md:text-xs"
                    >
                      <option value="minimalist">Minimalist (Light)</option>
                      <option value="dark">Contrasting Dark Mode</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-mono uppercase font-bold text-slate-500 mb-1">
                      Synthesizer Buzzer alarm wave Tone
                    </label>
                    <select
                      value={workoutToneType}
                      onChange={(e) => {
                        setWorkoutToneType(e.target.value);
                        localStorage.setItem(
                          "trim_workout_tone_type",
                          e.target.value,
                        );
                      }}
                      className="w-full p-2 border border-slate-205 rounded-xl bg-white focus:outline-none cursor-pointer text-base md:text-xs"
                    >
                      <option value="sine">
                        Classic Sine Wave (Smooth chime)
                      </option>
                      <option value="triangle">
                        Warm Triangle Wave (Classic beep)
                      </option>
                      <option value="square">
                        Retro Square Wave (Arcade tone)
                      </option>
                      <option value="sawtooth">
                        Crisp Sawtooth Wave (High feedback)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* EQUIPMENT DEFAULTS */}
              <div>
                <p className="text-[10px] text-slate-400 font-mono uppercase font-black tracking-wider mb-2">
                  2.5. Default Training Equipment
                </p>
                <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-150 text-slate-800">
                  <label className="block text-[9.5px] font-mono uppercase font-bold text-slate-500 mb-1 leading-tight">
                    Routines & Programs Equipment Requirements
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDefaultUseEquipment(false);
                        localStorage.setItem("trim_default_use_equipment", "false");
                      }}
                      className={`py-2 px-3 rounded-xl border text-[10.5px] font-bold uppercase transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                        !defaultUseEquipment
                          ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                          : "bg-white border-slate-250 hover:bg-slate-100 text-slate-650"
                      }`}
                    >
                      <span>🚫 Bodyweight</span>
                      <span className="text-[9px] font-normal leading-none">(No Gear)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDefaultUseEquipment(true);
                        localStorage.setItem("trim_default_use_equipment", "true");
                      }}
                      className={`py-2 px-3 rounded-xl border text-[10.5px] font-bold uppercase transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                        defaultUseEquipment
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                          : "bg-white border-slate-250 hover:bg-slate-100 text-slate-650"
                      }`}
                    >
                      <span>⚡ Equipment</span>
                      <span className="text-[9px] font-normal leading-none">(With Gear)</span>
                    </button>
                  </div>

                  {!defaultUseEquipment && (
                    <p className="text-[10px] text-slate-500 leading-normal bg-white p-2 border border-slate-105 rounded-xl mt-1">
                      💡 <strong>Bodyweight only is the active default.</strong> Generates simple, portable training exercises. Excellent for home workouts or traveling!
                    </p>
                  )}

                  {defaultUseEquipment && (
                    <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60">
                      <label className="block text-[9.5px] font-mono uppercase font-black text-slate-500">
                        Discuss and List Available Equipment
                      </label>
                      <textarea
                        rows={2}
                        value={profileEquipment}
                        onChange={(e) => {
                          setProfileEquipment(e.target.value);
                          localStorage.setItem("trim_profile_equipment", e.target.value);
                        }}
                        placeholder="e.g. Pair of 10kg dumbbells, resistance bands, pull-up bar..."
                        className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-base md:text-xs text-slate-800"
                      />
                      <p className="text-[9px] text-[#64748b] leading-tight">
                        List specific items or details about your setup. Our Trim Boy engine will tailor sets & exercises specifically around this.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* COMPLETED TRAINING HISTORY */}
              <div>
                <p className="text-[10px] text-slate-400 font-mono uppercase font-black tracking-wider mb-2">
                  3. Training Progress & Logs
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("history");
                    setShowProfileModal(false);
                  }}
                  className="w-full py-3 px-4 bg-[#2e2e2e] hover:bg-black text-white rounded-2xl font-bold uppercase transition text-xs font-mono flex items-center justify-between shadow-sm active:scale-95 duration-155"
                >
                  <span>Open Training Logs ({history.length} Saved)</span>
                  <span>➔</span>
                </button>
              </div>

              {/* HARD DRIVE BACKUP */}
              <div>
                <p className="text-[10px] text-slate-400 font-mono uppercase font-black tracking-wider mb-2">
                  3.5. Save/Restore to Hard Drive
                </p>
                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                  <button
                    type="button"
                    onClick={handleExportDataToHardDrive}
                    className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase transition text-[10px] font-mono flex items-center justify-center gap-1.5 shadow-sm active:scale-95 duration-100 cursor-pointer"
                  >
                    💾 Save backup to hard drive (.json)
                  </button>
                  <div className="relative">
                    <label className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-205 text-slate-705 rounded-xl font-bold uppercase transition text-[10px] font-mono flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border-dashed text-center">
                      📂 Load backup from hard drive
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportDataFromHardDrive}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* DANGER ZONE RESET APP */}
              <div className="border-t border-slate-150 pt-3">
                <p className="text-[10px] text-rose-500 font-mono uppercase font-black tracking-wider mb-2">
                  4. Danger Zone
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleResetAllData();
                  }}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-2xl font-bold uppercase transition text-[10px] font-mono"
                >
                  🔄 Reset All application data
                </button>
              </div>
            </div>

            {/* UPDATE / SAVE ACTION FOOTER FOR PROFILE */}
            <div className="pt-4 border-t border-slate-100 mt-5 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-205 text-slate-600 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  alert("Profile and settings updated successfully!");
                }}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 font-extrabold text-white rounded-xl text-xs shadow-xs transition uppercase tracking-wider font-sans"
              >
                Update Profile Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING NOTIFICATION TOAST */}
      <AnimatePresence>
        {congratsQuest && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm p-4 rounded-xl shadow-2xl flex items-center space-x-3.5 border border-slate-200 bg-white text-slate-800"
          >
            <div className="w-10 h-10 shrink-0 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center text-xl">
              ✨
            </div>
            <div>
              <h5 className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">
                Notice
              </h5>
              <p className="text-xs font-semibold leading-snug mt-0.5">
                {congratsQuest}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NATIVE FOOTER FOOTER */}
      <footer
        className="bg-slate-900 border-t border-white/5 py-6 px-6 font-mono text-[10.5px] text-slate-400 text-center"
        id="trim-native-footer"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <span>
            © 2026 Trim Workout Companion Engine • Built with React & Tailwind
            Engine
          </span>
          <div className="flex items-center justify-center space-x-3">
            <span>Server Gemini Host Port: 3000</span>
            <span>•</span>
            <span>Status: Stable Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
