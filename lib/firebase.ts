import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Tambahan untuk Storage gambar

const firebaseConfig = {
  apiKey: "AIzaSyD4SldHmRGmPCiPzL8mQMjyf-D2wonL1us",
  authDomain: "next-tea-pos.firebaseapp.com",
  projectId: "next-tea-pos",
  storageBucket: "next-tea-pos.appspot.com",
  messagingSenderId: "105743298195",
  appId: "1:105743298195:web:186fdf7baecf5bf139a766"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Inisialisasi Storage

export { app, auth, db, storage };