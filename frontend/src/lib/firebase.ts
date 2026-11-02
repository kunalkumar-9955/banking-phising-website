import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';

// =============================================
// Firebase Config — Paste your credentials in
// .env.local (see bottom of this file for keys)
// =============================================
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Prevent duplicate initialization in Next.js hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// =============================================
// Auth Helper Functions
// =============================================

/** Sign in with Google Popup */
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return { user: result.user, idToken };
};

/** Sign in with Email + Password */
export const signInWithEmail = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await result.user.getIdToken();
  return { user: result.user, idToken };
};

/** Register with Email + Password */
export const registerWithEmail = async (
  name: string,
  email: string,
  password: string
) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  // Set display name in Firebase
  await updateProfile(result.user, { displayName: name });
  const idToken = await result.user.getIdToken();
  return { user: result.user, idToken };
};

/** Send Password Reset Email */
export const resetPasswordEmail = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

/** Sign Out */
export const firebaseSignOut = async () => {
  await signOut(auth);
};

/** Get current Firebase ID token (refreshed) */
export const getCurrentIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(true);
};

export { auth, googleProvider, onAuthStateChanged };
export type { FirebaseUser };

// =============================================
// WHERE TO PASTE YOUR FIREBASE CREDENTIALS:
// File: frontend/.env.local
//
// NEXT_PUBLIC_FIREBASE_API_KEY=
// NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
// NEXT_PUBLIC_FIREBASE_PROJECT_ID=
// NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
// NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
// NEXT_PUBLIC_FIREBASE_APP_ID=
// =============================================
