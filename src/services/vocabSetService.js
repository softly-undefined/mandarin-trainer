import { db } from '../firebase';
import {
    collection,
    addDoc,
    getDoc,
    getDocs,
    doc,
    updateDoc,
    setDoc,
    deleteDoc,
    query,
    where,
    limit,
    runTransaction,
    documentId,
} from 'firebase/firestore';
import { normalizeVocabItems } from '../utils/chineseConverter';
import { sanitizeUsername } from './userProfileService';

const MAX_SETS_PER_USER = 50;
export const MAX_WORDS_PER_SET = 200;
const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const VOCAB_SETS_COLLECTION = 'vocabSets';
const SET_STARS_COLLECTION = 'setStars';

const generateSlug = (length = 8) => {
    let result = '';
    const charsLength = SLUG_CHARS.length;
    for (let i = 0; i < length; i++) {
        result += SLUG_CHARS.charAt(Math.floor(Math.random() * charsLength));
    }
    return result;
};

const ensureSlug = async () => {
    // Extremely low collision risk; no collection scan to avoid rules issues
    return generateSlug();
};

const resolveOwnerId = (data, fallbackOwnerId = '') => data?.ownerId || data?.userId || fallbackOwnerId || '';

const normalizeStarUserIds = (data, fallbackOwnerId = '') => {
    const ownerId = resolveOwnerId(data, fallbackOwnerId);
    const normalized = new Set(Array.isArray(data?.starUserIds) ? data.starUserIds.filter(Boolean) : []);

    if (ownerId) {
        normalized.add(ownerId);
    }

    return Array.from(normalized);
};

const buildStarDocId = (setId, userId) => `${setId}_${userId}`;

const normalizeOwnerMetadata = (ownerProfile = {}) => {
    const ownerUsername = sanitizeUsername(ownerProfile?.username || '');
    return {
        ownerDisplayName: ownerProfile?.displayName || '',
        ownerPhotoURL: ownerProfile?.photoURL || '',
        ownerUsername,
    };
};

const normalizeOwnerMetadataFromSet = (setData = {}) => {
    return {
        ownerDisplayName: setData?.ownerDisplayName || '',
        ownerPhotoURL: setData?.ownerPhotoURL || '',
        ownerUsername: sanitizeUsername(setData?.ownerUsername || ''),
    };
};

async function getStarUsersForSetIds(setIds) {
    const uniqueSetIds = Array.from(new Set((setIds || []).filter(Boolean)));
    if (uniqueSetIds.length === 0) {
        return {};
    }

    const starMap = {};
    const chunkSize = 10;
    for (let i = 0; i < uniqueSetIds.length; i += chunkSize) {
        const chunk = uniqueSetIds.slice(i, i + chunkSize);
        const q = query(
            collection(db, SET_STARS_COLLECTION),
            where('setId', 'in', chunk)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const setId = data?.setId;
            const userId = data?.userId;
            if (!setId || !userId) return;
            if (!starMap[setId]) {
                starMap[setId] = new Set();
            }
            starMap[setId].add(userId);
        });
    }

    return starMap;
}

async function applyStarCollectionToSets(sets = []) {
    if (!Array.isArray(sets) || sets.length === 0) {
        return [];
    }

    let starMap = {};
    try {
        starMap = await getStarUsersForSetIds(sets.map((set) => set.id));
    } catch (error) {
        console.warn('Falling back to legacy set star fields:', error);
        return sets.map((set) => {
            const ownerId = resolveOwnerId(set);
            const legacy = new Set(normalizeStarUserIds(set, ownerId));
            if (ownerId) {
                legacy.add(ownerId);
            }
            return {
                ...set,
                starUserIds: Array.from(legacy),
                starCount: legacy.size,
            };
        });
    }

    return sets.map((set) => {
        const ownerId = resolveOwnerId(set);
        const fromStarDocs = starMap[set.id] ? Array.from(starMap[set.id]) : [];
        const starIds = new Set(fromStarDocs);
        if (ownerId) {
            starIds.add(ownerId);
        }

        return {
            ...set,
            starUserIds: Array.from(starIds),
            starCount: starIds.size,
        };
    });
}

