// Ambient Sound Synthesizer using Web Audio API

interface MelodicNote {
  freq: number;
  duration: number; // in beats where 1 beat = approx 550ms
}

const HEDWIG_MELODY: MelodicNote[] = [
  { freq: 493.88, duration: 1 },   // B4 (intro)
  { freq: 659.25, duration: 1.5 }, // E5
  { freq: 783.99, duration: 0.5 }, // G5
  { freq: 739.99, duration: 1 },   // F#5
  { freq: 659.25, duration: 2 },   // E5
  { freq: 987.77, duration: 1 },   // B5
  { freq: 880.00, duration: 3 },   // A5
  
  { freq: 739.99, duration: 3 },   // F#5
  
  { freq: 659.25, duration: 1.5 }, // E5
  { freq: 783.99, duration: 0.5 }, // G5
  { freq: 739.99, duration: 1 },   // F#5
  { freq: 622.25, duration: 2 },   // D#5
  { freq: 698.46, duration: 1 },   // F5
  { freq: 493.88, duration: 3 },   // B4
  
  { freq: 0,      duration: 1.5 }, // Rest
  
  { freq: 493.88, duration: 1 },   // B4
  { freq: 659.25, duration: 1.5 }, // E5
  { freq: 783.99, duration: 0.5 }, // G5
  { freq: 739.99, duration: 1 },   // F#5
  { freq: 659.25, duration: 2 },   // E5
  { freq: 987.77, duration: 1 },   // B5
  { freq: 1174.66, duration: 2 },  // D6
  { freq: 1109.73, duration: 1 },  // C#6
  { freq: 1046.50, duration: 2 },  // C6
  
  { freq: 830.61, duration: 1 },   // G#5
  { freq: 1046.50, duration: 1.5 },// C6
  { freq: 987.77, duration: 0.5 }, // B5
  { freq: 932.33, duration: 1 },   // Bb5
  { freq: 622.25, duration: 2 },   // D#5
  { freq: 783.99, duration: 1 },   // G5
  { freq: 659.25, duration: 3 },   // E5
  
  { freq: 0,      duration: 4 }    // Outro Rest
];

class AudioManager {
  private ctx: AudioContext | null = null;
  
  // Ambient Sound Nodes
  private rainNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private fireNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private libraryNode: ScriptProcessorNode | null = null;
  private rainGain: GainNode | null = null;
  private fireGain: GainNode | null = null;
  private libraryGain: GainNode | null = null;
  private themeGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  
  // State
  private isRainPlaying = false;
  private isFirePlaying = false;
  private isLibraryPlaying = false;
  private isThemePlaying = false;
  private rainVolume = 0.3;
  private fireVolume = 0.3;
  private libraryVolume = 0.25;
  private themeVolume = 0.35;
  private isInitialized = false;

  // Theme sequencer state
  private themeTimeout: any = null;
  private currentNoteIndex = 0;

  // Continuous Typing Scratch State
  private continuousScratchNode: ScriptProcessorNode | null = null;
  private continuousScratchGain: GainNode | null = null;
  private isScratching = false;
  private scratchTimeout: any = null;

  constructor() {}

  init() {
    if (this.isInitialized) return;
    try {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.rainGain.connect(this.masterGain);

      this.fireGain = this.ctx.createGain();
      this.fireGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.fireGain.connect(this.masterGain);

      this.libraryGain = this.ctx.createGain();
      this.libraryGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.libraryGain.connect(this.masterGain);

      this.themeGain = this.ctx.createGain();
      this.themeGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.themeGain.connect(this.masterGain);

      // Create Rain Synthesizer Node
      this.setupRainSynth();
      // Create Fireplace Synthesizer Node
      this.setupFireSynth();
      // Create Distant Library Echoes Node
      this.setupLibrarySynth();

      // Resume on any click/touch gesture to satisfy browser autoplay policy
      const resume = () => {
        if (this.ctx && this.ctx.state === "suspended") {
          this.ctx.resume().then(() => {
            console.log("AudioContext resumed successfully via gesture.");
          }).catch(e => console.warn("Failed to resume AudioContext:", e));
        }
      };
      window.addEventListener("click", resume, { once: true });
      window.addEventListener("touchend", resume, { once: true });

      this.isInitialized = true;
    } catch (e) {
      console.error("Failed to initialize Web Audio API:", e);
    }
  }

