// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3BysvEwrcBb-2nDmfO12jGtqbr7ykQPQ",
  authDomain: "helpdeskticketingsystem-16d6b.firebaseapp.com",
  projectId: "helpdeskticketingsystem-16d6b",
  storageBucket: "helpdeskticketingsystem-16d6b.firebasestorage.app",
  messagingSenderId: "1014491574830",
  appId: "1:1014491574830:web:31e0d98a94d416d238e5bf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
