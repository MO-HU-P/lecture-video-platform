import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ALLOWED_DOMAIN = import.meta.env.VITE_ALLOWED_DOMAIN || 'your-organization.com';

const getUserRole = (email: string): 'student' | 'teacher' | 'unknown' => {
  const account = email.split('@')[0];

  const studentPattern = /^\d{4}P\d+$/;     //学部に合わせて「P」を変更
  const teacherPattern = /^[a-z]+(-[a-z]+)*$/;  

  if (studentPattern.test(account)) return 'student';
  if (teacherPattern.test(account)) return 'teacher';

  return 'unknown';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user);
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ hd: ALLOWED_DOMAIN });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
        await signOut(auth);
        throw new Error(`${ALLOWED_DOMAIN} のメールアドレスでログインしてください。`);
      }

      const role = getUserRole(user.email);
      console.log('User role determined as:', role);

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        role: role,
        displayName: user.displayName
      }, { merge: true });

      console.log('User data saved to Firestore.');
    } catch (error: any) {
      console.error('Authentication error:', error);
      if (error.code === 'auth/invalid-api-key') {
        throw new Error('認証の設定が正しくありません。管理者に連絡してください。');
      }
      throw error;
    }
  };

  const logout = () => signOut(auth);

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
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
