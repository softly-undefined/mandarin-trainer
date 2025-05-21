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
    const [answer1, setAnswer1] = useState("");
    const [answer2, setAnswer2] = useState("");
    const [answer3, setAnswer3] = useState("");
    const [answer4, setAnswer4] = useState("");
    const [answerPlacement, setAnswerPlacement] = useState(4);

    const button1Ref = useRef();
    const button2Ref = useRef();
    const button3Ref = useRef();
    const button4Ref = useRef();
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
            setAnswer1("");
            setAnswer2("");
            setAnswer3("");
            setAnswer4("");
            setAnswerPlacement(4);

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
                        // Set up multiple choice first
                        const answerLocation = Math.floor(Math.random() * 4);
                        const options = [];
                        
                        // Get three random wrong answers
                        for (let i = 0; i < 3; i++) {
                            let randomWord;
                            do {
                                const randomIndex = Math.floor(Math.random() * validWords.length);
                                randomWord = validWords[randomIndex][want];
                            } while (randomWord === firstWord[want] || options.includes(randomWord));
                            options.push(randomWord);
                        }
                        
                        // Insert the correct answer at random position
                        options.splice(answerLocation, 0, firstWord[want]);
                        
                        setAnswer1(options[0]);
                        setAnswer2(options[1]);
                        setAnswer3(options[2]);
                        setAnswer4(options[3]);
                        setAnswerPlacement(answerLocation);
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
            assignMC(next[want]);
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
                    assignMC(firstWord[want]);
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
        if (isMultipleChoice) {
            if (event.keyCode === 49) {
                button1Ref.current.click();
            } else if (event.keyCode === 50) {
                button2Ref.current.click();
            } else if (event.keyCode === 51) {
                button3Ref.current.click();
            } else if (event.keyCode === 52) {
                button4Ref.current.click();
            }
        }
    };

    const selectRandomAnswer = (currAns) => {
        if (!currentSet?.words || currentSet.words.length <= 4) {
            return "Option";
        }
        
        let randomWord;
        do {
            const randomIndex = Math.floor(Math.random() * currentSet.words.length);
            randomWord = currentSet.words[randomIndex][want];
        } while (randomWord === currAns);
        
        return randomWord;
    };

    const assignMC = (currAns) => {
        if (!currentSet?.words || currentSet.words.length === 0) {
            console.error("No valid words available for multiple choice");
            return;
        }

        const answerLocation = Math.floor(Math.random() * 4);
        setAnswer1(selectRandomAnswer(currAns));
        setAnswer2(selectRandomAnswer(currAns));
        setAnswer3(selectRandomAnswer(currAns));
        setAnswer4(selectRandomAnswer(currAns));

        if (answerLocation === 0) {
            setAnswer1(currAns);
            setAnswerPlacement(0);
        } else if (answerLocation === 1) {
            setAnswer2(currAns);
            setAnswerPlacement(1);
        } else if (answerLocation === 2) {
            setAnswer3(currAns);
            setAnswerPlacement(2);
        } else if (answerLocation === 3) {
            setAnswer4(currAns);
            setAnswerPlacement(3);
        }
    };

    const handleSubmit = (event) => {
        if (!isMultipleChoice) {
            event.preventDefault();
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
        const normalizedAnswer = answer.toLowerCase().replace(/\s+/g, '');
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '');

        if (normalizedAnswer === normalizedKey || event === answerPlacement) {
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
                            Testing {want} given {given}
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
                                    <Stack
                                        direction='horizontal'
                                        gap={1}
                                        style={{
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                        }}
                                    >
                                        <Stack
                                            direction='vertical'
                                            gap={1}
                                            style={{
                                                justifyContent: "flex-start",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Button
                                                style={{ 
                                                    fontSize: "20px", 
                                                    minWidth: "165px",
                                                    backgroundColor: isSubmitting && answerPlacement === 0 ? "#2E972E" : 
                                                                   isSubmitting && answerPlacement !== 0 ? "#DD4F4F" : mcButtonBg,
                                                    border: selectedAnswer === 0 ? selectedBorder : "4px solid transparent",
                                                    color: isDarkMode ? "#fff" : undefined
                                                }}
                                                variant={buttonState}
                                                ref={button1Ref}
                                                onClick={() => {
                                                    if (isSubmitting) {
                                                        handleSubmit();
                                                    } else {
                                                        setSelectedAnswer(0);
                                                        handleSubmit(0);
                                                    }
                                                }}
                                            >
                                                {answer1}
                                            </Button>
                                            <Button
                                                style={{ 
                                                    fontSize: "20px", 
                                                    minWidth: "165px",
                                                    backgroundColor: isSubmitting && answerPlacement === 1 ? "#2E972E" : 
                                                                   isSubmitting && answerPlacement !== 1 ? "#DD4F4F" : mcButtonBg,
                                                    border: selectedAnswer === 1 ? selectedBorder : "4px solid transparent",
                                                    color: isDarkMode ? "#fff" : undefined
                                                }}
                                                variant={buttonState}
                                                ref={button3Ref}
                                                onClick={() => {
                                                    if (isSubmitting) {
                                                        handleSubmit();
                                                    } else {
                                                        setSelectedAnswer(1);
                                                        handleSubmit(1);
                                                    }
                                                }}
                                            >
                                                {answer2}
                                            </Button>
                                        </Stack>
                                        <Stack
                                            direction='vertical'
                                            gap={1}
                                            style={{
                                                justifyContent: "flex-start",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Button
                                                style={{ 
                                                    fontSize: "20px", 
                                                    minWidth: "165px",
                                                    backgroundColor: isSubmitting && answerPlacement === 2 ? "#2E972E" : 
                                                                   isSubmitting && answerPlacement !== 2 ? "#DD4F4F" : mcButtonBg,
                                                    border: selectedAnswer === 2 ? selectedBorder : "4px solid transparent",
                                                    color: isDarkMode ? "#fff" : undefined
                                                }}
                                                variant={buttonState}
                                                ref={button2Ref}
                                                onClick={() => {
                                                    if (isSubmitting) {
                                                        handleSubmit();
                                                    } else {
                                                        setSelectedAnswer(2);
                                                        handleSubmit(2);
                                                    }
                                                }}
                                            >
                                                {answer3}
                                            </Button>
                                            <Button
                                                style={{ 
                                                    fontSize: "20px", 
                                                    minWidth: "165px",
                                                    backgroundColor: isSubmitting && answerPlacement === 3 ? "#2E972E" : 
                                                                   isSubmitting && answerPlacement !== 3 ? "#DD4F4F" : mcButtonBg,
                                                    border: selectedAnswer === 3 ? selectedBorder : "4px solid transparent",
                                                    color: isDarkMode ? "#fff" : undefined
                                                }}
                                                variant={buttonState}
                                                ref={button4Ref}
                                                onClick={() => {
                                                    if (isSubmitting) {
                                                        handleSubmit();
                                                    } else {
                                                        setSelectedAnswer(3);
                                                        handleSubmit(3);
                                                    }
                                                }}
                                            >
                                                {answer4}
                                            </Button>
                                        </Stack>
                                    </Stack>
                                    <Button 
                                        variant={isDarkMode ? "light" : "primary"}
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
                                    >
                                        {isSubmitting ? "Next ->" : "Skip ->"}
                                    </Button>
                                </Stack>
                            )}
                        </Stack>
                    </Form>
                </Card.Body>
            </Card>
        </>
    );
}
