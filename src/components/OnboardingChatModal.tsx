/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import trimBoySprite from '../assets/images/trim_boy_sprite_1781086910401.png';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ProfileData {
  name?: string;
  age?: string | number;
  occupation?: string;
  external?: string;
  workoutDuration?: string;
  workoutFrequency?: string;
  niggles?: string;
}

interface OnboardingChatModalProps {
  onClose: () => void;
  onUpdateProfile: (data: Partial<ProfileData>) => void;
  profileWorkoutDuration: string;
  profileWorkoutFrequency: string;
  profileExternal: string;
  profileNiggles: string;
}

export default function OnboardingChatModal({
  onClose,
  onUpdateProfile,
  profileWorkoutDuration,
  profileWorkoutFrequency,
  profileExternal,
  profileNiggles,
}: OnboardingChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with feel-good introduction message
  useEffect(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `Welcome to Trim.

Our absolute purpose is simply to help you feel good. We're here to design elite, custom-tailored movement and recovery sessions built wholly around your life. No pressure, no rigid templates. We know exactly what we are doing. Let's get trim.

Let's begin with a quick introduction: what is your name?`,
      },
    ]);
  }, []);

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
      const response = await fetch('/api/onboarding-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Introduction service is temporarily offline.');
      }

      const data = await response.json();
      
      // Process messages & update live application profile
      const coachMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Acknowledged with gratitude.',
      };

      setMessages((prev) => [...prev, coachMsg]);

      if (data.profileUpdates) {
        onUpdateProfile(data.profileUpdates);
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

  const handleFinish = () => {
    localStorage.setItem('trim_onboard_completed', 'true');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 font-sans text-slate-800" 
      id="trim-onboarding-chat-overlay"
    >
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col h-[580px] overflow-hidden">
        
        {/* HEADER */}
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <div>
            <h2 className="text-sm font-black font-display text-slate-800 tracking-wide uppercase">
              Introduction
            </h2>
            <p className="text-[10px] text-slate-500 font-mono tracking-tight uppercase">
              Let's get trim • No pressure
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleFinish}
              className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 border border-slate-200 rounded-lg px-2.5 py-1 text-center bg-white transition select-none cursor-pointer"
            >
              Skip Intro
            </button>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition font-black font-mono text-sm px-2 py-1"
              title="Close"
            >
              ✕
            </button>
          </div>
        </header>

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
                    <span className="text-indigo-600">Trim Boy</span>
                  </>
                )}
              </div>
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  item.role === 'user' 
                    ? 'bg-yellow-50 text-slate-900 font-semibold border border-yellow-250 font-sans shadow-sm'
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
          {messages.filter(m => m.role === 'user').length >= 3 && !isLoading ? (
            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-center text-xs font-sans rounded-2xl shadow-md transition-all duration-150 tracking-wider uppercase select-none cursor-pointer flex items-center justify-center space-x-2"
              id="onboarding-start-btn"
            >
              <span>Let's get started! 🚀</span>
            </button>
          ) : (
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
                placeholder="Type your reply here..."
                className="flex-1 p-2.5 bg-slate-50 border border-slate-300 hover:bg-white focus:bg-white focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 rounded-xl text-base md:text-xs font-sans text-slate-800 placeholder-slate-400 transition"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 border border-slate-950 text-white p-2.5 rounded-xl transition-all shrink-0 inline-flex items-center justify-center disabled:opacity-40 select-none cursor-pointer"
                disabled={!inputVal.trim() || isLoading}
                title="Send Message"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
