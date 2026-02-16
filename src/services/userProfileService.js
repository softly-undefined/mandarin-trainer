import { db, storage } from '../firebase';
import {
    collection,
    doc,
    documentId,
    getDoc,
    getDocs,
    query,
    runTransaction,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const USERS_COLLECTION = 'users';
const USERNAMES_COLLECTION = 'usernames';
const USERNAME_MIN_LEN = 3;
const USERNAME_MAX_LEN = 24;
const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/;

function buildDisplayName(user) {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'Mandarin Learner';
}

function safeFileName(name) {
    if (!name) return 'avatar';
    return String(name).replace(/[^a-zA-Z0-9._-]/g, '_');
}

function normalizeWhitespace(value) {
    return String(value || '').trim().replace(/\s+/g, '');
}

export function sanitizeUsername(value) {
    const lowered = normalizeWhitespace(value).toLowerCase();
    let cleaned = lowered.replace(/[^a-z0-9_-]/g, '');
    cleaned = cleaned.replace(/^[^a-z0-9]+/, '').replace(/[^a-z0-9]+$/, '');
    if (cleaned.length > USERNAME_MAX_LEN) {
        cleaned = cleaned.slice(0, USERNAME_MAX_LEN);
    }
    return cleaned;
}

export function isUsernameFormatValid(username) {
    return (
        typeof username === 'string' &&
        username.length >= USERNAME_MIN_LEN &&
        username.length <= USERNAME_MAX_LEN &&
        USERNAME_REGEX.test(username)
    );
}

export function getUsernameValidationMessage(input) {
    const normalized = sanitizeUsername(input);
    if (!normalized) return 'Username is required.';
    if (normalized.length < USERNAME_MIN_LEN) return `Username must be at least ${USERNAME_MIN_LEN} characters.`;
    if (normalized.length > USERNAME_MAX_LEN) return `Username must be at most ${USERNAME_MAX_LEN} characters.`;
    if (!isUsernameFormatValid(normalized)) {
        return 'Username must start/end with a letter or number and can include _ or - in the middle.';
    }
    return '';
}

export function getProfileHandle(profile, fallbackUid = '') {
    const username = sanitizeUsername(profile?.username || '');
    if (isUsernameFormatValid(username)) {
        return username;
    }
    return fallbackUid || profile?.uid || '';
}

function createUsernameError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
}

function buildUsernameSeed(user, uid) {
    const fromDisplayName = sanitizeUsername(user?.displayName || '');
    const fromEmail = sanitizeUsername(user?.email?.split('@')[0] || '');
    const fallback = sanitizeUsername(`user${String(uid || '').slice(0, 8)}`) || 'learner';
    return fromDisplayName || fromEmail || fallback;
}

async function claimUsername(uid, desiredUsername, currentUsername = '') {
    const normalizedDesired = sanitizeUsername(desiredUsername);
    const normalizedCurrent = sanitizeUsername(currentUsername);

    if (!isUsernameFormatValid(normalizedDesired)) {
        throw createUsernameError('invalid-username', 'Invalid username format.');
    }

    await runTransaction(db, async (transaction) => {
        const desiredRef = doc(db, USERNAMES_COLLECTION, normalizedDesired);
        const desiredSnap = await transaction.get(desiredRef);
        const desiredOwnerUid = desiredSnap.exists() ? desiredSnap.data()?.uid : '';

        if (desiredOwnerUid && desiredOwnerUid !== uid) {
            throw createUsernameError('username-taken', 'That username is already taken.');
        }

        const profileRef = doc(db, USERS_COLLECTION, uid);
        const now = new Date();

        if (normalizedCurrent && normalizedCurrent !== normalizedDesired) {
            const currentRef = doc(db, USERNAMES_COLLECTION, normalizedCurrent);
            const currentSnap = await transaction.get(currentRef);
            if (currentSnap.exists() && currentSnap.data()?.uid === uid) {
                transaction.delete(currentRef);
            }
        }

        transaction.set(desiredRef, {
            uid,
            username: normalizedDesired,
            updatedAt: now,
        }, { merge: true });

        transaction.set(profileRef, {
            username: normalizedDesired,
            updatedAt: now,
        }, { merge: true });
    });

    return normalizedDesired;
}

async function reserveInitialUsername(uid, user, currentUsername = '') {
    const baseSeed = buildUsernameSeed(user, uid);

    for (let attempt = 0; attempt < 100; attempt += 1) {
        const suffix = attempt === 0 ? '' : `${attempt}`;
        const base = baseSeed.slice(0, Math.max(1, USERNAME_MAX_LEN - suffix.length));
        const candidate = sanitizeUsername(`${base}${suffix}`);
        if (!isUsernameFormatValid(candidate)) {
            continue;
        }

        try {
            return await claimUsername(uid, candidate, currentUsername);
        } catch (err) {
            if (err?.code === 'username-taken') {
                continue;
            }
            throw err;
        }
    }

    throw createUsernameError('username-unavailable', 'Unable to reserve a username right now.');
}

function mergeProfile(uid, profileData = {}) {
    const username = sanitizeUsername(profileData.username || '');
    return {
        uid,
        ...profileData,
        username: isUsernameFormatValid(username) ? username : '',
    };
}

