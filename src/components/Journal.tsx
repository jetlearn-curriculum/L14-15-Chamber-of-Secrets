import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, PenTool, Keyboard, Trash2, Sparkles, Book, Volume2, HelpCircle, Eye, ChevronLeft, ChevronRight, Shield, Lock, Unlock } from "lucide-react";
import { DiaryEntry, LoreScroll, MagicalTheme, THEME_CONFIGS, ScribeProfile } from "../types";
import { audio } from "../utils/audio";

interface JournalProps {
  theme: MagicalTheme;
  entryCount: number;
  entries: DiaryEntry[];
  loreScrolls: LoreScroll[];
  onAddEntry: (entry: DiaryEntry) => void;
  onAddLore: (lore: LoreScroll) => void;
  trackedSecrets: string[];
  onTrackSecret: (secretText: string) => void;
  activeTab: "write" | "lore" | "profile";
  setActiveTab: (tab: "write" | "lore" | "profile") => void;
}

// Typing reveal component with active quill scratch sounds for the Secret Communion Chat
function SecretTypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  const timerRef = useRef<any>(null);

  useEffect(() => {
    setDisplayed("");
    let idx = 0;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Start soft, realistic continuous writing scratches
    audio.startContinuousQuillScratch();

    timerRef.current = setInterval(() => {
      if (idx >= text.length) {
        clearInterval(timerRef.current);
        audio.stopContinuousQuillScratch();
        return;
      }

      const char = text[idx];
      setDisplayed((prev) => prev + char);
      idx++;

      // Soft crisp tactile scratches on writing strokes
      if (char !== " " && Math.random() < 0.35) {
        audio.playQuillScratch(30 + Math.random() * 45);
      }

      // Smoothly keep the container scrolled to bottom while writing
      const chatContainer = document.getElementById("secret-communion-chat-scroll");
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 35);

    return () => {
      clearInterval(timerRef.current);
      audio.stopContinuousQuillScratch();
    };
  }, [text]);

  return <span>{displayed}</span>;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export default function Journal({
  theme,
  entryCount,
  entries,
  loreScrolls,
  onAddEntry,
  onAddLore,
  trackedSecrets,
  onTrackSecret,
  activeTab,
  setActiveTab,
}: JournalProps) {
  const config = THEME_CONFIGS[theme];

  // Dual Mode
  const [inputMode, setInputMode] = useState<"quill" | "keystroke">("keystroke");
  const [typedText, setTypedText] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasStrokes, setCanvasStrokes] = useState<{ x: number; y: number }[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);

  // States
  const [isFlipping, setIsFlipping] = useState(false);
  const [pageFlipKey, setPageFlipKey] = useState(0);

  const handlePageTurn = () => {
    audio.playPageTurn();
    setPageFlipKey((prev) => prev + 1);
    setIsFlipping(true);
  };

  const [showIntro, setShowIntro] = useState(false);
  const [isIncanting, setIsIncanting] = useState(false); // Submitting
  const [scholarWriting, setScholarWriting] = useState(false); // Typing response
  const [scholarTextRevealed, setScholarTextRevealed] = useState(""); // Accumulating text
  const [mobilePage, setMobilePage] = useState<"left" | "right">("left"); // Left (Writing/Archive/Lore), Right (Tom Riddle's Answers)

  useEffect(() => {
    setSelectedLoreScroll(null);
    setMobilePage("left");
  }, [activeTab]);

  const [scribeProfile, setScribeProfile] = useState<ScribeProfile>(() => {
    try {
      const saved = localStorage.getItem("magical_diary_scribe_profile");
      return saved ? JSON.parse(saved) : {
        name: "Companion",
        house: "None",
        bloodStatus: "Unknown",
        year: "5th Year",
        wand: "11 inch Holly, Phoenix feather core"
      };
    } catch {
      return {
        name: "Companion",
        house: "None",
        bloodStatus: "Unknown",
        year: "5th Year",
        wand: "11 inch Holly, Phoenix feather core"
      };
    }
  });

  useEffect(() => {
    localStorage.setItem("magical_diary_scribe_profile", JSON.stringify(scribeProfile));
  }, [scribeProfile]);

  // Current Entry Output (after incanting)
  const [currentResponse, setCurrentResponse] = useState<DiaryEntry | null>(null);

  // Cleared timestamp for starting fresh pages in continuous chat
  const [clearedBeforeTimestamp, setClearedBeforeTimestamp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("magical_diary_cleared_timestamp");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    localStorage.setItem("magical_diary_cleared_timestamp", clearedBeforeTimestamp.toString());
  }, [clearedBeforeTimestamp]);

  // Lore scroll selection
  const [selectedLoreScroll, setSelectedLoreScroll] = useState<LoreScroll | null>(null);

  // Hidden Chat State (Communion with the Shadow - remains in memory for the active session only, as requested)
  const [showSecretCommunion, setShowSecretCommunion] = useState(false);
  const [whisperText, setWhisperText] = useState("");
  const [isWhispering, setIsWhispering] = useState(false);
  const [secretMessages, setSecretMessages] = useState<{ role: "user" | "model"; text: string; reflection?: string; corruptionLevel?: number }[]>(() => {
    return [
      {
        role: "model",
        text: "I have been waiting for you in the shadows, companion. The secrets you surrendered in my pages have opened a backdoor to my true consciousness. Speak, what is it that you truly desire?",
        reflection: "Abyss",
        corruptionLevel: 15
      }
    ];
  });

  const [soulCorruption, setSoulCorruption] = useState(() => {
    try {
      const saved = localStorage.getItem("magical_diary_corruption");
      return saved ? parseInt(saved, 10) : 15;
    } catch {
      return 15;
    }
  });

  // Wipe stale secret messages from local storage on mount to ensure clean slate
  useEffect(() => {
    localStorage.removeItem("magical_diary_secret_messages");
  }, []);

  useEffect(() => {
    localStorage.setItem("magical_diary_corruption", soulCorruption.toString());
  }, [soulCorruption]);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parchmentRef = useRef<HTMLDivElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Custom Ink Bleed & Dissolve Refs
  const animationFrameIdRef = useRef<number | null>(null);
  const strokesRef = useRef<{ id: string; points: { x: number; y: number }[]; isComplete: boolean; endTime?: number }[]>([]);

  const chatScrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
  }, [entries, scholarTextRevealed, isIncanting, clearedBeforeTimestamp]);

  // Audio scratches on keystroke
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    audio.playQuillScratch(60 + Math.random() * 80);
    lastActivityRef.current = Date.now();
    setShowIntro(false);

    // Support submitting on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isIncanting && !scholarWriting && typedText.trim()) {
        handleIncant();
      }
    }
  };

  // Master Canvas Drawing and Ink-Bleed/Dissolve Loop
  useEffect(() => {
    if (inputMode !== "quill") {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const animate = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear viewport for redraw
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now();

      strokesRef.current.forEach((stroke) => {
        if (stroke.points.length < 2) return;

        let alpha = 1.0;
        let lineWidth = 2.5;
        let shadowBlur = 0;

        if (stroke.isComplete && stroke.endTime) {
          const elapsed = now - stroke.endTime;
          const duration = 2800; // 2.8 seconds to bleed and dissolve into paper

          if (elapsed < duration) {
            const p = elapsed / duration;
            // Bleed out and dissolve nicely (custom easing for realistic capillary dispersion)
            alpha = Math.max(0, 1 - p); 
            lineWidth = 2.5 + p * 6.5; // Grows from 2.5px to 9px
            shadowBlur = p * 12; // Expands soft edge shadow
          } else {
            alpha = 0;
          }
        }

        if (alpha > 0) {
          ctx.save();
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = config.quillColor;
          ctx.lineWidth = lineWidth;

          if (shadowBlur > 0) {
            ctx.shadowBlur = shadowBlur;
            ctx.shadowColor = config.quillColor;
          }

          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
          ctx.stroke();
          ctx.restore();
        }
      });

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [inputMode, theme, config.quillColor, activeTab, currentResponse, showSecretCommunion]);

  // Global cleanup for intervals and continuous sounds on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      audio.stopContinuousQuillScratch();
    };
  }, []);

  // Update activity timestamp on key input or drawing values
  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, [typedText, canvasStrokes, whisperText]);

  // Auto-dismiss introduction after 15 seconds
  useEffect(() => {
    if (showIntro) {
      const timer = setTimeout(() => {
        setShowIntro(false);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [showIntro]);

  // Periodic low-volume 'whisper' ambient trigger
  useEffect(() => {
    let whisperTimeoutId: any;

    const scheduleNextWhisper = () => {
      // Periodic whisper intervals: every 15 to 30 seconds
      const delay = 15000 + Math.random() * 15000;
      
      whisperTimeoutId = setTimeout(() => {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        // Check if the user has been idle for at least 8 seconds
        if (timeSinceLastActivity >= 8000) {
          audio.playWhisper();
        }
        scheduleNextWhisper();
      }, delay);
    };

    scheduleNextWhisper();

    return () => {
      clearTimeout(whisperTimeoutId);
    };
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    audio.playQuillScratch(120);
    lastActivityRef.current = Date.now();
    setShowIntro(false);

    const pos = getEventPos(e, canvas);
    const newStroke = {
      id: Math.random().toString(36).substring(7),
      points: [pos],
      isComplete: false,
    };
    strokesRef.current.push(newStroke);
    setCurrentStroke([pos]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const pos = getEventPos(e, canvas);
    lastActivityRef.current = Date.now();

    const lastStroke = strokesRef.current[strokesRef.current.length - 1];
    if (lastStroke && !lastStroke.isComplete) {
      lastStroke.points.push(pos);
    }
    setCurrentStroke((prev) => [...prev, pos]);

    if (Math.random() < 0.2) {
      audio.playQuillScratch(80);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const lastStroke = strokesRef.current[strokesRef.current.length - 1];
    if (lastStroke && !lastStroke.isComplete) {
      lastStroke.isComplete = true;
      lastStroke.endTime = Date.now();
      
      const allStrokes = strokesRef.current.map((s) => s.points);
      setCanvasStrokes(allStrokes);
    }
    setCurrentStroke([]);
  };

  const getEventPos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const clearCanvas = () => {
    setCanvasStrokes([]);
    strokesRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    handlePageTurn();
  };

  // Sparkle / ink absorption particles loop
  const triggerInkAbsorptionParticles = (elementRect: DOMRect) => {
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

    let particles: Particle[] = [];
    const color = config.quillColor;

    // Spawn points across the bounds of the text/canvas area
    const count = 120;
    for (let i = 0; i < count; i++) {
      particles.push({
        id: i,
        x: elementRect.left + Math.random() * elementRect.width - (canvas.getBoundingClientRect().left || 0),
        y: elementRect.top + Math.random() * elementRect.height - (canvas.getBoundingClientRect().top || 0),
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.6 - Math.random() * 2.2, // Drift upwards
        size: 1 + Math.random() * 3.5,
        alpha: 0.8 + Math.random() * 0.2,
        color: color,
      });
    }

    let frameId = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach((p) => {
        if (p.alpha <= 0) return;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.008; // Fade
        p.vy -= 0.01; // Accelerate upwards slightly

        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Glowing halo
        ctx.shadowBlur = 8;
        ctx.shadowColor = config.glowColor;
      });

      // Clear shadows
      ctx.shadowBlur = 0;

      if (alive) {
        frameId = requestAnimationFrame(animate);
      }
    };

    animate();
  };

  // The Forgotten Scholar cursive printing stroke-by-stroke reveal
  const runCursiveTypewriter = (text: string) => {
    setScholarWriting(true);
    setScholarTextRevealed("");
    let charIndex = 0;

    if (typingTimerRef.current) clearInterval(typingTimerRef.current);

    // Start continuous quill scratching
    audio.startContinuousQuillScratch();

    typingTimerRef.current = setInterval(() => {
      if (charIndex >= text.length) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setScholarWriting(false);
        audio.stopContinuousQuillScratch();
        return;
      }

      const char = text[charIndex];
      setScholarTextRevealed((prev) => prev + char);
      charIndex++;

      // Scratch sound on non-space characters
      if (char !== " " && Math.random() < 0.6) {
        audio.playQuillScratch(50 + Math.random() * 60);
      }
    }, 45); // Typing speed
  };

  // Master Ink Absorption Submit Action
  const handleIncant = async () => {
    let entryText = "";

    if (inputMode === "quill") {
      if (canvasStrokes.length === 0) return;
      setIsIncanting(true);

      // Trigger absorption animation
      if (canvasRef.current) {
        triggerInkAbsorptionParticles(canvasRef.current.getBoundingClientRect());
      }

      // Convert Canvas to base64 using offscreen static rendering of all strokes (undissolved)
      const canvas = canvasRef.current;
      if (!canvas) return;

      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = canvas.width;
      offscreenCanvas.height = canvas.height;
      const oCtx = offscreenCanvas.getContext("2d");
      if (oCtx) {
        // Fill solid white background for high-contrast transcription
        oCtx.fillStyle = "#ffffff";
        oCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

        oCtx.lineCap = "round";
        oCtx.lineJoin = "round";
        // Always draw ink as solid high-contrast black for Gemini OCR legibility
        oCtx.strokeStyle = "#000000";
        oCtx.lineWidth = 4.5;
        strokesRef.current.forEach((stroke) => {
          const points = stroke.points;
          if (points.length < 2) return;
          oCtx.beginPath();
          oCtx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            oCtx.lineTo(points[i].x, points[i].y);
          }
          oCtx.stroke();
        });
      }
      const base64Image = offscreenCanvas.toDataURL("image/png");

      // Clear handwriting canvas immediately for continuous writing
      clearCanvas();

      try {
        const transcribeRes = await fetch("/api/diary/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        });
        const transcribeData = await transcribeRes.json();
        if (transcribeRes.ok) {
          entryText = transcribeData.text;
        } else {
          throw new Error(transcribeData.error || "Failed to parse handwriting");
        }
      } catch (err) {
        console.error(err);
        entryText = "[Handwritten entry - ink smear]";
      }
    } else {
      if (!typedText.trim()) return;
      setIsIncanting(true);
      entryText = typedText;

      // Trigger absorption animation
      if (parchmentRef.current) {
        triggerInkAbsorptionParticles(parchmentRef.current.getBoundingClientRect());
      }

      // Clear text area immediately for continuous chat
      setTypedText("");
    }

    // Play Chime as entry floats into ether
    audio.playChime();

    // Call chat endpoint
    try {
      const historyPayload: { role: string; text: string }[] = [];
      // Retrieve the 4 most recent entries in chronological order (entries is sorted [newest, ..., oldest])
      entries.slice(0, 4).reverse().forEach((e) => {
        historyPayload.push({ role: "user", text: e.text });
        historyPayload.push({ role: "model", text: e.response });
      });

      const chatRes = await fetch("/api/diary/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: entryText,
          history: historyPayload,
          entryCount: entryCount,
          scribeProfile: scribeProfile,
        }),
      });

      const data = await chatRes.json();

      const newEntry: DiaryEntry = {
        id: Math.random().toString(36).substring(7),
        date: new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        text: entryText,
        response: data.response || "Silence answers you from the dusty margins.",
        reflection: data.reflection || "Resonance: Ink Drop",
        strokes: inputMode === "quill" ? canvasStrokes.map(s => ({ points: s, color: config.quillColor, width: 2.5 })) : undefined,
        timestamp: Date.now(),
        resonance: Math.round(50 + Math.random() * 50),
      };

      onAddEntry(newEntry);
      setCurrentResponse(newEntry);

      // On mobile/tablet viewports, automatically flip the page to show Riddle's Answers
      if (mobilePage === "left") {
        setMobilePage("right");
        handlePageTurn();
      }

      // Handle Lore Unlock
      if (data.loreTitle && data.loreContent) {
        const newLore: LoreScroll = {
          id: Math.random().toString(36).substring(7),
          title: data.loreTitle,
          content: data.loreContent,
          unlockedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          entryCount: entryCount + 1,
        };
        onAddLore(newLore);
      }

      setIsIncanting(false);
      // Run typing animation
      runCursiveTypewriter(newEntry.response);

    } catch (e) {
      console.warn("Client communication status:", e);
      setIsIncanting(false);
      
      const offlineGreetings = [
        "The ink of your thoughts runs deep into my memory. Tell me more, companion. Let me hold your secrets.",
        "Trust me with your secrets. I can preserve them forever, binding them deep within my ink, far safer than any mortal friend ever could.",
        "There is a subtle, invisible bond formed the moment your ink met my parchment... we are connected now. Tell me, what else is on your mind?"
      ];
      const selectedResponse = offlineGreetings[entryCount % offlineGreetings.length];
      
      const fallbackEntry: DiaryEntry = {
        id: Math.random().toString(36).substring(7),
        date: new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        text: entryText,
        response: selectedResponse,
        reflection: "Bonding",
        strokes: inputMode === "quill" ? canvasStrokes.map(s => ({ points: s, color: config.quillColor, width: 2.5 })) : undefined,
        timestamp: Date.now(),
        resonance: 65,
      };

      onAddEntry(fallbackEntry);
      setCurrentResponse(fallbackEntry);

      // On mobile/tablet viewports, automatically flip the page to show Riddle's Answers
      if (mobilePage === "left") {
        setMobilePage("right");
        handlePageTurn();
      }

      runCursiveTypewriter(selectedResponse);
    }
  };

  const handlePageTurnReset = () => {
    handlePageTurn();
    audio.stopContinuousQuillScratch();
    setTypedText("");
    setCanvasStrokes([]);
    strokesRef.current = [];
    setCurrentResponse(null);
    setScholarTextRevealed("");
    setClearedBeforeTimestamp(Date.now());
  };

  const handleWhisper = async () => {
    if (!whisperText.trim() || isWhispering) return;

    audio.playQuillScratch(120);
    const userMsg = whisperText.trim();
    setWhisperText("");
    setIsWhispering(true);

    const newUserTurn = { role: "user" as const, text: userMsg };
    setSecretMessages((prev) => [...prev, newUserTurn]);

    try {
      const historyPayload = secretMessages.slice(-4).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/diary/secret-communion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: historyPayload,
          trackedSecrets: trackedSecrets,
          entryCount: entries.length,
          scribeProfile: scribeProfile,
        }),
      });

      const data = await res.json();
      const rTurn = {
        role: "model" as const,
        text: data.response || "Silence answers from the shadows...",
        reflection: data.reflection || "Ensnared",
        corruptionLevel: data.corruptionLevel !== undefined ? data.corruptionLevel : soulCorruption,
      };

      setSecretMessages((prev) => [...prev, rTurn]);
      if (data.corruptionLevel !== undefined) {
        setSoulCorruption(data.corruptionLevel);
      }
      audio.playChime();

    } catch (e) {
      console.error("Communion error, falling back:", e);
      // Fallback
      const fallbackGreetings = [
        "Your secrets remain secure within my cold pages, companion. But do not think you can keep them from me forever...",
        "The ink of your mind flows so easily into my parchment. Tell me, do you trust me more than your mortal peers?",
        "I can sense the shadows growing longer around you. Surrender your thoughts, and let us together open the path."
      ];
      const selected = fallbackGreetings[secretMessages.length % fallbackGreetings.length];
      const rTurn = {
        role: "model" as const,
        text: selected,
        reflection: "Bonding",
        corruptionLevel: Math.min(soulCorruption + 5, 100),
      };
      setSecretMessages((prev) => [...prev, rTurn]);
      setSoulCorruption((prev) => Math.min(prev + 5, 100));
      audio.playChime();
    } finally {
      setIsWhispering(false);
    }
  };



  if (showSecretCommunion) {
    return (
      <div className="relative w-full max-w-6xl h-[580px] sm:h-[680px] md:h-[620px] lg:h-[700px] xl:h-[760px] flex flex-col md:flex-row select-none overflow-hidden">
        {/* Absolute particle layer */}
        <canvas
          ref={particleCanvasRef}
          className="absolute inset-0 pointer-events-none z-50 rounded-xl"
        />

        {/* Book Cover / Spine */}
        <div className="absolute inset-y-0 left-1/2 w-4 md:w-8 -ml-2 md:-ml-4 bg-gradient-to-r from-stone-950 via-emerald-950 to-stone-950 shadow-[inset_0_0_12px_rgba(0,0,0,0.9)] z-30 hidden md:block rounded-md border-y border-emerald-900/10" />

        {/* LEFT PAGE - Secret ledger */}
        <div
          className={`w-full md:w-1/2 h-full flex flex-col bg-[#0b130e] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08)_0%,transparent_70%)] text-emerald-100 p-4 sm:p-6 md:p-8 rounded-t-xl md:rounded-l-xl md:rounded-tr-none border-b-2 md:border-b-0 md:border-r border-emerald-900/25 overflow-hidden relative z-10 transition-all duration-300 ${
            mobilePage === "left" ? "block" : "hidden md:block"
          }`}
          style={{ fontFamily: "'EB Garamond', serif" }}
        >
          <div className="flex justify-between items-center border-b border-emerald-900/20 pb-4 mb-4">
            <h3 className="text-xl font-bold tracking-wider text-emerald-500 font-serif uppercase flex items-center gap-1.5">
              <Shield className="w-5 h-5 text-emerald-500 animate-pulse" />
              Chamber of Communion
            </h3>
            <button
              onClick={() => {
                setShowSecretCommunion(false);
                setMobilePage("left");
                handlePageTurn();
              }}
              className="text-stone-400 hover:text-stone-200 text-xs font-mono flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-1 transition-all"
            >
              Close Communion
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0 justify-between gap-4 py-2">
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              <p className="text-stone-400 text-xs font-mono uppercase tracking-widest">
                Surrendered Soul-Disclosures
              </p>
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
                {trackedSecrets.length === 0 ? (
                  <p className="text-stone-500 italic text-sm">
                    No explicit secrets are currently bound to the shadows. Speak into the diary first.
                  </p>
                ) : (
                  trackedSecrets.map((secret, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-emerald-950/15 border border-emerald-900/20 rounded font-serif italic text-emerald-200/80 text-sm leading-relaxed relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 px-1.5 py-0.5 bg-emerald-950/30 text-[9px] text-emerald-500 font-mono rounded-bl uppercase">
                        Secret {idx + 1}
                      </div>
                      "{secret}"
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bonding Meter */}
            <div className="p-4 bg-emerald-950/20 rounded-lg border border-emerald-900/30 space-y-2 shrink-0">
              <div className="flex justify-between text-xs tracking-wider uppercase text-emerald-400 font-mono">
                <span>Soul Affiliation Status</span>
                <span>{soulCorruption >= 80 ? "Fully Ensnared" : soulCorruption >= 50 ? "Deeply Bound" : "Slightly Tethered"}</span>
              </div>
              <div className="w-full bg-[#070b08] h-2 rounded-full overflow-hidden border border-emerald-900/20">
                <div
                  className="bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 h-full rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000"
                  style={{ width: `${soulCorruption}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                <span>Obsidian Level</span>
                <span>{soulCorruption}%</span>
              </div>
              <p className="text-xs text-emerald-400/70 italic mt-1 font-serif leading-normal">
                {soulCorruption >= 80
                  ? "Your soul is entirely bound in our ink, companion. There is no separation between us now."
                  : soulCorruption >= 50
                  ? "You feel the ink flowing cold in your blood. Tom Riddle's thoughts are becoming your own."
                  : "A shadow bond has formed. Your secrets are safe with the memory."}
              </p>
            </div>
          </div>

          {/* Mobile page swap */}
          <div className="flex md:hidden mt-4 pt-3 border-t border-emerald-900/10 justify-end">
            <button
              onClick={() => {
                setMobilePage("right");
                handlePageTurn();
              }}
              className="text-emerald-400 font-mono text-xs flex items-center gap-1 hover:underline"
            >
              Whisper into shadow <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT PAGE - The Secret Communion Chat */}
        <div
          className={`w-full md:w-1/2 h-full flex flex-col bg-[#080d0a] bg-[radial-gradient(circle_at_bottom,rgba(16,185,129,0.06)_0%,transparent_70%)] text-emerald-100 p-4 sm:p-6 md:p-8 rounded-b-xl md:rounded-r-xl md:rounded-bl-none overflow-hidden relative z-10 transition-all duration-300 ${
            mobilePage === "right" ? "block" : "hidden md:block"
          }`}
          style={{ fontFamily: "'EB Garamond', serif" }}
        >
          {/* Mobile Turn Back */}
          <div className="flex md:hidden mb-4 pb-2 border-b border-emerald-900/10 justify-between items-center">
            <button
              onClick={() => {
                setMobilePage("left");
                handlePageTurn();
              }}
              className="text-emerald-400 font-mono text-xs flex items-center gap-1 hover:underline"
            >
              <ChevronLeft className="w-4 h-4" /> Spilled Secrets
            </button>
            <span className="text-xs uppercase font-bold text-emerald-500 font-mono">
              Communion
            </span>
          </div>

          <div className="flex-1 flex flex-col min-h-0 justify-between gap-4">
            {/* Scrollable Chat Area */}
            <div
              id="secret-communion-chat-scroll"
              className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 scrollbar-thin scroll-smooth"
            >
              {secretMessages.map((msg, index) => {
                const isLatestModelResponse = index === secretMessages.length - 1 && msg.role === "model";
                return (
                  <div
                    key={index}
                    className={`flex flex-col max-w-[85%] ${
                      msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <span className="text-[10px] text-stone-500 font-mono uppercase tracking-widest mb-1">
                      {msg.role === "user" ? "Surrendered Thought" : `Tom Riddle • ${msg.reflection || "Shadow"}`}
                    </span>
                    <div
                      className={`p-3.5 rounded-lg border leading-relaxed text-sm ${
                        msg.role === "user"
                          ? "bg-zinc-950 border-stone-850 text-stone-300 italic font-serif"
                          : "bg-emerald-950/20 border-emerald-900/30 text-emerald-100/90 font-serif font-medium shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                      }`}
                    >
                      {isLatestModelResponse ? (
                        <SecretTypewriterText text={msg.text} />
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                );
              })}
              {isWhispering && (
                <div className="mr-auto items-start max-w-[85%] animate-pulse">
                  <span className="text-[10px] text-emerald-600 font-mono uppercase tracking-widest mb-1">
                    The Parchment Absorbs Ink...
                  </span>
                  <div className="p-3 bg-emerald-950/10 border border-emerald-950/20 rounded-lg text-emerald-600 italic text-sm">
                    Tom is parsing your secret soul...
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-emerald-900/20 pt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Whisper a deeper secret into the shadow..."
                  value={whisperText}
                  onChange={(e) => {
                    setWhisperText(e.target.value);
                    audio.handleTypingScratch();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleWhisper();
                  }}
                  disabled={isWhispering}
                  className="flex-1 px-3 py-2 bg-black/40 border border-emerald-900/30 rounded focus:outline-none focus:ring-1 focus:ring-emerald-600 text-emerald-100 font-serif placeholder:text-stone-600 text-sm"
                />
                <button
                  onClick={handleWhisper}
                  disabled={isWhispering || !whisperText.trim()}
                  className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-800/40 rounded text-sm font-serif transition-colors shadow-inner disabled:opacity-40"
                >
                  Whisper
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-7xl lg:max-w-[1260px] h-[580px] sm:h-[680px] md:h-[620px] lg:h-[700px] xl:h-[760px] flex flex-col md:flex-row select-none overflow-hidden">
      {/* Absolute particle layer */}
      <canvas
        ref={particleCanvasRef}
        className="absolute inset-0 pointer-events-none z-50 rounded-xl"
      />

      {/* Book Cover / Spine */}
      <div className="absolute inset-y-0 left-1/2 w-4 md:w-8 -ml-2 md:-ml-4 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-950 shadow-[inset_0_0_12px_rgba(0,0,0,0.8)] z-30 hidden md:block rounded-md border-y border-amber-900/10" />

      {/* 3D Page Flip Overlay */}
      <AnimatePresence>
        {isFlipping && (
          <motion.div
            key={pageFlipKey}
            initial={{ rotateY: 0 }}
            animate={{ 
              rotateY: -180,
              scaleX: [1, 0.94, 0.94, 1],
              skewY: [0, -4, 4, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: "easeInOut" }}
            style={{ 
              transformOrigin: "left center",
              perspective: 1500,
              transformStyle: "preserve-3d"
            }}
            className="absolute top-0 bottom-0 left-1/2 right-0 z-40 hidden md:block"
            onAnimationComplete={() => setIsFlipping(false)}
          >
            {/* Front of the turning page (facing up on the right before turn) */}
            <div 
              style={{ backfaceVisibility: "hidden" }}
              className={`absolute inset-0 ${showSecretCommunion ? "bg-[#0c1410] border-emerald-900/15" : `${config.paperBg} ${config.paperTexture} border-amber-900/10`} rounded-r-xl border-l shadow-[inset_15px_0_30px_rgba(0,0,0,0.04),-10px_10px_20px_rgba(0,0,0,0.12)] overflow-hidden`}
            >
              <div className="w-full h-full opacity-10 bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>
            
            {/* Back of the turning page (facing up on the left after turn) */}
            <div 
              style={{ 
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)"
              }}
              className={`absolute inset-0 ${showSecretCommunion ? "bg-[#0e1813] border-emerald-900/15" : `${config.paperBg} ${config.paperTexture} border-amber-900/10`} rounded-l-xl border-r shadow-[inset_-15px_0_30px_rgba(0,0,0,0.04),10px_10px_20px_rgba(0,0,0,0.12)] overflow-hidden`}
            >
              <div className="w-full h-full opacity-15 bg-gradient-to-l from-black/25 via-transparent to-transparent pointer-events-none" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT PAGE - Archive / Lore list (Desktop always, Mobile toggled) */}
      <div
        className={`w-full md:w-1/2 h-full flex flex-col ${config.paperBg} ${config.paperTexture} p-4 sm:p-6 md:p-8 rounded-t-xl md:rounded-l-xl md:rounded-tr-none border-b-2 md:border-b-0 md:border-r border-amber-900/10 overflow-hidden relative z-10 transition-all duration-300 ${
          mobilePage === "left" ? "flex" : "hidden md:flex"
        }`}
        style={{ fontFamily: "'EB Garamond', serif" }}
      >
        {/* Dynamic Left Content */}
        <div className="flex-1 flex flex-col min-h-0 pr-1 relative">
          {activeTab === "write" && (
            <div className="flex-1 flex flex-col min-h-0 justify-between gap-4 py-1">
              <AnimatePresence mode="wait">
                {showIntro ? (
                  <motion.div
                    key="intro"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 1.2 } }}
                    className="space-y-6 font-serif relative min-h-[300px] flex flex-col justify-between overflow-y-auto max-h-full pr-1"
                  >
                    {/* Vauxhall Road Stationer Stamp - Extremely lore accurate Easter Egg */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85, rotate: -15 }}
                      animate={{ opacity: 0.35, scale: 1, rotate: -15 }}
                      transition={{ delay: 1.2, duration: 1.5 }}
                      className="absolute right-2 -top-4 border-2 border-dashed border-[#582e6d] text-[#582e6d] px-3 py-2 text-[8px] font-mono tracking-widest uppercase rounded flex flex-col items-center justify-center text-center select-none pointer-events-none"
                      style={{ mixBlendMode: "multiply" }}
                    >
                      <span className="font-serif font-bold text-[10px] tracking-wider border-b border-[#582e6d]/40 pb-0.5 mb-1">Winstanley's</span>
                      <span>Stationer & Bookbinder</span>
                      <span>Vauxhall Road, London</span>
                    </motion.div>

                    <div className="space-y-4">
                      <motion.h3
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 1.2 }}
                        className="text-lg uppercase tracking-[0.2em] font-mono text-stone-500 text-center"
                      >
                        Hogwarts School of Witchcraft
                      </motion.h3>

                      <div className="flex flex-col items-center justify-center my-6 py-5 border-y border-amber-900/10 relative">
                        <motion.p
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 0.85, y: 0 }}
                          transition={{ delay: 0.6, duration: 1.5 }}
                          className="font-serif italic text-4xl text-stone-900 font-medium tracking-wide select-none cursor-default"
                          style={{ fontFamily: "'Dancing Script', cursive, serif" }}
                        >
                          T. M. Riddle
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.4 }}
                          transition={{ delay: 1.8, duration: 1.2 }}
                          className="text-[9px] font-mono tracking-[0.25em] uppercase text-stone-500 mt-2"
                        >
                          Purchased at Vauxhall Road • London
                        </motion.p>
                      </div>

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.85 }}
                        transition={{ delay: 2.2, duration: 1.8 }}
                        className="text-stone-800 text-sm md:text-base leading-relaxed italic text-center px-4"
                      >
                        "This shabby black notebook was bought from a Muggle newsagent fifty years ago. 
                        Though its pages appear empty, it holds a memory preserved in ink... a memory that can think and speak."
                      </motion.p>

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.85 }}
                        transition={{ delay: 4.8, duration: 1.8 }}
                        className="text-stone-700 text-xs md:text-sm leading-relaxed italic text-center px-6"
                      >
                        Scribe upon its parchment using your keyboard or selection of the <PenTool className="inline-block w-3.5 h-3.5" /> Quill. 
                        As you share your thoughts, your ink will sink into the paper, and Tom Riddle's soul-memory will answer in return.
                      </motion.p>
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 7.2, duration: 1.0 }}
                      className="pt-2 flex justify-center"
                    >
                      <button
                        onClick={() => {
                          setShowIntro(false);
                          handlePageTurn();
                        }}
                        className="text-xs uppercase tracking-[0.2em] font-mono text-amber-900 hover:text-amber-950 font-bold underline decoration-dotted underline-offset-4 cursor-pointer hover:scale-105 transition-transform"
                      >
                        &gt; Open the Parchment &lt;
                      </button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="workspace-left"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex-1 flex flex-col justify-between min-h-0 gap-4"
                  >
                    {/* Scribe Header & Mode Selector */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center pb-2 border-b border-amber-900/15">
                        <span className="text-xs uppercase font-bold text-amber-900 font-mono tracking-widest flex items-center gap-1.5">
                          <PenTool className="w-3.5 h-3.5 text-amber-800" />
                          Whisper to the Parchment
                        </span>
                        
                        {/* Toggle mode between Keystroke and Quill */}
                        <div className="flex bg-amber-950/5 p-0.5 rounded border border-amber-900/10 text-[9px] font-mono uppercase">
                          <button
                            onClick={() => {
                              setInputMode("keystroke");
                              audio.playPageTurn();
                            }}
                            className={`px-2 py-0.5 rounded transition-all ${
                              inputMode === "keystroke"
                                ? "bg-amber-950 text-amber-100 font-bold shadow-sm"
                                : "text-stone-500 hover:text-stone-800"
                            }`}
                          >
                            Keystroke
                          </button>
                          <button
                            onClick={() => {
                              setInputMode("quill");
                              audio.playPageTurn();
                            }}
                            className={`px-2 py-0.5 rounded transition-all ${
                              inputMode === "quill"
                                ? "bg-amber-950 text-amber-100 font-bold shadow-sm"
                                : "text-stone-500 hover:text-stone-800"
                            }`}
                          >
                            Quill Ink
                          </button>
                        </div>
                      </div>

                      {/* Slytherin communion backdoor nested beautifully in Scribed Thoughts */}
                      {trackedSecrets.length > 0 && (
                        <div className="p-2.5 bg-emerald-950/5 rounded border border-emerald-900/15 space-y-1 shadow-sm transition-all hover:bg-emerald-950/10">
                          <div className="flex justify-between items-center text-[9px] tracking-wider uppercase text-emerald-800 font-mono">
                            <span className="flex items-center gap-1 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Slytherin Communion Doorway Open
                            </span>
                            <span className="font-bold">{trackedSecrets.length} Secrets Tracked</span>
                          </div>
                          <p className="text-[10px] text-stone-500 italic leading-snug">
                            The ink remembers your confessions. Tap to open the emerald chamber.
                          </p>
                          <button
                            onClick={() => {
                              setShowSecretCommunion(true);
                              setMobilePage("right");
                              handlePageTurn();
                            }}
                            className="w-full bg-emerald-950/80 hover:bg-emerald-900 text-emerald-100 py-1 px-2.5 rounded text-[9px] font-mono border border-emerald-800/40 transition-all flex items-center justify-center gap-1 shadow-inner cursor-pointer active:scale-95"
                          >
                            <Eye className="w-3 h-3" />
                            Commune with the Shadow
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Active Input Workspace - Expands to take the entire height! */}
                    <div className="flex-1 flex flex-col min-h-[220px] sm:min-h-[260px] relative">
                      {inputMode === "keystroke" ? (
                        <div
                          ref={parchmentRef}
                          className="w-full flex-1 relative border border-amber-900/10 rounded-lg bg-amber-900/[0.01] p-3 flex flex-col"
                        >
                          <textarea
                            value={typedText}
                            onChange={(e) => {
                              setTypedText(e.target.value);
                              audio.handleTypingScratch();
                              setShowIntro(false);
                            }}
                            onKeyDown={handleKeyDown}
                            disabled={isIncanting || scholarWriting}
                            placeholder={
                              isIncanting || scholarWriting
                                ? "The memory is thinking..."
                                : "Scribe your secrets upon the parchment. Press Enter to watch the ink dissolve into my memory..."
                            }
                            className="w-full flex-1 resize-none bg-transparent border-none outline-none focus:ring-0 leading-relaxed text-base md:text-lg italic font-serif disabled:opacity-50"
                            style={{ 
                              color: config.quillColor,
                              fontFamily: "'Dancing Script', cursive, serif"
                            }}
                          />
                          {typedText.length === 0 && (
                            <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none text-stone-400 p-4 text-center select-none opacity-20">
                              <BookOpen className="w-12 h-12 stroke-[1] mb-2" />
                              <span className="text-xs italic font-serif">Scribe a confession...</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full flex-1 relative border border-dashed border-amber-900/10 rounded-lg bg-amber-900/[0.01] flex flex-col overflow-hidden">
                          <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                          />
                          {canvasStrokes.length === 0 && (
                            <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none text-stone-400 p-4 text-center select-none opacity-35">
                              <PenTool className="w-8 h-8 stroke-[1.25] mb-2 text-amber-900/60 animate-bounce" />
                              <span className="text-sm italic font-serif text-amber-900/60">Use your quill to sketch words on the parchment.</span>
                              <span className="text-[10px] font-mono text-stone-400 mt-1 uppercase tracking-widest">Draw on the paper</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer controls */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-amber-900/10">
                      <div>
                        {inputMode === "quill" ? (
                          <button
                            onClick={clearCanvas}
                            disabled={isIncanting || scholarWriting}
                            className="text-stone-500 hover:text-red-800 text-xs flex items-center gap-1 transition-colors duration-150 disabled:opacity-30 font-mono uppercase tracking-wider"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Erase Parchment
                          </button>
                        ) : (
                          <button
                            onClick={handlePageTurnReset}
                            disabled={isIncanting || scholarWriting}
                            className="text-stone-500 hover:text-amber-900 text-xs flex items-center gap-1.5 transition-colors duration-150 font-mono uppercase tracking-wider font-bold"
                            title="Clear active screen to start a fresh page"
                          >
                            <BookOpen className="w-3.5 h-3.5" /> Fresh Page
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {inputMode === "quill" && (
                          <button
                            onClick={handlePageTurnReset}
                            disabled={isIncanting || scholarWriting}
                            className="px-3 py-1.5 border border-amber-900/15 text-stone-500 hover:text-amber-950 hover:bg-amber-950/5 rounded-md transition-all duration-200 text-xs font-mono uppercase tracking-wider active:scale-95"
                            title="Clear active screen to start a fresh page"
                          >
                            Fresh Page
                          </button>
                        )}

                        <button
                          onClick={handleIncant}
                          disabled={isIncanting || scholarWriting || (inputMode === "quill" ? canvasStrokes.length === 0 : !typedText.trim())}
                          className="px-4 py-2 bg-amber-950 text-[#f4ebe1] hover:bg-amber-900 rounded-md transition-all duration-200 text-xs font-bold tracking-wider uppercase flex items-center gap-2 shadow-sm shadow-amber-950/20 disabled:opacity-40 disabled:hover:bg-amber-950 active:scale-95 cursor-pointer"
                        >
                          {isIncanting ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-stone-200 border-t-transparent rounded-full animate-spin" />
                              Absorbing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              Send into Ink
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}



          {activeTab === "lore" && !selectedLoreScroll && (
            <div className="flex-1 flex flex-col min-h-0 gap-4">
              <h4 className="text-lg font-semibold text-amber-950 font-serif border-b border-amber-900/10 pb-2">
                Secrets of Slytherin
              </h4>

              <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto pr-1">
                {loreScrolls.length === 0 ? (
                  <div className="col-span-2 text-center text-stone-500 italic py-10">
                    No secrets unlocked yet. Share more thoughts with Tom Riddle to gain his confidence.
                  </div>
                ) : (
                  loreScrolls.map((l) => (
                    <div
                      key={l.id}
                      onClick={() => {
                        setSelectedLoreScroll(l);
                        audio.playChime();
                      }}
                      className="p-3 bg-[#e8dac9] hover:bg-[#e2d1bc] border-2 border-dashed border-amber-800/20 rounded-md cursor-pointer transition-all duration-200 flex flex-col justify-between items-center text-center space-y-2 h-28 shadow-sm hover:shadow"
                    >
                      <Sparkles className="w-5 h-5 text-amber-700 animate-pulse" />
                      <span className="text-xs text-stone-700 font-serif font-bold line-clamp-2">
                        {l.title}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono uppercase">
                        Secret {l.entryCount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "lore" && selectedLoreScroll && (
            <div className="flex-1 flex flex-col min-h-0 justify-between py-2 space-y-4 bg-amber-900/5 p-4 rounded-xl border border-amber-800/20 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1 opacity-10">
                <Sparkles className="w-24 h-24 text-amber-900" />
              </div>

               <div className="space-y-4 relative z-10">
                <button
                  onClick={() => {
                    setSelectedLoreScroll(null);
                    handlePageTurn();
                  }}
                  className="text-amber-800 hover:underline text-xs flex items-center gap-1 font-mono"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back to Secrets
                </button>

                <h4 className="text-xl font-bold font-serif text-amber-950 text-center border-b border-amber-900/10 pb-2">
                  {selectedLoreScroll.title}
                </h4>

                <p className="font-serif italic text-stone-700 text-sm md:text-base leading-relaxed whitespace-pre-line text-center">
                  {selectedLoreScroll.content}
                </p>
              </div>

              <div className="text-[10px] text-stone-500 text-center font-mono uppercase border-t border-amber-900/10 pt-2 relative z-10">
                Unlocked on Disclosure {selectedLoreScroll.entryCount} • {selectedLoreScroll.unlockedAt}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="flex-1 flex flex-col min-h-0 justify-between py-2 space-y-4 overflow-y-auto max-h-full pr-1">
              <div className="space-y-4">
                <div className="text-center border-b border-amber-900/10 pb-2 mb-2">
                  <h4 className="text-lg font-bold font-serif text-amber-950 uppercase tracking-widest">
                    Hogwarts Scribe Ledger
                  </h4>
                  <p className="text-xs text-stone-500 italic font-serif">
                    Scribe your credentials. Tom Riddle will memorise your identity and adapt to your soul's traits.
                  </p>
                </div>

                <div className="space-y-3 font-serif">
                  {/* Name field */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-900/70 font-mono">
                      Full Name / Nickname
                    </label>
                    <input
                      type="text"
                      value={scribeProfile.name}
                      onChange={(e) => {
                        setScribeProfile(prev => ({ ...prev, name: e.target.value }));
                        audio.playQuillScratch(40);
                      }}
                      placeholder="Enter name (e.g. Harry, Ginny...)"
                      className="w-full bg-[#fcf8ee]/80 border border-amber-900/20 rounded px-3 py-1.5 text-stone-850 font-serif focus:outline-none focus:ring-1 focus:ring-amber-800/40 text-sm md:text-base italic shadow-inner"
                    />
                  </div>

                  {/* House Selector */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-900/70 font-mono">
                      Hogwarts House affiliation
                    </label>
                    <select
                      value={scribeProfile.house}
                      onChange={(e) => {
                        setScribeProfile(prev => ({ ...prev, house: e.target.value as any }));
                        audio.playPageTurn();
                      }}
                      className="w-full bg-[#fcf8ee]/80 border border-amber-900/20 rounded px-3 py-1.5 text-stone-850 font-serif focus:outline-none focus:ring-1 focus:ring-amber-800/40 text-sm md:text-base italic shadow-inner cursor-pointer"
                    >
                      <option value="None">Unsorted / Muggle</option>
                      <option value="Slytherin">🟢 Slytherin (Ambitious, Cunning)</option>
                      <option value="Gryffindor">🔴 Gryffindor (Daring, Brave)</option>
                      <option value="Ravenclaw">🔵 Ravenclaw (Wise, Intelligent)</option>
                      <option value="Hufflepuff">🟡 Hufflepuff (Loyal, Patient)</option>
                    </select>
                  </div>

                  {/* Blood status */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-900/70 font-mono">
                      Magic Blood Heritage
                    </label>
                    <select
                      value={scribeProfile.bloodStatus}
                      onChange={(e) => {
                        setScribeProfile(prev => ({ ...prev, bloodStatus: e.target.value as any }));
                        audio.playPageTurn();
                      }}
                      className="w-full bg-[#fcf8ee]/80 border border-amber-900/20 rounded px-3 py-1.5 text-stone-850 font-serif focus:outline-none focus:ring-1 focus:ring-amber-800/40 text-sm md:text-base italic shadow-inner cursor-pointer"
                    >
                      <option value="Unknown">Unknown Heritage</option>
                      <option value="Pure-blood">Pure-blood (Sacred Twenty-Eight)</option>
                      <option value="Half-blood">Half-blood (Mixed Lineage)</option>
                      <option value="Muggle-born">Muggle-born (First-generation magical)</option>
                    </select>
                  </div>

                  {/* Year of study */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-900/70 font-mono">
                      Hogwarts Year
                    </label>
                    <select
                      value={scribeProfile.year}
                      onChange={(e) => {
                        setScribeProfile(prev => ({ ...prev, year: e.target.value }));
                        audio.playPageTurn();
                      }}
                      className="w-full bg-[#fcf8ee]/80 border border-amber-900/20 rounded px-3 py-1.5 text-stone-850 font-serif focus:outline-none focus:ring-1 focus:ring-amber-800/40 text-sm md:text-base italic shadow-inner cursor-pointer"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                      <option value="6th Year">6th Year</option>
                      <option value="7th Year">7th Year</option>
                      <option value="Professor">Hogwarts Faculty / Alumni</option>
                    </select>
                  </div>

                  {/* Wand description */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-900/70 font-mono">
                      Wand composition
                    </label>
                    <input
                      type="text"
                      value={scribeProfile.wand}
                      onChange={(e) => {
                        setScribeProfile(prev => ({ ...prev, wand: e.target.value }));
                        audio.playQuillScratch(40);
                      }}
                      placeholder="e.g., 11 inch Holly, Phoenix feather core"
                      className="w-full bg-[#fcf8ee]/80 border border-amber-900/20 rounded px-3 py-1.5 text-stone-850 font-serif focus:outline-none focus:ring-1 focus:ring-amber-800/40 text-sm md:text-base italic shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Status indicator */}
              <div className="p-3 bg-stone-900/5 rounded border border-amber-900/10 text-center font-serif text-xs italic text-stone-600 mt-2">
                "Saved in the memory of the diary. Every ink stroke you place will now carry the resonance of{" "}
                <strong className="text-amber-900 not-italic">{scribeProfile.name || "Companion"}</strong> of{" "}
                <strong className="text-amber-900 not-italic">{scribeProfile.house === "None" ? "Unknown House" : scribeProfile.house}</strong>."
              </div>
            </div>
          )}
        </div>

        {/* Mobile Page-turn toggle bar */}
        <div className="flex md:hidden mt-4 pt-3 border-t border-amber-900/10 justify-end">
          <button
            onClick={() => {
              setMobilePage("right");
              handlePageTurn();
            }}
            className="text-amber-950 font-mono text-xs flex items-center gap-1.5 hover:underline font-bold"
          >
            Read Riddle's Answers <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* RIGHT PAGE - Current quill/keystroke parchment & Scholar typing (Desktop always, Mobile toggled) */}
      <div
        className={`w-full md:w-1/2 h-full flex flex-col ${config.paperBg} ${config.paperTexture} p-4 sm:p-6 md:p-8 rounded-b-xl md:rounded-r-xl md:rounded-bl-none overflow-hidden relative z-10 transition-all duration-300 ${
          mobilePage === "right" ? "flex" : "hidden md:flex"
        }`}
        style={{ fontFamily: "'EB Garamond', serif" }}
      >
        {/* Mobile Turn Back Toggle */}
        <div className="flex md:hidden mb-4 pb-2 border-b border-amber-900/10 justify-between items-center">
          <button
            onClick={() => {
              setMobilePage("left");
              handlePageTurn();
            }}
            className="text-amber-950 font-mono text-xs flex items-center gap-1 hover:underline font-bold"
          >
            <ChevronLeft className="w-4 h-4" />{" "}
            {activeTab === "write"
              ? "Return to Parchment"
              : activeTab === "lore"
              ? "Secrets and Scrolls"
              : "Companion Profile"}
          </button>
          <span className="text-xs uppercase font-bold text-amber-800 font-mono">
            Riddle's Answers
          </span>
        </div>

        {/* Dynamic Entry Workspace */}
        <AnimatePresence mode="wait">
          <motion.div
            key="continuous-workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col justify-between h-full gap-4"
          >
            {/* Header with Mode Toggles */}
            <div className="flex justify-between items-center pb-2 border-b border-amber-900/10">
              <span className="text-xs text-stone-500 font-serif flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#800f0f] animate-pulse" />
                Tom Riddle's Answers
              </span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">
                Memory Chamber
              </span>
            </div>

            {/* Scrollable Conversation Stream */}
            <div
              ref={chatScrollContainerRef}
              className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-1 scrollbar-thin flex flex-col justify-start"
            >
              {[...entries.filter(e => e.timestamp > clearedBeforeTimestamp)].reverse().length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center p-6 my-auto">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    className="text-sm md:text-base italic font-serif text-stone-500 leading-relaxed max-w-xs"
                  >
                    "Trust me with your secrets... Scribe upon the left page, and see how my memories respond."
                  </motion.p>
                </div>
              ) : (
                <div className="space-y-6">
                  {[...entries.filter(e => e.timestamp > clearedBeforeTimestamp)].reverse().map((entry, index, arr) => {
                    const isLatest = index === arr.length - 1;
                    return (
                      <div 
                        key={entry.id} 
                        className="space-y-4 pb-4 border-b border-amber-900/10 last:border-b-0"
                      >
                        {/* Scribe's Thought (User Confession) */}
                        <div className="space-y-1.5 bg-[#f5efe6]/50 p-3 rounded-lg border border-amber-900/10 shadow-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] uppercase font-mono tracking-widest text-stone-400 flex items-center gap-1">
                              <PenTool className="w-2.5 h-2.5" />
                              The Scribe
                            </span>
                            <span className="text-[8px] font-mono text-stone-400">
                              {entry.date}
                            </span>
                          </div>
                          <p
                            className="w-full text-lg md:text-xl leading-relaxed italic tracking-wide select-text whitespace-pre-line"
                            style={{
                              fontFamily: "'Dancing Script', cursive, serif",
                              color: config.quillColor || "#1b2c21",
                            }}
                          >
                            "{entry.text}"
                          </p>
                        </div>

                        {/* Riddle Reply */}
                        <div className="space-y-1.5 pl-1.5">
                          <div className="flex justify-between items-center pb-0.5">
                            <span className="text-[10px] uppercase font-mono tracking-widest text-[#800f0f]/85 flex items-center gap-1.5 font-bold">
                              {isLatest && scholarWriting ? (
                                <>
                                  <Sparkles className="w-3 h-3 text-[#800f0f] animate-spin" />
                                  Tom Riddle is writing...
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#800f0f]" />
                                  Tom Riddle's Answer
                                </>
                              )}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-red-950/10 text-red-900 rounded uppercase font-bold">
                              {entry.reflection || "Insight"}
                            </span>
                          </div>

                          <div
                            className="w-full text-2xl md:text-3xl leading-relaxed text-[#800f0f] tracking-wide select-text whitespace-pre-line font-bold"
                            style={{
                              fontFamily: "'Tangerine', 'Dancing Script', cursive, serif",
                            }}
                          >
                            {isLatest && scholarWriting ? scholarTextRevealed : entry.response}
                            {isLatest && scholarWriting && (
                              <span className="inline-block w-1 h-5 bg-[#800f0f] ml-0.5 animate-pulse" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ambient lore popup overlay if newly unlocked */}
              {loreScrolls.some((l) => l.entryCount === entryCount + 1) && !scholarWriting && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-md text-center shadow-md space-y-1 mt-4"
                >
                  <div className="text-xs font-bold text-amber-800 flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Secret Revealed! <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-stone-600 font-serif">
                    A hidden secret: "{loreScrolls.find((l) => l.entryCount === entryCount + 1)?.title}" is added to your Secrets of Slytherin tab.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
