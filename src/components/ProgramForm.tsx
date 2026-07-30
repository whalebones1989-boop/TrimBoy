/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Program, Week } from '../types';

interface ProgramFormProps {
  onSave: (program: Program) => void;
  onClose: () => void;
  onStartWithAi?: (weeks: number, sessions: number, notes: string) => void;
}

export default function ProgramForm({ onSave, onClose, onStartWithAi }: ProgramFormProps) {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [weeksCount, setWeeksCount] = useState<number>(4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Allocate selected count of empty weeks automatically
    const emptyWeeks: Week[] = [];
    for (let w = 1; w <= Number(weeksCount); w++) {
      emptyWeeks.push({
        weekNumber: w,
        days: [] // Assigned calendar activities will dynamically build this structure
      });
    }

    const newProgram: Program = {
      id: `program-manual-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      weeksCount: Number(weeksCount),
      weeks: emptyWeeks,
      isArchived: false
    };

    onSave(newProgram);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm text-left max-w-md mx-auto w-full" id="trim-program-form">
      
      {/* HEADER ROW */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5 shrink-0">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 leading-tight">Build Training Program</h2>
          <span className="text-[11px] text-slate-400 font-mono">Formulate long-term scheduling calendars.</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
        >
          <span className="text-sm font-bold">✕</span>
        </button>
      </div>

      {onStartWithAi && (
        <div className="bg-[#f0f4ff] border border-indigo-100 rounded-2xl p-4 mb-5 flex flex-col sm:flex-row items-center justify-between text-xs font-sans gap-3">
          <div className="flex items-start space-x-2.5">
            <span className="text-xl select-none leading-none mt-0.5">✨</span>
            <div>
              <p className="font-extrabold text-[#0f172a]">Synthesize with AI Program Builder</p>
              <p className="text-[11px] text-[#64748b] mt-0.5 leading-relaxed">
                Connect your targets, schedule, and custom constraints into one coordinated, multi-week training cycle.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onStartWithAi(weeksCount, 3, description)}
            className="py-2.5 px-4 bg-[#0f172a] hover:bg-black text-white font-extrabold rounded-xl transition duration-150 text-[10px] uppercase tracking-wide select-none cursor-pointer text-center w-full sm:w-auto shrink-0"
          >
            Start with AI
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-slate-700 text-xs text-left">
        
        {/* TITLE */}
        <div>
          <label className="block text-[10px] uppercase font-bold font-mono text-slate-400 mb-1.5">Program Title</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 12 Week Strength, 4 Week Running Core"
            className="w-full p-2.5 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-xl focus:outline-none text-base md:text-xs transition"
            required
          />
        </div>

        {/* TIMELINE SPAN RANGE */}
        <div>
          <label className="block text-[10px] uppercase font-bold font-mono text-slate-400 mb-1.5">Timeline duration span</label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="1"
              max="16"
              value={weeksCount}
              onChange={(e) => setWeeksCount(parseInt(e.target.value) || 1)}
              className="flex-1 accent-indigo-500 cursor-pointer"
            />
            <span className="text-xs font-bold leading-none bg-indigo-50 text-indigo-750 p-2 rounded-xl text-mono shrink-0">
              {weeksCount} Weeks
            </span>
          </div>
          <span className="text-[10px] text-slate-400 italic block mt-1">
            *Trim permits plans up to 16 weeks span directly.
          </span>
        </div>

        {/* DESCRIPTION SUMMARY */}
        <div>
          <label className="block text-[10px] uppercase font-bold font-mono text-slate-400 mb-1">Target objectives description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline physical benchmarks, cardio thresholds, or nutritional guidelines associated with this training program."
            className="w-full text-base md:text-xs p-3 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-xl focus:outline-none transition h-24 placeholder-slate-400"
          />
        </div>

        {/* GUIDING ADVICE ALERT */}
        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex items-start space-x-2.5">
          <p className="text-[11.5px] text-slate-500 leading-normal">
            Once submitted, click the created Program card inside the dashboard to view the grid calendar draft where you can allocate individual workouts and runs to specific weekly days.
          </p>
        </div>

        {/* SUBMIT BUTTON ACTIONS */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-50 border border-slate-200 hover:border-slate-100 rounded-xl"
          >
            Go Back
          </button>
          <button
            type="submit"
            className="py-2.5 px-5 bg-indigo-650 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase rounded-xl shadow-xs transition hover:shadow-md"
          >
            Build Program
          </button>
        </div>

      </form>

    </div>
  );
}
