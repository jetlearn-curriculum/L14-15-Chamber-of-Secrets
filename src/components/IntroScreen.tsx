import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audio } from "../utils/audio";
import { Sparkles, PenTool, Flame, ChevronRight, ChevronLeft } from "lucide-react";

interface IntroScreenProps {
  onComplete: () => void;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [step, setStep] = useState(0);
  const [hasStartedAudio, setHasStartedAudio] = useState(false);

  // Auto progression - slowed down significantly for drama (11 seconds per slide)
  useEffect(() => {
    if (step > 0 && step < 3) {
      const timer = setTimeout(() => {
        // Play scratch sound to mimic ink being written
        if (hasStartedAudio) {
          audio.playQuillScratch(300);
        }
        setStep((prev) => prev + 1);
      }, 11000); // Slower, highly dramatic pace
      return () => clearTimeout(timer);
    }
  }, [step, hasStartedAudio]);

  const handleStart = () => {
    audio.init();
    audio.playPageTurn();
    setHasStartedAudio(true);
    setStep(1);
  };

  const handleSkip = () => {
    audio.init();
    audio.playPageTurn();
    onComplete();
  };

  const handleNext = () => {
    if (step < 3) {
      audio.playPageTurn();
      if (hasStartedAudio) {
        audio.playQuillScratch(200);
      }
      setStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      audio.playPageTurn();
      setStep((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#040302] flex flex-col items-center justify-center z-50 overflow-hidden font-serif">
      {/* Cinematic Ambient Candlelight Aura with breathing scale animation */}
      <motion.div 
        animate={{
          scale: [1, 1.08, 0.96, 1.03, 1],
          opacity: [0.85, 1.0, 0.8, 0.95, 0.85]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle 700px at center, rgba(217, 119, 6, 0.09) 0%, rgba(120, 53, 4, 0.03) 55%, transparent 100%)`,
        }}
      />
      
      {/* Tiny Ember particles drifting up with varying speed and horizontal drift */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: `${10 + Math.random() * 80}%`, 
              y: "110vh", 
              opacity: 0, 
              scale: 0.5 + Math.random() * 0.8 
            }}
            animate={{
              y: "-10vh",
              opacity: [0, 0.7, 0.7, 0],
              x: [
                `calc(${15 + Math.random() * 70}% - 20px)`,
                `calc(${15 + Math.random() * 70}% + 20px)`
              ]
            }}
            transition={{
              duration: 12 + Math.random() * 8,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: "easeInOut"
            }}
            className="absolute w-1 h-1 bg-amber-500 rounded-full blur-[0.8px]"
          />
        ))}
      </div>

      <div className="w-full max-w-2xl px-6 text-center z-10 flex flex-col items-center justify-between min-h-[420px]">
        
        {/* Progress indicators with beautiful glowing slide count */}
        <div className="flex items-center gap-2.5 mb-6 select-none">
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              onClick={() => {
                if (hasStartedAudio || idx === 0) {
                  audio.playPageTurn();
                  setStep(idx);
                }
              }}
              disabled={!hasStartedAudio && idx > 0}
              className="focus:outline-none py-2 px-1 relative group cursor-pointer disabled:cursor-not-allowed"
            >
              <motion.div
                animate={{
                  width: idx === step ? 30 : 8,
                  backgroundColor: idx === step ? "#d97706" : "#44403c",
                  boxShadow: idx === step ? "0 0 12px rgba(217,119,6,0.6)" : "none"
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="h-1.5 rounded-full"
              />
            </button>
          ))}
        </div>

        <div className="flex-1 w-full flex flex-col justify-center items-center relative">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, filter: "blur(20px)", scale: 1.05 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                exit={{ opacity: 0, filter: "blur(15px)", scale: 0.95 }}
                transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-6">
                    <motion.div 
                      animate={{
                        boxShadow: ["0 0 15px rgba(217,119,6,0.1)", "0 0 30px rgba(217,119,6,0.3)", "0 0 15px rgba(217,119,6,0.1)"]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-full border border-amber-800/20 flex items-center justify-center bg-amber-950/25"
                    >
                      <Flame className="w-10 h-10 text-amber-600 animate-pulse" />
                    </motion.div>
                    <span className="absolute -inset-2 rounded-full border border-dashed border-amber-800/20 animate-spin" style={{ animationDuration: "30s" }} />
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold tracking-[0.25em] text-stone-200 uppercase font-serif drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                    Tom Riddle's Diary
                  </h2>
                  <p className="text-[10px] font-mono tracking-[0.35em] uppercase text-stone-500 mt-2.5">
                    A Memory Preserved in Ink (1943)
                  </p>
                </div>

                <p className="text-stone-400 text-sm md:text-base leading-relaxed max-w-md italic mx-auto">
                  "You are holding a memory, bound to parchment fifty years ago. Light your candle, set your ink, and step into the past..."
                </p>

                <div className="pt-6">
                  <motion.button
                    onClick={handleStart}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(217,119,6,0.25)", borderColor: "#d97706" }}
                    whileTap={{ scale: 0.97 }}
                    className="group px-7 py-3 bg-amber-950/50 hover:bg-amber-900/40 border border-amber-900/40 text-amber-100 rounded-md transition-all duration-300 text-xs tracking-[0.2em] font-mono uppercase flex items-center gap-2 shadow-lg shadow-black/60"
                  >
                    <PenTool className="w-4 h-4 text-amber-600 group-hover:text-amber-400 transition-colors" />
                    Begin the Communion
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, filter: "blur(20px)", scale: 1.08 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                exit={{ opacity: 0, filter: "blur(15px)", scale: 0.92 }}
                transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 w-full"
              >
                <motion.h3 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="text-stone-400 text-xs md:text-sm font-mono tracking-[0.3em] uppercase"
                >
                  Hogwarts School of Witchcraft & Wizardry
                </motion.h3>
                <div className="py-8 relative">
                  {/* Subtle ink splash background */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <div className="w-48 h-48 rounded-full bg-stone-500 blur-3xl" />
                  </div>
                  
                  <motion.h1 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 2.5, delay: 1.0, ease: "easeOut" }}
                    className="font-serif italic text-5xl md:text-6xl text-[#f3c83b] tracking-wider font-light drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                    style={{ fontFamily: "'Dancing Script', cursive, serif" }}
                  >
                    T. M. Riddle
                  </motion.h1>
                  
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.4, y: 0 }}
                    transition={{ duration: 1.5, delay: 1.8 }}
                    className="text-[10px] font-mono tracking-[0.25em] uppercase text-stone-500 mt-4"
                  >
                    Purchased at Vauxhall Road • London
                  </motion.p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, filter: "blur(20px)", y: 25 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                exit={{ opacity: 0, filter: "blur(15px)", y: -25 }}
                transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 max-w-lg"
              >
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.8, delay: 0.3 }}
                  className="text-stone-200 text-base md:text-lg leading-relaxed italic drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]"
                >
                  "This shabby black notebook was bought from a Muggle newsagent fifty years ago."
                </motion.p>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 2.0, delay: 2.5 }}
                  className="text-stone-500 text-xs md:text-sm leading-relaxed italic border-t border-stone-900/60 pt-4 max-w-md mx-auto"
                >
                  Though its pages appear entirely empty, it holds a living reflection of Tom Riddle's sixteen-year-old soul.
                </motion.p>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, filter: "blur(20px)", scale: 0.96 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                exit={{ opacity: 0, filter: "blur(15px)", scale: 0.9 }}
                transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 max-w-lg"
              >
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                  className="text-stone-300 text-sm md:text-base leading-relaxed italic"
                >
                  Scribe upon its parchment using your keyboard or selection of the magical <strong className="text-amber-500 font-mono">Emerald Quill</strong>.
                </motion.p>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.8, delay: 2.0 }}
                  className="text-stone-400 text-xs md:text-sm leading-relaxed italic"
                >
                  As you share your thoughts, your ink will sink deep into the paper, and Tom Riddle's memory will write back... in elegant golden letters.
                </motion.p>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.5, delay: 3.8 }}
                  className="pt-6"
                >
                  <motion.button
                    onClick={onComplete}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(243,200,59,0.3)", borderColor: "#f3c83b" }}
                    whileTap={{ scale: 0.97 }}
                    className="group px-8 py-3 bg-amber-950 text-amber-100 hover:bg-amber-900 border border-amber-800/40 rounded-md transition-all duration-300 text-xs tracking-[0.25em] font-mono uppercase flex items-center gap-2 shadow-xl shadow-black/80"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 group-hover:animate-spin" />
                    Open the Diary
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step-by-Step Manual Navigation Panel for cinematic ease of use */}
        {step > 0 && (
          <div className="flex items-center justify-between w-full max-w-xs mt-6 select-none">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              whileHover={{ opacity: 1, scale: 1.05 }}
              onClick={handlePrev}
              className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-stone-400 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </motion.button>

            {step < 3 ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                whileHover={{ opacity: 1, scale: 1.05, textShadow: "0 0 8px rgba(217,119,6,0.5)" }}
                onClick={handleNext}
                className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-500 cursor-pointer"
              >
                Proceed
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            ) : (
              <div className="w-10" />
            )}
          </div>
        )}

        {/* Skip controls */}
        {step > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            whileHover={{ opacity: 0.9 }}
            className="mt-6 select-none"
          >
            <button
              onClick={handleSkip}
              className="text-[10px] font-mono uppercase tracking-[0.25em] text-stone-500 hover:text-amber-200 transition-colors cursor-pointer"
            >
              Skip Introduction &gt;
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
