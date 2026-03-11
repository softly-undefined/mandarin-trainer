const STORAGE_NAMESPACE = 'learningSession:v1';

function getUserScope(userId) {
    return userId || 'anonymous';
}

function getLatestSessionKey(userId) {
    return `${STORAGE_NAMESPACE}:latest:${getUserScope(userId)}`;
}

function getSessionKey(userId, sessionId) {
    return `${STORAGE_NAMESPACE}:session:${getUserScope(userId)}:${sessionId}`;
}

function safeReadStorage(key) {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return null;
        return window.localStorage.getItem(key);
    } catch (error) {
        console.warn('Unable to read learning session from localStorage:', error);
        return null;
    }
}

function safeWriteStorage(key, value) {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.setItem(key, value);
    } catch (error) {
        console.warn('Unable to write learning session to localStorage:', error);
    }
}

function safeRemoveStorage(key) {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return;
        window.localStorage.removeItem(key);
    } catch (error) {
        console.warn('Unable to remove learning session from localStorage:', error);
    }
}

function parseStoredSession(value) {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch (error) {
        console.warn('Unable to parse stored learning session:', error);
        return null;
    }
}

function buildSessionId() {
    return `session_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

export function createLearningSession({
    userId,
    setId,
    setName,
    mode,
    totalWords = 0,
}) {
    const now = new Date().toISOString();
    const session = {
        sessionId: buildSessionId(),
        userId: userId || null,
        setId: setId || '',
        setName: setName || '',
        mode: mode || {},
        status: 'active',
        progress: {
            learnedWords: 0,
            totalWords: totalWords || 0,
            responseCount: 0,
        },
        createdAt: now,
        updatedAt: now,
        completedAt: null,
    };

    safeWriteStorage(getSessionKey(userId, session.sessionId), JSON.stringify(session));
    safeWriteStorage(getLatestSessionKey(userId), JSON.stringify(session));
    return session;
}

export function updateLearningSession({ userId, sessionId, patch = {} }) {
    if (!sessionId) return null;

    const existing = parseStoredSession(safeReadStorage(getSessionKey(userId, sessionId))) || {};
    const merged = {
        ...existing,
        ...patch,
        progress: {
            ...(existing.progress || {}),
            ...(patch.progress || {}),
        },
        updatedAt: new Date().toISOString(),
    };

    safeWriteStorage(getSessionKey(userId, sessionId), JSON.stringify(merged));
    safeWriteStorage(getLatestSessionKey(userId), JSON.stringify(merged));
    return merged;
}

export function completeLearningSession({ userId, sessionId, patch = {} }) {
    if (!sessionId) return null;
    return updateLearningSession({
        userId,
        sessionId,
        patch: {
            ...patch,
            status: 'completed',
            completedAt: new Date().toISOString(),
        },
    });
}

export function getLatestLearningSession(userId) {
    return parseStoredSession(safeReadStorage(getLatestSessionKey(userId)));
}

export function clearLatestLearningSession(userId) {
    safeRemoveStorage(getLatestSessionKey(userId));
}
