import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  subscribeAuthState, 
  loginWithEmail, 
  logoutUser, 
  sendPhoneVerificationCode, 
  confirmPhoneOtp, 
  updateUserDisplayName 
} from '../services/authService';
import { db, isFirebaseConfigured } from '../services/firebase';
import { INITIAL_USERS } from '../utils/sampleData';

const AuthContext = createContext(null);

function buildUserSession(user, profile) {
  if (!profile) return null;
  const role = profile.role || 'TEAM_MEMBER';
  const isAdmin = role === 'ADMIN';

  // Deny by default: Team members start with false/false unless explicitly granted by Admin
  const permissions = profile.permissions || (
    isAdmin
      ? { canAddCredit: true, canAddDebit: true }
      : { canAddCredit: false, canAddDebit: false }
  );

  return {
    uid: profile.id || profile.uid || user?.uid,
    authUid: user?.uid,
    email: profile.email || user?.email || '',
    displayName: profile.displayName || profile.email || 'Authorized Member',
    phoneNumber: profile.phoneNumber || user?.phoneNumber || '',
    role,
    isActive: profile.isActive !== false,
    permissions,
    canAddCredit: isAdmin || Boolean(permissions.canAddCredit),
    canAddDebit: isAdmin || Boolean(permissions.canAddDebit),
  };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(!isFirebaseConfigured());

  useEffect(() => {
    // If real Firebase keys are configured, listen to real Firebase Auth
    if (isFirebaseConfigured()) {
      setIsDemoMode(false);
      let unsubProfileDoc = null;

      const unsubscribeAuth = subscribeAuthState((authData) => {
        if (unsubProfileDoc) {
          unsubProfileDoc();
          unsubProfileDoc = null;
        }

        if (authData && authData.user) {
          const profile = authData.profile;
          if (!profile) {
            logoutUser();
            setCurrentUser(null);
            setAuthError('Access Denied: Your account is not authorized or provisioned in the company personnel directory.');
            setIsLoading(false);
          } else if (profile.isActive === false) {
            logoutUser();
            setCurrentUser(null);
            setAuthError('Access Denied: In your Firestore "users" collection, "isActive" is set to false. Please contact your company administrator.');
            setIsLoading(false);
          } else {
            setCurrentUser(buildUserSession(authData.user, profile));
            setAuthError(null);
            setIsLoading(false);

            // REAL-TIME PERMISSIONS LISTENER:
            // Any admin updates to permissions or account status take effect immediately!
            const docId = profile.id || profile.uid || authData.user.uid;
            if (db && docId) {
              unsubProfileDoc = onSnapshot(
                doc(db, 'users', docId),
                (docSnap) => {
                  if (docSnap.exists()) {
                    const latestData = { id: docSnap.id, ...docSnap.data() };
                    if (latestData.isActive === false) {
                      logoutUser();
                      setCurrentUser(null);
                      setAuthError('Access Denied: Your account has been deactivated by an administrator.');
                    } else {
                      setCurrentUser(buildUserSession(authData.user, latestData));
                    }
                  }
                },
                (err) => {
                  console.warn('Real-time profile listener notice:', err.message);
                }
              );
            }
          }
        } else {
          setCurrentUser(null);
          setIsLoading(false);
        }
      });

      return () => {
        unsubscribeAuth();
        if (unsubProfileDoc) unsubProfileDoc();
      };
    } else {
      // Prompt for real authentication when no demo users exist
      const defaultDemoUser = INITIAL_USERS && INITIAL_USERS.length > 0 ? INITIAL_USERS[0] : null;
      if (defaultDemoUser) {
        setCurrentUser({
          ...defaultDemoUser,
          canAddCredit: true,
          canAddDebit: true,
        });
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      if (isDemoMode) {
        const matched = INITIAL_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (matched) {
          if (!matched.isActive) {
            throw new Error('Access Denied: This company account is deactivated.');
          }
          setCurrentUser(matched);
        } else {
          setCurrentUser({
            uid: `demo-${Date.now()}`,
            email,
            displayName: email.split('@')[0],
            role: 'TEAM_MEMBER',
            isActive: true,
          });
        }
        setIsLoading(false);
        return;
      }

      const { user, profile } = await loginWithEmail(email, password);
      setCurrentUser(buildUserSession(user, profile));
    } catch (err) {
      setAuthError(err.message || 'Login failed. Please verify credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendPhoneOtp = async (phoneNumber) => {
    setAuthError(null);
    try {
      if (isDemoMode) {
        return { fake: true, phoneNumber };
      }
      const confirmationResult = await sendPhoneVerificationCode(phoneNumber);
      return confirmationResult;
    } catch (err) {
      setAuthError(err.message || 'Failed to send OTP verification code.');
      throw err;
    }
  };

  const loginWithPhoneOtp = async (confirmationResult, otpCode, phoneNumber) => {
    setAuthError(null);
    try {
      if (isDemoMode) {
        const demoUser = {
          uid: `phone-user-${Date.now()}`,
          displayName: `Authorized Member`,
          phoneNumber: phoneNumber || '+91 99007 13875',
          email: `${(phoneNumber || '9900713875').replace(/[^0-9]/g, '')}@infotreetech.com`,
          role: 'TEAM_MEMBER',
          isActive: true,
          permissions: { canAddCredit: false, canAddDebit: false },
          canAddCredit: false,
          canAddDebit: false,
        };
        setCurrentUser(demoUser);
        return;
      }

      const { user, profile } = await confirmPhoneOtp(confirmationResult, otpCode, phoneNumber);
      setCurrentUser(buildUserSession(user, profile));
    } catch (err) {
      setAuthError(err.message || 'Invalid verification code. Please check and try again.');
      throw err;
    }
  };

  const updateDisplayName = async (newName) => {
    if (!currentUser || !newName?.trim()) return;
    const trimmed = newName.trim();
    if (!isDemoMode && currentUser.uid) {
      await updateUserDisplayName(currentUser.uid, trimmed);
    }
    setCurrentUser(prev => ({
      ...prev,
      displayName: trimmed,
    }));
  };

  const logout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setAuthError(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const value = {
    currentUser,
    isLoading,
    authError,
    setAuthError,
    isDemoMode,
    isAdmin: currentUser?.role === 'ADMIN',
    canAddCredit: currentUser?.role === 'ADMIN' || Boolean(currentUser?.permissions?.canAddCredit),
    canAddDebit: currentUser?.role === 'ADMIN' || Boolean(currentUser?.permissions?.canAddDebit),
    login,
    logout,
    sendPhoneOtp,
    loginWithPhoneOtp,
    updateDisplayName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
