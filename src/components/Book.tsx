import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronRight, Lock, Unlock } from "lucide-react";
import { audio } from "../utils/audio";

interface BookProps {
  children: React.ReactNode;
  theme: string;
}

export default function Book({ children, theme }: BookProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Play audio on state change
  const handleOpen = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    audio.playPageTurn();
    setIsOpen(true);
    setTimeout(() => setIsAnimating(false), 1200);
  };

  const handleClose = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    audio.playPageTurn();
    setIsOpen(false);
    setTimeout(() => setIsAnimating(false), 1200);
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-center min-h-[640px]">
      {/* 3D Perspective Wrapper */}
      <div 
        className="relative w-full max-w-6xl lg:max-w-[1260px] flex items-center justify-center py-4"
        style={{ perspective: "1800px" }}
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            /* CLOSED LEATHER-BOUND DIARY */
            <motion.div
              key="closed-book"
              initial={{ scale: 0.95, opacity: 0, rotateY: 15 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                rotateY: [15, 10, 15],
                y: [0, -4, 0]
              }}
              exit={{ 
                scale: 1.05, 
                opacity: 0, 
                rotateY: -90,
                transition: { duration: 0.8, ease: "easeInOut" } 
              }}
              transition={{
                rotateY: { repeat: Infinity, duration: 6, ease: "easeInOut" },
                y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                scale: { duration: 0.5 }
              }}
              onClick={handleOpen}
              className="relative w-[280px] sm:w-[360px] md:w-[410px] h-[485px] sm:h-[560px] md:h-[610px] cursor-pointer group select-none"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Outer Shadow */}
              <div className="absolute inset-2 bg-black/85 rounded-r-xl rounded-l-md blur-xl group-hover:blur-2xl transition-all duration-300 transform translate-x-4 translate-y-6" />

              {/* Stacked Paper Edges (Bottom & Right sides) */}
              {/* Right page stack */}
              <div 
                className="absolute right-0 top-3 bottom-3 w-4 bg-[#eadaaf] rounded-r-sm border-y border-stone-800 shadow-md"
                style={{
                  backgroundImage: "repeating-linear-gradient(to bottom, #d2be90 0px, #d2be90 1px, #f4e4bc 2px, #f4e4bc 4px)",
                  transform: "translateZ(-8px) rotateY(90deg)",
                  transformOrigin: "right center"
                }}
              />
              {/* Bottom page stack */}
              <div 
                className="absolute left-3 right-3 bottom-0 h-4 bg-[#eadaaf] rounded-b-sm border-x border-stone-800 shadow-md"
                style={{
                  backgroundImage: "repeating-linear-gradient(to right, #d2be90 0px, #d2be90 1px, #f4e4bc 2px, #f4e4bc 4px)",
                  transform: "translateZ(-8px) rotateX(-90deg)",
                  transformOrigin: "center bottom"
                }}
              />

              {/* Physical Book Cover Back */}
              <div 
                className="absolute inset-0 bg-[#0d0b0a] rounded-r-xl rounded-l-sm border border-stone-900 shadow-inner"
                style={{ transform: "translateZ(-16px)" }}
              />

              {/* FRONT COVER (Leathery with gold leaf details) */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1c1613] via-[#0d0b0a] to-[#070505] rounded-r-xl rounded-l-md border-y border-r border-[#261f1c] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between p-5 sm:p-8 z-10">
                {/* Worn Leather Texture Overlay */}
                <div 
                  className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
                  style={{
                    backgroundImage: "url('https://www.transparenttextures.com/patterns/leather.png')"
                  }}
                />

                {/* Subtle Vignette */}
                <div className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/75 pointer-events-none" />

                {/* Left Spine Ribbed Details */}
                <div className="absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-black/80 via-white/5 to-black/60 border-r border-black/40 flex flex-col justify-around py-12">
                  <div className="h-[2px] w-full bg-black/80 shadow-[0_1px_1px_rgba(255,255,255,0.1)]" />
                  <div className="h-[2px] w-full bg-black/80 shadow-[0_1px_1px_rgba(255,255,255,0.1)]" />
                  <div className="h-[2px] w-full bg-black/80 shadow-[0_1px_1px_rgba(255,255,255,0.1)]" />
                  <div className="h-[2px] w-full bg-black/80 shadow-[0_1px_1px_rgba(255,255,255,0.1)]" />
                  <div className="h-[2px] w-full bg-black/80 shadow-[0_1px_1px_rgba(255,255,255,0.1)]" />
                </div>

                {/* Weathered Metallic Gold Corner Protective Brackets */}
                <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-200 via-yellow-600 to-amber-950 rotate-45 translate-x-8 -translate-y-8 border-b-2 border-amber-400 shadow-md flex items-end justify-center pb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-950/80 mb-2" />
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none overflow-hidden">
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tr from-amber-950 via-yellow-600 to-amber-200 -rotate-45 translate-x-8 translate-y-8 border-t-2 border-amber-400 shadow-md flex items-start justify-center pt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-950/80 mt-2" />
                  </div>
                </div>

                {/* Gold Foil Embossed Seal & Title */}
                <div className="flex flex-col items-center mt-6 sm:mt-12 text-center relative z-20">
                  {/* Slytherin / Riddle Crest */}
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-2 border-amber-500/40 p-1 flex items-center justify-center bg-black/30 backdrop-blur-sm shadow-[0_0_15px_rgba(245,158,11,0.15)] mb-2 sm:mb-4 group-hover:border-amber-400/70 transition-colors">
                    <div className="w-full h-full rounded-full border border-amber-500/30 flex items-center justify-center text-amber-500/80 font-serif text-2xl sm:text-3xl italic font-bold tracking-widest">
                      S
                    </div>
                  </div>
                  <h2 className="text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-amber-500/50 font-mono mb-2">
                    Hogwarts School of Witchcraft
                  </h2>
                  <div className="h-[1px] w-24 sm:w-32 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
                </div>

                {/* Center Embossed Riddle Script */}
                <div className="flex flex-col items-center justify-center flex-1 my-2 sm:my-4 relative z-20">
                  <h1 className="font-serif italic text-2xl sm:text-3xl md:text-4xl text-amber-100/90 tracking-wide select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] filter contrast-125 text-center px-2">
                    Tom Marvolo Riddle
                  </h1>
                  <p className="text-[10px] sm:text-[11px] font-mono tracking-widest text-stone-500 uppercase mt-2 sm:mt-3">
                    His Diary
                  </p>
                </div>

                {/* Antique Lock & Closure Strap */}
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-8 sm:w-10 h-12 sm:h-14 bg-gradient-to-r from-amber-900 to-amber-950 border-y border-r border-amber-700/40 rounded-r-md shadow-md z-20 flex items-center justify-center">
                  <div className="w-5 sm:w-6 h-6 sm:h-8 rounded bg-black/60 border border-amber-600/30 flex items-center justify-center text-amber-400/80 group-hover:text-amber-300">
                    <Lock className="w-3 sm:w-3.5 h-3 sm:h-3.5 animate-pulse" />
                  </div>
                </div>

                {/* Interactive Click Indicator */}
                <div className="flex flex-col items-center relative z-20 mb-2 sm:mb-4 animate-bounce">
                  <span className="text-[9px] sm:text-[10px] tracking-widest uppercase font-mono text-amber-500/70 group-hover:text-amber-400 transition-colors">
                    Touch to Open
                  </span>
                  <ChevronRight className="w-3 sm:w-4 h-3 sm:h-4 text-amber-500/70 group-hover:text-amber-400 rotate-90" />
                </div>

                {/* Footer Vintage detail */}
                <div className="text-[8px] sm:text-[9px] font-mono tracking-widest text-stone-600 text-center relative z-20">
                  EST. 1943 • SEWERED IN SILENCE
                </div>
              </div>
            </motion.div>
          ) : (
            /* OPEN ACTIVE DIARY WRAPPER WITH 3D FLIP COMPLETED */
            <motion.div
              key="open-book"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative w-full max-w-7xl lg:max-w-[1260px]"
            >
              {/* Massive ambient desk shadow */}
              <div className="absolute -inset-4 bg-black/60 rounded-2xl blur-2xl pointer-events-none" />

              {/* Beautiful heavy leather book container framing the pages */}
              <div className="relative bg-[#0d0b0a] rounded-xl border border-stone-800 pt-12 pb-2 px-2 md:p-3 shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden">
                {/* Worn leather texture for background framing */}
                <div 
                  className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                  style={{
                    backgroundImage: "url('https://www.transparenttextures.com/patterns/leather.png')"
                  }}
                />

                {/* Ribbon Bookmarker dangling from spine */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-24 bg-[#7a1818] rounded-b-md shadow-md z-40 pointer-events-none border-b border-black/30" />

                {/* Close Button on the Leather Margin */}
                <button
                  onClick={handleClose}
                  className="absolute top-2.5 right-2 md:top-4 md:right-4 z-40 bg-black/70 hover:bg-black text-amber-400 hover:text-amber-300 border border-amber-500/20 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Unlock className="w-3.5 h-3.5" /> Close Diary
                </button>

                {/* Inner Children Pages (The Journal Component) */}
                <div className="relative rounded-lg overflow-hidden bg-[#faf1db]">
                  {children}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