async function applyStarCollectionToSet(set) {
    if (!set?.id) return set;
    const updated = await applyStarCollectionToSets([set]);
    return updated[0] || set;
}

export function getSetStarCount(set) {
    if (typeof set?.starCount === 'number') {
        return set.starCount;
    }
    return normalizeStarUserIds(set).length;
}

export function isSetStarredByUser(set, userId) {
    if (!userId) return false;
    const ownerId = resolveOwnerId(set);
    if (ownerId && userId === ownerId) return true;
    const starredUserIds = normalizeStarUserIds(set);
    return starredUserIds.includes(userId);
};

const normalizeSetRecord = (id, data, fallbackOwnerId = '') => {
    const ownerId = resolveOwnerId(data, fallbackOwnerId);
    const normalizedItems = normalizeVocabItems(data?.vocabItems || []);
    const starUserIds = normalizeStarUserIds(data, fallbackOwnerId);
    const ownerMeta = normalizeOwnerMetadataFromSet(data);

    return {
        id,
        ...data,
        ownerId,
        userId: data?.userId || ownerId,
        ...ownerMeta,
        isPublic: data?.isPublic !== false,
        vocabItems: normalizedItems,
        starUserIds,
        starCount: typeof data?.starCount === 'number' ? data.starCount : starUserIds.length,
    };
};

