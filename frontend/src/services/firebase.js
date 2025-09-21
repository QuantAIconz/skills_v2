// // src/services/firebase.js
// import { initializeApp } from 'firebase/app';
// import { getAuth, GoogleAuthProvider } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID
// };

// const app = initializeApp(firebaseConfig);
// export const auth = getAuth(app);
// export const db = getFirestore(app);
// export const googleProvider = new GoogleAuthProvider();

// export default app;


// Import the functions you need from the SDKs you need
// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCb4BuMTXVH1HYh5bPWkOdwNZqXMC3MXRA",
  authDomain: "skill-asseser.firebaseapp.com",
  projectId: "skill-asseser",
  storageBucket: "skill-asseser.firebasestorage.app",
  messagingSenderId: "495284014236",
  appId: "1:495284014236:web:985f7f4fec72a0dbd33159",
  measurementId: "G-D51C8BH2V0"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const googleProvider = new GoogleAuthProvider();

export default app;