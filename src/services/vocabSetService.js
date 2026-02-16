import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, limit } from 'firebase/firestore';
import { normalizeVocabItems } from '../utils/chineseConverter';

const MAX_SETS_PER_USER = 50;
export const MAX_WORDS_PER_SET = 200;
const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

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

export async function createVocabSet(userId, setName, vocabItems) {
    try {
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
        const docRef = await addDoc(collection(db, 'vocabSets'), {
            userId,
            ownerId: userId,
            setName,
            vocabItems: normalizedItems,
            slug,
            isPublic: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating vocab set:", error);
        throw error;
    }
}

export async function getUserVocabSets(userId) {
    try {
        const q = query(collection(db, 'vocabSets'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const sets = [];

        for (const d of querySnapshot.docs) {
            const data = d.data();
            let needsUpdate = false;
            const updatePayload = {};

            if (!data.ownerId) {
                updatePayload.ownerId = userId;
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

            if (needsUpdate) {
                try {
                    await updateDoc(doc(db, 'vocabSets', d.id), { ...updatePayload, updatedAt: new Date() });
                } catch (err) {
                    console.error("Error backfilling set", d.id, err);
                }
            }

            sets.push({ id: d.id, ...data, ...updatePayload });
        }

        return sets;
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
        return {
            id: d.id,
            ...data,
            vocabItems: normalizeVocabItems(data.vocabItems),
        };
    } catch (error) {
        console.error("Error fetching set by slug:", error);
        throw error;
    }
}

export async function duplicateSet(targetUserId, sourceSet) {
    const { setName, vocabItems } = sourceSet;
    return await createVocabSet(targetUserId, `${setName} (copy)`, vocabItems || []);
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
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error searching vocab sets:", error);
        throw error;
    }
} 
