// services/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAOXXai5Iw_kB-fGeav5uw5sNm-k_3Cem4",
  authDomain: "coindesi.firebaseapp.com",
  projectId: "coindesi",
  storageBucket: "coindesi.firebasestorage.app",
  messagingSenderId: "1027380469055",
  appId: "1:1027380469055:web:5881ccf8117a543199c78a"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Setup Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore
const db = getFirestore(app);

export { app, auth, db };
