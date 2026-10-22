import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Load stored config from localStorage if user pasted it directly in the UI
 */
function loadStoredConfig() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('infotree_firebase_config') : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.apiKey && parsed.projectId) return parsed;
    }
  } catch (_) {}
  return null;
}

const storedConfig = loadStoredConfig();

/**
 * Firebase Configuration from Vite environment variables or localStorage override.
 */
export const firebaseConfig = storedConfig || {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA4qqEFbFZ94yAm9UZLajrauwUVZwnJlI8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'infotreetech-financial.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'infotreetech-financial',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'infotreetech-financial.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '188668385877',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:188668385877:web:d49b895fa516fd49b092dc',
  measurementId: 'G-XZ77LTRSBJ',
};

/**
 * Checks if real Firebase credentials have been configured
 */
export function isFirebaseConfigured() {
  const current = storedConfig || {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  };
  return Boolean(
    current.apiKey &&
    current.projectId &&
    !current.apiKey.includes('Placeholder') &&
    !current.projectId.includes('your-company')
  );
}

/**
 * Save Firebase configuration directly from UI and reload to connect live
 */
export function saveFirebaseConfigDirectly(configObj) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('infotree_firebase_config', JSON.stringify(configObj));
    window.location.reload();
  }
}

/**
 * Disconnect and revert to preview mode
 */
export function resetFirebaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('infotree_firebase_config');
    window.location.reload();
  }
}

// Initialize Firebase App singleton safely
let app;
let auth = null;
let db = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  // Ensure local session persistence
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Session persistence initialization notice:', err);
  });

  db = getFirestore(app);
} catch (error) {
  console.warn('Firebase initialization notice (Configuration pending):', error.message);
}

export { app, auth, db };
