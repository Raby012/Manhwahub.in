import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  language: string;
  createdAt: number;
  updatedAt: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const docRef = doc(db, `users/${u.uid}`);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            // Check email verification rules logic ? Here we just enforce email rule in UI, though we can't create doc if unverified if our rules demanded it.
            const newProfile: UserProfile = {
              uid: u.uid,
              email: u.email || '',
              displayName: u.displayName || 'Reader',
              photoURL: u.photoURL || '',
              language: 'en',
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          }
          
          // Sync existing local bookmarks to remote
          const localBookmarks = JSON.parse(localStorage.getItem('manhwahub_bookmarks') || '[]');
          for (const b of localBookmarks) {
            b.userId = u.uid;
            await setDoc(doc(db, `users/${u.uid}/bookmarks/${b.id}`), b).catch(() => {});
          }
          
          // Fetch remote bookmarks
          const { getDocs, collection } = await import('firebase/firestore');
          const bmSnap = await getDocs(collection(db, `users/${u.uid}/bookmarks`));
          const remoteBookmarks = bmSnap.docs.map(d => d.data());
          localStorage.setItem('manhwahub_bookmarks', JSON.stringify(remoteBookmarks));
          window.dispatchEvent(new Event('bookmarksUpdated'));

        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user || !profile) return;
    try {
      const docRef = doc(db, `users/${user.uid}`);
      const newData = { ...profile, ...data, updatedAt: Date.now() };
      await setDoc(docRef, newData, { merge: true });
      setProfile(newData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, updateProfileData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
