import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC_vnckUwReJH6HxbIOHKGKYLgSXNotGmE",
  authDomain: "pay-rolls-management-system.firebaseapp.com",
  projectId: "pay-rolls-management-system",
  storageBucket: "pay-rolls-management-system.firebasestorage.app",
  messagingSenderId: "125473801987",
  appId: "1:125473801987:web:2e7c5c1a636dafacb7cb36",
  measurementId: "G-M0L82RE4T4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account",
});