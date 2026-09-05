import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as fbSignOut, 
  signInAnonymously,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, testConnection } from './firebase';
import { UserProfile, UserSettings, ThemeMode } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  signInWithGoogle: () => Promise<void>;
  signInAsDemoUser: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
}

const defaultSettings: UserSettings = {
  motivation_quote: "It never gets easier, you just go faster. Every mile is a step towards greatness.",
  theme_preference: 'dark',
  runner_name: 'Alex Runner',
  weekly_target_km: 30
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const savedTheme = localStorage.getItem('running_tracker_theme') as ThemeMode | null;
    if (savedTheme) {
      if (savedTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return savedTheme;
    }
    document.documentElement.classList.add('dark');
    return 'dark';
  });

  // Test Firestore connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('running_tracker_theme', newTheme);
  };

  // Sync theme with system or saved preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('running_tracker_theme') as ThemeMode | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setUserProfile(data);
            if (data.settings?.theme_preference) {
              setTheme(data.settings.theme_preference);
            }
          } else {
            // First time user setup
            const initialProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || `${currentUser.uid}@runner.local`,
              displayName: currentUser.displayName || 'Runner',
              photoURL: currentUser.photoURL || '',
              settings: defaultSettings,
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
          }
        } catch (err) {
          console.warn('Could not fetch user profile from Firestore:', err);
          // Fallback profile if offline/permission issue
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email || 'user@runningtracker.com',
            displayName: currentUser.displayName || 'Runner',
            settings: defaultSettings
          });
        }
      } else {
        // In guest mode: load local guest settings
        try {
          const savedGuest = localStorage.getItem('running_tracker_guest_settings');
          const guestSettings: UserSettings = savedGuest ? JSON.parse(savedGuest) : defaultSettings;
          setUserProfile({
            uid: 'guest_runner_personal',
            email: 'guest@runner.local',
            displayName: guestSettings.runner_name || 'Runner',
            settings: guestSettings
          });
        } catch {
          setUserProfile({
            uid: 'guest_runner_personal',
            email: 'guest@runner.local',
            displayName: 'Runner',
            settings: defaultSettings
          });
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in with Google error:', error);
      throw error;
    }
  };

  const signInAsDemoUser = async () => {
    try {
      const cred = await signInAnonymously(auth);
      if (cred.user) {
        await updateProfile(cred.user, {
          displayName: 'Banker & Student Runner'
        });
      }
    } catch (error) {
      console.warn('Firebase anonymous auth not active; using local demo profile:', error);
      const demoSettings: UserSettings = {
        motivation_quote: "It never gets easier, you just go faster. Every mile is a step towards greatness.",
        theme_preference: 'dark',
        runner_name: 'Banker & Student Runner',
        weekly_target_km: 35
      };
      localStorage.setItem('running_tracker_guest_settings', JSON.stringify(demoSettings));
      setUserProfile({
        uid: 'guest_runner_personal',
        email: 'demo@runner.local',
        displayName: 'Banker & Student Runner',
        settings: demoSettings
      });
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
      const savedGuest = localStorage.getItem('running_tracker_guest_settings');
      const guestSettings: UserSettings = savedGuest ? JSON.parse(savedGuest) : defaultSettings;
      setUserProfile({
        uid: 'guest_runner_personal',
        email: 'guest@runner.local',
        displayName: guestSettings.runner_name || 'Runner',
        settings: guestSettings
      });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateUserSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) {
      // Save locally in guest mode
      const current = userProfile?.settings || defaultSettings;
      const mergedSettings = {
        ...current,
        ...newSettings
      } as UserSettings;
      localStorage.setItem('running_tracker_guest_settings', JSON.stringify(mergedSettings));
      setUserProfile(prev => prev ? { ...prev, settings: mergedSettings } : null);
      if (newSettings.theme_preference) {
        setTheme(newSettings.theme_preference);
      }
      return;
    }

    const path = `users/${user.uid}`;
    try {
      const mergedSettings = {
        ...userProfile?.settings,
        ...newSettings
      } as UserSettings;

      await updateDoc(doc(db, 'users', user.uid), {
        settings: mergedSettings
      });

      setUserProfile(prev => prev ? { ...prev, settings: mergedSettings } : null);
      if (newSettings.theme_preference) {
        setTheme(newSettings.theme_preference);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      theme,
      setTheme,
      signInWithGoogle,
      signInAsDemoUser,
      signOut,
      updateUserSettings
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
