import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: appletConfig.apiKey,
  authDomain: appletConfig.authDomain || `${appletConfig.projectId}.firebaseapp.com`,
  projectId: appletConfig.projectId,
  storageBucket: appletConfig.storageBucket || `${appletConfig.projectId}.firebasestorage.app`,
  messagingSenderId: appletConfig.messagingSenderId || "",
  appId: appletConfig.appId || "",
  measurementId: appletConfig.measurementId || ""
};

const databaseId = appletConfig.firestoreDatabaseId || '(default)';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, databaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

