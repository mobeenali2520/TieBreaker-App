import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Default config provided or dynamically loaded from firebase-applet-config.json
let firebaseConfig: Record<string, string> = {
  apiKey: "AIzaSyC6-iHtRuCxkxwB7L8RBvuHnxu83Qj6gSY",
  authDomain: "act-ai-50abd.firebaseapp.com",
  projectId: "act-ai-50abd",
  storageBucket: "act-ai-50abd.firebasestorage.app",
  messagingSenderId: "277146911161",
  appId: "1:277146911161:web:6b0ac18ba63f28788ff668",
  measurementId: "G-M7G4HDNQ48"
};

let databaseId = '(default)';

try {
  // Attempt to load workspace firebase config if available
  const appletConfig = (import.meta as any).glob('/firebase-applet-config.json', { eager: true, import: 'default' });
  const configKeys = Object.keys(appletConfig);
  if (configKeys.length > 0) {
    const loaded = appletConfig[configKeys[0]] as any;
    if (loaded && loaded.apiKey && loaded.projectId) {
      firebaseConfig = {
        apiKey: loaded.apiKey,
        authDomain: loaded.authDomain || `${loaded.projectId}.firebaseapp.com`,
        projectId: loaded.projectId,
        storageBucket: loaded.storageBucket || `${loaded.projectId}.firebasestorage.app`,
        messagingSenderId: loaded.messagingSenderId || "",
        appId: loaded.appId || "",
        measurementId: loaded.measurementId || ""
      };
      if (loaded.firestoreDatabaseId) {
        databaseId = loaded.firestoreDatabaseId;
      }
    }
  }
} catch (e) {
  console.warn("Using fallback firebaseConfig", e);
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, databaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
