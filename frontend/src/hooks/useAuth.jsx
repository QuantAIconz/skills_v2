// src/hooks/useAuth.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email, password, userData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Save additional user data to Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      ...userData,
      createdAt: new Date()
    });
    return userCredential;
  };

  const loginWithGoogle = async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    // Check if user exists in Firestore, if not create document
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        name: userCredential.user.displayName,
        role: 'candidate',
        createdAt: new Date()
      });
    }
    return userCredential;
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    userData,
    login,
    signup,
    loginWithGoogle,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}