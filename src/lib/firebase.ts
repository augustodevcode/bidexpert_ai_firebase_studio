
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAnVwejd_SzA8_d7kDwkYDm6FKZQ00ndYw",
  authDomain: "bidexpert-630df.firebaseapp.com",
  projectId: "bidexpert-630df",
  storageBucket: "bidexpert-630df.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID", // Você pode encontrar este valor no console do Firebase
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID", // Você pode encontrar este valor no console do Firebase
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Opcional, mas bom ter. Você pode encontrar este valor no console do Firebase
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app); // Firestore inicializado

export { app, auth, db };