  private setupRainSynth() {
    if (!this.ctx || !this.rainGain) return;
    const bufferSize = 4096;
    // Create random noise for rain
    // Use ScriptProcessorNode as fallback since AudioWorklet setup requires separate files
    const node = this.ctx.createScriptProcessor(bufferSize, 1, 1);
    
    // Lowpass and Highpass filters for rain color
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(1200, this.ctx.currentTime);

    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(200, this.ctx.currentTime);

    // LFO for wind-blown volume modulation
    let lastOut = 0;
    node.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // White noise
        const white = Math.random() * 2 - 1;
        // Simple low-pass filter inside process for extra softness
        lastOut = 0.9 * lastOut + 0.1 * white;
        output[i] = lastOut;
      }
    };

    node.connect(lp);
    lp.connect(hp);
    hp.connect(this.rainGain);
    this.rainNode = node;
  }

  private setupFireSynth() {
    if (!this.ctx || !this.fireGain) return;
    const bufferSize = 4096;
    
    // Core low-frequency rumble node
    const node = this.ctx.createScriptProcessor(bufferSize, 1, 1);
    
    // Soft low pass for fire hum
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(150, this.ctx.currentTime);

    // High pass filter to cut sub-bass rumble
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(120, this.ctx.currentTime);

    // Filtered noise loop for wood combustion
    let lastOut = 0;
    node.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = 0.95 * lastOut + 0.05 * white;
        output[i] = lastOut * 0.02; // Drastically reduced volume (1/20th) to remove explosive rumble
      }
    };

    node.connect(lp);
    lp.connect(hp);
    hp.connect(this.fireGain);
    this.fireNode = node;

    // Fire crackle/pop sound schedule
    this.scheduleCrackles();
  }

  private scheduleCrackles() {
    if (!this.ctx || !this.fireGain) return;

    const triggerCrackle = () => {
      if (!this.isFirePlaying) {
        setTimeout(triggerCrackle, 500 + Math.random() * 2000);
        return;
      }

      try {
        const now = this.ctx!.currentTime;
        // Create highly filtered sharp pops
        const osc = this.ctx!.createOscillator();
        const popGain = this.ctx!.createGain();
        const popFilter = this.ctx!.createBiquadFilter();

        osc.type = "sine";
        // Random pitch for pops
        osc.frequency.setValueAtTime(600 + Math.random() * 2000, now);
        
        popFilter.type = "bandpass";
        popFilter.frequency.setValueAtTime(1500 + Math.random() * 3000, now);
        popFilter.Q.setValueAtTime(5, now);

        // Crackle volume envelope (extremely sharp attack, fast decay)
        const duration = 0.005 + Math.random() * 0.03;
        const popVol = (0.05 + Math.random() * 0.25) * this.fireVolume;

        popGain.gain.setValueAtTime(0, now);
        popGain.gain.linearRampToValueAtTime(popVol, now + 0.001);
        popGain.gain.exponentialRampToValueAtTime(0.00001, now + duration);

        osc.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(this.masterGain!);

        osc.start(now);
        osc.stop(now + duration + 0.01);
      } catch (e) {
        // Ignored
      }

      // Schedule next crackle at random interval
      setTimeout(triggerCrackle, 50 + Math.random() * 800);
    };

    triggerCrackle();
  }

  private setupLibrarySynth() {
    if (!this.ctx || !this.libraryGain) return;
    const bufferSize = 8192;
    
    // Low room resonance hum (standing waves in stone hall)
    const node = this.ctx.createScriptProcessor(bufferSize, 1, 1);
    
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(160, this.ctx.currentTime); // Raised from 90 to 160 for a lighter atmosphere

    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(140, this.ctx.currentTime); // Raised from 30 to 140 to completely cut out sub-bass rumbling

    // Noise process for a deep cavernous airy background
    let lastOut = 0;
    node.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = 0.98 * lastOut + 0.02 * white; // heavy low-pass filtering
        output[i] = lastOut * 0.02; // Drastically reduced from 0.15 to 0.02 to avoid mud
      }
    };

    node.connect(lp);
    lp.connect(hp);
    hp.connect(this.libraryGain);
    this.libraryNode = node;

    // Distant cavernous echo schedule
    this.scheduleLibraryEchoes();
  }

  private scheduleLibraryEchoes() {
    if (!this.ctx || !this.libraryGain) return;

    const triggerEcho = () => {
      if (!this.isLibraryPlaying) {
        setTimeout(triggerEcho, 2000);
        return;
      }

      try {
        const now = this.ctx!.currentTime;
        const choice = Math.random();

        if (choice < 0.4) {
          // 1. Distant Page Flip / Book closing rustle
          const duration = 0.3 + Math.random() * 0.4;
          const osc = this.ctx!.createOscillator();
          const pGain = this.ctx!.createGain();
          const filter = this.ctx!.createBiquadFilter();

          osc.type = "triangle";
          osc.frequency.setValueAtTime(100, now);
          osc.frequency.exponentialRampToValueAtTime(600 + Math.random() * 400, now + duration * 0.3);
          osc.frequency.exponentialRampToValueAtTime(80, now + duration);

          filter.type = "bandpass";
          filter.frequency.setValueAtTime(800 + Math.random() * 1200, now);
          filter.Q.setValueAtTime(1.5, now);

          pGain.gain.setValueAtTime(0, now);
          pGain.gain.linearRampToValueAtTime(0.012 * this.libraryVolume, now + 0.05);
          pGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

          osc.connect(filter);
          filter.connect(pGain);
          pGain.connect(this.masterGain!);

          osc.start(now);
          osc.stop(now + duration + 0.1);
        } else if (choice < 0.7) {
          // 2. Beautiful Wand Sparkle/Harp Arpeggio (replaces low explosion rumble)
          const notes = [329.63, 392.00, 493.88, 587.33]; // Em7 (E4, G4, B4, D5) magical arpeggio
          const duration = 1.2;
          notes.forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gNode = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            osc.frequency.exponentialRampToValueAtTime(freq * 2, now + idx * 0.1 + 0.4);

            filter.type = "lowpass";
            filter.frequency.setValueAtTime(freq * 1.5, now);

            gNode.gain.setValueAtTime(0, now + idx * 0.1);
            gNode.gain.linearRampToValueAtTime(0.02 * this.libraryVolume, now + idx * 0.1 + 0.02);
            gNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.7);

            osc.connect(filter);
            filter.connect(gNode);
            gNode.connect(this.masterGain!);

            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.8);
          });
        } else {
          // 3. Ghostly Whisper/Distant wind gust echoing
          const duration = 2.0 + Math.random() * 3.0;
          const bufferSize = this.ctx!.sampleRate * duration;
          const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
          const data = buffer.getChannelData(0);
          
          let lastOut = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = 0.9 * lastOut + 0.1 * white;
            data[i] = lastOut;
          }

          const source = this.ctx!.createBufferSource();
          source.buffer = buffer;

          const filter = this.ctx!.createBiquadFilter();
          filter.type = "bandpass";
          // Sweep bandpass frequency to simulate ghostly breathing wind
          filter.frequency.setValueAtTime(600 + Math.random() * 300, now);
          filter.frequency.exponentialRampToValueAtTime(300 + Math.random() * 150, now + duration * 0.5);
          filter.frequency.exponentialRampToValueAtTime(700 + Math.random() * 200, now + duration);
          filter.Q.setValueAtTime(2.0, now);

          const wGain = this.ctx!.createGain();
          wGain.gain.setValueAtTime(0, now);
          wGain.gain.linearRampToValueAtTime(0.015 * this.libraryVolume, now + duration * 0.3);
          wGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

          source.connect(filter);
          filter.connect(wGain);
          wGain.connect(this.masterGain!);

          source.start(now);
          source.stop(now + duration + 0.1);
        }
      } catch (e) {
        // Safe fail
      }

      // Schedule next echo at random interval (e.g. 5 to 12 seconds)
      setTimeout(triggerEcho, 4000 + Math.random() * 8000);
    };

    triggerEcho();
  }

  toggleRain(play: boolean) {
    this.init();
    if (!this.ctx || !this.rainGain) return;
    
    this.isRainPlaying = play;
    const now = this.ctx.currentTime;

    if (play) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.rainGain.gain.cancelScheduledValues(now);
      this.rainGain.gain.linearRampToValueAtTime(this.rainVolume, now + 2.0); // Slow fade-in
    } else {
      this.rainGain.gain.cancelScheduledValues(now);
      this.rainGain.gain.linearRampToValueAtTime(0, now + 1.5); // Smooth fade-out
    }
  }

  toggleFire(play: boolean) {
    this.init();
    if (!this.ctx || !this.fireGain) return;

    this.isFirePlaying = play;
    const now = this.ctx.currentTime;

    if (play) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.fireGain.gain.cancelScheduledValues(now);
      this.fireGain.gain.linearRampToValueAtTime(this.fireVolume, now + 2.0);
    } else {
      this.fireGain.gain.cancelScheduledValues(now);
      this.fireGain.gain.linearRampToValueAtTime(0, now + 1.5);
    }
  }

  setRainVolume(vol: number) {
    this.rainVolume = Math.max(0, Math.min(1, vol));
    if (this.isRainPlaying && this.rainGain && this.ctx) {
      this.rainGain.gain.setValueAtTime(this.rainVolume, this.ctx.currentTime);
    }
  }

  setFireVolume(vol: number) {
    this.fireVolume = Math.max(0, Math.min(1, vol));
    if (this.isFirePlaying && this.fireGain && this.ctx) {
      this.fireGain.gain.setValueAtTime(this.fireVolume, this.ctx.currentTime);
    }
  }

  toggleLibrary(play: boolean) {
    this.init();
    if (!this.ctx || !this.libraryGain) return;

    this.isLibraryPlaying = play;
    const now = this.ctx.currentTime;

    if (play) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.libraryGain.gain.cancelScheduledValues(now);
      this.libraryGain.gain.linearRampToValueAtTime(this.libraryVolume, now + 3.0); // Gentle slow fade-in
    } else {
      this.libraryGain.gain.cancelScheduledValues(now);
      this.libraryGain.gain.linearRampToValueAtTime(0, now + 2.0); // Smooth slow fade-out
    }
  }

  setLibraryVolume(vol: number) {
    this.libraryVolume = Math.max(0, Math.min(1, vol));
    if (this.isLibraryPlaying && this.libraryGain && this.ctx) {
      this.libraryGain.gain.setValueAtTime(this.libraryVolume, this.ctx.currentTime);
    }
  }

  // --- SOUND EFFECTS ---

  playPageTurn() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Sweep frequency to mimic paper rustling
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.35);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.linearRampToValueAtTime(400, now + 0.35);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  playQuillScratch(durationMs = 150) {
    this.init();
    if (!this.ctx || this.ctx.state === "suspended") return;
    try {
      const now = this.ctx.currentTime;
      
      // Synthesize scratch noise with highpass and bandpass filters
      const bufferSize = this.ctx.sampleRate * (durationMs / 1000);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Soften white noise to pinker scratch
        lastOut = 0.85 * lastOut + 0.15 * white;
        data[i] = lastOut;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(4000, now); // Paper texture scratching frequencies
      filter.Q.setValueAtTime(3, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (durationMs / 1000));

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      noiseNode.start(now);
    } catch (e) {}
  }

  playChime() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const chords = [329.63, 392.00, 493.88, 587.33]; // Em7 (E, G, B, D) beautiful ethereal minor chords
      
      chords.forEach((freq, index) => {
        const osc = this.ctx!.createOscillator();
        const oscGain = this.ctx!.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + index * 0.06); // Stagger notes for arpeggio

        oscGain.gain.setValueAtTime(0, now + index * 0.06);
        oscGain.gain.linearRampToValueAtTime(0.08, now + index * 0.06 + 0.02);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.06 + 2.0);

        // Add a soft bandpass filter for celestial resonance
        const filter = this.ctx!.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(freq * 1.5, now);
        filter.Q.setValueAtTime(1, now);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(this.masterGain!);

        osc.start(now + index * 0.06);
        osc.stop(now + index * 0.06 + 2.1);
      });
    } catch (e) {}
  }

  playCandleBlow() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.3; // 300ms whoosh
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(200, now);
      lp.frequency.exponentialRampToValueAtTime(20, now + 0.3);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      noiseNode.connect(lp);
      lp.connect(gain);
      gain.connect(this.masterGain!);

      noiseNode.start(now);
    } catch (e) {}
  }

  playWhisper() {
    this.init();
    if (!this.ctx || this.ctx.state === "suspended") return;
    try {
      const now = this.ctx.currentTime;
      const duration = 1.8 + Math.random() * 2.2; // 1.8s - 4.0s
      const sampleRate = this.ctx.sampleRate;
      const bufferSize = sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Soft pinkish/white noise mix
        lastOut = 0.82 * lastOut + 0.18 * white;
        data[i] = lastOut;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Two resonant bandpass filters for ghostly vocal formant simulation ('shh', 'oo', 'ah')
      const filter1 = this.ctx.createBiquadFilter();
      filter1.type = "bandpass";
      filter1.Q.setValueAtTime(7, now);

      const filter2 = this.ctx.createBiquadFilter();
      filter2.type = "bandpass";
      filter2.Q.setValueAtTime(5, now);

      filter1.frequency.setValueAtTime(750 + Math.random() * 300, now);
      filter2.frequency.setValueAtTime(2100 + Math.random() * 600, now);

      // Program subtle syllable-like sweeps over time
      const syllables = 3 + Math.floor(Math.random() * 4);
      for (let j = 1; j <= syllables; j++) {
        const t = now + (duration * (j / syllables));
        const freq1 = 550 + Math.random() * 700;
        const freq2 = 1700 + Math.random() * 1100;
        filter1.frequency.exponentialRampToValueAtTime(freq1, t);
        filter2.frequency.exponentialRampToValueAtTime(freq2, t);
      }

      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.012, now + 0.4); // extremely subtle low volume

      // Syllable pulsing volume envelope
      for (let j = 1; j < syllables; j++) {
        const t = now + (duration * (j / syllables));
        const pulseVol = 0.002 + Math.random() * 0.009;
        gainNode.gain.linearRampToValueAtTime(pulseVol, t);
        gainNode.gain.linearRampToValueAtTime(0.001, t + 0.18);
      }
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const merger = this.ctx.createGain();
      merger.gain.setValueAtTime(0.5, now);

      noiseSource.connect(filter1);
      noiseSource.connect(filter2);
      
      filter1.connect(merger);
      filter2.connect(merger);
      
      merger.connect(gainNode);
      gainNode.connect(this.masterGain!);

      noiseSource.start(now);
    } catch (e) {
      console.warn("Failed to play whisper sound:", e);
    }
  }

  startContinuousQuillScratch() {
    this.init();
    if (!this.ctx || this.ctx.state === "suspended") return;
    try {
      const now = this.ctx.currentTime;
      if (!this.continuousScratchNode) {
        const bufferSize = 2048;
        const node = this.ctx.createScriptProcessor(bufferSize, 1, 1);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(3900, now);
        filter.Q.setValueAtTime(3.5, now);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);

        let lastOut = 0;
        node.onaudioprocess = (e) => {
          const output = e.outputBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = 0.83 * lastOut + 0.17 * white;
            
            // Subtle, dynamic oscillation simulating physical paper strokes and variation
            const mod = 0.75 + 0.25 * Math.sin(Date.now() * 0.012 + i * 0.005);
            output[i] = lastOut * mod;
          }
        };

        node.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain!);

        this.continuousScratchNode = node;
        this.continuousScratchGain = gainNode;
      }

      if (this.continuousScratchGain) {
        this.continuousScratchGain.gain.cancelScheduledValues(now);
        // Soft ramp up to prevent pops
        this.continuousScratchGain.gain.linearRampToValueAtTime(0.045, now + 0.05);
      }
      this.isScratching = true;
    } catch (e) {
      console.warn("Failed to play continuous scratch:", e);
    }
  }

  stopContinuousQuillScratch() {
    if (!this.ctx || !this.continuousScratchGain) return;
    try {
      const now = this.ctx.currentTime;
      this.continuousScratchGain.gain.cancelScheduledValues(now);
      this.continuousScratchGain.gain.linearRampToValueAtTime(0, now + 0.2);
      this.isScratching = false;
    } catch (e) {}
  }

  handleTypingScratch() {
    this.init();
    if (!this.ctx || this.ctx.state === "suspended") return;

    if (!this.isScratching) {
      this.startContinuousQuillScratch();
    }

    if (this.scratchTimeout) {
      clearTimeout(this.scratchTimeout);
    }

    this.scratchTimeout = setTimeout(() => {
      this.stopContinuousQuillScratch();
    }, 550);
  }

  private playNextThemeNote() {
    if (!this.isThemePlaying || !this.ctx || !this.themeGain) return;

    try {
      // If suspended, do not schedule yet - wait 500ms and try again
      if (this.ctx.state === "suspended") {
        this.themeTimeout = setTimeout(() => {
          this.playNextThemeNote();
        }, 500);
        return;
      }

      const now = this.ctx.currentTime;
      const beatDuration = 0.55; // 550ms per beat (approx 110 BPM)
      
      const currentNote = HEDWIG_MELODY[this.currentNoteIndex];
      const durationSecs = currentNote.duration * beatDuration;

      if (currentNote.freq > 0) {
        const freq = currentNote.freq;
        
        // Celesta Bell synthesizer using a clean combination of oscillators
        const osc1 = this.ctx.createOscillator(); // Main Fundamental (Sine)
        const osc2 = this.ctx.createOscillator(); // Celestial Bell octave chime (Sine)
        const osc3 = this.ctx.createOscillator(); // Subtle Warm Sub (Triangle)
        
        const voiceGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(freq, now);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(freq * 2, now); // Octave

        osc3.type = "triangle";
        osc3.frequency.setValueAtTime(freq * 0.5, now); // Sub-octave warmth

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(freq * 3, now); // Smooth out high-frequency harshness
        filter.Q.setValueAtTime(1, now);

        // Vol envelopes
        voiceGain.gain.setValueAtTime(0, now);
        // Extremely fast attack
        voiceGain.gain.linearRampToValueAtTime(this.themeVolume * 0.22, now + 0.015);
        // Exponential decay for beautiful music box tail
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSecs * 1.5);

        // Connect everything
        osc1.connect(filter);
        osc2.connect(filter);
        osc3.connect(filter);
        
        filter.connect(voiceGain);
        voiceGain.connect(this.themeGain);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);

        osc1.stop(now + durationSecs * 1.6);
        osc2.stop(now + durationSecs * 1.6);
        osc3.stop(now + durationSecs * 1.6);
      }

      // Advance note index
      this.currentNoteIndex = (this.currentNoteIndex + 1) % HEDWIG_MELODY.length;

      // Schedule next note
      this.themeTimeout = setTimeout(() => {
        this.playNextThemeNote();
      }, durationSecs * 1000);

    } catch (e) {
      console.error("Theme music sequencer error:", e);
    }
  }

  toggleTheme(play: boolean) {
    this.init();
    if (!this.ctx || !this.themeGain) return;

    this.isThemePlaying = play;
    const now = this.ctx.currentTime;

    if (play) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(e => console.log("Failed to resume AudioContext in toggle:", e));
      }
      
      this.themeGain.gain.cancelScheduledValues(now);
      this.themeGain.gain.linearRampToValueAtTime(1.0, now + 1.5); // Ramp up channel gain safely
      
      if (!this.themeTimeout) {
        this.currentNoteIndex = 0;
        this.playNextThemeNote();
      }
    } else {
      this.themeGain.gain.cancelScheduledValues(now);
      this.themeGain.gain.linearRampToValueAtTime(0, now + 1.0); // Soft fade-out
      
      if (this.themeTimeout) {
        clearTimeout(this.themeTimeout);
        this.themeTimeout = null;
      }
    }
  }

  setThemeVolume(vol: number) {
    this.themeVolume = Math.max(0, Math.min(1, vol));
  }
}

export const audio = new AudioManager();

// Bulletproof global interaction listener to unlock Web Audio context on very first user gesture
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    audio.init();
    const ctx = (audio as any).ctx;
    if (ctx && ctx.state === "suspended") {
      ctx.resume().then(() => {
        console.log("AudioContext successfully unlocked via global interaction gesture.");
      }).catch((e: any) => console.warn("Global audio resume failed:", e));
    }
    // Remove listeners once successfully unlocked or on first gesture to avoid overhead
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("touchend", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
  };
  window.addEventListener("click", unlockAudio);
  window.addEventListener("touchend", unlockAudio);
  window.addEventListener("keydown", unlockAudio);
}
