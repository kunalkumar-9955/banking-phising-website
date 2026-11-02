'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import {
  signInWithGoogle,
  resetPasswordEmail,
  firebaseSignOut,
  onAuthStateChanged,
  auth,
  type FirebaseUser,
} from '@/lib/firebase';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  is_verified: boolean;
  avatar?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Prevents onAuthStateChanged from double-processing when we already handled it
  const skipNextAuthChange = useRef(false);

  useEffect(() => {
    // On mount: restore existing backend-only session (email/password users)
    const savedToken = localStorage.getItem('phishguard_token');
    if (savedToken) {
      authApi.getMe(savedToken)
        .then((userData) => {
          setToken(savedToken);
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('phishguard_token');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    // Firebase listener: fires on page refresh when Firebase session exists
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      // Skip if googleLogin() / logout() already handled this exact state change
      if (skipNextAuthChange.current) {
        skipNextAuthChange.current = false;
        return;
      }

      if (fbUser) {
        // Page reloaded with an active Firebase session — re-sync backend token
        try {
          const idToken = await fbUser.getIdToken();
          const data = await authApi.googleAuth(idToken);
          setToken(data.access_token);
          setUser(data.user);
          localStorage.setItem('phishguard_token', data.access_token);
        } catch {
          // Backend sync failed — user can still try logging in again
        }
      }
    });

    return () => unsubscribe();
  }, []);

  /** Email + Password Login (backend only) */
  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('phishguard_token', data.access_token);
  };

  /** Email + Password Register (backend only) */
  const register = async (name: string, email: string, password: string) => {
    const data = await authApi.register(name, email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('phishguard_token', data.access_token);
  };

  /** Google Sign-In popup — we handle the sync here, tell listener to skip */
  const googleLogin = async () => {
    const { idToken } = await signInWithGoogle();
    skipNextAuthChange.current = true;
    const data = await authApi.googleAuth(idToken);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('phishguard_token', data.access_token);
  };

  /** Firebase Forgot Password email */
  const forgotPassword = async (email: string) => {
    await resetPasswordEmail(email);
  };

  /** Full logout */
  const logout = async () => {
    skipNextAuthChange.current = true;
    await firebaseSignOut().catch(() => {});
    setToken(null);
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('phishguard_token');
  };

  const updateUser = (updatedUser: User) => setUser(updatedUser);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        firebaseUser,
        isLoading,
        login,
        register,
        googleLogin,
        forgotPassword,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
