import React, { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

export default function QuillCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [angle, setAngle] = useState(-15); // Standard elegant tilt for writing
  const lastMousePos = useRef({ x: 0, y: 0, time: Date.now() });

  // Smooth motion spring values
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 32, stiffness: 650, mass: 0.18 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Hide default cursor in desktop environments when hovering over the window
    const style = document.createElement("style");
    style.innerHTML = `
      @media (hover: hover) and (pointer: fine) {
        body, input, textarea, button, [role="button"], canvas {
          cursor: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      
      if (!isVisible) setIsVisible(true);

      // Dynamically calculate tilt based on speed and direction to make it feel organic
      const now = Date.now();
      const dt = now - lastMousePos.current.time;
      if (dt > 10) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        
        // Only adjust angle if the mouse is actively moving
        const speed = Math.sqrt(dx * dx + dx * dy);
        if (speed > 1.5) {
          // Calculate angle toward motion, clamped nicely
          const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) - 45;
          // Smooth blend toward target angle (weighted heavily towards traditional -15 degree quill resting slant)
          setAngle((prev) => prev + (targetAngle - prev) * 0.12);
        } else {
          // Relax back to cozy writing slant
          setAngle((prev) => prev + (-15 - prev) * 0.08);
        }

        lastMousePos.current = { x: e.clientX, y: e.clientY, time: now };
      }
    };

    const handleMouseDown = () => setIsDrawing(true);
    const handleMouseUp = () => setIsDrawing(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      document.head.removeChild(style);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [mouseX, mouseY, isVisible]);

  // Touch screen devices check: disable custom cursor on touch inputs to avoid laggy/broken touch targets
  const [isTouch, setIsTouch] = useState(true);
  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(window.matchMedia("(hover: none)").matches || navigator.maxTouchPoints > 0);
    };
    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  if (isTouch || !isVisible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] origin-top-left"
      style={{
        x: cursorX,
        y: cursorY,
        rotate: angle,
        translateX: "-16px", // Aligns writing tip center exactly with mouse cursor
        translateY: "-2px",  // Aligns tip top exactly with mouse cursor
        transformOrigin: "16px 2px" // Rotate around the very tip of the quill
      }}
    >
      <div className="relative">
        {/* Real-time contact shadow for realistic touch on paper */}
        <div 
          className="absolute bg-black/40 rounded-full blur-[2.5px] transition-all duration-150"
          style={{
            width: "6px",
            height: "10px",
            left: isDrawing ? "14px" : "15px",
            top: isDrawing ? "2px" : "4px",
            transform: "rotate(25deg) scale(" + (isDrawing ? 0.6 : 1) + ")",
            opacity: isDrawing ? 0.85 : 0.45
          }}
        />

        {/* Hand-Carved Goose Feather Quill Vector Graphic */}
        <svg
          width="36"
          height="80"
          viewBox="0 0 36 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-100"
          style={{
            transform: isDrawing ? "scale(0.92) translate(0.5px, 0.5px)" : "scale(1)",
          }}
        >
          {/* Magical glowing ink aura at the writing tip */}
          <circle
            cx="18"
            cy="2"
            r={isDrawing ? "5" : "1.8"}
            fill="#059669"
            opacity={isDrawing ? "0.75" : "0.3"}
            className={isDrawing ? "animate-pulse" : ""}
          />
          {isDrawing && (
            <circle
              cx="18"
              cy="2"
              r="8"
              stroke="#10b981"
              strokeWidth="0.5"
              fill="none"
              opacity="0.4"
              className="animate-ping"
            />
          )}

          {/* Central Quill Rachis (Stem) */}
          <path
            d="M18 4 Q22 35 27 75"
            stroke="url(#quillShaftGradient)"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Calamus Hollow Tip (Writing Tip) */}
          <path
            d="M18 2 L14 14 C14 17 16 20 18 20 C20 20 22 17 22 14 L18 2 Z"
            fill="url(#calamusGradient)"
            stroke="#111827"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />

          {/* Gothic Ornate Silver Filigree Sleeve around Quill Base */}
          <path
            d="M14.5 13 C14.5 13 16 11 18 11 C20 11 21.5 13 21.5 13 L21 21 C21 21 19.5 22.5 18 22.5 C16.5 22.5 15 21 C15 21 L14.5 13 Z"
            fill="url(#silverGothicGradient)"
            stroke="#4b5563"
            strokeWidth="0.5"
          />
          
          {/* Emerald Core Gem embedded in the Silver Sleeve */}
          <rect
            x="17"
            y="15"
            width="2"
            height="3.5"
            rx="0.5"
            fill="url(#emeraldGemGradient)"
            stroke="#064e3b"
            strokeWidth="0.3"
            className="animate-pulse"
          />

          {/* Nib Cut and Slit */}
          <line
            x1="18"
            y1="2"
            x2="18"
            y2="12"
            stroke="#111827"
            strokeWidth="0.5"
            strokeLinecap="round"
          />

          {/* Fluffy Left Vane / Plume with soft shading */}
          <path
            d="M18 18 C10 26 4 38 5 50 C5.5 56 8.5 62 13 67 C16.5 69 21 71 23 72 L21 61 C17 55 15 46 16 38 C16.5 31 18 24 19 20 Z"
            fill="url(#featherGradientLeft)"
            opacity="0.95"
          />

          {/* Fluffy Right Vane / Plume */}
          <path
            d="M18 18 C24 24 29 33 30 44 C31 53 29 61 23 69 L24 72 C28 64 30 55 28 45 C26 35 21 26 19 20 Z"
            fill="url(#featherGradientRight)"
            opacity="0.95"
          />

          {/* High-quality decorative quill slots to simulate physical feathers */}
          <path d="M13 32 L7 28" stroke="#000000" strokeWidth="0.5" opacity="0.4" />
          <path d="M12 46 L5 41" stroke="#000000" strokeWidth="0.5" opacity="0.4" />
          <path d="M15 55 L8 51" stroke="#000000" strokeWidth="0.5" opacity="0.4" />
          <path d="M22 30 L27 26" stroke="#000000" strokeWidth="0.5" opacity="0.4" />
          <path d="M24 41 L29 37" stroke="#000000" strokeWidth="0.5" opacity="0.4" />
          <path d="M25 52 L30 47" stroke="#000000" strokeWidth="0.5" opacity="0.4" />

          {/* Silver Filigree Overlay details on Feather */}
          <path
            d="M18 25 Q13 38 10 52"
            stroke="url(#silverGothicGradient)"
            strokeWidth="0.4"
            opacity="0.35"
            fill="none"
          />
          <path
            d="M18 35 Q23 48 26 62"
            stroke="url(#silverGothicGradient)"
            strokeWidth="0.4"
            opacity="0.35"
            fill="none"
          />

          {/* 3D Realism Glare Highlight on Shaft */}
          <path
            d="M17.5 3 Q21 33 25.5 68"
            stroke="#ffffff"
            strokeWidth="0.4"
            strokeLinecap="round"
            opacity="0.25"
            fill="none"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="calamusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#f5e6b3" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#d9b64e" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="silverGothicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f3f4f6" />
              <stop offset="35%" stopColor="#d1d5db" />
              <stop offset="70%" stopColor="#6b7280" />
              <stop offset="100%" stopColor="#1f2937" />
            </linearGradient>
            <linearGradient id="emeraldGemGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
            <linearGradient id="quillShaftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#cfd4dc" />
              <stop offset="100%" stopColor="#4b5563" />
            </linearGradient>
            <linearGradient id="featherGradientLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#090d16" />
              <stop offset="30%" stopColor="#12241d" />
              <stop offset="65%" stopColor="#1e3a2f" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <linearGradient id="featherGradientRight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#030712" />
              <stop offset="30%" stopColor="#061c14" />
              <stop offset="65%" stopColor="#062f22" />
              <stop offset="100%" stopColor="#011812" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </motion.div>
  );
}
