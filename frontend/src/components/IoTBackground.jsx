import React, { useEffect, useRef } from 'react';

/**
 * IoTBackground
 * Renders a subtle, high-performance canvas background representing
 * connected IoT nodes, infrastructure topology, and realtime data telemetry.
 *
 * Adheres to:
 * - Low-contrast, non-distracting industrial aesthetic
 * - Prefers-reduced-motion support (renders static frame, no animation loop)
 * - Subtle cursor parallax (with smooth lerp)
 * - Mobile optimizations (reduced node density, touch detection)
 */
export const IoTBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Subtle parallax state
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e) => {
      if (isTouchDevice || prefersReducedMotion) return;
      const { innerWidth, innerHeight } = window;
      targetMouseX = (e.clientX / innerWidth - 0.5) * 20; // max +/- 10px shift
      targetMouseY = (e.clientY / innerHeight - 0.5) * 20;
    };

    if (!isTouchDevice && !prefersReducedMotion) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    // Network nodes & pulses
    let nodes = [];
    let pulses = [];
    const MAX_PULSES = isTouchDevice ? 3 : 6;
    const CONNECT_DISTANCE = isTouchDevice ? 110 : 145;

    const initNodes = () => {
      const isMobile = width < 768;
      const count = isMobile ? 18 : 36;
      nodes = [];

      for (let i = 0; i < count; i++) {
        const isGateway = i % 7 === 0; // Key gateway nodes
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (isGateway ? 0.08 : 0.18),
          vy: (Math.random() - 0.5) * (isGateway ? 0.08 : 0.18),
          radius: isGateway ? 3 : Math.random() * 1.5 + 1.2,
          isGateway,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.015 + Math.random() * 0.015,
        });
      }
      pulses = [];
    };

    const resize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      initNodes();

      if (prefersReducedMotion) {
        drawFrame(true);
      }
    };

    const spawnPulse = () => {
      if (pulses.length >= MAX_PULSES || nodes.length < 2) return;
      // Pick a random node that has a connected neighbor
      const fromIdx = Math.floor(Math.random() * nodes.length);
      const fromNode = nodes[fromIdx];

      const eligibleTargets = [];
      for (let j = 0; j < nodes.length; j++) {
        if (j === fromIdx) continue;
        const toNode = nodes[j];
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DISTANCE) {
          eligibleTargets.push(toNode);
        }
      }

      if (eligibleTargets.length > 0) {
        const toNode = eligibleTargets[Math.floor(Math.random() * eligibleTargets.length)];
        pulses.push({
          from: fromNode,
          to: toNode,
          progress: 0,
          speed: 0.005 + Math.random() * 0.006, // slow, calm transit
        });
      }
    };

    const drawFrame = (isStatic = false) => {
      ctx.clearRect(0, 0, width, height);

      // Smooth parallax interpolation
      if (!isStatic && !prefersReducedMotion && !isTouchDevice) {
        currentMouseX += (targetMouseX - currentMouseX) * 0.04;
        currentMouseY += (targetMouseY - currentMouseY) * 0.04;
      }

      ctx.save();
      ctx.translate(currentMouseX, currentMouseY);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECT_DISTANCE) {
            const alpha = (1 - dist / CONNECT_DISTANCE) * 0.12;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(100, 140, 190, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw and update data pulses
      if (!isStatic && !prefersReducedMotion) {
        if (Math.random() < 0.03) {
          spawnPulse();
        }

        for (let k = pulses.length - 1; k >= 0; k--) {
          const pulse = pulses[k];
          pulse.progress += pulse.speed;

          if (pulse.progress >= 1) {
            pulses.splice(k, 1);
            continue;
          }

          const currentX = pulse.from.x + (pulse.to.x - pulse.from.x) * pulse.progress;
          const currentY = pulse.from.y + (pulse.to.y - pulse.from.y) * pulse.progress;

          // Tiny glowing packet
          ctx.beginPath();
          ctx.arc(currentX, currentY, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(52, 211, 153, 0.75)'; // Soft emerald
          ctx.shadowColor = 'rgba(52, 211, 153, 0.6)';
          ctx.shadowBlur = 4;
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      }

      // Draw and update nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (!isStatic && !prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;

          // Wrap around edges softly
          if (node.x < -20) node.x = width + 20;
          if (node.x > width + 20) node.x = -20;
          if (node.y < -20) node.y = height + 20;
          if (node.y > height + 20) node.y = -20;

          node.pulsePhase += node.pulseSpeed;
        }

        const pulseGlow = Math.sin(node.pulsePhase) * 0.15 + 0.35;

        // Outer soft halo for gateway nodes
        if (node.isGateway) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(16, 185, 129, ${pulseGlow * 0.25})`;
          ctx.fill();
        }

        // Core node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        if (node.isGateway) {
          ctx.fillStyle = `rgba(52, 211, 153, ${pulseGlow + 0.3})`;
        } else {
          ctx.fillStyle = `rgba(148, 163, 184, ${pulseGlow * 0.75})`;
        }
        ctx.fill();
      }

      ctx.restore();
    };

    const animate = () => {
      drawFrame();
      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    if (!prefersReducedMotion) {
      animate();
    } else {
      drawFrame(true);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', resize);
      if (!isTouchDevice && !prefersReducedMotion) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Background industrial dark gradient */}
      <div className="absolute inset-0 bg-[#070b12]" />

      {/* Subtle telemetry coordinates grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:48px_48px]" />

      {/* Soft ambient radial glow centered behind login card */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_46%,rgba(16,185,129,0.04)_0%,rgba(15,23,42,0)_60%)]" />

      {/* Canvas rendering nodes, links and data pulses */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
    </div>
  );
};
