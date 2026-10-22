import { 
  signInWithEmailAndPassword, 
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  collection, 
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';

/**
 * Standardize phone string to extract the last 10 significant digits
 */
export function normalizePhoneDigits(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Standardize email string for consistent comparison
 */
export function normalizeEmail(raw) {
  return raw ? String(raw).trim().toLowerCase() : '';
}

/**
 * Find the single canonical Admin-provisioned member record for an authenticated user.
 * Searches across:
 * 1. Document ID matching user UID
 * 2. linkedAuthUids array containing user UID
 * 3. Verified mobile phone number (last 10 digits)
 * 4. Verified corporate email address
 *
 * If duplicate or orphan records (e.g. legacy phone-auth "Finance Lead") are found,
 * it automatically identifies the Admin-provisioned record, converts the duplicate into an alias,
 * and merges the Auth UIDs into linkedAuthUids.
 */
export async function findCanonicalMemberRecord({ uid, email, phoneNumber }) {
  if (!db) return null;

  const targetDigits = normalizePhoneDigits(phoneNumber);
  const targetEmail = normalizeEmail(email);

  try {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);

    const matches = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const docId = docSnap.id;

      // Skip deleted records
      if (data.isDeleted) return;

      const docDigits = normalizePhoneDigits(data.phoneNumber);
      const docEmail = normalizeEmail(data.email);
      const linkedUids = Array.isArray(data.linkedAuthUids) ? data.linkedAuthUids : [];

      let isMatch = false;

      // 1. Direct Document ID match
      if (docId === uid || data.uid === uid) {
        isMatch = true;
      }
      // 2. Previously mapped Auth UID in linkedAuthUids
      else if (uid && linkedUids.includes(uid)) {
        isMatch = true;
      }
      // 3. Verified Phone Number match
      else if (targetDigits && docDigits && targetDigits === docDigits) {
        isMatch = true;
      }
      // 4. Verified Email match
      else if (targetEmail && docEmail && targetEmail === docEmail) {
        isMatch = true;
      }

      if (isMatch) {
        matches.push({ id: docId, ...data });
      }
    });

    if (matches.length === 0) {
      return null;
    }

    // Identify the primary Admin-provisioned member document:
    // The canonical record has real human name (not "Finance Lead" or "Company Member"),
    // a valid non-synthetic email (not starting with phone digits), and isAlias !== true.
    let primary = matches.find(m => 
      !m.isAlias && 
      m.displayName !== 'Finance Lead' && 
      m.displayName !== 'Company Member' &&
      m.email && 
      !m.email.includes(`${targetDigits}@`)
    );

    if (!primary) {
      primary = matches.find(m => !m.isAlias && m.displayName !== 'Finance Lead');
    }

    if (!primary) {
      primary = matches.find(m => !m.isAlias);
    }

    if (!primary) {
      primary = matches[0];
    }

    // Clean up or link any orphan duplicates to the single canonical member record
    for (const dup of matches) {
      if (dup.id !== primary.id) {
        try {
          // If the orphan document is a legacy "Finance Lead" or synthetic phone record,
          // mark it as an alias and sync its role and profile with the primary record.
          await updateDoc(doc(db, 'users', dup.id), {
            isAlias: true,
            primaryUid: primary.id,
            displayName: primary.displayName,
            email: primary.email,
            phoneNumber: primary.phoneNumber || phoneNumber || '',
            role: primary.role,
            isActive: primary.isActive,
            updatedAt: serverTimestamp(),
          }).catch(() => {});
        } catch (_) {}
      }
    }

    // Ensure the primary record contains the authenticated user UID in linkedAuthUids
    const existingLinked = Array.isArray(primary.linkedAuthUids) ? primary.linkedAuthUids : [];
    if (uid && !existingLinked.includes(uid) && uid !== primary.id) {
      try {
        await updateDoc(doc(db, 'users', primary.id), {
          linkedAuthUids: arrayUnion(uid),
          phoneUid: targetDigits ? uid : primary.phoneUid || null,
        }).catch(() => {});
        primary.linkedAuthUids = [...existingLinked, uid];
      } catch (_) {}
    }

    return primary;
  } catch (err) {
    console.error('Error finding canonical member record:', err);
    return null;
  }
}

/**
 * Sign in existing company team member using email and password.
 */
export async function loginWithEmail(email, password) {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase configuration is missing or incomplete.');
  }

  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const user = userCredential.user;

  // Retrieve canonical user profile from Cloud Firestore
  const profile = await findCanonicalMemberRecord({ 
    uid: user.uid, 
    email: user.email 
  });

  if (!profile) {
    await signOut(auth);
    throw new Error('Authentication succeeded in Firebase, but no authorized member profile was found in the Firestore "users" collection for: ' + user.email);
  }

  if (profile.isActive === false) {
    await signOut(auth);
    throw new Error('Access Denied: This company account has been deactivated by an administrator.');
  }

  return { user, profile };
}

/**
 * Safely initialize or reset invisible reCAPTCHA verifier for Phone Auth.
 */
export function initRecaptchaVerifier() {
  if (!auth) throw new Error('Firebase Auth not initialized');

  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    auth.settings.appVerificationDisabledForTesting = true;
  }

  let container = document.getElementById('recaptcha-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'recaptcha-container';
    document.body.appendChild(container);
  }

  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (_) {}
    window.recaptchaVerifier = null;
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {
      console.warn('Invisible reCAPTCHA token expired');
    }
  });

  return window.recaptchaVerifier;
}

