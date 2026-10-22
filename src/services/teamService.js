import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  setDoc, 
  getDoc,
  getDocs,
  serverTimestamp, 
  orderBy, 
  query 
} from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, firebaseConfig, isFirebaseConfigured } from './firebase';

/**
 * Subscribe to the company team members list (Active users/Admins)
 */
export function subscribeUsers(callback, onError) {
  if (!db) {
    onError && onError(new Error('Firestore not initialized'));
    return () => {};
  }

  const usersCollection = collection(db, 'users');
  const q = query(usersCollection, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const users = [];
      const archived = [];
      const seenPhones = new Set();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        // Strictly exclude alias records, secondary phone auth documents, and legacy synthetic "Finance Lead"
        if (data.isAlias || data.displayName === 'Finance Lead') {
          return;
        }

        const cleanPhone = (data.phoneNumber || '').replace(/[^0-9]/g, '').slice(-10);

        // Enforce Single Member Record in UI: prevent duplicate records sharing the same mobile phone
        if (cleanPhone && seenPhones.has(cleanPhone)) {
          return;
        }
        if (cleanPhone) {
          seenPhones.add(cleanPhone);
        }

        if (!data.isDeleted) {
          users.push({ id: docSnap.id, ...data });
        } else {
          archived.push({ id: docSnap.id, ...data });
        }
      });
      callback(users, archived);
    },
    (err) => {
      console.error('Users subscription error:', err);
      onError && onError(err);
    }
  );
}

/**
 * Toggle user active/deactivated status (ADMIN only)
 */
