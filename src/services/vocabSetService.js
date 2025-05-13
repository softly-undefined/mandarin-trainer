import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const MAX_SETS_PER_USER = 50;
const MAX_WORDS_PER_SET = 100;

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

        const docRef = await addDoc(collection(db, 'vocabSets'), {
            userId,
            setName,
            vocabItems,
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
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
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