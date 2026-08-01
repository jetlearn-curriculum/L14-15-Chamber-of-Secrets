import { useState, useEffect } from "react";
import { audio } from "../utils/audio";

export interface AmbientAudioControls {
  ambientMuted: boolean;
  setAmbientMuted: (muted: boolean) => void;
  rainOn: boolean;
  setRainOn: (on: boolean) => void;
  rainVol: number;
  setRainVol: (vol: number) => void;
  fireOn: boolean;
  setFireOn: (on: boolean) => void;
  fireVol: number;
  setFireVol: (vol: number) => void;
  libraryOn: boolean;
  setLibraryOn: (on: boolean) => void;
  libraryVol: number;
  setLibraryVol: (vol: number) => void;
  themeOn: boolean;
  setThemeOn: (on: boolean) => void;
  themeVol: number;
  setThemeVol: (vol: number) => void;
}

export function useAmbientAudio(): AmbientAudioControls {
  const [ambientMuted, setAmbientMuted] = useState<boolean>(() => {
    const saved = localStorage.getItem("ambient_muted");
    return saved ? JSON.parse(saved) : false;
  });

  const [rainOn, setRainOn] = useState<boolean>(() => {
    const saved = localStorage.getItem("ambient_rain_on");
    return saved ? JSON.parse(saved) : true;
  });

  const [rainVol, setRainVol] = useState<number>(() => {
    const saved = localStorage.getItem("ambient_rain_vol");
    return saved ? parseFloat(saved) : 0.2;
  });

  const [fireOn, setFireOn] = useState<boolean>(() => {
    const saved = localStorage.getItem("ambient_fire_on");
    return saved ? JSON.parse(saved) : true; // Hearth default ON for cozy immersion
  });

  const [fireVol, setFireVol] = useState<number>(() => {
    const saved = localStorage.getItem("ambient_fire_vol");
    return saved ? parseFloat(saved) : 0.25;
  });

  const [libraryOn, setLibraryOn] = useState<boolean>(() => {
    const saved = localStorage.getItem("ambient_library_on");
    return saved ? JSON.parse(saved) : true; // Library Echoes default ON for dungeon study feeling!
  });

  const [libraryVol, setLibraryVol] = useState<number>(() => {
    const saved = localStorage.getItem("ambient_library_vol");
    return saved ? parseFloat(saved) : 0.2;
  });

  const [themeOn, setThemeOn] = useState<boolean>(() => {
    const saved = localStorage.getItem("ambient_theme_on");
    return saved ? JSON.parse(saved) : true; // Default ON to welcome the user!
  });

  const [themeVol, setThemeVol] = useState<number>(() => {
    const saved = localStorage.getItem("ambient_theme_vol");
    return saved ? parseFloat(saved) : 0.35;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem("ambient_muted", JSON.stringify(ambientMuted));
  }, [ambientMuted]);

  useEffect(() => {
    localStorage.setItem("ambient_rain_on", JSON.stringify(rainOn));
  }, [rainOn]);

  useEffect(() => {
    localStorage.setItem("ambient_rain_vol", rainVol.toString());
  }, [rainVol]);

  useEffect(() => {
    localStorage.setItem("ambient_fire_on", JSON.stringify(fireOn));
  }, [fireOn]);

  useEffect(() => {
    localStorage.setItem("ambient_fire_vol", fireVol.toString());
  }, [fireVol]);

  useEffect(() => {
    localStorage.setItem("ambient_library_on", JSON.stringify(libraryOn));
  }, [libraryOn]);

  useEffect(() => {
    localStorage.setItem("ambient_library_vol", libraryVol.toString());
  }, [libraryVol]);

  useEffect(() => {
    localStorage.setItem("ambient_theme_on", JSON.stringify(themeOn));
  }, [themeOn]);

  useEffect(() => {
    localStorage.setItem("ambient_theme_vol", themeVol.toString());
  }, [themeVol]);

  // Sync to AudioManager
  useEffect(() => {
    const active = !ambientMuted;
    audio.toggleRain(rainOn && active);
    audio.setRainVolume(rainVol);
  }, [rainOn, rainVol, ambientMuted]);

  useEffect(() => {
    const active = !ambientMuted;
    audio.toggleFire(fireOn && active);
    audio.setFireVolume(fireVol);
  }, [fireOn, fireVol, ambientMuted]);

  useEffect(() => {
    const active = !ambientMuted;
    audio.toggleLibrary(libraryOn && active);
    audio.setLibraryVolume(libraryVol);
  }, [libraryOn, libraryVol, ambientMuted]);

  useEffect(() => {
    const active = !ambientMuted;
    audio.toggleTheme(themeOn && active);
    audio.setThemeVolume(themeVol);
  }, [themeOn, themeVol, ambientMuted]);

  return {
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
  };
}
