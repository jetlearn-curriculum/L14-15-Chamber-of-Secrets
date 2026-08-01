import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDl15IJzIJ7Kbgbt67hz2sfO6UIla7V2Ac",
  authDomain: "chamber-of-secrets-71f18.firebaseapp.com",
  projectId: "chamber-of-secrets-71f18",
  storageBucket: "chamber-of-secrets-71f18.firebasestorage.app",
  messagingSenderId: "292928292438",
  appId: "1:292928292438:web:ec24314c07aaebe31f1df7",
  measurementId: "G-9DFY0FV8S4"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
