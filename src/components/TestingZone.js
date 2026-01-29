import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, CloseButton, Form, Stack, ProgressBar } from "react-bootstrap";
import { getUserVocabSets } from "../services/vocabSetService";
import { useAuth } from "../contexts/AuthContext";
import dictionary from "./dictionary.json";
import { useTheme } from "../contexts/ThemeContext";

export default function TestingZone(props) {
    const {
        given,
        want,
        setChoice,
        goToPage,
        isMultipleChoice,
        responseCounts,
        setResponseCounts,
        learnedOverTime,
        setLearnedOverTime,
        currentSetName
    } = props;

    const { isDarkMode } = useTheme();
    const { currentUser } = useAuth();
    const [currentSet, setCurrentSet] = useState(null);
    const [term, setTerm] = useState("");
    const [key, setKey] = useState("");
    const [answer, setAnswer] = useState("");
    const [keyText, setKeyText] = useState(false);
    const [submissionNum, setSubmissionNum] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [formColor, setFormColor] = useState("black");
    const [currChar, setCurrChar] = useState("");
    const [currPinyin, setCurrPinyin] = useState("");
    const [currDefinition, setCurrDefinition] = useState("");
    const [buttonState, setButtonState] = useState("primary");
    const [buttonText, setButtonText] = useState("Submit");
    const [cardWidth] = useState(400);
    const [selectedAnswer, setSelectedAnswer] = useState(null);

    // Multiple choice related variables
    const [mcOptions, setMcOptions] = useState([]);
    const [answerPlacement, setAnswerPlacement] = useState(null);

    const learnedWordsRef = useRef(0);

    const [shuffledSet, setShuffledSet] = useState([]);
    const [remainingSet, setRemainingSet] = useState([]);
    const [answerCounts, setAnswerCounts] = useState({});
    const [wrongCounts, setWrongCounts] = useState({});
    const [totalWords, setTotalWords] = useState(0);
    const [learnedWords, setLearnedWords] = useState(0);
    const [learnedSet, setLearnedSet] = useState(new Set());
    const [lastWord, setLastWord] = useState(null);

    const cardStyle = isDarkMode
        ? { backgroundColor: "#23272b", color: "#fff", borderColor: "#444" }
        : {};
    const headerStyle = isDarkMode ? { color: "#fff" } : {};
    const inputStyle = isDarkMode
        ? { backgroundColor: '#181a1b', color: '#fff', border: '1px solid #444' }
        : {};
    const progressBarVariant = isDarkMode ? "light" : "primary";
    const mcButtonBg = isDarkMode ? "#343a40" : undefined;
    const selectedBorder = isDarkMode ? "4px solid #fff" : "4px solid black";

    const shuffleArray = (array) =>
        array
            .map((value) => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);

    const buildMcOptions = (wordList, correctWord) => {
        if (!wordList || wordList.length === 0 || !correctWord) {
            return { options: [], correctIndex: null };
        }

        // Unique answer pool, excluding the correct answer
        const uniquePool = Array.from(
            new Set(
                wordList
                    .map((w) => w?.[want])
                    .filter((val) => val && val === val) // filters falsy/undefined/NaN
            )
        ).filter((val) => val !== correctWord[want]);

        const wrongChoices = shuffleArray(uniquePool).slice(0, Math.min(3, uniquePool.length));
        const options = [...wrongChoices];

        const insertAt = Math.floor(Math.random() * (options.length + 1));
        options.splice(insertAt, 0, correctWord[want]);

        return { options, correctIndex: insertAt };
    };

    useEffect(() => {
        let isMounted = true;

        const loadSet = async () => {
            if (!setChoice) {
                console.log("No set selected");
                return;
            }

            // Reset all state first
            setCurrentSet(null);
            setTerm("");
            setKey("");
            setAnswer("");
            setKeyText(false);
            setSubmissionNum(1);
            setIsSubmitting(false);
            setCurrChar("");
            setCurrPinyin("");
            setCurrDefinition("");
            setButtonState("primary");
            setButtonText("Submit");
            setLearnedOverTime([]);
            setLearnedWords(0);
            setResponseCounts([]);
            setAnswerCounts({});
            setWrongCounts({});
            setLearnedSet(new Set());
            setTotalWords(0);
            setShuffledSet([]);
            setRemainingSet([]);
            // Reset multiple choice states
            setMcOptions([]);
            setAnswerPlacement(null);

            console.log("Loading set with choice:", setChoice);
            const setId = setChoice.replace('custom_', '');
            console.log("Looking for set with ID:", setId);
            
            const sets = await getUserVocabSets(currentUser.uid);
            console.log("Available sets:", sets);
            
            const selectedSet = sets.find(set => set.id === setId);
            console.log("Found selected set:", selectedSet);
            
            if (!selectedSet) {
                console.error("Selected set not found");
                return;
            }

            if (!selectedSet.vocabItems || !Array.isArray(selectedSet.vocabItems)) {
                console.error("Selected set has invalid vocabItems:", selectedSet);
                return;
            }

            if (isMounted) {
                // Transform the vocabItems into the expected format and filter out empty/invalid words
                const validWords = selectedSet.vocabItems
                    .filter(item => 
                        item && 
                        item.character && 
                        item.pinyin && 
                        item.definition &&
                        item.character.trim() !== '' &&
                        item.pinyin.trim() !== '' &&
                        item.definition.trim() !== ''
                    )
                    .map(item => ({
                        character: item.character,
                        pinyin: item.pinyin,
                        definition: item.definition
                    }));

                if (validWords.length === 0) {
                    console.error("No valid words found in set");
                    return;
                }

                const transformedSet = { words: validWords };
                console.log("Transformed set:", transformedSet);
                setCurrentSet(transformedSet);
                setTotalWords(validWords.length);

                // Shuffle and set up the first word immediately
                let shuffled = validWords
                    .map((value) => ({ value, sort: Math.random() }))
                    .sort((a, b) => a.sort - b.sort)
                    .map(({ value }) => value);
                
                console.log("Shuffled words:", shuffled);
                setShuffledSet(shuffled);
                setRemainingSet(shuffled);
                setLearnedWords(0);
                setLastWord(null);

                // Set up the first word
                if (shuffled.length > 0) {
                    const firstWord = shuffled[0];
                    if (isMultipleChoice) {
                        const { options, correctIndex } = buildMcOptions(validWords, firstWord);
                        setMcOptions(options);
                        setAnswerPlacement(correctIndex);
                    }
                    
                    setLastWord(firstWord);
                    setTerm(firstWord[given]);
                    setKey(firstWord[want]);
                    setCurrChar(firstWord.character);
                    setCurrPinyin(firstWord.pinyin);
                    setCurrDefinition(firstWord.definition);
                    
                    // Remove the first word from remaining set
                    setRemainingSet(shuffled.slice(1));
                }
            }
        };

        loadSet();

        return () => {
            isMounted = false;
        };
    }, [setChoice, currentUser]);

    const shuffle = (set) => {
        console.log("Shuffling set:", set);
        if (!set || !set.words || !Array.isArray(set.words) || set.words.length === 0) {
            console.error("Invalid set structure in shuffle:", set);
            return;
        }

        let shuffled = set.words
            .map((value) => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
        
        console.log("Shuffled words:", shuffled);
        setShuffledSet(shuffled);
        setRemainingSet(shuffled);
        setLearnedWords(0);
        
        // Present the first word after shuffling
        presentNext();
    };

    const presentNext = () => {
        console.log("Presenting next word. Current state:", {
            remainingSet,
            currentSet,
            answerCounts,
            wrongCounts
        });

        if (!remainingSet || remainingSet.length === 0) {
            console.log("No words remaining, preparing next set");
            prepareNext();
            return;
        }

        let nextSet = [...remainingSet];
        let next = nextSet.pop();
        
        // Validate the next word before setting it
        if (!next || !next[given] || !next[want] || !next.character || !next.pinyin || !next.definition) {
            console.error("Invalid word data:", next);
            prepareNext();
            return;
        }

        // If the next word is the same as the last word shown, get a different word
        if (lastWord && next[want] === lastWord[want] && nextSet.length > 0) {
            const randomIndex = Math.floor(Math.random() * nextSet.length);
            [next, nextSet[randomIndex]] = [nextSet[randomIndex], next];
        }

        console.log("Setting next word:", next);
        setLastWord(next);
        setRemainingSet(nextSet);
        setTerm(next[given]);
        setKey(next[want]);
        setCurrChar(next.character);
        setCurrPinyin(next.pinyin);
        setCurrDefinition(next.definition);
        
        if (isMultipleChoice) {
            assignMC(next);
        }
    };

    const prepareNext = () => {
        console.log("Preparing next word. Current state:", {
            remainingSet,
            currentSet,
            answerCounts,
            wrongCounts
        });

        if (!currentSet || !currentSet.words || currentSet.words.length === 0) {
            console.error("No valid set to train with");
            return;
        }

        // Filter words that still need practice
        let newTrainingSet = { ...currentSet };
        newTrainingSet.words = newTrainingSet.words.filter((word) => {
            const correctCount = answerCounts[word[want]] || 0;
            const wrongCount = wrongCounts[word[want]] || 0;
            const keep = correctCount < 3 && !(correctCount >= 2 && wrongCount === 0);
            console.log("Filtering word:", word, "correctCount:", correctCount, "wrongCount:", wrongCount, "keep:", keep);
            return keep;
        });
        
        console.log("Filtered training set:", newTrainingSet);
        
        if (newTrainingSet.words.length > 0) {
            // Shuffle the remaining words
            let shuffled = newTrainingSet.words
                .map((value) => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value);
            
            // If the first word is the same as the last word shown, swap it with another word
            if (lastWord && shuffled.length > 1 && shuffled[0][want] === lastWord[want]) {
                const randomIndex = Math.floor(Math.random() * (shuffled.length - 1)) + 1;
                [shuffled[0], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[0]];
            }
            
            console.log("Shuffled remaining words:", shuffled);
            setShuffledSet(shuffled);
            setRemainingSet(shuffled);
            
            // Present the first word from the new set
            if (shuffled.length > 0) {
                const firstWord = shuffled[0];
                setLastWord(firstWord);
                setTerm(firstWord[given]);
                setKey(firstWord[want]);
                setCurrChar(firstWord.character);
                setCurrPinyin(firstWord.pinyin);
                setCurrDefinition(firstWord.definition);
                if (isMultipleChoice) {
                    assignMC(firstWord);
                }
                // Remove the first word from remaining set
                setRemainingSet(shuffled.slice(1));
            }
        } else {
            console.log("No words left to train, going to finish page");
            goToPage("finishPage");
        }
    };

    useEffect(() => {
        document.addEventListener("keydown", handleButton);
        return () => {
            document.removeEventListener("keydown", handleButton);
        };
    }, []);

    useEffect(() => {
        if (responseCounts.length === 0) return;
        setLearnedOverTime((prev) => [
            ...prev,
            { trial: responseCounts.length, learned: learnedWordsRef.current },
        ]);
    }, [responseCounts]);

    const handleButton = (event) => {
        if (!isMultipleChoice) return;
        const keyMap = { 49: 0, 50: 1, 51: 2, 52: 3 };
        const idx = keyMap[event.keyCode];
        if (idx !== undefined && idx < mcOptions.length) {
            handleSubmit(idx);
        }
    };

    const assignMC = (word) => {
        const pool = currentSet?.words || [];
        const { options, correctIndex } = buildMcOptions(pool, word);
        setMcOptions(options);
        setAnswerPlacement(correctIndex);
        setSelectedAnswer(null);
    };

    const handleSubmit = (eventOrIndex) => {
        if (!isMultipleChoice && eventOrIndex?.preventDefault) {
            eventOrIndex.preventDefault();
        }

        // If we're already showing the answer, move to next question
        if (isSubmitting) {
            setKeyText(false);
            setAnswer("");
            setFormColor("black");
            setButtonState("primary");
            setButtonText("Submit");
            setIsSubmitting(false);
            setSelectedAnswer(null);
            prepareNext();
            return;
        }

        // Otherwise, show the answer feedback
        setKeyText(true);
        setTerm("");
        setIsSubmitting(true);

        // Normalize both answers by converting to lowercase and removing spaces
        let normalizedAnswer = "";
        if (isMultipleChoice) {
            const selectedIndex = typeof eventOrIndex === "number" ? eventOrIndex : selectedAnswer;
            const chosen = selectedIndex !== null ? mcOptions[selectedIndex] : "";
            normalizedAnswer = (chosen || "").toLowerCase().replace(/\s+/g, '');
        } else {
            normalizedAnswer = answer.toLowerCase().replace(/\s+/g, '');
        }
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '');

        if (normalizedAnswer === normalizedKey) {
            setIsCorrect(true);
            setFormColor("#2E972E");
            setButtonState("success");
            setButtonText("Next ->");
            setResponseCounts((prev) => [...prev, 1]);

            setAnswerCounts((prevCounts) => {
                const newCounts = { ...prevCounts };
                newCounts[key] = (newCounts[key] || 0) + 1;

                const correctCount = newCounts[key];
                const wrongCount = wrongCounts[key] || 0;

                setLearnedSet((prevSet) => {
                    const safeSet = prevSet ?? new Set();

                    if (
                        !safeSet.has(key) &&
                        learnedWords < totalWords &&
                        (correctCount === 3 || (correctCount === 2 && wrongCount === 0))
                    ) {
                        const newSet = new Set(safeSet);
                        newSet.add(key);
                        const newCount = learnedWords + 1;
                        setLearnedWords(newCount);
                        learnedWordsRef.current = newCount;
                        return newSet;
                    }
                    return safeSet;
                });

                return newCounts;
            });
        } else {
            setIsCorrect(false);
            setFormColor("#DD4F4F");
            setButtonState("danger");
            setButtonText("Next Term ->");
            setResponseCounts((prev) => [...prev, 0]);

            setWrongCounts((answerCounts) => {
                let newAnswerCounts = { ...answerCounts };
                newAnswerCounts[key] = (newAnswerCounts[key] || 0) + 1;
                return newAnswerCounts;
            });
        }
        setSubmissionNum((submissionNum) => submissionNum + 1);
    };

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
            <Card body style={{ width: cardWidth, ...cardStyle }}>
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
                    </Stack>
                    <div className={isDarkMode ? "testingzone-darkmode-close" : undefined}>
                        <CloseButton
                            onClick={() => {
                                goToPage("menu");
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
                                        ...headerStyle
                                    }}
                                >
                                    {term}
                                </Form.Label>
                                <Form.Label
                                    style={{
                                        fontSize: "25px",
                                        ...headerStyle
                                    }}
                                >
                                    {keyText && (
                                        <Stack>
                                            <Form.Label style={{ fontSize: "50px", ...headerStyle }}>{currChar}</Form.Label>
                                            <Form.Label style={headerStyle}>{currPinyin}</Form.Label>
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
                                        onChange={(event) => setAnswer(event.target.value)}
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
                                                    color: isDarkMode ? "#fff" : undefined
                                                }}
                                                variant={buttonState}
                                                onClick={() => {
                                                    if (isSubmitting) {
                                                        handleSubmit();
                                                    } else {
                                                        setSelectedAnswer(idx);
                                                        handleSubmit(idx);
                                                    }
                                                }}
                                            >
                                                {opt}
                                            </Button>
                                        ))}
                                    </Stack>
                                    <div style={{ 
                                        borderTop: isDarkMode ? '1px solid #444' : '1px solid #dee2e6',
                                        marginTop: '0.5rem',
                                        paddingTop: '1rem'
                                    }}>
                                        <Button 
                                            variant={isDarkMode ? "light" : "outline-secondary"}
                                            onClick={() => {
                                                if (!isSubmitting) {
                                                    // Register as incorrect answer
                                                    setIsCorrect(false);
                                                    setFormColor("#DD4F4F");
                                                    setButtonState("danger");
                                                    setButtonText("Next ->");
                                                    setResponseCounts((prev) => [...prev, 0]);
                                                    setWrongCounts((answerCounts) => {
                                                        let newAnswerCounts = { ...answerCounts };
                                                        newAnswerCounts[key] = (newAnswerCounts[key] || 0) + 1;
                                                        return newAnswerCounts;
                                                    });
                                                    setSubmissionNum((submissionNum) => submissionNum + 1);
                                                    // Show the answer feedback
                                                    setKeyText(true);
                                                    setTerm("");
                                                    setIsSubmitting(true);
                                                } else {
                                                    // Move to next question
                                                    setKeyText(false);
                                                    setAnswer("");
                                                    setFormColor("black");
                                                    setButtonState("primary");
                                                    setButtonText("Submit");
                                                    setIsSubmitting(false);
                                                    setSelectedAnswer(null);
                                                    prepareNext();
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                fontSize: '1.1rem',
                                                fontWeight: '500'
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
