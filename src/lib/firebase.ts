import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "scientific-lambda-v09p9",
  appId: "1:73980637939:web:702fa51495f198afdf7d86",
  apiKey: "AIzaSyCc1gGuPorPE5KRyMpqbThhu02pAGKgESM",
  authDomain: "scientific-lambda-v09p9.firebaseapp.com",
  storageBucket: "scientific-lambda-v09p9.firebasestorage.app",
  messagingSenderId: "73980637939",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-tomriddlesdiary-f351b1a6-c0ab-4270-8d62-d1b2b0b3fa6a");
