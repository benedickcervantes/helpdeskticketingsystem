// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;