export async function ensureUserProfileFromAuth(user) {
    if (!user?.uid) return null;

    const profileRef = doc(db, USERS_COLLECTION, user.uid);
    const snapshot = await getDoc(profileRef);

    const displayName = buildDisplayName(user);
    const googlePhotoURL = user.photoURL || '';
    const now = new Date();

    let mergedData;

    if (!snapshot.exists()) {
        const initialProfile = {
            displayName,
            email: user.email || '',
            photoURL: googlePhotoURL,
            googlePhotoURL,
            createdAt: now,
            updatedAt: now,
        };
        await setDoc(profileRef, initialProfile);
        mergedData = initialProfile;
    } else {
        const existing = snapshot.data();
        const updates = {};

        if (!existing.displayName && displayName) {
            updates.displayName = displayName;
        }
        if (!existing.email && user.email) {
            updates.email = user.email;
        }
        if (googlePhotoURL && existing.googlePhotoURL !== googlePhotoURL) {
            updates.googlePhotoURL = googlePhotoURL;
        }
        if (googlePhotoURL && (!existing.photoURL || existing.photoURL === existing.googlePhotoURL)) {
            updates.photoURL = googlePhotoURL;
        }

        if (Object.keys(updates).length > 0) {
            updates.updatedAt = now;
            await updateDoc(profileRef, updates);
        }

        mergedData = { ...existing, ...updates };
    }

    let username = sanitizeUsername(mergedData.username || '');
    if (!isUsernameFormatValid(username)) {
        username = await reserveInitialUsername(user.uid, user, mergedData.username || '');
        mergedData = { ...mergedData, username };
    } else {
        try {
            await claimUsername(user.uid, username, username);
        } catch (err) {
            if (err?.code === 'username-taken') {
                username = await reserveInitialUsername(user.uid, user, username);
                mergedData = { ...mergedData, username };
            } else {
                throw err;
            }
        }
    }

    return mergeProfile(user.uid, mergedData);
}

export async function getUserProfileById(uid) {
    if (!uid) return null;
    const profileRef = doc(db, USERS_COLLECTION, uid);
    const snapshot = await getDoc(profileRef);
    if (!snapshot.exists()) {
        return null;
    }
    return mergeProfile(uid, snapshot.data());
}

export async function getUserProfileByHandle(handle) {
    const normalizedHandle = sanitizeUsername(handle || '');

    if (isUsernameFormatValid(normalizedHandle)) {
        const usernameRef = doc(db, USERNAMES_COLLECTION, normalizedHandle);
        const usernameSnap = await getDoc(usernameRef);
        if (usernameSnap.exists()) {
            const linkedUid = usernameSnap.data()?.uid;
            if (linkedUid) {
                const profile = await getUserProfileById(linkedUid);
                if (profile) {
                    return profile;
                }
                return {
                    uid: linkedUid,
                    username: normalizedHandle,
                };
            }
        }
    }

    const byUid = await getUserProfileById(handle);
    if (byUid) {
        return byUid;
    }

    return null;
}

export async function getUserProfilesByIds(uids) {
    if (!Array.isArray(uids) || uids.length === 0) {
        return {};
    }

    const uniqueIds = Array.from(new Set(uids.filter(Boolean)));
    if (uniqueIds.length === 0) {
        return {};
    }

    const result = {};
    const chunkSize = 10;

    for (let i = 0; i < uniqueIds.length; i += chunkSize) {
        const chunk = uniqueIds.slice(i, i + chunkSize);
        const q = query(collection(db, USERS_COLLECTION), where(documentId(), 'in', chunk));
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap) => {
            result[docSnap.id] = mergeProfile(docSnap.id, docSnap.data());
        });
    }

    return result;
}

export async function updateUsername(uid, nextUsername) {
    if (!uid) {
        throw new Error('Missing user');
    }

    const normalizedNext = sanitizeUsername(nextUsername);
    const validationError = getUsernameValidationMessage(normalizedNext);
    if (validationError) {
        throw createUsernameError('invalid-username', validationError);
    }

    const profile = await getUserProfileById(uid);
    const currentUsername = profile?.username || '';
    const claimed = await claimUsername(uid, normalizedNext, currentUsername);
    return claimed;
}

export async function uploadUserProfilePhoto(uid, file) {
    if (!uid || !file) {
        throw new Error('Missing user or file');
    }

    const path = `profilePhotos/${uid}/${Date.now()}-${safeFileName(file.name)}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}

export async function updateUserProfilePhoto(uid, photoURL) {
    if (!uid) {
        throw new Error('Missing user');
    }

    const profileRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(profileRef, {
        photoURL: photoURL || '',
        updatedAt: new Date(),
    }, { merge: true });
}

export async function resetUserProfilePhotoToGoogle(uid, fallbackGooglePhotoURL = '') {
    if (!uid) {
        throw new Error('Missing user');
    }

    const profileRef = doc(db, USERS_COLLECTION, uid);
    const snapshot = await getDoc(profileRef);
    const data = snapshot.exists() ? snapshot.data() : {};
    const googlePhotoURL = data.googlePhotoURL || fallbackGooglePhotoURL || '';

    await setDoc(profileRef, {
        photoURL: googlePhotoURL,
        googlePhotoURL,
        updatedAt: new Date(),
    }, { merge: true });

    return googlePhotoURL;
}
