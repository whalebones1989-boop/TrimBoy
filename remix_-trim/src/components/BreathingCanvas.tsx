/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';

interface BreathingCanvasProps {
  isBreathingRunning: boolean;
  phase: string;
  theme?: string;
  timeLeft: number;
  duration: number;
}

export default function BreathingCanvas({ 
  isBreathingRunning, 
  phase, 
  theme = 'minimalist',
  timeLeft,
  duration 
}: BreathingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<string>(phase);
  const durationRef = useRef<number>(duration);
  const phaseStartTimeRef = useRef<number>(Date.now());
  const warmthRef = useRef<number>(0); // Smooth color blending state (0 = cool, 1 = warm)

  // Track phase changes to restart the millisecond progress clock precisely
  useEffect(() => {
    phaseRef.current = phase;
    durationRef.current = duration;
    phaseStartTimeRef.current = Date.now();
  }, [phase, duration, isBreathingRunning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const MIN_RADIUS = 35;
    const MAX_RADIUS = 75;

    // Canvas size
    const width = 220;
    const height = 220;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const centerX = width / 2;
    const centerY = height / 2;

    const renderLoop = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      const currentPhase = phaseRef.current;
      const currentDuration = durationRef.current || 4;

      let currentRadius = 50;
      let targetWarmth = 0;

      if (!isBreathingRunning) {
        currentRadius = 50;
        targetWarmth = 0;
      } else {
        const elapsedMs = Date.now() - phaseStartTimeRef.current;
        const totalMs = currentDuration * 1000;
        // Compute progress fraction between 0.0 and 1.0
        const progress = Math.min(1.0, elapsedMs / totalMs);

        // Biologically realistic S-curve easing (Sine ease-in-out)
        // Helps lungs accelerate and decelerate naturally
        const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;

        const pLower = currentPhase.toLowerCase();

        if (pLower.includes('inhale')) {
          // Circle slowly expands from empty to full
          currentRadius = MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * easeProgress;
          targetWarmth = 0.0; // Cool during inhale
        } else if (pLower.includes('exhale')) {
          // Circle slowly contracts from full to empty
          currentRadius = MAX_RADIUS - (MAX_RADIUS - MIN_RADIUS) * easeProgress;
          // Colors transition from warm back to cool as we exhale
          targetWarmth = 1.0 - progress;
        } else if (pLower.includes('hold') || pLower.includes('retain')) {
          if (pLower.includes('empty')) {
            // Stay in the same spot at empty
            currentRadius = MIN_RADIUS;
            targetWarmth = 0.0; // Cool
          } else {
            // Stay in the same spot at full
            currentRadius = MAX_RADIUS;
            // Transition from cool to warm during full hold
            targetWarmth = progress;
          }
        } else if (pLower.includes('rest')) {
          // Rest is usually post-exhale empty hold
          currentRadius = MIN_RADIUS;
          targetWarmth = 0.0;
        } else {
          // Default fallback
          currentRadius = 50;
          targetWarmth = 0.2;
        }
      }

      // Smoothly interpolate the visual glow color transition (cool to warm or vice versa)
      warmthRef.current += (targetWarmth - warmthRef.current) * 0.1;
      const glowWarmth = warmthRef.current;

      // Color spectrum calculation:
      // Cool state: Sky Blue (R=56, G=189, B=248) -> Warm state: Amber Orange (R=251, G=146, B=60)
      const r = Math.round(56 + (251 - 56) * glowWarmth);
      const g = Math.round(189 + (146 - 189) * glowWarmth);
      const b = Math.round(248 + (60 - 248) * glowWarmth);

      ctx.save();
      
      // Draw glowing background breathing aura
      const grad = ctx.createRadialGradient(
        centerX, 
        centerY, 
        Math.max(0, currentRadius - 15), 
        centerX, 
        centerY, 
        currentRadius + 22
      );
      
      const opacityFactor = isBreathingRunning ? 0.26 : 0.12;
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacityFactor})`);
      grad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${opacityFactor * 0.4})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius + 25, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw faint secondary outline
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius + 4, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.12)`;
      ctx.stroke();

      // Draw solid perimeter ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
      ctx.stroke();

      // Gentle internal center color filling
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius - 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.055)`;
      ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isBreathingRunning]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: '220px', height: '220px' }} 
      className="block"
    />
  );
}
