import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, Sparkles, Sun, Moon, Info, Shield, Compass, BookOpen, LogOut, ShieldCheck, HelpCircle, Flame } from "lucide-react";
import { DiaryEntry, LoreScroll, MagicalTheme, THEME_CONFIGS } from "../types";
import { audio } from "../utils/audio";
import Journal from "./Journal";
import Book from "./Book";
import IntroScreen from "./IntroScreen";
import HogwartsAuth from "./HogwartsAuth";
import { useAmbientAudio } from "../hooks/useAmbientAudio";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const hogwartsSunset = new URL("../assets/images/hogwarts_sunset_login_1783855538166.jpg", import.meta.url).href;

export default function Desk() {
  const [theme, setTheme] = useState<MagicalTheme>("candlelight");
  const config = THEME_CONFIGS[theme];
  const [showIntroScreen, setShowIntroScreen] = useState(true);

  // Ambiance Hook (Looping fireplace crackles + library echoes via Web Audio API)
  const {
    ambientMuted,
    setAmbientMuted,
    rainOn,
    setRainOn,
    rainVol,
    setRainVol,
    fireOn,
    setFireOn,
    fireVol,
    setFireVol,
    libraryOn,
    setLibraryOn,
    libraryVol,
    setLibraryVol,
    themeOn,
    setThemeOn,
    themeVol,
    setThemeVol,
  } = useAmbientAudio();

  const [showAmbientMenu, setShowAmbientMenu] = useState(false);
  const [showMusicMenu, setShowMusicMenu] = useState(false);

  const ambientMenuRef = useRef<HTMLDivElement>(null);
  const musicMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        ambientMenuRef.current &&
        !ambientMenuRef.current.contains(event.target as Node)
      ) {
        setShowAmbientMenu(false);
      }
      if (
        musicMenuRef.current &&
        !musicMenuRef.current.contains(event.target as Node)
      ) {
        setShowMusicMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const [candleOn, setCandleOn] = useState(true);

  // Firebase Auth & User Profile State
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Diary Data
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loreScrolls, setLoreScrolls] = useState<LoreScroll[]>([]);
  const [trackedSecrets, setTrackedSecrets] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"write" | "lore" | "profile">("write");

  // Load theme from local storage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("magical_diary_theme");
      if (savedTheme) setTheme(savedTheme as MagicalTheme);
    } catch (e) {
      console.error("Failed to load local theme:", e);
    }
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else {
            setUserProfile({
              uid: currentUser.uid,
              name: currentUser.email?.split("@")[0] || "Unknown Wizard",
              house: "None",
              wand: "Unknown Wand",
              bloodStatus: "Unknown",
              year: "Fifth Year",
            });
          }
        } catch (e) {
          console.error("Error fetching user profile:", e);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setEntries([]);
        setLoreScrolls([]);
        setTrackedSecrets([]);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time Firestore subscriptions for active authenticated user
  useEffect(() => {
    if (!user) return;

    // Listen to user-specific entries (sorted client-side to avoid index-creation requirements)
    const entriesQuery = query(
      collection(db, "entries"),
      where("userId", "==", user.uid)
    );
    const unsubscribeEntries = onSnapshot(entriesQuery, (snapshot) => {
      const loadedEntries: DiaryEntry[] = [];
      snapshot.forEach((doc) => {
        loadedEntries.push(doc.data() as DiaryEntry);
      });
      loadedEntries.sort((a, b) => b.timestamp - a.timestamp);
      setEntries(loadedEntries);
    }, (err) => {
      console.error("Entries snapshot error:", err);
    });

    // Listen to user-specific unlocked lore Scrolls
    const loreQuery = query(
      collection(db, "loreScrolls"),
      where("userId", "==", user.uid)
    );
    const unsubscribeLore = onSnapshot(loreQuery, (snapshot) => {
      const loadedLore: LoreScroll[] = [];
      snapshot.forEach((doc) => {
        loadedLore.push(doc.data() as LoreScroll);
      });
      loadedLore.sort((a, b) => a.entryCount - b.entryCount);
      setLoreScrolls(loadedLore);
    }, (err) => {
      console.error("Lore snapshot error:", err);
    });

    // Listen to user-specific tracked secrets
    const secretsQuery = query(
      collection(db, "trackedSecrets"),
      where("userId", "==", user.uid)
    );
    const unsubscribeSecrets = onSnapshot(secretsQuery, (snapshot) => {
      const loadedSecrets: { text: string; timestamp: number }[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        loadedSecrets.push({ text: data.text, timestamp: data.timestamp || 0 });
      });
      loadedSecrets.sort((a, b) => b.timestamp - a.timestamp);
      setTrackedSecrets(loadedSecrets.map(s => s.text));
    }, (err) => {
      console.error("Secrets snapshot error:", err);
    });

    return () => {
      unsubscribeEntries();
      unsubscribeLore();
      unsubscribeSecrets();
    };
  }, [user]);

  const handleTrackSecret = async (secretText: string) => {
    if (!user || !secretText.trim()) return;
    try {
      if (trackedSecrets.includes(secretText)) return;
      const secretRef = doc(collection(db, "trackedSecrets"));
      await setDoc(secretRef, {
        text: secretText,
        userId: user.uid,
        id: secretRef.id,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Failed to track secret:", err);
    }
  };

  const handleAddEntry = async (newEntry: DiaryEntry) => {
    if (!user) return;
    try {
      const entryRef = doc(collection(db, "entries"));
      await setDoc(entryRef, {
        ...newEntry,
        userId: user.uid,
        id: entryRef.id,
      });

      // Auto detect secret
      const secretKeywords = [
        "secret", "hide", "ashamed", "confess", "afraid", "truth", "private", "murder", "stole", "fear", "hate", "lied", "regret", "guilt", "shame", "sorrow", "lonely", "darkness", "forbidden", "power", "chamber", "slytherin", "voldemort", "death", "kill", "blood"
      ];
      const normalizedText = newEntry.text.toLowerCase();
      const isKeywordSecret = secretKeywords.some(keyword => normalizedText.includes(keyword));
      const isReflectionSecret = ["Secret", "Sorrow", "Loneliness", "Power", "Corruption", "Devotion", "Ambition", "Suspicion"].includes(newEntry.reflection);

      if (isKeywordSecret || isReflectionSecret) {
        await handleTrackSecret(newEntry.text);
      }
    } catch (err) {
      console.error("Failed to add entry:", err);
    }
  };

  const handleAddLore = async (newLore: LoreScroll) => {
    if (!user) return;
    try {
      const loreRef = doc(collection(db, "loreScrolls"));
      await setDoc(loreRef, {
        ...newLore,
        userId: user.uid,
        id: loreRef.id,
      });
    } catch (err) {
      console.error("Failed to add lore scroll:", err);
    }
  };

  const handleThemeChange = (newTheme: MagicalTheme) => {
    setTheme(newTheme);
    localStorage.setItem("magical_diary_theme", newTheme);
    audio.playChime();
  };

  // Candle toggle handler
  const handleCandleClick = () => {
    if (candleOn) {
      audio.playCandleBlow();
      setCandleOn(false);
    } else {
      audio.playChime();
      setCandleOn(true);
    }
  };

  const handleLogout = async () => {
    audio.playPageTurn();
    setShowIntroScreen(true);
    await signOut(auth);
  };

  if (loadingAuth) {
    return (
      <div className="fixed inset-0 w-full h-full bg-[#060403] flex flex-col items-center justify-center z-50 font-serif">
        <div className="relative flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-2 border-dashed border-amber-600 animate-spin mb-4" />
          <h2 className="text-sm tracking-[0.2em] text-stone-400 uppercase font-mono">Consulting Hogwarts Registry...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className="min-h-screen w-full relative flex flex-col items-center justify-center p-4 md:p-8 transition-all duration-1000 overflow-x-hidden bg-black"
      >
        {/* Immersive generated Hogwarts Sunset background image with majestic continuous slow-zoom pan */}
        <motion.img
          src={hogwartsSunset}
          alt="Hogwarts Sunset"
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{
            scale: [1.15, 1.0, 1.05],
            opacity: 0.9,
          }}
          transition={{
            scale: {
              duration: 35,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
            },
            opacity: {
              duration: 2.5,
              ease: "easeOut",
            }
          }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          referrerPolicy="no-referrer"
        />
        
        {/* Moody gradient vignette overlay to match picture with beautiful pulsing entry */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.0 }}
          className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/60 pointer-events-none" 
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.5 }}
          className="absolute inset-0 bg-radial-gradient(circle at center, transparent 20%, rgba(0, 0, 0, 0.95) 100%) pointer-events-none" 
        />
        <div className="absolute inset-0 desk-dots opacity-10 pointer-events-none" />
        
        {/* Slow drifting magical amber spark particles across the portal */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: `${10 + Math.random() * 80}%`,
                y: "110%",
                opacity: 0,
                scale: 0.5 + Math.random() * 0.8,
              }}
              animate={{
                y: "-10%",
                opacity: [0, 0.65, 0.65, 0],
                x: [
                  "calc(" + (15 + Math.random() * 70) + "% - 30px)",
                  "calc(" + (15 + Math.random() * 70) + "% + 30px)"
                ]
              }}
              transition={{
                duration: 14 + Math.random() * 12,
                repeat: Infinity,
                delay: Math.random() * 10,
                ease: "linear",
              }}
              className="absolute w-1.5 h-1.5 bg-amber-400/60 rounded-full blur-[0.5px]"
            />
          ))}
        </div>

        {/* Floating candles background styling or lights */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-55 z-10 animate-pulse" style={{ animationDuration: "6s" }}>
          <div className="absolute w-1.5 h-1.5 bg-amber-400 rounded-full blur-[1px] animate-pulse top-[20%] left-[15%]" style={{ animationDuration: "3s" }} />
          <div className="absolute w-2 h-2 bg-amber-300 rounded-full blur-[1.5px] animate-pulse top-[40%] right-[10%]" style={{ animationDuration: "5s" }} />
          <div className="absolute w-1.5 h-1.5 bg-amber-500 rounded-full blur-[0.5px] animate-pulse bottom-[30%] left-[45%]" style={{ animationDuration: "4s" }} />
        </div>

        <HogwartsAuth onAuthSuccess={(u, p) => {
          setUser(u);
          setUserProfile(p);
        }} />
      </div>
    );
  }

  if (showIntroScreen) {
    return <IntroScreen onComplete={() => setShowIntroScreen(false)} />;
  }

  return (
    <div
      className={`min-h-screen w-full relative flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 transition-all duration-1000 overflow-x-hidden ${candleOn ? config.deskBg : "bg-[#060403]"}`}
      style={{
        backgroundImage: "radial-gradient(circle at center, rgba(34, 19, 6, 0.1) 0%, rgba(0,0,0,0.96) 100%)",
      }}
    >
      {/* Interactive Wood Grain / Shadow overlays for immersion */}
      <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/wooden/1920/1080?blur=5')] bg-cover opacity-10 mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 desk-dots opacity-30 pointer-events-none" />

      {/* Hogwarts Banner/Header with Wizard Profile & Log Out */}
      <header className="w-full max-w-7xl lg:max-w-[1260px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 px-4 py-2 mt-2 z-30 select-none relative border-b border-amber-900/10 lg:border-b-0 pb-3 lg:pb-0">
        <div className="flex items-center gap-3 w-full lg:w-auto justify-start">
          {userProfile?.house && userProfile?.house !== "None" ? (
            <div className="w-10 h-10 rounded-full bg-stone-900 border border-amber-900/40 flex items-center justify-center text-xl shadow-md">
              {userProfile.house === "Gryffindor" && "🦁"}
              {userProfile.house === "Slytherin" && "🐍"}
              {userProfile.house === "Ravenclaw" && "🦅"}
              {userProfile.house === "Hufflepuff" && "🦡"}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-stone-900 border border-amber-900/40 flex items-center justify-center text-xl shadow-md">
              🏰
            </div>
          )}
          <div>
            <h3 className="text-xs md:text-sm font-serif font-bold text-amber-100/90 tracking-wide">
              {userProfile?.name || "Unknown Wizard"}
            </h3>
            <p className="text-[9px] font-mono uppercase tracking-widest text-stone-500 flex flex-wrap items-center gap-1.5">
              <span className="text-amber-500/80 font-bold">{userProfile?.house || "Hogwarts"}</span>
              <span className="text-amber-900/40">•</span>
              <span>{userProfile?.year || "Fifth Year"}</span>
              <span className="text-amber-900/40">•</span>
              <span className="text-stone-600 italic hover:text-stone-400 cursor-help" title={userProfile?.wand}>{userProfile?.wand ? "Wand Registered" : "Wand Unknown"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center lg:justify-end w-full lg:w-auto">
          {/* Journal Navigation Tabs */}
          <button
            onClick={() => {
              setActiveTab("write");
              audio.playPageTurn();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-all duration-200 active:scale-95 shadow-md ${
              activeTab === "write"
                ? "border-amber-700 bg-amber-950/30 text-amber-400 font-bold"
                : "border-stone-800 bg-stone-950/80 text-stone-400 hover:text-stone-200"
            } text-[10px] font-mono uppercase tracking-widest`}
            title="Go to Active Journal Entry"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Active Entry</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("lore");
              audio.playPageTurn();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-all duration-200 active:scale-95 shadow-md relative ${
              activeTab === "lore"
                ? "border-amber-700 bg-amber-950/30 text-amber-400 font-bold"
                : "border-stone-800 bg-stone-950/80 text-stone-400 hover:text-stone-200"
            } text-[10px] font-mono uppercase tracking-widest`}
            title="View Unlocked Secrets and Scrolls"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Scrolls</span>
            {loreScrolls.length > 0 && (
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("profile");
              audio.playPageTurn();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-all duration-200 active:scale-95 shadow-md ${
              activeTab === "profile"
                ? "border-amber-700 bg-amber-950/30 text-amber-400 font-bold"
                : "border-stone-800 bg-stone-950/80 text-stone-400 hover:text-stone-200"
            } text-[10px] font-mono uppercase tracking-widest`}
            title="Scribe Profile Ledger"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Scribe Profile</span>
          </button>

          {/* Divider */}
          <div className="h-5 w-[1px] bg-stone-800/80 self-center mx-1 hidden lg:block" />

          {/* Soundscapes Control */}
          <div className="relative" ref={ambientMenuRef}>
            <button
              onClick={() => {
                setShowAmbientMenu(!showAmbientMenu);
                setShowMusicMenu(false);
                audio.playPageTurn();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-all duration-200 active:scale-95 shadow-md ${
                !ambientMuted
                  ? "border-amber-700 bg-amber-950/30 text-amber-400"
                  : "border-stone-800 bg-stone-950/80 text-stone-400 hover:text-stone-200"
              } text-[10px] font-mono uppercase tracking-widest`}
              title="Toggle Ambient Sounds Menu"
            >
              {ambientMuted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              )}
              <span className="hidden md:inline">Sounds</span>
            </button>

            {/* Ambient Channels Menu Dropdown */}
            {showAmbientMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 mt-2 p-3 bg-stone-900/95 border border-stone-800 rounded-md shadow-2xl flex flex-col gap-2.5 w-48 text-[10px] uppercase tracking-wider text-stone-400 shadow-black/80 z-50"
              >
                <div className="flex justify-between items-center border-b border-stone-800/40 pb-1.5 mb-0.5 select-none">
                  <span className="font-serif italic text-amber-500/60">Hogwarts Ambiance</span>
                  <button
                    onClick={() => {
                      setAmbientMuted(!ambientMuted);
                      audio.playPageTurn();
                    }}
                    className={`text-[8px] px-1.5 py-0.5 rounded border transition-colors ${
                      ambientMuted ? "bg-amber-950 text-amber-400 border-amber-900/40" : "bg-stone-800 text-stone-400 border-stone-700"
                    }`}
                  >
                    {ambientMuted ? "UNMUTE" : "MUTE"}
                  </button>
                </div>

                {/* Rain Channel */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-left">
                    <button
                      onClick={() => setRainOn(!rainOn)}
                      className={`hover:text-stone-200 transition-colors ${rainOn && !ambientMuted ? "text-amber-500 font-bold" : "text-stone-600 line-through"}`}
                    >
                      🌧️ Stormy Roof
                    </button>
                    <span className="text-[9px] text-stone-500">{Math.round(rainVol * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.05"
                    value={rainVol}
                    onChange={(e) => setRainVol(parseFloat(e.target.value))}
                    disabled={!rainOn || ambientMuted}
                    className="w-full accent-amber-600 bg-stone-800 h-1 rounded cursor-pointer disabled:opacity-30"
                  />
                </div>

                {/* Fireplace Channel */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-left">
                    <button
                      onClick={() => setFireOn(!fireOn)}
                      className={`hover:text-stone-200 transition-colors ${fireOn && !ambientMuted ? "text-amber-500 font-bold" : "text-stone-600 line-through"}`}
                    >
                      🔥 Common Hearth
                    </button>
                    <span className="text-[9px] text-stone-500">{Math.round(fireVol * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.05"
                    value={fireVol}
                    onChange={(e) => setFireVol(parseFloat(e.target.value))}
                    disabled={!fireOn || ambientMuted}
                    className="w-full accent-amber-600 bg-stone-800 h-1 rounded cursor-pointer disabled:opacity-30"
                  />
                </div>

                {/* Library Echoes Channel */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-left">
                    <button
                      onClick={() => setLibraryOn(!libraryOn)}
                      className={`hover:text-stone-200 transition-colors ${libraryOn && !ambientMuted ? "text-amber-500 font-bold" : "text-stone-600 line-through"}`}
                    >
                      🏰 Dungeon Echoes
                    </button>
                    <span className="text-[9px] text-stone-500">{Math.round(libraryVol * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.6"
                    step="0.05"
                    value={libraryVol}
                    onChange={(e) => setLibraryVol(parseFloat(e.target.value))}
                    disabled={!libraryOn || ambientMuted}
                    className="w-full accent-amber-600 bg-stone-800 h-1 rounded cursor-pointer disabled:opacity-30"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Music Control */}
          <div className="relative" ref={musicMenuRef}>
            <button
              onClick={() => {
                setShowMusicMenu(!showMusicMenu);
                setShowAmbientMenu(false);
                audio.playPageTurn();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-all duration-200 active:scale-95 shadow-md ${
                themeOn && !ambientMuted
                  ? "border-amber-700 bg-amber-950/30 text-amber-400"
                  : "border-stone-800 bg-stone-950/80 text-stone-400 hover:text-stone-200"
              } text-[10px] font-mono uppercase tracking-widest`}
              title="Toggle Music Menu"
            >
              <Sparkles className={`w-3.5 h-3.5 ${themeOn && !ambientMuted ? "animate-pulse text-amber-400" : ""}`} />
              <span className="hidden md:inline">Music</span>
            </button>

            {/* Music Volume Dropdown */}
            {showMusicMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute right-0 mt-2 p-3 bg-stone-900/95 border border-stone-800 rounded-md shadow-2xl flex flex-col gap-2 w-44 text-[10px] uppercase tracking-wider text-stone-400 shadow-black/80 z-50"
              >
                <div className="flex justify-between items-center border-b border-stone-800/40 pb-1.5 mb-1.5 select-none">
                  <span className="font-serif italic text-amber-500/60">Music Theme</span>
                  <button
                    onClick={() => {
                      setThemeOn(!themeOn);
                      audio.playPageTurn();
                    }}
                    className={`text-[8px] px-1.5 py-0.5 rounded border transition-colors ${
                      themeOn && !ambientMuted ? "bg-amber-950 text-amber-400 border-amber-900/40" : "bg-stone-800 text-stone-400 border-stone-700"
                    }`}
                  >
                    {(themeOn && !ambientMuted) ? "MUTE" : "PLAY"}
                  </button>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-left">
                    <span className={`${themeOn && !ambientMuted ? "text-amber-500 font-bold" : "text-stone-600 line-through"}`}>Hedwig's Theme</span>
                    <span className="text-[9px] text-stone-500">{Math.round(themeVol * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.05"
                    value={themeVol}
                    onChange={(e) => setThemeVol(parseFloat(e.target.value))}
                    disabled={!themeOn || ambientMuted}
                    className="w-full accent-amber-600 bg-stone-800 h-1 rounded cursor-pointer disabled:opacity-30"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Candle/Room Light Toggle Button */}
          <button
            onClick={handleCandleClick}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-all duration-200 active:scale-95 shadow-md ${
              candleOn
                ? "border-amber-700 bg-amber-950/30 text-amber-400"
                : "border-stone-800 bg-stone-950/80 text-stone-400 hover:text-stone-200"
            } text-[10px] font-mono uppercase tracking-widest`}
            title={candleOn ? "Blow out candlelight" : "Ignite candlelight"}
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{candleOn ? "Lit" : "Muted"}</span>
          </button>

          {/* Depart Portal Logout Button */}
          <button
            onClick={handleLogout}
            className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-stone-800 bg-stone-950/80 hover:bg-stone-900 text-stone-400 hover:text-amber-400 text-[10px] font-mono uppercase tracking-widest transition-all duration-200 active:scale-95 shadow-md hover:border-amber-950"
            title="Securely Lock Diary and Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Depart Portal</span>
          </button>
        </div>
      </header>
      
      {/* Dynamic Candle Room Lighting Overlay - flickering and originating from candle location */}
      <div
        className={`absolute inset-0 transition-all duration-1000 pointer-events-none z-20 ${
          candleOn ? "opacity-100 room-candle-lit" : "opacity-20"
        }`}
        style={{
          background: candleOn
            ? `radial-gradient(circle 800px at calc(100% - 100px) calc(100% - 140px), rgba(254, 215, 170, 0.22) 0%, rgba(217, 119, 6, 0.08) 40%, rgba(0, 0, 0, 0) 100%)`
            : `radial-gradient(circle 450px at 50% 50%, rgba(99, 102, 241, 0.04) 0%, transparent 100%)`,
        }}
      />

      {/* Deep Room Shadow Overlay when candle is out */}
      <div 
        className={`absolute inset-0 pointer-events-none z-10 transition-opacity duration-1000 ${
          candleOn ? "opacity-45" : "opacity-97"
        }`}
        style={{
          background: "radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.98) 90%)",
        }}
      />

      {/* CENTRAL DIARY AREA (Takes full visual focus of the page) */}
      <main className="w-full flex-1 flex items-center justify-center py-4 z-10">
        <Book theme={theme}>
          <Journal
            theme={theme}
            entryCount={entries.length}
            entries={entries}
            loreScrolls={loreScrolls}
            onAddEntry={handleAddEntry}
            onAddLore={handleAddLore}
            trackedSecrets={trackedSecrets}
            onTrackSecret={handleTrackSecret}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </Book>
      </main>


    </div>
  );
}
