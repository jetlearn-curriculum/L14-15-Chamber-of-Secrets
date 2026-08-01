import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "gen-lang-client-0852391485",
  appId: "1:584164969432:web:e5a2812d1a7f20090480ad",
  apiKey: "AIzaSyBH-0VhsrTLz63krhuzXJW5cmrfYn6yd0w",
  authDomain: "gen-lang-client-0852391485.firebaseapp.com",
  storageBucket: "gen-lang-client-0852391485.firebasestorage.app",
  messagingSenderId: "584164969432"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-chamberofsecrets-8f02e0ab-60e6-49f0-a7b1-88d5b081b197");

