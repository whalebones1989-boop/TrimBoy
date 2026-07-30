/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import trimBoySprite from '../assets/images/trim_boy_sprite_1781086910401.png';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface WeeklyCheckInModalProps {
  onClose: () => void;
  programNotes: string;
  onSaveProgramNotes: (notes: string) => void;
  recentLogs?: any[];
}

export default function WeeklyCheckInModal({
  onClose,
  programNotes,
  onSaveProgramNotes,
  recentLogs = [],
}: WeeklyCheckInModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with weekly check-in greeting
  useEffect(() => {
    let logsSummary = "";
    if (recentLogs && recentLogs.length > 0) {
      logsSummary = `\n\nI see you've logged these activities recently:\n` + recentLogs.map(l => {
        const dateStr = new Date(l.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return `• ${l.name || l.type} (${l.type}) for ${l.durationCompleted} mins on ${dateStr}`;
      }).join('\n');
    }

    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Hi there. It's time for your weekly coaching check-in.${logsSummary}

How did your training feel this week? Was it too hard, too easy?

Have you experienced any clicky joints, muscle soreness, or other physical niggles? We can modify your upcoming sessions accordingly.`,
      },
    ]);
  }, [recentLogs]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputVal('');
    setIsLoading(true);

    try {
      const parsedLogsSummary = recentLogs.length > 0
        ? recentLogs.map((l: any) => `- ${l.name || l.type} (Type: ${l.type}) done for ${l.durationCompleted} mins`).join("\n")
        : "No logs completed this week.";

      const response = await fetch('/api/checkin-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `[System Context - Athlete has logged the following activities this week:\n${parsedLogsSummary}\nCoach please dynamically reference and coordinate recommendations around these external sports/activities!]`
            },
            ...newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            }))
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Check-in service is currently offline.');
      }

      const data = await response.json();
      
      const coachMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Check-in processed successfully.',
      };

      setMessages((prev) => [...prev, coachMsg]);

      if (data.programNotes) {
        onSaveProgramNotes(data.programNotes);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error synchronizing: ${error.message || 'Check connection settings.'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 font-sans text-slate-800" 
      id="trim-checkin-chat-overlay"
    >
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col h-[580px] overflow-hidden">
        
        {/* HEADER */}
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <div>
            <h2 className="text-sm font-black font-display text-slate-800 tracking-wide uppercase">
              Weekly Trim Boy Check-In
            </h2>
            <p className="text-[10px] text-slate-500 font-mono tracking-tight uppercase">
              Fine-tune your routine volume & joint recovery
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-black p-1 bg-white hover:bg-slate-100 rounded-lg border border-slate-150 transition-all text-xs w-6 h-6 flex items-center justify-center"
            title="Close check-in"
          >
            ✕
          </button>
        </header>

        {/* RECENTLY COMPLETED ACTIVITIES TICKER */}
        {recentLogs && recentLogs.length > 0 && (
          <div className="px-6 py-2 bg-slate-100 border-b border-slate-200.5 flex flex-wrap items-center gap-1.5 shrink-0 select-none">
            <span className="text-[9px] font-black font-mono text-slate-450 uppercase tracking-tight">Week's logs:</span>
            {recentLogs.map((log: any, idx: number) => (
              <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-white text-slate-700 border border-slate-200 shadow-xs max-w-[150px] truncate">
                {log.type === 'Surfing' ? '🏄' : log.type === 'Skating' ? '🛹' : log.type === 'Yoga' ? '🧘' : log.type === 'GymStrength' ? '🏋️' : log.type === 'Run' ? '🏃' : '✨'} {log.name || log.type}
              </span>
            ))}
          </div>
        )}

        {/* CURRENT COACH NOTES SUMMARY ACCORDION */}
        {programNotes && (
          <div className="px-6 py-3 bg-indigo-50/45 border-b border-indigo-100 text-[11px] text-indigo-950 font-sans flex items-start space-x-2">
            <span className="font-bold shrink-0">Active Modification:</span>
            <span className="italic leading-relaxed">{programNotes}</span>
          </div>
        )}

        {/* CONVERSATION AREA */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50"
        >
          {messages.map((item) => (
            <div 
              key={item.id}
              className={`flex flex-col space-y-1 ${item.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center space-x-1.5 text-[10px] uppercase font-mono font-bold text-slate-400">
                {item.role === 'user' ? (
                  <span>Athlete</span>
                ) : (
                  <>
                    <img 
                      src={trimBoySprite} 
                      alt="Trim Boy" 
                      className="w-4.5 h-4.5 rounded-full object-cover border border-slate-100 shadow-xs" 
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-indigo-600">Trim Boy (AI)</span>
                  </>
                )}
              </div>
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  item.role === 'user' 
                    ? 'bg-amber-50 text-slate-900 font-semibold border border-amber-200 font-sans shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-800 font-sans shadow-sm'
                }`}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {item.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex flex-col space-y-1 items-start">
              <div className="flex items-center space-x-1.5 text-[10px] uppercase font-mono font-bold text-slate-400">
                <img 
                  src={trimBoySprite} 
                  alt="Trim Boy" 
                  className="w-4.5 h-4.5 rounded-full object-cover animate-pulse border border-slate-100" 
                  referrerPolicy="no-referrer"
                />
                <span className="text-indigo-600 animate-pulse">Trim Boy</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-500 font-mono tracking-normal shadow-sm flex items-center space-x-2">
                <span className="animate-spin inline-block text-indigo-500">↺</span>
                <span>Trim Boy is cooking...</span>
              </div>
            </div>
          )}
        </div>

        {/* INPUT INPUT CONTROLS */}
        <div className="p-4 border-t border-slate-200/80 shrink-0 bg-white">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputVal);
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. My knees are a bit clicky and shoulder is sore."
              className="flex-1 p-2.5 bg-slate-50 border border-slate-305 focus:bg-white focus:border-slate-400 focus:outline-none rounded-xl text-base md:text-xs font-sans text-slate-800 placeholder-slate-400 transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 border border-slate-950 text-white font-bold p-2.5 rounded-xl transition-all font-sans text-xs shrink-0 inline-flex items-center space-x-1 disabled:opacity-40"
              disabled={!inputVal.trim() || isLoading}
            >
              <span>Send</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 py-2.5 px-3.5 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all text-xs font-bold font-sans tracking-tight shrink-0 uppercase"
            >
              Done
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
