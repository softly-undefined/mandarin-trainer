import { useCallback, useEffect, useReducer } from "react";
import { Button, Card, CloseButton, Form, Stack, ProgressBar } from "react-bootstrap";
import { getUserVocabSets } from "../services/vocabSetService";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useScript } from "../contexts/ScriptContext";
import { usePinyin } from "../contexts/PinyinContext";
import { normalizePinyinForCompare } from "../utils/pinyinUtils";
import {
    buildPromptFromWord,
    buildValidWordsFromSet,
    hasRequiredWordFields,
    resolveWordField,
    shuffleWords,
} from "../learning/learningSessionModel";
import {
    createInitialLearningSessionState,
    LEARNING_SESSION_ACTIONS,
    learningSessionReducer,
} from "../learning/learningSessionReducer";
import {
    completeLearningSession,
    createLearningSession,
    updateLearningSession,
} from "../services/learningSessionService";

export default function TestingZone(props) {
    const {
        given,
        want,
        setChoice,
        goToPage,
        isMultipleChoice,
        isQuickReview,
        setResponseCounts,
        setLearnedOverTime,
        currentSetName,
        externalSet,
        onTermCountChange,
    } = props;

    const { isDarkMode } = useTheme();
    const { getDisplayChar } = useScript();
    const { formatPinyin } = usePinyin();
    const { currentUser } = useAuth();

    const [sessionState, dispatch] = useReducer(
        learningSessionReducer,
        undefined,
        createInitialLearningSessionState
    );

    const {
        sessionId,
        currentSet,
        term,
        key,
        answer,
        keyText,
        submissionNum,
        isSubmitting,
        formColor,
        currChar,
        currPinyin,
        currDefinition,
        buttonState,
        buttonText,
        selectedAnswer,
        mcOptions,
        answerPlacement,
        remainingSet,
        answerCounts,
        wrongCounts,
        totalWords,
        learnedWords,
        learnedWordKeys,
        lastWord,
        responseCounts,
        learnedOverTime,
    } = sessionState;

    const patchSession = useCallback((patch) => {
        dispatch({ type: LEARNING_SESSION_ACTIONS.PATCH, payload: patch });
    }, []);

    const setSessionAnswer = useCallback((value) => {
        dispatch({ type: LEARNING_SESSION_ACTIONS.SET_ANSWER, payload: value });
    }, []);

    const setSessionSelectedAnswer = useCallback((value) => {
        dispatch({ type: LEARNING_SESSION_ACTIONS.SET_SELECTED_ANSWER, payload: value });
    }, []);

    const formatFieldForDisplay = useCallback((value, field) => {
        if (field === 'pinyin') {
            return formatPinyin(value);
        }
        return value;
    }, [formatPinyin]);

    const cardStyle = isDarkMode
        ? { backgroundColor: "#23272b", color: "#fff", borderColor: "#444" }
        : { backgroundColor: "#FFF2DC", borderColor: "#e7dccb" };
    const headerStyle = isDarkMode ? { color: "#fff" } : {};
    const inputStyle = isDarkMode
        ? { backgroundColor: '#181a1b', color: '#fff', border: '1px solid #444' }
        : {};
    const progressBarVariant = isDarkMode ? "light" : "primary";
    const mcButtonBg = isDarkMode ? "#343a40" : undefined;
    const selectedBorder = isDarkMode ? "4px solid #fff" : "4px solid black";

    const hasMetLearningRequirement = useCallback((correctCount, wrongCount) => {
        if (isQuickReview) {
            return correctCount >= 1;
        }
        return correctCount >= 3 || (correctCount >= 2 && wrongCount === 0);
    }, [isQuickReview]);

    const buildMcOptions = useCallback((wordList, correctWord) => {
        if (!wordList || wordList.length === 0 || !correctWord) {
            return { options: [], correctIndex: null };
        }

        const correctVal = resolveWordField(correctWord, want, getDisplayChar);

        const uniquePool = Array.from(
            new Set(
                wordList
                    .map((w) => resolveWordField(w, want, getDisplayChar))
                    .filter((val) => val && !Number.isNaN(val))
            )
        ).filter((val) => val !== correctVal);

        const wrongChoices = shuffleWords(uniquePool).slice(0, Math.min(3, uniquePool.length));
        const options = [...wrongChoices];

        const insertAt = Math.floor(Math.random() * (options.length + 1));
        options.splice(insertAt, 0, correctVal);

        return { options, correctIndex: insertAt };
    }, [want, getDisplayChar]);

    const setActiveWord = useCallback((word, nextRemainingSet, optionPool) => {
        const prompt = buildPromptFromWord(word, given, want, getDisplayChar);
        let mcPayload = { mcOptions: [], answerPlacement: null };

        if (isMultipleChoice) {
            const { options, correctIndex } = buildMcOptions(optionPool || currentSet?.words || [], word);
            mcPayload = { mcOptions: options, answerPlacement: correctIndex };
        }

        patchSession({
            lastWord: word,
            remainingSet: nextRemainingSet,
            term: prompt.term,
            key: prompt.key,
            currChar: prompt.currChar,
            currPinyin: prompt.currPinyin,
            currDefinition: prompt.currDefinition,
            selectedAnswer: null,
            ...mcPayload,
        });
    }, [
        given,
        want,
        getDisplayChar,
        isMultipleChoice,
        buildMcOptions,
        patchSession,
        currentSet?.words,
    ]);

    const persistSessionProgress = useCallback((stateOverride = {}) => {
        const state = { ...sessionState, ...stateOverride };
        if (!state.sessionId) return;

        updateLearningSession({
            userId: currentUser?.uid,
            sessionId: state.sessionId,
            patch: {
                setName: currentSetName,
                mode: {
                    given,
                    want,
                    isMultipleChoice,
                    isQuickReview,
                },
                progress: {
                    learnedWords: state.learnedWords,
                    totalWords: state.totalWords,
                    responseCount: state.responseCounts.length,
                },
                runtime: {
                    responseCounts: state.responseCounts,
                    learnedOverTime: state.learnedOverTime,
                    answerCounts: state.answerCounts,
                    wrongCounts: state.wrongCounts,
                    learnedWordKeys: state.learnedWordKeys,
                    remainingSet,
                    key,
                    term,
                },
            },
        });
    }, [
        sessionState,
        currentUser?.uid,
        currentSetName,
        given,
        want,
        isMultipleChoice,
        isQuickReview,
        remainingSet,
        key,
        term,
    ]);

    const prepareNext = useCallback(() => {
        if (!currentSet || !currentSet.words || currentSet.words.length === 0) {
            console.error("No valid set to train with");
            return;
        }

        const nextTrainingWords = currentSet.words.filter((word) => {
            const wordKey = resolveWordField(word, want, getDisplayChar);
            const correctCount = answerCounts[wordKey] || 0;
            const wrongCount = wrongCounts[wordKey] || 0;
            return !hasMetLearningRequirement(correctCount, wrongCount);
        });

        if (nextTrainingWords.length > 0) {
            const reshuffled = shuffleWords(nextTrainingWords);

            if (
                lastWord &&
                reshuffled.length > 1 &&
                resolveWordField(reshuffled[0], want, getDisplayChar) ===
                    resolveWordField(lastWord, want, getDisplayChar)
            ) {
                const randomIndex = Math.floor(Math.random() * (reshuffled.length - 1)) + 1;
                [reshuffled[0], reshuffled[randomIndex]] = [reshuffled[randomIndex], reshuffled[0]];
            }

            patchSession({
                shuffledSet: reshuffled,
                remainingSet: reshuffled,
            });

            const firstWord = reshuffled[0];
            setActiveWord(firstWord, reshuffled.slice(1), currentSet.words);
            return;
        }

        completeLearningSession({
            userId: currentUser?.uid,
            sessionId,
            patch: {
                progress: {
                    learnedWords,
                    totalWords,
                    responseCount: responseCounts.length,
                },
                runtime: {
                    responseCounts,
                    learnedOverTime,
                    answerCounts,
                    wrongCounts,
                },
            },
        });

        if (goToPage) {
            goToPage("finishPage");
        }
    }, [
        currentSet,
        want,
        getDisplayChar,
        answerCounts,
        wrongCounts,
        hasMetLearningRequirement,
        lastWord,
        patchSession,
        setActiveWord,
        currentUser?.uid,
        sessionId,
        learnedWords,
        totalWords,
        responseCounts,
        learnedOverTime,
        goToPage,
    ]);

    const presentNext = useCallback(() => {
        if (!remainingSet || remainingSet.length === 0) {
            prepareNext();
            return;
        }

        const nextSet = [...remainingSet];
        let nextWord = nextSet.pop();

        if (!hasRequiredWordFields(nextWord, given, want)) {
            prepareNext();
            return;
        }

        if (
            lastWord &&
            resolveWordField(nextWord, want, getDisplayChar) === resolveWordField(lastWord, want, getDisplayChar) &&
            nextSet.length > 0
        ) {
            const randomIndex = Math.floor(Math.random() * nextSet.length);
            [nextWord, nextSet[randomIndex]] = [nextSet[randomIndex], nextWord];
        }

        setActiveWord(nextWord, nextSet, currentSet?.words || []);
    }, [
        remainingSet,
        prepareNext,
        given,
        want,
        lastWord,
        getDisplayChar,
        setActiveWord,
        currentSet?.words,
    ]);

    useEffect(() => {
        let isMounted = true;

        const buildFromSet = (selectedSet) => {
            const validWords = buildValidWordsFromSet(selectedSet);

            if (validWords.length === 0) {
                console.error("No valid words found in set");
                if (onTermCountChange) onTermCountChange(0);
                dispatch({ type: LEARNING_SESSION_ACTIONS.RESET });
                return;
            }

            const learningSession = createLearningSession({
                userId: currentUser?.uid,
                setId: selectedSet?.id || setChoice.replace('custom_', ''),
                setName: selectedSet?.setName || currentSetName || '',
                mode: {
                    given,
                    want,
                    isMultipleChoice,
                    isQuickReview,
                },
                totalWords: validWords.length,
            });

            const transformedSet = { words: validWords };
            const initialShuffled = shuffleWords(validWords);
            const firstWord = initialShuffled[0];

            let mcPayload = { mcOptions: [], answerPlacement: null };
            if (isMultipleChoice && firstWord) {
                const { options, correctIndex } = buildMcOptions(validWords, firstWord);
                mcPayload = { mcOptions: options, answerPlacement: correctIndex };
            }

            const prompt = firstWord
                ? buildPromptFromWord(firstWord, given, want, getDisplayChar)
                : {
                    term: '',
                    key: '',
                    currChar: '',
                    currPinyin: '',
                    currDefinition: '',
                };

            if (onTermCountChange) onTermCountChange(validWords.length);

            dispatch({
                type: LEARNING_SESSION_ACTIONS.INITIALIZE,
                payload: {
                    sessionId: learningSession.sessionId,
                    currentSet: transformedSet,
                    totalWords: validWords.length,
                    shuffledSet: initialShuffled,
                    remainingSet: initialShuffled.length > 1 ? initialShuffled.slice(1) : [],
                    learnedWords: 0,
                    lastWord: firstWord || null,
                    ...prompt,
                    ...mcPayload,
                },
            });

            setResponseCounts([]);
            setLearnedOverTime([]);
        };

        const loadSet = async () => {
            if (externalSet) {
                buildFromSet(externalSet);
                return;
            }

            if (!setChoice || !currentUser) {
                return;
            }

            const setId = setChoice.replace('custom_', '');
            const sets = await getUserVocabSets(currentUser.uid);
            const selectedSet = sets.find((set) => set.id === setId);
            if (!selectedSet) {
                console.error("Selected set not found");
                return;
            }

            buildFromSet(selectedSet);
        };

        if (isMounted) {
            loadSet();
        }

        return () => {
            isMounted = false;
        };
    }, [
        setChoice,
        currentUser,
        externalSet,
        isMultipleChoice,
        isQuickReview,
        given,
        want,
        getDisplayChar,
        onTermCountChange,
        buildMcOptions,
        currentSetName,
        setResponseCounts,
        setLearnedOverTime,
    ]);

    useEffect(() => {
        setResponseCounts(responseCounts);
    }, [responseCounts, setResponseCounts]);

    useEffect(() => {
        setLearnedOverTime(learnedOverTime);
    }, [learnedOverTime, setLearnedOverTime]);

    useEffect(() => {
        if (!sessionId || !currentSet) {
            return;
        }

        persistSessionProgress();
    }, [
        sessionId,
        currentSet,
        learnedWords,
        totalWords,
        responseCounts,
        learnedOverTime,
        answerCounts,
        wrongCounts,
        learnedWordKeys,
        remainingSet,
        key,
        term,
        persistSessionProgress,
    ]);

    const handleSubmit = useCallback((eventOrIndex) => {
        if (!isMultipleChoice && eventOrIndex?.preventDefault) {
            eventOrIndex.preventDefault();
        }

        if (isSubmitting) {
            patchSession({
                keyText: false,
                answer: "",
                formColor: "black",
                buttonState: "primary",
                buttonText: "Submit",
                isSubmitting: false,
                selectedAnswer: null,
            });
            presentNext();
            return;
        }

        let normalizedAnswer = "";
        let normalizedKey = "";
        if (isMultipleChoice) {
            const selectedIndex = typeof eventOrIndex === "number" ? eventOrIndex : selectedAnswer;
            const chosen = selectedIndex !== null ? mcOptions[selectedIndex] : "";
            normalizedAnswer = want === "pinyin"
                ? normalizePinyinForCompare(chosen || "")
                : (chosen || "").toLowerCase().replace(/\s+/g, '');
            normalizedKey = want === "pinyin"
                ? normalizePinyinForCompare(key)
                : key.toLowerCase().replace(/\s+/g, '');
        } else {
            normalizedAnswer = want === "pinyin"
                ? normalizePinyinForCompare(answer)
                : answer.toLowerCase().replace(/\s+/g, '');
            normalizedKey = want === "pinyin"
                ? normalizePinyinForCompare(key)
                : key.toLowerCase().replace(/\s+/g, '');
        }

        const nextTrial = responseCounts.length + 1;

        if (normalizedAnswer === normalizedKey) {
            const newAnswerCounts = { ...answerCounts };
            newAnswerCounts[key] = (newAnswerCounts[key] || 0) + 1;

            const correctCount = newAnswerCounts[key];
            const wrongCount = wrongCounts[key] || 0;

            let nextLearnedWordKeys = learnedWordKeys;
            let nextLearnedWords = learnedWords;
            let nextLearnedOverTime = learnedOverTime;

            if (
                !learnedWordKeys.includes(key) &&
                learnedWords < totalWords &&
                hasMetLearningRequirement(correctCount, wrongCount)
            ) {
                nextLearnedWordKeys = [...learnedWordKeys, key];
                nextLearnedWords = learnedWords + 1;
                const attemptsToMaster = correctCount + wrongCount;
                nextLearnedOverTime = [
                    ...learnedOverTime,
                    { trial: nextTrial, learned: nextLearnedWords, term: key, attempts: attemptsToMaster },
                ];
            }

            patchSession({
                isCorrect: true,
                formColor: "#2E972E",
                buttonState: "success",
                buttonText: "Next ->",
                responseCounts: [...responseCounts, 1],
                answerCounts: newAnswerCounts,
                learnedWordKeys: nextLearnedWordKeys,
                learnedWords: nextLearnedWords,
                learnedOverTime: nextLearnedOverTime,
                keyText: true,
                term: "",
                isSubmitting: true,
                submissionNum: submissionNum + 1,
            });
        } else {
            const newWrongCounts = { ...wrongCounts };
            newWrongCounts[key] = (newWrongCounts[key] || 0) + 1;

            patchSession({
                isCorrect: false,
                formColor: "#DD4F4F",
                buttonState: "danger",
                buttonText: "Next Term ->",
                responseCounts: [...responseCounts, 0],
                wrongCounts: newWrongCounts,
                keyText: true,
                term: "",
                isSubmitting: true,
                submissionNum: submissionNum + 1,
            });
        }
    }, [
        isMultipleChoice,
        isSubmitting,
        patchSession,
        presentNext,
        selectedAnswer,
        mcOptions,
        want,
        key,
        answer,
        responseCounts,
        answerCounts,
        wrongCounts,
        learnedWordKeys,
        learnedWords,
        totalWords,
        hasMetLearningRequirement,
        learnedOverTime,
        submissionNum,
    ]);

    useEffect(() => {
        const handler = (event) => {
            if (!isMultipleChoice) return;
            const keyMap = {
                49: 0,
                50: 1,
                51: 2,
                52: 3,
                '1': 0,
                '2': 1,
                '3': 2,
                '4': 3,
            };
            const idx = keyMap[event.keyCode] ?? keyMap[event.key];
            if (idx !== undefined && idx < mcOptions.length) {
                setSessionSelectedAnswer(idx);
                handleSubmit(idx);
            }
        };

        document.addEventListener("keydown", handler);
        return () => {
            document.removeEventListener("keydown", handler);
        };
    }, [isMultipleChoice, mcOptions, handleSubmit, setSessionSelectedAnswer]);

    const getFontSize = (length) => {
        return length > 5 ? "25px" : "50px";
    };

    return (
        <>
            {isDarkMode && (
                <style>{`
                    .testingzone-darkmode-input::placeholder {
                        color: #b0b0b0 !important;
                        opacity: 1 !important;
                    }
                    .testingzone-darkmode-close .btn-close {
                        filter: invert(1) brightness(2);
                    }
                `}</style>
            )}
            <Card body style={{ width: 400, ...cardStyle }}>
                <Stack gap={1} className="mb-3">
                    <div style={headerStyle}>Progress: {learnedWords}/{totalWords} words learned</div>
                    <ProgressBar
                        now={totalWords > 0 ? (learnedWords / totalWords) * 100 : 0}
                        label={totalWords > 0 ? `${Math.round((learnedWords / totalWords) * 100)}%` : '0%'}
                        variant={progressBarVariant}
                        style={isDarkMode ? { backgroundColor: '#181a1b', color: '#fff' } : {}}
                    />
                </Stack>
                <Stack
                    direction='horizontal'
                    style={{
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                    }}
                >
                    <Stack gap={0}>
                        <Card.Title style={headerStyle}>
                            {given} → {want}
                        </Card.Title>
                        <Card.Title style={headerStyle}>{currentSetName}</Card.Title>
                        <div style={{ ...headerStyle, fontSize: "0.95rem", opacity: 0.85 }}>
                            Mode: {isQuickReview ? "Quick Review" : "Standard"}
                        </div>
                    </Stack>
                    <div className={isDarkMode ? "testingzone-darkmode-close" : undefined}>
                        <CloseButton
                            onClick={() => {
                                if (goToPage) {
                                    goToPage("startLearning");
                                } else {
                                    window.history.back();
                                }
                            }}
                        />
                    </div>
                </Stack>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Stack gap={1}>
                            <Stack gap={2}>
                                <Form.Label
                                    style={{
                                        fontSize: getFontSize(term.length),
                                        ...headerStyle,
                                    }}
                                >
                                    {formatFieldForDisplay(term, given)}
                                </Form.Label>
                                <Form.Label
                                    style={{
                                        fontSize: "25px",
                                        ...headerStyle,
                                    }}
                                >
                                    {keyText && (
                                        <Stack>
                                            <Form.Label style={{ fontSize: "50px", ...headerStyle }}>{currChar}</Form.Label>
                                            <Form.Label style={headerStyle}>{formatPinyin(currPinyin)}</Form.Label>
                                            <Form.Label style={headerStyle}>{currDefinition}</Form.Label>
                                        </Stack>
                                    )}
                                </Form.Label>

                                {!isMultipleChoice && (
                                    <Form.Control
                                        style={{ color: formColor, ...inputStyle }}
                                        spellCheck='false'
                                        placeholder='Answer'
                                        id='responseArea'
                                        readOnly={isSubmitting}
                                        type='text'
                                        value={answer}
                                        onChange={(event) => setSessionAnswer(event.target.value)}
                                        className={isDarkMode ? 'testingzone-darkmode-input' : ''}
                                    />
                                )}
                            </Stack>
                            {!isMultipleChoice && (
                                <Button type='submit' variant={buttonState} style={isDarkMode ? { color: '#fff' } : {}}>
                                    {buttonText}
                                </Button>
                            )}
                            {isMultipleChoice && (
                                <Stack gap={2}>
                                    <Stack gap={2}>
                                        {mcOptions.map((opt, idx) => (
                                            <Button
                                                key={`${opt}-${idx}`}
                                                style={{
                                                    fontSize: "20px",
                                                    width: "100%",
                                                    backgroundColor: isSubmitting && answerPlacement !== null
                                                        ? (answerPlacement === idx ? "#2E972E" : "#DD4F4F")
                                                        : mcButtonBg,
                                                    border: selectedAnswer === idx ? selectedBorder : "4px solid transparent",
                                                    color: isDarkMode ? "#fff" : undefined,
                                                }}
                                                variant={buttonState}
                                                onClick={() => {
                                                    if (isSubmitting) {
                                                        handleSubmit();
                                                    } else {
                                                        setSessionSelectedAnswer(idx);
                                                        handleSubmit(idx);
                                                    }
                                                }}
                                            >
                                                {formatFieldForDisplay(opt, want)}
                                            </Button>
                                        ))}
                                    </Stack>
                                    <div
                                        style={{
                                            borderTop: isDarkMode ? '1px solid #444' : '1px solid #dee2e6',
                                            marginTop: '0.5rem',
                                            paddingTop: '1rem',
                                        }}
                                    >
                                        <Button
                                            variant={isDarkMode ? "light" : "outline-secondary"}
                                            onClick={() => {
                                                if (!isSubmitting) {
                                                    const newWrongCounts = { ...wrongCounts };
                                                    newWrongCounts[key] = (newWrongCounts[key] || 0) + 1;

                                                    patchSession({
                                                        isCorrect: false,
                                                        formColor: "#DD4F4F",
                                                        buttonState: "danger",
                                                        buttonText: "Next ->",
                                                        responseCounts: [...responseCounts, 0],
                                                        wrongCounts: newWrongCounts,
                                                        submissionNum: submissionNum + 1,
                                                        keyText: true,
                                                        term: "",
                                                        isSubmitting: true,
                                                    });
                                                } else {
                                                    patchSession({
                                                        keyText: false,
                                                        answer: "",
                                                        formColor: "black",
                                                        buttonState: "primary",
                                                        buttonText: "Submit",
                                                        isSubmitting: false,
                                                        selectedAnswer: null,
                                                    });
                                                    prepareNext();
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                fontSize: '1.1rem',
                                                fontWeight: '500',
                                            }}
                                        >
                                            {isSubmitting ? "Next ->" : "Skip ->"}
                                        </Button>
                                    </div>
                                </Stack>
                            )}
                        </Stack>
                    </Form>
                </Card.Body>
            </Card>
        </>
    );
}