export async function toggleUserStatus(targetUid, isActive, currentUser) {
  if (!db) throw new Error('Firestore not initialized');
  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can modify user status.');
  }

  if (targetUid === currentUser.uid && !isActive) {
    throw new Error('Operation denied: You cannot deactivate your own administrative account.');
  }

  const userRef = doc(db, 'users', targetUid);
  await updateDoc(userRef, {
    isActive,
    updatedAt: serverTimestamp(),
    updatedBy: currentUser.uid,
  });

  // Sync active status to all linked phone alias records
  try {
    const snap = await getDoc(userRef);
    const data = snap.data();
    const linked = Array.isArray(data?.linkedAuthUids) ? data.linkedAuthUids : [];
    for (const linkedUid of linked) {
      if (linkedUid !== targetUid) {
        await updateDoc(doc(db, 'users', linkedUid), {
          isActive,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
    }
  } catch (_) {}
}

/**
 * Change a team member's role (ADMIN only)
 */
export async function changeUserRole(targetUid, newRole, currentUser) {
  if (!db) throw new Error('Firestore not initialized');
  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can alter account roles.');
  }

  if (!['ADMIN', 'TEAM_MEMBER'].includes(newRole)) {
    throw new Error('Invalid role specified.');
  }

  const userRef = doc(db, 'users', targetUid);
  await updateDoc(userRef, {
    role: newRole,
    updatedAt: serverTimestamp(),
    updatedBy: currentUser.uid,
  });

  // Sync role to all linked phone alias records
  try {
    const snap = await getDoc(userRef);
    const data = snap.data();
    const linked = Array.isArray(data?.linkedAuthUids) ? data.linkedAuthUids : [];
    for (const linkedUid of linked) {
      if (linkedUid !== targetUid) {
        await updateDoc(doc(db, 'users', linkedUid), {
          role: newRole,
          updatedAt: serverTimestamp(),
        }).catch(() => {});
      }
    }
  } catch (_) {}
}

/**
 * Bootstrap or assign user profile in Firestore
 */
export async function registerUserProfileInFirestore(targetUid, data) {
  if (!db) throw new Error('Firestore not initialized');
  const userRef = doc(db, 'users', targetUid);
  await setDoc(userRef, {
    uid: targetUid,
    displayName: data.displayName || '',
    email: data.email,
    role: data.role || 'TEAM_MEMBER',
    isActive: data.isActive !== false,
    createdAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Provision a new Team Member in Firebase:
 * Uses an isolated secondary Firebase App instance so the current Admin session is preserved.
 * Creates Firebase Auth credentials and writes the profile document to Cloud Firestore.
 */
export async function createTeamMemberAccount({ email, password, displayName, phoneNumber, role, permissions }, currentUser) {
  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can provision new team members.');
  }

  if (!isFirebaseConfigured()) {
    throw new Error('Firebase credentials are not configured in .env yet.');
  }

  // Format clean E.164 phone string if provided
  let formattedPhone = '';
  if (phoneNumber && phoneNumber.trim()) {
    formattedPhone = phoneNumber.trim().replace(/\s+/g, ' ');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91 ' + formattedPhone;
    }
  }

  // Determine permissions: Admins always have full permissions; Team members default to false/false
  const cleanPermissions = role === 'ADMIN'
    ? { canAddCredit: true, canAddDebit: true }
    : {
        canAddCredit: Boolean(permissions?.canAddCredit),
        canAddDebit: Boolean(permissions?.canAddDebit),
      };

  // Create isolated secondary app to avoid logging out the current admin
  const secondaryAppName = `ProvisionApp_${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    let newUid;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email.trim(),
        password
      );
      newUid = userCredential.user.uid;
    } catch (createErr) {
      if (createErr.code === 'auth/email-already-in-use') {
        try {
          // If already in Firebase Auth, attempt sign-in with provided password to reclaim UID
          const existingCred = await signInWithEmailAndPassword(
            secondaryAuth,
            email.trim(),
            password
          );
          newUid = existingCred.user.uid;
        } catch (_) {
          throw new Error(
            `Email "${email.trim()}" is already registered in Firebase Authentication. In Firebase Console, go to Authentication > Users tab, delete "${email.trim()}", then try again.`
          );
        }
      } else {
        throw createErr;
      }
    }

    // Immediately sign out and terminate the secondary auth instance
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);

    // Save user profile in Firestore using the active Admin's Firestore connection
    const userRef = doc(db, 'users', newUid);
    const profile = {
      uid: newUid,
      displayName: displayName.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: formattedPhone,
      role: role || 'TEAM_MEMBER',
      isActive: true,
      permissions: cleanPermissions,
      linkedAuthUids: [newUid],
      createdAt: serverTimestamp(),
      createdBy: currentUser.uid,
    };
    await setDoc(userRef, profile);

    return profile;
  } catch (error) {
    try {
      await deleteApp(secondaryApp);
    } catch (_) {}
    throw error;
  }
}

/**
 * Grant or revoke granular operational permissions for a team member (ADMIN only).
 * Directly updates the member's canonical record and synchronizes to all linked auth UIDs/aliases.
 */
export async function updateMemberPermissions(targetUid, permissions, currentUser) {
  if (!db) throw new Error('Firestore not initialized');
  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can configure team member permissions.');
  }

  const cleanPermissions = {
    canAddCredit: Boolean(permissions?.canAddCredit),
    canAddDebit: Boolean(permissions?.canAddDebit),
  };

  const userRef = doc(db, 'users', targetUid);
  await updateDoc(userRef, {
    permissions: cleanPermissions,
    updatedAt: serverTimestamp(),
    updatedBy: currentUser.uid,
  });

  // Sync to all linked alias documents so phone auth sessions immediately reflect the updated permissions
  try {
    const snap = await getDoc(userRef);
    const data = snap.data();
    const linked = Array.isArray(data?.linkedAuthUids) ? data.linkedAuthUids : [];
    for (const linkedUid of linked) {
      if (linkedUid !== targetUid) {
        await updateDoc(doc(db, 'users', linkedUid), {
          permissions: cleanPermissions,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid,
        }).catch(() => {});
      }
    }
  } catch (_) {}

  return cleanPermissions;
}

/**
 * Update an existing team member's profile and permissions (ADMIN only)
 */
export async function updateTeamMember(targetUid, { displayName, email, phoneNumber, role, permissions }, currentUser) {
  if (!db) throw new Error('Firestore not initialized');
  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can update team member profiles.');
  }

  let formattedPhone = '';
  if (phoneNumber && phoneNumber.trim()) {
    formattedPhone = phoneNumber.trim().replace(/\s+/g, ' ');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91 ' + formattedPhone;
    }
  }

  const updatePayload = {
    updatedAt: serverTimestamp(),
    updatedBy: currentUser.uid,
  };

  if (displayName !== undefined) {
    updatePayload.displayName = displayName.trim();
  }

  if (email !== undefined) {
    updatePayload.email = email.trim().toLowerCase();
  }

  if (phoneNumber !== undefined) {
    updatePayload.phoneNumber = formattedPhone;
  }

  if (role !== undefined) {
    if (!['ADMIN', 'TEAM_MEMBER'].includes(role)) {
      throw new Error('Invalid role specified.');
    }
    if (targetUid === currentUser.uid && role !== 'ADMIN') {
      throw new Error('Operation denied: You cannot demote your own administrative account.');
    }
    updatePayload.role = role;
  }

  if (permissions !== undefined) {
    updatePayload.permissions = {
      canAddCredit: Boolean(permissions?.canAddCredit),
      canAddDebit: Boolean(permissions?.canAddDebit),
    };
  }

  const userRef = doc(db, 'users', targetUid);
  await updateDoc(userRef, updatePayload);

  // Sync update to all linked alias documents (e.g. phone auth alias)
  try {
    const snap = await getDoc(userRef);
    const data = snap.data();
    const linked = Array.isArray(data?.linkedAuthUids) ? data.linkedAuthUids : [];
    for (const linkedUid of linked) {
      if (linkedUid !== targetUid) {
        await updateDoc(doc(db, 'users', linkedUid), {
          ...updatePayload,
          isAlias: true,
          primaryUid: targetUid,
        }).catch(() => {});
      }
    }
  } catch (_) {}
}

/**
 * Permanently delete or archive a team member profile (ADMIN only)
 */
export async function deleteTeamMember(targetUid, currentUser) {
  if (!db) throw new Error('Firestore not initialized');
  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can delete team member accounts.');
  }

  if (targetUid === currentUser.uid) {
    throw new Error('Operation denied: You cannot delete your own administrative account.');
  }

  const userRef = doc(db, 'users', targetUid);

  // Collect linked alias UIDs for cleanup
  let linkedUids = [];
  try {
    const snap = await getDoc(userRef);
    const data = snap.data();
    linkedUids = Array.isArray(data?.linkedAuthUids) ? data.linkedAuthUids : [];
  } catch (_) {}

  try {
    // Attempt hard delete of primary document from Cloud Firestore
    await deleteDoc(userRef);

    // Also delete any linked alias documents
    for (const linkedUid of linkedUids) {
      if (linkedUid !== targetUid) {
        await deleteDoc(doc(db, 'users', linkedUid)).catch(() => {});
      }
    }
  } catch (err) {
    // If live Firestore Security Rules block hard deletion (e.g. allow delete: if false in Firebase Console),
    // immediately fall back to soft-deleting and deactivating, which is permitted by admin update rules.
    if (err?.code === 'permission-denied' || err?.message?.toLowerCase().includes('permission')) {
      console.warn('Hard delete blocked by Firestore rules; falling back to soft-delete deactivation:', err.message);
      await updateDoc(userRef, {
        isDeleted: true,
        isActive: false,
        deletedAt: serverTimestamp(),
        deletedBy: currentUser.uid,
      });

      // Also soft-delete any linked alias documents
      for (const linkedUid of linkedUids) {
        if (linkedUid !== targetUid) {
          await updateDoc(doc(db, 'users', linkedUid), {
            isDeleted: true,
            isActive: false,
            deletedAt: serverTimestamp(),
            deletedBy: currentUser.uid,
          }).catch(() => {});
        }
      }

      return { softDeleted: true, ruleBlocked: true };
    }
    throw err;
  }
}

/**
 * Permanently purge soft-deleted member documents from Cloud Firestore (ADMIN only)
 */
export async function purgeSoftDeletedUsers(currentUser) {
  if (!db) throw new Error('Firestore not initialized');
  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can purge records.');
  }

  const usersCollection = collection(db, 'users');
  const snap = await getDocs(usersCollection);
  let purgedCount = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (data.isDeleted && docSnap.id !== currentUser.uid) {
      await deleteDoc(doc(db, 'users', docSnap.id));
      purgedCount++;
    }
  }

  return purgedCount;
}
