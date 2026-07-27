import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  collection,
  getDocs,
  query
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { UserProfile } from '../types/user';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isRevoked: boolean;
  clearAuthError: () => void;
  updateUserAccess: (targetUid: string, newStatus: 'active' | 'revoked') => Promise<void>;
  updateUserRole: (targetUid: string, newRole: 'admin' | 'user') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = [
  'nh6693032@gmail.com',
  // Can be extended or managed dynamically
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfileListener: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfileListener) {
        unsubscribeProfileListener();
        unsubscribeProfileListener = null;
      }

      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        setLoading(true);

        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          const now = new Date().toISOString();
          const emailLower = (firebaseUser.email || '').toLowerCase();
          const isAdminByEmail = ADMIN_EMAILS.includes(emailLower);

          if (!userDocSnap.exists()) {
            // First time login - check if any admin exists or if this email is designated admin
            let role: 'admin' | 'user' = isAdminByEmail ? 'admin' : 'user';

            // If no users exist yet in database, make the first user an admin automatically
            try {
              const allUsersSnap = await getDocs(query(collection(db, 'users')));
              if (allUsersSnap.empty) {
                role = 'admin';
              }
            } catch (e) {
              console.warn("Could not check user count", e);
            }

            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL || '',
              createdAt: now,
              lastLogin: now,
              status: 'active',
              role: role,
            };

            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          } else {
            // Existing user document - update lastLogin and sync profile info
            const existingData = userDocSnap.data() as UserProfile;
            
            // If email is in hardcoded admin list, ensure role is admin
            const updatedRole = isAdminByEmail ? 'admin' : existingData.role;

            const updatedFields = {
              lastLogin: now,
              displayName: firebaseUser.displayName || existingData.displayName,
              photoURL: firebaseUser.photoURL || existingData.photoURL,
              email: firebaseUser.email || existingData.email,
              role: updatedRole
            };

            await updateDoc(userDocRef, updatedFields);
            setUserProfile({
              ...existingData,
              ...updatedFields,
            });
          }

          // Real-time listener on user's profile document to handle immediate access revocation
          unsubscribeProfileListener = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data() as UserProfile;
              setUserProfile(data);
            }
          }, (err) => {
            console.error("User profile snapshot listener error:", err);
          });

        } catch (err: any) {
          console.error("Error setting up user profile in Firestore:", err);
          setAuthError(err?.message || "Failed to sync user profile.");
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfileListener) {
        unsubscribeProfileListener();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Google Sign In Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError("Sign-in popup was closed before completing.");
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError("Sign-in popup was blocked by browser settings. Please allow popups for this app.");
      } else {
        setAuthError(err.message || "Failed to sign in with Google.");
      }
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.error("Sign Out Error:", err);
      setAuthError(err.message || "Failed to sign out.");
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const updateUserAccess = async (targetUid: string, newStatus: 'active' | 'revoked') => {
    try {
      const userRef = doc(db, 'users', targetUid);
      await updateDoc(userRef, { status: newStatus });
    } catch (err: any) {
      console.error("Error updating user access:", err);
      throw err;
    }
  };

  const updateUserRole = async (targetUid: string, newRole: 'admin' | 'user') => {
    try {
      const userRef = doc(db, 'users', targetUid);
      await updateDoc(userRef, { role: newRole });
    } catch (err: any) {
      console.error("Error updating user role:", err);
      throw err;
    }
  };

  const isAdmin = userProfile?.role === 'admin' || (currentUser?.email?.toLowerCase() === 'nh6693032@gmail.com');
  const isRevoked = userProfile?.status === 'revoked';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        authError,
        signInWithGoogle,
        logout,
        isAdmin,
        isRevoked,
        clearAuthError,
        updateUserAccess,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