/**
 * Send Phone Verification OTP Code
 */
export async function sendPhoneVerificationCode(phoneNumber) {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase is not configured yet. Please check your credentials in .env or settings.');
  }

  let formatted = phoneNumber.trim().replace(/[\s-]/g, '');
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }

  try {
    const verifier = initRecaptchaVerifier();
    const confirmationResult = await signInWithPhoneNumber(auth, formatted, verifier);
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  } catch (error) {
    console.error('Live Firebase Phone Auth error:', error);

    if (error.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'your-app.vercel.app';
      throw new Error(
        `Firebase Unauthorized Domain: "${currentHost}" is not allowed. In Firebase Console, go to Authentication > Settings > Authorized domains > click "Add domain" and enter "${currentHost}".`
      );
    } else if (error.code === 'auth/operation-not-allowed' || error.message?.includes('operation-not-allowed') || error.message?.includes('region enabled')) {
      throw new Error(
        'Firebase SMS Region Policy: Go to Firebase Console > Authentication > Settings tab > SMS region policy > ensure India (+91) is enabled, then click Save.'
      );
    } else if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number format. Please ensure country code and 10-digit number are correct.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests from this device or network. Please wait a few moments before trying again.');
    } else if (error.code === 'auth/quota-exceeded') {
      throw new Error('Firebase daily SMS quota exceeded. Add this phone number under Firebase Console > Authentication > Sign-in method > Phone > Phone numbers for testing (optional) to bypass SMS limits.');
    } else if (error.code === 'auth/captcha-check-failed' || error.code === 'auth/invalid-app-credential') {
      throw new Error('reCAPTCHA security check failed. Please ensure your Vercel domain is added to Firebase Authorized Domains and reload the page.');
    }
    throw new Error(error.message || 'Failed to send OTP verification code via SMS.');
  }
}

/**
 * Confirm Phone OTP Code and verify against Admin-Provisioned member record.
 * STRICTURE: Will NEVER create a new member record or assign a role to an un-provisioned phone number.
 */
export async function confirmPhoneOtp(confirmationResult, otpCode, phoneNumber) {
  if (!confirmationResult) {
    throw new Error('No active verification session. Please request a new OTP code.');
  }

  const result = await confirmationResult.confirm(otpCode.trim());
  const user = result.user;

  const targetPhone = user.phoneNumber || phoneNumber;

  // Retrieve the single canonical Admin-provisioned member record
  const profile = await findCanonicalMemberRecord({
    uid: user.uid,
    phoneNumber: targetPhone,
    email: user.email,
  });

  if (!profile) {
    // SECURITY ENFORCEMENT: If Gowtham did not provision this mobile number in Team Accounts, reject!
    await signOut(auth);
    throw new Error(
      `Access Denied: Mobile number ${targetPhone} is not registered in the company personnel directory. Please ask your company administrator (Gowtham) to provision your account under Team Accounts.`
    );
  }

  if (profile.isActive === false) {
    await signOut(auth);
    throw new Error('Access Denied: This company member account has been deactivated by an administrator.');
  }

  // Ensure an alias document exists at /users/{user.uid} so Firestore Security Rules
  // (exists(/databases/$(database)/documents/users/$(request.auth.uid))) succeed.
  if (user.uid !== profile.id && user.uid !== profile.uid) {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        primaryUid: profile.id || profile.uid,
        isAlias: true,
        displayName: profile.displayName,
        email: profile.email,
        phoneNumber: profile.phoneNumber || targetPhone,
        role: profile.role,
        isActive: profile.isActive,
        permissions: profile.permissions || (profile.role === 'ADMIN' ? { canAddCredit: true, canAddDebit: true } : { canAddCredit: false, canAddDebit: false }),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Link Phone Auth UID into canonical record
      await updateDoc(doc(db, 'users', profile.id || profile.uid), {
        linkedAuthUids: arrayUnion(user.uid),
        phoneUid: user.uid,
      }).catch(() => {});
    } catch (e) {
      console.warn('Silent alias sync notice:', e);
    }
  }

  return { user, profile };
}

/**
 * Update a user's display name in Firestore
 */
export async function updateUserDisplayName(uid, newName) {
  if (!db || !uid) throw new Error('Firestore not initialized');
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    displayName: newName.trim(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Sign out the currently logged-in user
 */
export async function logoutUser() {
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Fetch a user's role and profile metadata from Cloud Firestore
 */
export async function fetchUserProfile(uid) {
  if (!db) return null;
  return await findCanonicalMemberRecord({ uid });
}

/**
 * Subscribe to Firebase Auth state changes and resolve canonical profile
 */
export function subscribeAuthState(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const profile = await findCanonicalMemberRecord({
          uid: user.uid,
          email: user.email,
          phoneNumber: user.phoneNumber,
        });

        if (!profile || profile.isActive === false) {
          // If deleted or deactivated, report status
          if (profile && profile.isActive === false) {
            callback({ user, profile: { ...profile, isActive: false } });
          } else {
            callback({ user: null, profile: null });
          }
          return;
        }

        callback({ user, profile });
      } catch (err) {
        console.error('Error resolving canonical profile in auth observer:', err);
        callback({ user, profile: null });
      }
    } else {
      callback(null);
    }
  });
}
