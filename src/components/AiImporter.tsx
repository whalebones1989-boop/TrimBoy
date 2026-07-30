/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Check, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Send, 
  X, 
  ChevronRight, 
  Trash2, 
  Plus, 
  Dumbbell, 
  Calendar, 
  SlidersHorizontal, 
  Info, 
  MessageSquare,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Routine, Program, Exercise, IntervalItem } from '../types';

interface AiImporterProps {
  onImportRoutine: (routine: Routine) => void;
  onImportProgram: (program: Program) => void;
  onClose: () => void;
  profileOccupation?: string;
  profileStress?: string;
  profileExternal?: string;
  profileName?: string;
  profileAge?: string;
  profileWorkoutDuration?: number;
  profileWorkoutFrequency?: number;
  profileNiggles?: string;
  profileGoals?: string;
  profileEquipment?: string;
  
  // Optional pre-configured triggers for Home Screen / modal empty states
  initialBuilderType?: 'routine' | 'program';
  initialRoutineTitle?: string;
  initialRoutinePrompt?: string;
  initialRoutineTime?: number;
  initialRoutineEquipment?: string;
  
  initialProgramWeeks?: number;
  initialProgramSessions?: number;
  initialProgramSessionTime?: number;
  initialProgramNotes?: string;
  initialProgramNiggles?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AiImporter({ 
  onImportRoutine, 
  onImportProgram, 
  onClose,
  profileOccupation,
  profileStress,
  profileExternal,
  profileName,
  profileAge,
  profileWorkoutDuration,
  profileWorkoutFrequency,
  profileNiggles,
  profileGoals,
  profileEquipment,
  
  initialBuilderType,
  initialRoutineTitle,
  initialRoutinePrompt,
  initialRoutineTime,
  initialRoutineEquipment,
  initialProgramWeeks,
  initialProgramSessions,
  initialProgramSessionTime,
  initialProgramNotes,
  initialProgramNiggles
}: AiImporterProps) {
  
  // --- BUILDER ACTIVE TAB ---
  const [builderType, setBuilderType] = useState<'routine' | 'program'>('program');

  // --- ROUTINE INPUT STATES (Simplified: Time and Title only, prompt is the Chat Input) ---
  const [routineTitle, setRoutineTitle] = useState<string>(initialRoutineTitle || '');
  const [routineTime, setRoutineTime] = useState<number>(initialRoutineTime || 15);
  const [routinePrompt, setRoutinePrompt] = useState<string>(initialRoutinePrompt || '');

  // --- PROGRAM INPUT STATES (Simplified: Time/Weeks and Action Chat Input only) ---
  const [programWeeks, setProgramWeeks] = useState<number>(initialProgramWeeks || 3);
  const [programSessions, setProgramSessions] = useState<number>(initialProgramSessions || 3);
  const [programSessionTime, setProgramSessionTime] = useState<number>(initialProgramSessionTime || 30);
  const [programNotes, setProgramNotes] = useState<string>(initialProgramNotes || '');
  const [programNiggles, setProgramNiggles] = useState<string>(initialProgramNiggles || profileNiggles || '');

  // --- DISCUSSION & STATE STATUS ---
  const [discussionStarted, setDiscussionStarted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDraft, setCurrentDraft] = useState<{
    detectedType: 'routine' | 'program';
    routine?: Routine;
    program?: Program;
  } | null>(null);

  // --- CHAT TIMELINE ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [revisionText, setRevisionText] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- LOADING TIPS ---
  const [loadingTip, setLoadingTip] = useState<string>("Trim Boy is cooking...");

  // Auto scroll chat segment
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isLoading]);

  // Loading tip auto rotator
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      const tips = [
        "Trim Boy is cooking...",
        "Structuring elite movement progressions...",
        "Adapting around target comfort constraints...",
        "Tuning recovery and mobility layers...",
        "Preparing custom workout options..."
      ];
      let index = 0;
      interval = setInterval(() => {
        index = (index + 1) % tips.length;
        setLoadingTip(tips[index]);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Trigger automatic generation loop if values preloaded on mount
  useEffect(() => {
    if (initialBuilderType === 'routine' && (initialRoutinePrompt || initialRoutineTitle)) {
      handleStartDiscussion();
    } else if (initialBuilderType === 'program' && initialProgramNotes) {
      handleStartDiscussion();
    }
  }, []);

  // Sync state with incoming props changes
  useEffect(() => {
    if (initialBuilderType) setBuilderType(initialBuilderType);
    if (initialRoutineTitle) setRoutineTitle(initialRoutineTitle);
    if (initialRoutinePrompt) setRoutinePrompt(initialRoutinePrompt);
    if (initialRoutineTime) setRoutineTime(initialRoutineTime);
    if (initialProgramWeeks) setProgramWeeks(initialProgramWeeks);
    if (initialProgramSessions) setProgramSessions(initialProgramSessions);
    if (initialProgramSessionTime) setProgramSessionTime(initialProgramSessionTime);
    if (initialProgramNotes) setProgramNotes(initialProgramNotes);
    if (initialProgramNiggles) setProgramNiggles(initialProgramNiggles);
  }, [
    initialBuilderType,
    initialRoutineTitle,
    initialRoutinePrompt,
    initialRoutineTime,
    initialProgramWeeks,
    initialProgramSessions,
    initialProgramSessionTime,
    initialProgramNotes,
    initialProgramNiggles
  ]);

  // --- 1. START CONVERSATIONAL DISCUSSION FIRST ---
  const handleStartDiscussion = async () => {
    setIsLoading(true);
    setError(null);
    setCurrentDraft(null);
    setDiscussionStarted(true);

    let starterPrompt = "";
    if (builderType === 'routine') {
      const displayTitle = routineTitle.trim() || "My New Custom Routine";
      starterPrompt = `Hello Coach! I'd love to discuss and design a custom Workout Routine.
- Routine Title: "${displayTitle}"
- Est. Duration: ${routineTime} mins
- My Specific Ideas & Focal Point: "${routinePrompt || "Focus on building a beautiful balanced routine."}"

Please provide some friendly coaching feedback, share your conceptual vision for this workout, discuss the sequence ideas, and ask any questions you have. 
CRITICAL Mandate: Do NOT respond with the final structured JSON mockup 'proposedItem' yet. Let's discuss first! I will click the 'Generate Routine' button when we are ready to build.`;
    } else {
      const displayTitle = programNotes.trim() || "My Weekly Program Notes";
      starterPrompt = `Hello Coach! I'd love to discuss and design a custom multi-week Calendar Program.
- Program Duration: ${programWeeks} Weeks
- Frequency: ${programSessions} sessions per week
- Target Session Length: ${programSessionTime} mins
- Focus / Goal Notes: "${displayTitle}"
- Injuries / Niggles to watch: "${programNiggles || "None"}"

Please explain your training strategy, your week-by-week progression structure, and how you will fit this custom program around my lifestyle.
CRITICAL Mandate: Do NOT respond with the final structured JSON mockup 'proposedItem' yet. Let's discuss first! I will click the 'Generate Program' button when we are ready to compile.`;
    }

    const messagesPayload = [
      { role: 'user', content: starterPrompt }
    ];

    try {
      const response = await fetch('/api/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesPayload,
          profile: {
            name: profileName,
            age: profileAge,
            occupation: profileOccupation,
            stress: profileStress,
            external: profileExternal,
            workoutDuration: builderType === 'program' ? programSessionTime : (profileWorkoutDuration || 30),
            workoutFrequency: builderType === 'program' ? programSessions : (profileWorkoutFrequency || 3),
            niggles: programNiggles || profileNiggles,
            goals: builderType === 'program' ? programNotes : routinePrompt,
            equipment: profileEquipment || 'Bodyweight'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Server error starting coach chat.');
      }

      const data = await response.json();
      if (!data || !data.reply) {
        throw new Error('Coach replied with empty feedback.');
      }

      setChatMessages([
        {
          id: `msg-${Date.now()}-coach-starter`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date()
        }
      ]);
      
      // If server proposed structure immediately because of prior logic, clear it until generate click
      if (data.proposedItem) {
        // We'll let them click compile manually to verify discussion
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error initializing discussion with Coach.');
      setDiscussionStarted(false);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. BACK-AND-FORTH CHAT REFINEMENT ---
  const handleRevisionSubmittal = async () => {
    if (!revisionText.trim() || isLoading) return;

    const userComment = revisionText;
    setRevisionText('');
    setError(null);
    setIsLoading(true);

    const newUserMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: userComment,
      timestamp: new Date()
    };

    const updatedTimeline = [...chatMessages, newUserMsg];
    setChatMessages(updatedTimeline);

    const messagesPayload = updatedTimeline.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Instruct the coach to remain in conversation mode UNLESS we trigger compile
    const activeContext = currentDraft 
      ? `We have a proposed draft. Tweak it using my comment: "${userComment}". Update the proposedItem JSON accordingly and explain what changed.`
      : `Discuss this adjustment comment with me: "${userComment}". Do NOT generate the final structured JSON. Just speak conversationally.`;

    messagesPayload.push({
      role: 'user',
      content: activeContext
    });

    try {
      const response = await fetch('/api/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesPayload,
          profile: {
            name: profileName,
            age: profileAge,
            occupation: profileOccupation,
            stress: profileStress,
            external: profileExternal,
            niggles: programNiggles || profileNiggles,
            goals: builderType === 'program' ? programNotes : routinePrompt,
            equipment: profileEquipment || 'Bodyweight',
            workoutFrequency: builderType === 'program' ? programSessions : (profileWorkoutFrequency || 3),
            workoutDuration: builderType === 'program' ? programSessionTime : (profileWorkoutDuration || 30)
          }
        })
      });

      if (!response.ok) {
        throw new Error('Server lost communication with coach.');
      }

      const data = await response.json();
      if (data.proposedItem) {
        setCurrentDraft(data.proposedItem);
      }
      
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-coach`,
          role: 'assistant',
          content: data.reply || "I've processed your thought. Let me know what you think!",
          timestamp: new Date()
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setError(`Failed to apply thought: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. THE MAGIC STEP: COMPILE / GENERATE BLUEPRINT CARD ---
  const handleFinalizeAndGenerate = async () => {
    setIsLoading(true);
    setError(null);

    const confirmationMsg: ChatMessage = {
      id: `msg-confirm-${Date.now()}`,
      role: 'user',
      content: `⚡ Ready! Compile and generate my interactive ${builderType === 'routine' ? 'Workout Routine' : 'Calendar Program'} now!`,
      timestamp: new Date()
    };

    const updatedTimeline = [...chatMessages, confirmationMsg];
    setChatMessages(updatedTimeline);

    const messagesPayload = updatedTimeline.map(m => ({
      role: m.role,
      content: m.content
    }));

    const buildInstruction = builderType === 'routine' 
      ? `Compile and provide the final structured Routine under proposedItem. Make it a routine with title "${routineTitle || "My Coach Workout"}", duration of ${routineTime} minutes, detailed exercises (names, sets, reps, duration in seconds), and colorful intervals if applicable.`
      : `Compile and provide the final structured Program under proposedItem. Make it a program with description, ${programWeeks} weeks, and EXACTLY scheduling active training sessions on ${programSessions} active days per week. Rest days should be explicitly set for remaining days of the week. Ensure that any workout routine assigned to active days has exercises matching these focus and goals: "${programNotes}". Ensure the daily schedule in calendar matches this frequency perfectly.`;

    messagesPayload.push({
      role: 'user',
      content: buildInstruction
    });

    try {
      const response = await fetch('/api/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesPayload,
          profile: {
            name: profileName,
            age: profileAge,
            occupation: profileOccupation,
            stress: profileStress,
            external: profileExternal,
            niggles: programNiggles || profileNiggles,
            goals: builderType === 'program' ? programNotes : routinePrompt,
            equipment: profileEquipment || 'Bodyweight',
            workoutFrequency: builderType === 'program' ? programSessions : (profileWorkoutFrequency || 3),
            workoutDuration: builderType === 'program' ? programSessionTime : (profileWorkoutDuration || 30)
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate interactive layout.');
      }

      const data = await response.json();
      if (data.proposedItem) {
        setCurrentDraft(data.proposedItem);
        setChatMessages(prev => [
          ...prev,
          {
            id: `msg-generation-ack-${Date.now()}`,
            role: 'assistant',
            content: data.reply || "Superb! See the complete blueprint of your physical program now loaded on your screen!",
            timestamp: new Date()
          }
        ]);
      } else {
        throw new Error("Coach chatted but forgot to export the visual layout structure. Try clicking 'Generate' again, or say 'generate the workout'.");
      }
    } catch (err: any) {
      console.error(err);
      setError(`Generation failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- SAVE CODE BLOCK TO MAIN APP ---
  const handleAcceptAndSave = () => {
    if (!currentDraft) return;

    if (currentDraft.detectedType === 'routine' && currentDraft.routine) {
      const savedRoutine: Routine = {
        ...currentDraft.routine,
        id: `ai-routine-save-${Date.now()}`,
        name: `✨ ${currentDraft.routine.name.replace(/^✨\s*/, '')}`,
        isFavourite: false,
        recentlyUsedAt: null,
        isAiGenerated: true
      };
      
      savedRoutine.exercises = (savedRoutine.exercises || []).map((e, idx) => ({
        ...e,
        id: e.id || `ex-ai-${idx}-${Date.now()}`,
        reps: e.reps !== undefined ? e.reps : null,
        sets: e.sets !== undefined ? e.sets : null,
        weight: e.weight !== undefined ? e.weight : null,
        duration: e.duration !== undefined ? e.duration : null
      }));
      savedRoutine.intervals = (savedRoutine.intervals || []).map((i, idx) => ({
        ...i,
        id: i.id || `int-ai-${idx}-${Date.now()}`
      }));
      
      onImportRoutine(savedRoutine);
    } else if (currentDraft.detectedType === 'program' && currentDraft.program) {
      const savedProgram: Program = {
        ...currentDraft.program,
        id: `ai-program-save-${Date.now()}`,
        name: `✨ ${currentDraft.program.name.replace(/^✨\s*/, '')}`,
        isArchived: false,
        isAiGenerated: true,
        weeks: currentDraft.program.weeks.map(wk => ({
          ...wk,
          days: wk.days.map(day => ({
            ...day,
            activities: day.activities.map(act => ({
              ...act,
              id: act.id || `act-ai-${Math.random().toString(36).substr(2, 5)}`
            }))
          }))
        }))
      };

      const routinesToRegister = (currentDraft.program as any).routines || [];
      (savedProgram as any).routines = routinesToRegister.map((r: any) => ({
        ...r,
        name: `✨ ${r.name.replace(/^✨\s*/, '')}`
      }));

      onImportProgram(savedProgram);
    }
  };

  const handleReset = () => {
    setCurrentDraft(null);
    setDiscussionStarted(false);
    setChatMessages([]);
    setError(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl min-h-[580px] p-6 text-left relative overflow-hidden flex flex-col" id="ai-training-architect-panel">
      
      {/* HEADER BANNER STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6 shrink-0">
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="text-indigo-600 text-xl font-bold animate-pulse">✨</span>
            <h2 className="text-slate-850 font-black text-lg font-display tracking-tight uppercase">AI Trim Boy Discussion Room</h2>
          </div>
        </div>
        
        <button
          onClick={onClose}
          type="button"
          className="self-end sm:self-auto py-1 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-mono font-bold transition select-none cursor-pointer"
        >
          ✕ Exit
        </button>
      </div>

      {/* SYSTEM ERRORS */}
      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs font-sans flex items-start space-x-2 shrink-0 animate-fade-in">
          <span>⚠️</span>
          <div className="flex-1">
            <p className="font-bold">Trim Boy Note Error</p>
            <p className="opacity-90 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* PHASE 1: SIMPLIFIED INITIALIZATION SETUP */}
      {!discussionStarted && !isLoading && (
        <div className="flex-1 flex flex-col animate-fade-in">
          
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-150 flex-1 flex flex-col justify-between">
            
            {/* BUILDER TYPE SELECTOR */}
            <div className="flex space-x-1 rounded-xl bg-slate-200/50 p-1 mb-4 self-start leading-none shrink-0" id="builder-type-selector">
              <button
                type="button"
                onClick={() => setBuilderType('program')}
                className={`py-1.5 px-4 rounded-lg text-xs font-bold font-mono transition duration-150 cursor-pointer ${
                  builderType === 'program'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Multi-Week Program
              </button>
              <button
                type="button"
                onClick={() => setBuilderType('routine')}
                className={`py-1.5 px-4 rounded-lg text-xs font-bold font-mono transition duration-150 cursor-pointer ${
                  builderType === 'routine'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Single Workout Routine
              </button>
            </div>

            {/* CONDITIONAL SPEC GRID */}
            <div className="space-y-4">
              {builderType === 'program' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Program Duration (Weeks)
                      </label>
                      <select
                        value={programWeeks}
                        onChange={(e) => setProgramWeeks(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-base md:text-xs font-mono font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500"
                      >
                        {[1, 2, 3, 4, 6, 8, 12].map(wk => (
                          <option key={wk} value={wk}>{wk} Weeks</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Days Per Week
                      </label>
                      <select
                        value={programSessions}
                        onChange={(e) => setProgramSessions(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-base md:text-xs font-mono font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7].map(s => (
                          <option key={s} value={s}>{s} days / week</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Target Session Length (Time)
                      </label>
                      <select
                        value={programSessionTime}
                        onChange={(e) => setProgramSessionTime(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-base md:text-xs font-mono font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500"
                      >
                        {[10, 15, 20, 30, 45, 60].map(m => (
                          <option key={m} value={m}>{m} Mins</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>Chat Input: Program Goal & Lifestyle Focus *</span>
                    </label>
                    <textarea
                      value={programNotes}
                      onChange={(e) => setProgramNotes(e.target.value)}
                      placeholder="e.g. Schedule cardio cycling intervals alternating with joint strength loops. Help me prepare for lower extremity flexibility and desk job decompression."
                      className="w-full h-24 p-2.5 bg-white border border-slate-200 rounded-lg text-base md:text-xs text-slate-800 focus:outline-none resize-none leading-relaxed focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Any Injuries or clicky discomfort spots? (Leave blank if none)
                    </label>
                    <input
                      type="text"
                      value={programNiggles}
                      onChange={(e) => setProgramNiggles(e.target.value)}
                      placeholder="e.g. Sore right wrist, rigid traps, hamstring stiffness"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-base md:text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Routine Title / Focus Name
                      </label>
                      <input
                        type="text"
                        value={routineTitle}
                        onChange={(e) => setRoutineTitle(e.target.value)}
                        placeholder="e.g. Desk Decompression & Posture Fix"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-base md:text-xs font-mono font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                        Target Routine Length (Minutes)
                      </label>
                      <select
                        value={routineTime}
                        onChange={(e) => setRoutineTime(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-base md:text-xs font-mono font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500"
                      >
                        {[5, 10, 15, 20, 30, 45, 60].map(m => (
                          <option key={m} value={m}>{m} Mins</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>Chat Input: Workout Goal, Exercises & Equipment *</span>
                    </label>
                    <textarea
                      value={routinePrompt}
                      onChange={(e) => setRoutinePrompt(e.target.value)}
                      placeholder="e.g. Generate an interval strength circuit routine focusing on traps, posture exercises, and thoracic mobility stretches using a light resistance band."
                      className="w-full h-24 p-2.5 bg-white border border-slate-250 border-slate-200 rounded-lg text-base md:text-xs text-slate-800 focus:outline-none resize-none leading-relaxed focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-mono font-bold text-slate-450 uppercase tracking-widest mb-1">
                      Any physical constraints or clicky parts? (Leave blank if none)
                    </label>
                    <input
                      type="text"
                      value={programNiggles}
                      onChange={(e) => setProgramNiggles(e.target.value)}
                      placeholder="e.g. Tender lower back, tight jaw, stiff hips"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-base md:text-xs focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* ACTION FORWARD FOOTER */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleStartDiscussion}
                disabled={builderType === 'program' ? !programNotes.trim() : !routinePrompt.trim()}
                className="py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs font-sans rounded-xl shadow-xs transition inline-flex items-center space-x-1.5 disabled:opacity-45 cursor-pointer uppercase tracking-wider select-none"
              >
                <span>Discuss with Trim Boy</span>
                <span>✨</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* PHASE 2: SPINNER LOADER WINDOW */}
      {isLoading && chatMessages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in" id="ai-generating-loader">
          <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center mb-4 relative">
            <span className="animate-spin text-2xl text-indigo-600 font-extrabold">↺</span>
            <span className="absolute bottom-0 right-0 text-xs">✨</span>
          </div>
          <h4 className="font-extrabold text-slate-850 font-display text-base uppercase tracking-tight">AI Planning Room Setup</h4>
          <p className="text-xs text-indigo-600 font-mono italic mt-2 animate-pulse max-w-sm text-center">
            "{loadingTip}"
          </p>
        </div>
      )}

      {/* PHASE 3: DISCUSSION TIMELINE AND LAYOUT COMPILATION */}
      {discussionStarted && (
        <div className="flex-grow flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto w-full">
          
          {/* TOP CARD: CHAT ROOM WINDOW */}
          <div className="flex flex-col h-[520px] shrink-0 bg-white border border-slate-150 rounded-2xl relative shadow-md">
            
            {/* COACH CHAT BANNER */}
            <div className="p-3.5 bg-slate-900 text-white rounded-t-2xl shrink-0 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <div>
                  <dt className="text-xs font-black font-display uppercase tracking-widest">Trim Boy Chat Room</dt>
                  <dd className="text-[9px] font-mono text-indigo-300">Live Custom Fine-tuner Protocol</dd>
                </div>
              </div>
              
              <div className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                Type: {builderType}
              </div>
            </div>

            {/* MESSAGE CONTAINER */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/20">
              {chatMessages.map((m) => (
                <div 
                  key={m.id} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-sans leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200 shadow-3xs'
                  }`}>
                    <div className="whitespace-pre-line leading-relaxed font-sans">{m.content}</div>
                    <span className={`block text-[8px] mt-1.5 font-mono ${m.role === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'}`}>
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start items-center space-x-2 animate-pulse">
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 text-xs font-mono text-slate-500 rounded-tl-none flex items-center space-x-1.5 shadow-3xs">
                    <span className="animate-spin inline-block text-[11px] font-bold">↺</span>
                    <span>Trim Boy is cooking...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* SEAMLESS DISCUSSION CTA HEADER CONTROLS */}
            {!isLoading && (
              <div className="px-3.5 py-2.5 bg-indigo-50/80 border-t border-indigo-100/60 flex items-center justify-between text-[11px] font-sans shrink-0 gap-2">
                <span className="text-slate-650 font-medium">Happy with your conceptual plan?</span>
                <button
                  type="button"
                  onClick={handleFinalizeAndGenerate}
                  className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10.5px] font-mono uppercase rounded-lg shadow-sm transition inline-flex items-center gap-1 cursor-pointer select-none"
                >
                  <span>✨ Generate {builderType === 'routine' ? 'Routine' : 'Program'}</span>
                </button>
              </div>
            )}

            {/* CHAT INPUT FORM */}
            <div className="p-3 border-t border-slate-200 shrink-0 bg-white">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleRevisionSubmittal(); }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={revisionText || ''}
                  onChange={(e) => setRevisionText(e.target.value)}
                  placeholder="Ask for updates or refine notes..."
                  className="flex-1 p-2.5 bg-slate-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-xl text-base md:text-xs font-sans text-slate-800 placeholder-slate-400 transition border border-slate-200"
                  disabled={isLoading}
                />
                
                <button
                  type="submit"
                  disabled={!revisionText.trim() || isLoading}
                  className="bg-indigo-600 text-white font-bold p-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-40 cursor-pointer text-xs flex items-center justify-center shrink-0"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </form>
            </div>

            {/* CTA ACTION DOCK */}
            <div className="p-3 bg-slate-50 border-t border-slate-150 rounded-b-2xl flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={handleReset}
                type="button"
                className="py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-750 text-xs font-bold rounded-xl transition cursor-pointer select-none"
              >
                🗑 Discard & Reset
              </button>
              
              <button
                onClick={handleAcceptAndSave}
                disabled={!currentDraft}
                type="button"
                className="py-2.5 px-4 bg-slate-900 hover:bg-black text-white font-black text-xs font-sans rounded-xl shadow-xs transition cursor-pointer select-none inline-flex items-center space-x-1.5 uppercase disabled:opacity-30 disabled:pointer-events-none"
              >
                <span>Save ✨ {builderType === 'routine' ? 'Routine' : 'Program'}</span>
                <span>→</span>
              </button>
            </div>

          </div>

          {/* BOTTOM CARD: WORKOUT LAYOUT / PLANNING PLACEHOLDER */}
          <div className="flex flex-col bg-slate-50 border border-slate-150 rounded-2xl p-5 relative">
            
            <div className="sticky top-0 bg-slate-50 pb-2 border-b border-slate-200/60 mb-4 shrink-0 flex items-center justify-between z-10">
              <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest">
                🔬 AI Workout Blueprint ({builderType})
              </span>
              <span className="text-[9px] font-mono text-slate-450 bg-white border border-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${currentDraft ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500 animate-ping'}`} />
                {currentDraft ? 'Interactive Card Active' : 'Waiting for discussion generate'}
              </span>
            </div>

            {currentDraft ? (
              /* ACTUAL ACTIVE BLUEPRINT GENERATED */
              currentDraft.detectedType === 'routine' && currentDraft.routine ? (
                <div className="space-y-4 text-slate-800 flex-1">
                  <div>
                    <h3 className="text-base font-black text-slate-900 font-display flex items-center space-x-1">
                      <span>✨</span>
                      <span>{currentDraft.routine.name}</span>
                    </h3>
                    <div className="flex items-center space-x-2 mt-1 shrink-0">
                      <span className="text-[10px] font-mono bg-indigo-100 text-indigo-850 px-2.5 py-0.5 rounded font-bold uppercase">
                        {currentDraft.routine.duration} mins
                      </span>
                      {currentDraft.routine.isRecovery && (
                        <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded font-bold uppercase">
                          Active Recovery
                        </span>
                      )}
                    </div>
                  </div>

                  {currentDraft.routine.instructions && (
                    <div className="bg-white border border-slate-150 p-3 rounded-xl">
                      <span className="block text-[8.5px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Instructions / Ideas
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans">{currentDraft.routine.instructions}</p>
                    </div>
                  )}

                  {currentDraft.routine.notes && (
                    <div className="bg-white border border-slate-150 p-3 rounded-xl border-l-2 border-l-amber-400 bg-amber-50/10">
                      <span className="block text-[8.5px] font-mono font-bold text-amber-600 uppercase tracking-wider mb-1">
                        Coaching tips
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans italic">{currentDraft.routine.notes}</p>
                    </div>
                  )}

                  {currentDraft.routine.exercises && currentDraft.routine.exercises.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                        Exercises Sequence Details ({currentDraft.routine.exercises.length})
                      </h5>
                      <div className="space-y-1.5">
                        {currentDraft.routine.exercises.map((ex, index) => (
                          <div key={index} className="bg-white border border-slate-150 p-2.5 rounded-xl flex items-center justify-between text-xs transition hover:border-slate-300">
                            <div className="flex items-center space-x-2 truncate">
                              <span className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center font-mono font-bold text-[10px] text-slate-500 shrink-0">
                                {index + 1}
                              </span>
                              <span className="font-extrabold text-slate-850 truncate">{ex.name}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2 text-[10.5px] font-mono text-slate-500 shrink-0">
                              {ex.sets && <span>{ex.sets}s</span>}
                              {ex.reps && <span>{ex.reps}r</span>}
                              {ex.duration && <span>{ex.duration}s</span>}
                              {ex.weight && <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9.5px]">{ex.weight}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentDraft.routine.intervals && currentDraft.routine.intervals.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                        Interval Timers Loop
                      </h5>
                      <div className="flex flex-wrap gap-1.5">
                        {currentDraft.routine.intervals.map((int, i) => (
                          <div 
                            key={i} 
                            className={`py-1.5 px-3 rounded-lg border text-[10.5px] font-mono font-semibold flex items-center space-x-1.5 ${
                              int.color === 'emerald' ? 'bg-emerald-50 border-emerald-250 text-emerald-800' :
                              int.color === 'rose' ? 'bg-rose-50 border-rose-250 text-rose-800' :
                              int.color === 'blue' ? 'bg-blue-50 border-blue-250 text-blue-800' :
                              'bg-amber-50 border-amber-250 text-amber-800'
                            }`}
                          >
                            <span className="font-bold">{int.name}</span>
                            <span>{int.duration}s</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : currentDraft.detectedType === 'program' && currentDraft.program ? (
                <div className="space-y-4 text-slate-800 flex-1">
                  <div>
                    <h3 className="text-base font-black text-slate-900 font-display flex items-center space-x-1">
                      <span>✨</span>
                      <span>{currentDraft.program.name}</span>
                    </h3>
                    <p className="text-xs text-slate-650 mt-1 leading-relaxed font-sans">{currentDraft.program.description}</p>
                    <div className="bg-indigo-550 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-xl p-2 px-3 text-xs mt-2.5 font-sans font-medium">
                      🚀 Program length: <strong>{currentDraft.program.weeks.length} Weeks</strong> • <strong>{currentDraft.program.weeks[0]?.days.filter(d=>d.activities.length>0).length || programSessions} Sessions/Week</strong>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {currentDraft.program.weeks.map((wk, wkIdx) => (
                      <div key={wkIdx} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-3xs">
                        <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-slate-100">
                          <span className="text-[10px] font-mono font-black tracking-widest text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded-md">
                            WEEK {wk.weekNumber} SCHEDULE
                          </span>
                        </div>

                        <div className="space-y-2">
                          {wk.days.map((dy, dyIdx) => {
                            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                            return (
                              <div key={dyIdx} className="flex gap-2 p-1.5 bg-slate-50/40 rounded-lg">
                                <span className="w-10 text-[10px] font-mono font-extrabold text-slate-400 uppercase text-right self-center">
                                  {days[dy.dayIndex].substring(0, 3)}
                                </span>
                                <div className="flex-1">
                                  {dy.activities.length > 0 ? (
                                    dy.activities.map((act, actIdx) => (
                                      <div key={actIdx} className="bg-white border border-slate-150 p-2 rounded-md flex items-center justify-between text-[11px]">
                                        <div>
                                          <span className="font-black text-slate-800 block">{act.name}</span>
                                          <span className="text-[9px] text-indigo-650 uppercase bg-slate-50 font-mono font-bold px-1 rounded block mt-0.5 w-max">{act.type}</span>
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-500 uppercase">
                                          {act.duration && <span>{act.duration}m</span>}
                                          {act.distance && <span className="ml-1 text-sky-600">({act.distance}k)</span>}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-[10.5px] text-slate-400 italic">Rest day</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            ) : (
              /* CONCEPT PLANNING ROOM PLACEHOLDER */
              <div className="flex-1 flex flex-col justify-center items-center text-center p-8 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center mb-4 text-indigo-600 animate-pulse">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest font-mono">
                  Concept Planning Session
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-3 leading-relaxed">
                  Your Trim Boy is detailing ideas, discussing structures, and checking Comfort Constraints in the chat panel. 
                </p>
                <p className="text-xs text-slate-500 font-sans mt-2.5 leading-relaxed">
                  Review the feedback. When you are ready, click the highly prominent <span className="font-extrabold text-indigo-600">✨ Generate {builderType === 'routine' ? 'Routine' : 'Program'}</span> button in the coach room to view the interactive card!
                </p>
                
                {/* BIG CALL TO ACTION ARROW ACCENT */}
                <div className="mt-8 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-3xs flex items-center space-x-2 animate-bounce cursor-pointer" onClick={handleFinalizeAndGenerate}>
                  <Zap className="w-4.5 h-4.5 text-amber-500" />
                  <span className="text-[11px] font-mono font-black text-indigo-600 uppercase">Generate blueprint visual &rarr;</span>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
