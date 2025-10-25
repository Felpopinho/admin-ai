import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDNITA081TuIkFvHsd_zsH0aOPtzO8BUGk",
  authDomain: "admin-ai-fd783.firebaseapp.com",
  projectId: "admin-ai-fd783",
  storageBucket: "admin-ai-fd783.firebasestorage.app",
  messagingSenderId: "338940027519",
  appId: "1:338940027519:web:b012705e0fd8e49f54954a",
  measurementId: "G-D1PZR10YB2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);