export async function createVocabSet(userId, setName, vocabItems, options = {}) {
    try {
        const { isPublic = true, ownerProfile = null } = options;

        // Check if user has reached the maximum number of sets
        const userSets = await getUserVocabSets(userId);
        if (userSets.length >= MAX_SETS_PER_USER) {
            throw new Error(`Maximum limit of ${MAX_SETS_PER_USER} sets reached`);
        }

        // Check if the new set would exceed the word limit
        if (vocabItems.length > MAX_WORDS_PER_SET) {
            throw new Error(`Maximum limit of ${MAX_WORDS_PER_SET} words per set reached`);
        }

        const normalizedItems = normalizeVocabItems(vocabItems);
        const slug = await ensureSlug();
        const starUserIds = [userId];
        const ownerMeta = normalizeOwnerMetadata(ownerProfile || {});
        const docRef = await addDoc(collection(db, 'vocabSets'), {
            userId,
            ownerId: userId,
            ...ownerMeta,
            setName,
            vocabItems: normalizedItems,
            slug,
            isPublic,
            starUserIds,
            starCount: starUserIds.length,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating vocab set:", error);
        throw error;
    }
}

export async function getUserVocabSets(userId, options = {}) {
    try {
        const { ownerProfile = null } = options;
        const normalizedOwnerMeta = normalizeOwnerMetadata(ownerProfile || {});
        const q = query(collection(db, 'vocabSets'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const sets = [];

        for (const d of querySnapshot.docs) {
            const data = d.data();
            const ownerId = resolveOwnerId(data, userId);
            let needsUpdate = false;
            const updatePayload = {};

            if (!data.ownerId) {
                updatePayload.ownerId = ownerId;
                needsUpdate = true;
            }
            if (data.isPublic === undefined) {
                updatePayload.isPublic = true;
                needsUpdate = true;
            }
            if (!data.slug) {
                updatePayload.slug = await ensureSlug();
                needsUpdate = true;
            }

            // Normalize vocabItems to include characterTrad
            const normalizedItems = normalizeVocabItems(data.vocabItems);
            const itemsChanged = JSON.stringify(normalizedItems) !== JSON.stringify(data.vocabItems);
            if (itemsChanged) {
                updatePayload.vocabItems = normalizedItems;
                needsUpdate = true;
            }

            if (ownerProfile) {
                if (normalizedOwnerMeta.ownerDisplayName && data.ownerDisplayName !== normalizedOwnerMeta.ownerDisplayName) {
                    updatePayload.ownerDisplayName = normalizedOwnerMeta.ownerDisplayName;
                    needsUpdate = true;
                }
                if (normalizedOwnerMeta.ownerPhotoURL && data.ownerPhotoURL !== normalizedOwnerMeta.ownerPhotoURL) {
                    updatePayload.ownerPhotoURL = normalizedOwnerMeta.ownerPhotoURL;
                    needsUpdate = true;
                }
                if (normalizedOwnerMeta.ownerUsername && data.ownerUsername !== normalizedOwnerMeta.ownerUsername) {
                    updatePayload.ownerUsername = normalizedOwnerMeta.ownerUsername;
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                try {
                    await updateDoc(doc(db, 'vocabSets', d.id), { ...updatePayload, updatedAt: new Date() });
                } catch (err) {
                    console.error("Error backfilling set", d.id, err);
                }
            }

            sets.push(normalizeSetRecord(d.id, { ...data, ...updatePayload }, ownerId));
        }

        const setsWithStars = await applyStarCollectionToSets(sets);

        setsWithStars.sort((a, b) => {
            const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
            const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
            return bTime - aTime;
        });

        return setsWithStars;
    } catch (error) {
        console.error("Error fetching vocab sets:", error);
        throw error;
    }
}

export async function updateVocabSet(setId, updates) {
    try {
        // Check if the update would exceed the word limit
        if (updates.vocabItems && updates.vocabItems.length > MAX_WORDS_PER_SET) {
            throw new Error(`Maximum limit of ${MAX_WORDS_PER_SET} words per set reached`);
        }

        const setRef = doc(db, 'vocabSets', setId);
        await updateDoc(setRef, {
            ...updates,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error("Error updating vocab set:", error);
        throw error;
    }
}

export async function syncOwnerMetadataForUser(userId, ownerProfile) {
    if (!userId || !ownerProfile) {
        return;
    }

    const ownerMeta = normalizeOwnerMetadata(ownerProfile);
    if (!ownerMeta.ownerDisplayName && !ownerMeta.ownerPhotoURL && !ownerMeta.ownerUsername) {
        return;
    }

    const q = query(collection(db, VOCAB_SETS_COLLECTION), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const updates = {};

        if (ownerMeta.ownerDisplayName && data.ownerDisplayName !== ownerMeta.ownerDisplayName) {
            updates.ownerDisplayName = ownerMeta.ownerDisplayName;
        }
        if (ownerMeta.ownerPhotoURL && data.ownerPhotoURL !== ownerMeta.ownerPhotoURL) {
            updates.ownerPhotoURL = ownerMeta.ownerPhotoURL;
        }
        if (ownerMeta.ownerUsername && data.ownerUsername !== ownerMeta.ownerUsername) {
            updates.ownerUsername = ownerMeta.ownerUsername;
        }

        if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, VOCAB_SETS_COLLECTION, docSnap.id), {
                ...updates,
                updatedAt: new Date(),
            });
        }
    }
}

export async function ensureSetSlug(setId) {
    const slug = await ensureSlug();
    const setRef = doc(db, 'vocabSets', setId);
    await updateDoc(setRef, { slug, updatedAt: new Date() });
    return slug;
}

export async function getSetBySlug(slug) {
    try {
        const q = query(collection(db, 'vocabSets'), where('slug', '==', slug), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const d = snapshot.docs[0];
        const data = d.data();
        const normalized = normalizeSetRecord(d.id, data);
        return await applyStarCollectionToSet(normalized);
    } catch (error) {
        console.error("Error fetching set by slug:", error);
        throw error;
    }
}

export async function getPublicVocabSetsByUser(userId) {
    try {
        let docs = [];

        try {
            const directQuery = query(
                collection(db, 'vocabSets'),
                where('userId', '==', userId),
                where('isPublic', '==', true)
            );
            const directSnapshot = await getDocs(directQuery);
            docs = directSnapshot.docs;
        } catch (queryError) {
            const code = queryError?.code || '';
            const message = String(queryError?.message || '');
            const canFallback =
                code === 'failed-precondition' ||
                code === 'permission-denied' ||
                message.toLowerCase().includes('index') ||
                message.toLowerCase().includes('insufficient permissions');

            if (!canFallback) {
                throw queryError;
            }

            // Fallback while indexes/rules are being adjusted.
            const fallbackQuery = query(
                collection(db, 'vocabSets'),
                where('isPublic', '==', true)
            );
            const fallbackSnapshot = await getDocs(fallbackQuery);
            docs = fallbackSnapshot.docs.filter((d) => {
                const data = d.data();
                const ownerId = resolveOwnerId(data);
                return ownerId === userId || data?.userId === userId;
            });
        }

        const sets = docs.map((d) => normalizeSetRecord(d.id, d.data(), userId));
        const setsWithStars = await applyStarCollectionToSets(sets);

        setsWithStars.sort((a, b) => {
            const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
            const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
            return bTime - aTime;
        });

        return setsWithStars;
    } catch (error) {
        console.error("Error fetching public vocab sets:", error);
        throw error;
    }
}

export async function getPublicVocabSetsByUsername(username) {
    const normalizedUsername = sanitizeUsername(username || '');
    if (!normalizedUsername) {
        return [];
    }

    try {
        const q = query(
            collection(db, VOCAB_SETS_COLLECTION),
            where('ownerUsername', '==', normalizedUsername),
            where('isPublic', '==', true)
        );
        const querySnapshot = await getDocs(q);
        const sets = querySnapshot.docs.map((d) => normalizeSetRecord(d.id, d.data()));
        const setsWithStars = await applyStarCollectionToSets(sets);

        setsWithStars.sort((a, b) => {
            const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
            const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
            return bTime - aTime;
        });

        return setsWithStars;
    } catch (error) {
        console.error("Error fetching public sets by username:", error);
        return [];
    }
}

export async function getStarredVocabSetsForUser(userId) {
    try {
        let setIdsFromStarDocs = [];
        try {
            const starsQuery = query(
                collection(db, SET_STARS_COLLECTION),
                where('userId', '==', userId)
            );
            const starsSnapshot = await getDocs(starsQuery);
            setIdsFromStarDocs = Array.from(
                new Set(
                    starsSnapshot.docs
                        .map((docSnap) => docSnap.data()?.setId)
                        .filter(Boolean)
                )
            );
        } catch (starsErr) {
            console.warn('Unable to load star docs collection:', starsErr);
        }

        let legacySetIds = [];
        try {
            const legacyQuery = query(
                collection(db, VOCAB_SETS_COLLECTION),
                where('starUserIds', 'array-contains', userId),
                where('isPublic', '==', true)
            );
            const legacySnapshot = await getDocs(legacyQuery);
            legacySetIds = legacySnapshot.docs.map((docSnap) => docSnap.id);
        } catch (legacyErr) {
            console.warn('Unable to load legacy starred sets:', legacyErr);
        }

        const setIds = Array.from(new Set([...setIdsFromStarDocs, ...legacySetIds]));
        if (setIds.length === 0) {
            return [];
        }

        const sets = [];
        const chunkSize = 10;
        for (let i = 0; i < setIds.length; i += chunkSize) {
            const chunk = setIds.slice(i, i + chunkSize);
            const setsQuery = query(
                collection(db, VOCAB_SETS_COLLECTION),
                where(documentId(), 'in', chunk)
            );
            const setsSnapshot = await getDocs(setsQuery);
            setsSnapshot.forEach((docSnap) => {
                const normalized = normalizeSetRecord(docSnap.id, docSnap.data());
                if (normalized.isPublic !== false) {
                    sets.push(normalized);
                }
            });
        }

        const setsWithStars = await applyStarCollectionToSets(sets);
        const filtered = setsWithStars.filter((set) => isSetStarredByUser(set, userId));

        filtered.sort((a, b) => {
            const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
            const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
            return bTime - aTime;
        });

        return filtered;
    } catch (error) {
        console.error("Error fetching starred vocab sets:", error);
        throw error;
    }
}

async function setVocabSetStarredLegacy(setId, userId, shouldBeStarred) {
    return await runTransaction(db, async (transaction) => {
        const setRef = doc(db, VOCAB_SETS_COLLECTION, setId);
        const setSnap = await transaction.get(setRef);

        if (!setSnap.exists()) {
            throw new Error('Set not found.');
        }

        const data = setSnap.data();
        const ownerId = resolveOwnerId(data);
        const starredUserIds = new Set(normalizeStarUserIds(data, ownerId));
        const currentlyStarred = starredUserIds.has(userId);
        const nextStarredValue = typeof shouldBeStarred === 'boolean' ? shouldBeStarred : !currentlyStarred;

        if (ownerId && userId === ownerId) {
            starredUserIds.add(ownerId);
        } else if (nextStarredValue) {
            starredUserIds.add(userId);
        } else {
            starredUserIds.delete(userId);
        }

        if (ownerId) {
            starredUserIds.add(ownerId);
        }

        const nextStarUserIds = Array.from(starredUserIds);
        const nextStarCount = nextStarUserIds.length;

        transaction.update(setRef, {
            starUserIds: nextStarUserIds,
            starCount: nextStarCount,
            updatedAt: new Date(),
        });

        return normalizeSetRecord(setId, {
            ...data,
            starUserIds: nextStarUserIds,
            starCount: nextStarCount,
        }, ownerId);
    });
}

async function setVocabSetStarredByStarDoc(setId, userId, shouldBeStarred) {
    const setRef = doc(db, VOCAB_SETS_COLLECTION, setId);
    const setSnap = await getDoc(setRef);

    if (!setSnap.exists()) {
        throw new Error('Set not found.');
    }

    const setData = setSnap.data();
    const ownerId = resolveOwnerId(setData);
    const normalizedSet = normalizeSetRecord(setId, setData, ownerId);

    if (ownerId && userId === ownerId) {
        return await applyStarCollectionToSet(normalizedSet);
    }

    const starRef = doc(db, SET_STARS_COLLECTION, buildStarDocId(setId, userId));
    const existingStar = await getDoc(starRef);
    const currentlyStarred = existingStar.exists();
    const nextStarredValue = typeof shouldBeStarred === 'boolean' ? shouldBeStarred : !currentlyStarred;
    const now = new Date();

    if (nextStarredValue) {
        await setDoc(starRef, {
            setId,
            userId,
            ownerId,
            createdAt: existingStar.exists() ? (existingStar.data()?.createdAt || now) : now,
            updatedAt: now,
        }, { merge: true });
    } else if (existingStar.exists()) {
        await deleteDoc(starRef);
    }

    return await applyStarCollectionToSet(normalizedSet);
}

export async function setVocabSetStarred(setId, userId, shouldBeStarred) {
    try {
        if (!userId) {
            throw new Error('Must be signed in to star sets.');
        }

        try {
            return await setVocabSetStarredLegacy(setId, userId, shouldBeStarred);
        } catch (legacyError) {
            const legacyCode = legacyError?.code || '';
            const legacyMessage = String(legacyError?.message || '').toLowerCase();
            const shouldFallback =
                legacyCode === 'permission-denied' ||
                legacyMessage.includes('insufficient permissions');

            if (!shouldFallback) {
                throw legacyError;
            }

            return await setVocabSetStarredByStarDoc(setId, userId, shouldBeStarred);
        }
    } catch (error) {
        console.error("Error starring vocab set:", error);
        throw error;
    }
}

export async function duplicateSet(targetUserId, sourceSet) {
    const { setName, vocabItems, isPublic } = sourceSet;
    return await createVocabSet(
        targetUserId,
        `${setName} (copy)`,
        vocabItems || [],
        { isPublic: isPublic !== false }
    );
}

export async function deleteVocabSet(setId) {
    try {
        await deleteDoc(doc(db, 'vocabSets', setId));
    } catch (error) {
        console.error("Error deleting vocab set:", error);
        throw error;
    }
}

export async function searchVocabSets(userId, searchTerm) {
    try {
        const q = query(
            collection(db, 'vocabSets'),
            where('userId', '==', userId),
            where('setName', '>=', searchTerm),
            where('setName', '<=', searchTerm + '\uf8ff')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((docSnap) => normalizeSetRecord(docSnap.id, docSnap.data(), userId));
    } catch (error) {
        console.error("Error searching vocab sets:", error);
        throw error;
    }
} 
