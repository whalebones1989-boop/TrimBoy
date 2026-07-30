/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Clock, MessageSquare } from 'lucide-react';
import { Routine } from '../types';

interface RoutineFormProps {
  initialRoutine?: Routine;
  onSave: (routine: Routine) => void;
  onClose: () => void;
  onStartWithAi?: (title: string, duration: number, prompt: string) => void;
}

export default function RoutineForm({ initialRoutine, onSave, onClose, onStartWithAi }: RoutineFormProps) {
  const [name, setName] = useState<string>(initialRoutine?.name || '');
  const [duration, setDuration] = useState<number>(initialRoutine?.duration || 15);
  const [prompt, setPrompt] = useState<string>('');
  const [useEquipment, setUseEquipment] = useState<boolean>(initialRoutine?.useEquipment || false);
  const [equipmentDetails, setEquipmentDetails] = useState<string>(initialRoutine?.equipmentDetails || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Is there a prompt? If yes, and we have the AI callback, start with AI!
    if (onStartWithAi && prompt.trim()) {
      onStartWithAi(name.trim(), Number(duration), prompt.trim());
      return;
    }

    // Default basic manual save
    const routineId = initialRoutine?.id || `routine-manual-${Date.now()}`;
    const cleanRoutine: Routine = {
      id: routineId,
      name: name.trim(),
      instructions: prompt.trim() || 'AI generated routine placeholder.',
      notes: '',
      duration: Number(duration),
      isRecovery: false,
      isFavourite: initialRoutine?.isFavourite || false,
      recentlyUsedAt: initialRoutine?.recentlyUsedAt || null,
      exercises: initialRoutine?.exercises || [],
      intervals: initialRoutine?.intervals || [],
      tags: [],
      useEquipment,
      equipmentDetails: useEquipment ? equipmentDetails.trim() : ''
    };

    onSave(cleanRoutine);
  };

  const handleTriggerAiOnly = () => {
    if (!name.trim() || !prompt.trim() || !onStartWithAi) return;
    onStartWithAi(name.trim(), Number(duration), prompt.trim());
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl text-left max-w-lg mx-auto w-full relative overflow-hidden" id="trim-routine-form">
      {/* Decorative colored glow bubble */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-xl pointer-events-none" />

      {/* HEADER UPPER TITLE ONLY */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5 shrink-0">
        <div>
          <div className="flex items-center space-x-1.5">
            <Sparkles className="text-indigo-600 w-5 h-5 animate-pulse" />
            <h2 className="text-lg font-black font-display text-slate-900 leading-tight uppercase tracking-tight">
              {initialRoutine ? 'Rename Routine' : 'Create Custom Routine'}
            </h2>
          </div>
          <span className="text-[10.5px] text-slate-400 font-mono tracking-wide mt-0.5 inline-block">
            TAILORED AROUND INTENT • SPECIFY DESIGN ATTEMPTS
          </span>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition cursor-pointer"
        >
          <span className="text-sm font-bold">✕</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-slate-700 text-xs text-left">
        
        {/* TITLE AND TIME FIELDS ONLY */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-3">
            <label className="block text-[9.5px] uppercase font-bold font-mono text-slate-400 mb-1.5 tracking-wider">
              Routine Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Upper Body Pumping, Hip Decompression, Post-Desk Stretch"
              className="w-full p-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition leading-tight text-base md:text-xs bg-slate-50/40 font-medium text-slate-800"
              required
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-[9.5px] uppercase font-bold font-mono text-slate-400 mb-1.5 tracking-wider">
              Est. Time (Min)
            </label>
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="w-full p-2.5 border border-slate-200 focus:border-indigo-500 rounded-xl focus:outline-none transition bg-slate-50/40 text-base md:text-xs font-mono font-bold text-center"
              required
            />
          </div>
        </div>

        {/* EQUIPMENT SELECTION */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex items-center space-x-2.5">
            <input
              type="checkbox"
              id="useEquipment"
              checked={useEquipment}
              onChange={(e) => setUseEquipment(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 border-slate-200 focus:ring-indigo-550 cursor-pointer"
            />
            <label htmlFor="useEquipment" className="text-xs font-bold font-sans text-slate-700 cursor-pointer select-none">
              Does this routine require equipment?
            </label>
          </div>

          {useEquipment && (
            <div className="pt-1">
              <label className="block text-[9px] uppercase font-bold font-mono text-slate-500 mb-1 tracking-wider">
                What equipment is needed? *
              </label>
              <input
                type="text"
                value={equipmentDetails}
                onChange={(e) => setEquipmentDetails(e.target.value)}
                placeholder="e.g. Dumbbells, Resistance Band, Pull-up Bar"
                className="w-full p-2 border border-slate-200 focus:border-indigo-500 rounded-lg focus:outline-none transition text-base md:text-xs bg-white font-medium text-slate-800"
                required={useEquipment}
              />
            </div>
          )}
        </div>

        {/* DESCRIPTION FIELD */}
        <div>
          <label className="block text-[9.5px] uppercase font-bold font-mono text-indigo-605 text-indigo-600 mb-1.5 tracking-wider flex items-center space-x-1">
            <MessageSquare className="w-3 h-3 text-indigo-500" />
            <span>Instructions / Description *</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what to do in this workout (e.g. Upper body focus, light active stretches, deep rhythmic breaths)."
            className="w-full p-3 border border-slate-200 hover:border-slate-350 focus:border-indigo-500 rounded-xl focus:outline-none transition h-28 text-base md:text-xs text-slate-800 placeholder-slate-400 resize-none leading-relaxed font-sans"
            required={!initialRoutine}
          />
        </div>

        {/* SUBMISSION FOOTER BAR */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded-xl transition cursor-pointer text-xs"
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="py-2.5 px-5 bg-slate-900 hover:bg-black font-extrabold tracking-wide uppercase text-white rounded-xl shadow-md transition disabled:opacity-40 cursor-pointer text-xs"
            >
              {initialRoutine ? 'Save Edits' : 'Create Routine'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
