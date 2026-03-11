export const LEARNING_SESSION_ACTIONS = {
    RESET: 'RESET',
    INITIALIZE: 'INITIALIZE',
    PATCH: 'PATCH',
    SET_ANSWER: 'SET_ANSWER',
    SET_SELECTED_ANSWER: 'SET_SELECTED_ANSWER',
};

export function createInitialLearningSessionState() {
    return {
        sessionId: '',
        currentSet: null,
        term: '',
        key: '',
        answer: '',
        keyText: false,
        submissionNum: 1,
        isSubmitting: false,
        isCorrect: false,
        formColor: 'black',
        currChar: '',
        currPinyin: '',
        currDefinition: '',
        buttonState: 'primary',
        buttonText: 'Submit',
        selectedAnswer: null,
        mcOptions: [],
        answerPlacement: null,
        shuffledSet: [],
        remainingSet: [],
        answerCounts: {},
        wrongCounts: {},
        totalWords: 0,
        learnedWords: 0,
        learnedWordKeys: [],
        lastWord: null,
        responseCounts: [],
        learnedOverTime: [],
    };
}

export function learningSessionReducer(state, action) {
    switch (action.type) {
        case LEARNING_SESSION_ACTIONS.RESET:
            return createInitialLearningSessionState();
        case LEARNING_SESSION_ACTIONS.INITIALIZE:
            return {
                ...createInitialLearningSessionState(),
                ...action.payload,
            };
        case LEARNING_SESSION_ACTIONS.PATCH:
            return {
                ...state,
                ...(action.payload || {}),
            };
        case LEARNING_SESSION_ACTIONS.SET_ANSWER:
            return {
                ...state,
                answer: action.payload || '',
            };
        case LEARNING_SESSION_ACTIONS.SET_SELECTED_ANSWER:
            return {
                ...state,
                selectedAnswer: action.payload,
            };
        default:
            return state;
    }
}
