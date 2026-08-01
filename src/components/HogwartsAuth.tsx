import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Sparkles, Wand, User, AlertCircle, GraduationCap } from "lucide-react";
import { audio } from "../utils/audio";

interface HogwartsAuthProps {
  onAuthSuccess: (user: any, profile: any) => void;
}

export default function HogwartsAuth({ onAuthSuccess }: HogwartsAuthProps) {
  // Sorting ceremony state is triggered for first-time sign-ins
  const [isSortingCeremony, setIsSortingCeremony] = useState(false);
  const [sortingUser, setSortingUser] = useState<any>(null);

  // Profile data collected during sorting
  const [name, setName] = useState("");
  const [house, setHouse] = useState<"Gryffindor" | "Slytherin" | "Ravenclaw" | "Hufflepuff">("Gryffindor");
  const [wand, setWand] = useState("Phoenix Feather, Holly, 11 inches");
  const [bloodStatus, setBloodStatus] = useState<"Pure-blood" | "Half-blood" | "Muggle-born" | "Unknown">("Half-blood");
  const [year, setYear] = useState("Fifth Year");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const houses = [
    {
      name: "Gryffindor" as const,
      color: "from-red-900 to-amber-700",
      textColor: "text-amber-400",
      borderColor: "border-amber-600/50",
      crest: "🦁",
      motto: "Bravery & Courage"
    },
    {
      name: "Slytherin" as const,
      color: "from-emerald-950 to-teal-800",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-600/50",
      crest: "🐍",
      motto: "Ambition & Cunning"
    },
    {
      name: "Ravenclaw" as const,
      color: "from-blue-950 to-indigo-800",
      textColor: "text-blue-300",
      borderColor: "border-blue-600/50",
      crest: "🦅",
      motto: "Wit & Wisdom"
    },
    {
      name: "Hufflepuff" as const,
      color: "from-amber-950 to-yellow-700",
      textColor: "text-yellow-400",
      borderColor: "border-yellow-600/50",
      crest: "🦡",
      motto: "Loyalty & Patience"
    }
  ];

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    audio.playQuillScratch(200);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user has an existing Hogwarts profile in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const profilePayload = userDoc.data();
        onAuthSuccess(user, profilePayload);
        audio.playChime();
      } else {
        // First-time wizard! Trigger sorting ceremony step to gather profile information
        setName(user.displayName || "Unknown Wizard");
        setSortingUser(user);
        setIsSortingCeremony(true);
        audio.playPageTurn();
      }
    } catch (err: any) {
      console.error("Google Auth Failure:", err);
      let errMsg = err.message || "An ancient spell blocked your entry.";
      if (err.code === "auth/popup-blocked") {
        errMsg = "The Floo Network portal popup was blocked by your browser. Please allow popups to enter Hogwarts.";
      } else if (err.code === "auth/popup-closed-by-user") {
        errMsg = "You closed the portal before completing your authentication.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSorting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sortingUser) return;

    setLoading(true);
    setError("");
    audio.playQuillScratch(400);

    try {
      if (!name.trim()) {
        throw new Error("You must scribe your name in the Hogwarts register.");
      }

      const profilePayload = {
        uid: sortingUser.uid,
        name,
        house,
        wand,
        bloodStatus,
        year,
        createdAt: Date.now()
      };

      await setDoc(doc(db, "users", sortingUser.uid), profilePayload);
      onAuthSuccess(sortingUser, profilePayload);
      audio.playChime();
    } catch (err: any) {
      console.error("Sorting Registry Failure:", err);
      setError(err.message || "Failed to register your wizarding profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-30 flex flex-col items-center">
      <AnimatePresence mode="wait">
        {isSortingCeremony ? (
          /* VINTAGE WOODEN/PARCHMENT CARD FOR SORTING CEREMONY */
          <motion.div
            key="sorting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-[#1a120c] border-[4px] border-[#3e2c1c] rounded-xl p-6 md:p-8 shadow-2xl shadow-black/95 w-full font-serif"
          >
            {/* Corner Brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-amber-800/60 pointer-events-none" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-amber-800/60 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-amber-800/60 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-amber-800/60 pointer-events-none" />

            <div className="flex flex-col items-center text-center pb-4 mb-5 border-b border-amber-900/20">
              <div className="relative mb-3 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-amber-800/40 flex items-center justify-center bg-amber-950/40 shadow-inner">
                  <span className="text-3xl animate-pulse">🎩</span>
                </div>
                <div className="absolute -inset-1.5 rounded-full border border-dashed border-amber-700/30 animate-spin" style={{ animationDuration: "35s" }} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-[0.2em] text-amber-100 uppercase">
                Sorting Hat
              </h2>
              <p className="text-[10px] font-mono tracking-[0.25em] text-stone-500 uppercase mt-1">
                The hat prepares to designate your house
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-5 p-3 bg-red-950/40 border border-red-900/50 rounded flex items-start gap-2.5 text-xs text-red-200 leading-relaxed italic shadow-inner">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCompleteSorting} className="space-y-4 text-stone-300">
              <div className="p-3.5 bg-amber-950/30 border border-amber-900/20 rounded-md text-xs italic text-amber-100/80 leading-relaxed text-center">
                "Ah, I see courage, intellect, loyalty, and ambition all nestled inside your mind... Scribe your official scroll details to complete your sorting!"
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-stone-400 block">
                  Your Wizarding Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Harry Potter"
                    className="w-full bg-stone-950/80 border border-amber-900/20 focus:border-amber-700 rounded p-2 pl-9 text-sm focus:outline-none focus:ring-1 focus:ring-amber-800 text-stone-100 font-serif"
                  />
                </div>
              </div>

              {/* House Selection */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono tracking-widest text-stone-400 block">
                  Select Your Hogwarts House
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {houses.map((h) => (
                    <button
                      key={h.name}
                      type="button"
                      onClick={() => {
                        setHouse(h.name);
                        audio.playPageTurn();
                      }}
                      className={`p-2 rounded border flex flex-col items-center justify-center transition-all ${
                        house === h.name 
                          ? `bg-gradient-to-br ${h.color} ${h.borderColor} text-white shadow-md scale-105` 
                          : "bg-stone-950/50 border-stone-850 text-stone-400 hover:text-stone-200 hover:border-stone-700"
                      }`}
                      title={h.motto}
                    >
                      <span className="text-xl mb-1">{h.crest}</span>
                      <span className="text-[8px] uppercase tracking-wider font-mono font-bold">{h.name}</span>
                    </button>
                  ))}
                </div>
                <div className="text-[9px] italic font-serif text-amber-800 text-center mt-1">
                  House Traits: {houses.find(h => h.name === house)?.motto}
                </div>
              </div>

              {/* Wand, Blood Status, and Year */}
              <div className="space-y-3 pt-2 border-t border-amber-900/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-stone-400 block">
                      Wand Core & Wood
                    </label>
                    <div className="relative">
                      <Wand className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                      <input
                        type="text"
                        value={wand}
                        onChange={(e) => setWand(e.target.value)}
                        className="w-full bg-stone-950/80 border border-amber-900/20 focus:border-amber-700 rounded p-2 pl-9 text-xs focus:outline-none focus:ring-1 focus:ring-amber-800 text-stone-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-stone-400 block">
                      Blood Status
                    </label>
                    <select
                      value={bloodStatus}
                      onChange={(e: any) => setBloodStatus(e.target.value)}
                      className="w-full bg-stone-950/80 border border-amber-900/20 focus:border-amber-700 rounded p-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-800 text-stone-100 font-serif"
                    >
                      <option value="Half-blood">Half-blood</option>
                      <option value="Pure-blood">Pure-blood</option>
                      <option value="Muggle-born">Muggle-born</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-stone-400 block">
                    Hogwarts Academic Year
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-2.5 w-4 h-4 text-stone-500" />
                    <select
                      value={year}
                      onChange={(e: any) => setYear(e.target.value)}
                      className="w-full bg-stone-950/80 border border-amber-900/20 focus:border-amber-700 rounded p-2 pl-9 text-xs focus:outline-none focus:ring-1 focus:ring-amber-800 text-stone-100 font-serif"
                    >
                      <option value="First Year">First Year</option>
                      <option value="Second Year">Second Year</option>
                      <option value="Third Year">Third Year</option>
                      <option value="Fourth Year">Fourth Year</option>
                      <option value="Fifth Year">Fifth Year (Standard)</option>
                      <option value="Sixth Year">Sixth Year</option>
                      <option value="Seventh Year">Seventh Year</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-4 bg-amber-950 text-amber-100 hover:bg-amber-900 border border-amber-800/40 rounded transition-all duration-200 text-xs font-mono tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg shadow-black/80 disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-amber-100 border-t-transparent rounded-full animate-spin" />
                    Scribing Registry...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    Enter Hogwarts Great Hall
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          /* IMMERSIVE FLOATING SUNSET LOGIN INTERFACE WITH SPECTACULAR CINEMATIC ANIMATIONS */
          <motion.div
            key="login-portal"
            initial={{ opacity: 0, scale: 0.94, y: 35 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -25 }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col items-center"
          >
            {/* Title Block matching the screenshot precisely with stagger and blur effects */}
            <div className="text-center mb-8 z-10 select-none">
              <motion.span
                initial={{ opacity: 0, letterSpacing: "0.15em", y: -5 }}
                animate={{ opacity: 0.9, letterSpacing: "0.25em", y: 0 }}
                transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                className="text-stone-300 font-serif text-sm tracking-[0.25em] md:text-base opacity-90 block uppercase font-light"
              >
                Do you wish to enter the
              </motion.span>
              <motion.h1 
                initial={{ opacity: 0, filter: "blur(12px)", scale: 0.9 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
                transition={{ duration: 2.2, delay: 0.5, ease: "easeOut" }}
                className="text-4xl sm:text-5xl md:text-[3.25rem] font-medium leading-none tracking-wide text-[#f3c83b] font-['Pirata_One',_cursive] filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] mt-2"
                style={{ textShadow: "0 0 15px rgba(243, 200, 59, 0.35)" }}
              >
                Chamber of Secrets
              </motion.h1>
            </div>
 
            {/* Error message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[320px] mb-4 p-2.5 bg-red-950/60 border border-red-800/40 rounded text-center text-xs text-red-200 leading-relaxed font-serif italic shadow-md"
              >
                {error}
              </motion.div>
            )}
 
            {/* Main CTA: Immersive Google login styled as a beautiful magic crest button */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.4, delay: 0.9, ease: "easeOut" }}
              className="w-full max-w-[320px] flex flex-col items-center mt-2"
            >
              <motion.button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                whileHover={{ 
                  scale: 1.04, 
                  boxShadow: "0 0 25px rgba(217, 119, 6, 0.45)",
                  borderColor: "#f3c83b",
                }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 bg-[#d97706] hover:bg-[#cf6d14] text-white font-serif rounded-lg transition-all duration-300 text-sm font-semibold shadow-2xl shadow-black/90 disabled:opacity-50 border border-[#f3c83b]/30 flex items-center justify-center gap-2.5 uppercase tracking-widest relative overflow-hidden group"
              >
                {/* Beautiful custom glossy shine sweep that runs infinitely */}
                <motion.div
                  animate={{
                    x: ["-150%", "250%"],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3.5,
                    ease: "linear",
                    delay: 2.0,
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none -skew-x-12"
                />

                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="tracking-widest">Unlocking Gate...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200 group-hover:animate-spin" />
                    <span>Enter via Google Portal</span>
                  </>
                )}
              </motion.button>
              
              <p className="text-[10px] text-stone-400 font-mono tracking-wider text-center mt-5 uppercase max-w-[280px] leading-relaxed opacity-80 select-none">
                Authenticates via the secure Floo Network to protect your sacred journal entries.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
