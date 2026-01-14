import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAnVwejd_SzA8_d7kDwkYDm6FKZQ00ndYw",
  authDomain: "bidexpert-630df.firebaseapp.com",
  projectId: "bidexpert-630df",
  storageBucket: "bidexpert-630df.firebasestorage.app",
  messagingSenderId: "163984892992",
  appId: "1:163984892992:web:ccc38450de4ff3c5972ba5",
  measurementId: "G-TBSTHBEV1C"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;

// Initialize Firebase
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

// Initialize Analytics only on client side
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn("Firebase Analytics not supported:", err);
  });
}

// Connect to emulators in development
if (typeof window !== 'undefined' && window.location.hostname === "localhost") {
    try {
        console.log("Connecting to Firebase Emulators...");
        connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
        connectFirestoreEmulator(db, "127.0.0.1", 8080);
    } catch(e) {
        console.warn("Could not connect to Firebase emulators. This is expected if they are not running.");
    }
}

export { app, auth, db, analytics };
