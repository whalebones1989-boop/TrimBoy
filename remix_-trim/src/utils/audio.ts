/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Plays a synthesized beep to signpost interval state changes
 * @param pitch 'high' or 'low' or 'double'
 */
export function playBuzzer(pitch: 'high' | 'low' | 'double' = 'high') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    
    const triggerBeep = (freq: number, duration: number, delay: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      try {
        const waveType = (localStorage.getItem('trim_workout_tone_type') || 'sine') as OscillatorType;
        osc.type = waveType;
      } catch (err) {
        osc.type = 'sine';
      }
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.05);
    };

    if (pitch === 'double') {
      triggerBeep(880, 0.15, 0);
      triggerBeep(880, 0.15, 0.2);
    } else if (pitch === 'high') {
      triggerBeep(784, 0.25, 0); // G5
    } else {
      triggerBeep(523, 0.35, 0); // C5
    }
  } catch (e) {
    console.warn("Web Audio Context blocked. Playback requires user interaction.", e);
  }
}

/**
 * Plays an 8-bit arcade style Coin collect sound (low beep then immediate high beep)
 */
export function playCoinSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const triggerAudio = (freq: number, duration: number, delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square'; // authentic 8-bit square wave
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + delay + duration - 0.02);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };
    triggerAudio(987.77, 0.08, 0); // B5
    triggerAudio(1318.51, 0.25, 0.08); // E6
  } catch (e) {}
}

/**
 * Plays an 8-bit fantasy Level Up arpeggio chime
 */
export function playLevelUpSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const triggerAudio = (freq: number, duration: number, delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle'; // smoother chiptune synth
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.02);
    };
    
    const scale = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
    scale.forEach((freq, idx) => {
      triggerAudio(freq, 0.18, idx * 0.07);
    });
  } catch (e) {}
}

/**
 * Plays an 8-bit classic Game Over / Lose Heart sound (descending minor sequence)
 */
export function playLoseHeartSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const triggerAudio = (freq: number, duration: number, delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth'; // heavy tone
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.02);
    };
    
    const scale = [587.33, 554.37, 523.25, 349.23]; // D5, C#5, C5, F4
    scale.forEach((freq, idx) => {
      triggerAudio(freq, 0.25, idx * 0.12);
    });
  } catch (e) {}
}

/**
 * Plays a refreshing 8-bit power-up sweep
 */
export function playPowerUpSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(330, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.38);
  } catch (e) {}
}

/**
 * Plays quick double-beep success chime
 */
export function playComboBeeps() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const triggerAudio = (freq: number, duration: number, delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.02);
    };
    triggerAudio(523.25, 0.12, 0); // C5
    triggerAudio(659.25, 0.12, 0.08); // E5
    triggerAudio(783.99, 0.2, 0.16); // G5
  } catch (e) {}
}

/**
 * Plays a short quiet synthesized beep to count down seconds
 */
export function playCountdownTick() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    try {
      const waveType = (localStorage.getItem('trim_workout_tone_type') || 'sine') as OscillatorType;
      osc.type = waveType;
    } catch (err) {
      osc.type = 'sine';
    }
    
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 frequency (sweet short pip)
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}
}

/**
 * Plays a distinct high double chime to signify end of timer / workout transition
 */
export function playTransitionEndSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const trigger = (freq: number, duration: number, delay: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      try {
        const waveType = (localStorage.getItem('trim_workout_tone_type') || 'sine') as OscillatorType;
        osc.type = waveType;
      } catch (err) {
        osc.type = 'sine';
      }
      
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.05);
    };
    
    trigger(880, 0.18, 0); // A5 chime
    trigger(1174.66, 0.25, 0.12); // D6 chime (ascending transition signpost)
  } catch (e) {}
}

