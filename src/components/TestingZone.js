import { useState, useEffect, useMemo, useCallback } from "react";
import {
    Stack,
    Card,
    Form,
    Button,
    CloseButton,
} from "react-bootstrap";
import data from "./dictionary.json";

export default function Menu(props) {
    const {
        given,
        setGiven,
        want,
        setWant,
        setChoice,
        setSetChoice,
        goToPage,
        isMultipleChoice,
        setIsMultipleChoice
    } = props; //should probably change this to get only given, want, and set because we dont need to change them

    const [term, setTerm] = useState(""); //change this initial value
    const [key, setKey] = useState(""); //change this initial value
    const [answer, setAnswer] = useState("");
    const [keyText, setKeyText] = useState(false);

    const [submissionNum, setSubmissionNum] = useState(1); //does the alternating intermediary state
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isCorrect, setIsCorrect] = useState(false);
    const [formColor, setFormColor] = useState("black"); //sets color of wrongright

    //used for displaying correct info after person answers
    const [currChar, setCurrChar] = useState("");
    const [currPinyin, setCurrPinyin] = useState("");
    const [currDefinition, setCurrDefinition] = useState("");

    const [buttonState, setButtonState] = useState("primary");
    const [buttonText, setButtonText] = useState("SUBMIT");

    //multiple choice variables
    // const [isMultipleChoice, setIsMultipleChoice] = useState(true);
    const [mcButtonSize, setMCButtonSize] = useState(10); //rn i just hardwired the button minwidth but it should be variable around cardsize eventually


    const [cardWidth, setCardWidth] = useState(400); //doesn't change right now but can add functionality eventually

    const formStyle = {
        color: formColor,
    };

    const trainingSet = useMemo(() => {
        return data.sets.find((set) => set.setName === setChoice);
    }, [setChoice]);

    const [shuffledSet, setShuffledSet] = useState([]);
    const [remainingSet, setRemainingSet] = useState([]);

    const [answerCounts, setAnswerCounts] = useState({});
    const [wrongCounts, setWrongCounts] = useState({});

    const [answer1, setAnswer1] = useState(false);
    const [answer2, setAnswer2] = useState(false);
    const [answer3, setAnswer3] = useState(false);
    const [answer4, setAnswer4] = useState(false);
    const [mcAnswerChoice, setMCAnswerChoice] = useState(4);
    const [answerPlacement, setAnswerPlacement] = useState(4);
    const [mcCorrect, setMCCorrect] = useState(false);

    const assignMC = (currAns) => {
        const answerLocation = Math.floor(Math.random() * 4);
        console.log("CURRENT KEY", currAns);
        setAnswer1(selectRandomAnswer(currAns));
        setAnswer2(selectRandomAnswer(currAns));
        setAnswer3(selectRandomAnswer(currAns));
        setAnswer4(selectRandomAnswer(currAns));
        // console.log(answerLocation); //debuggywuggy tools
        // console.log(currAns);
        if(answerLocation === 0) {
            setAnswer1(currAns);
            setAnswerPlacement(0);
        }else if(answerLocation === 1) {
            setAnswer2(currAns);
            setAnswerPlacement(1);
        }else if(answerLocation === 2) {
            setAnswer3(currAns);
            setAnswerPlacement(2);
        }else if(answerLocation === 3) {
            setAnswer4(currAns);
            setAnswerPlacement(3);
        }
    }

    // const getMCButtonStyle = (length) => {
    //     //do some calculations here about length
    //     setMCButtonSize(cardWidth / 4);
    //     minWidth: mcButtonSize,
    // }
    const getFontSize = (length) => {
        return length > 5 ? '25px' : '50px';
    }

    const selectRandomAnswer = (currAns) => {
        if(trainingSet.words.length > 4) {
            const randomIndex = Math.floor(Math.random() * trainingSet.words.length);
            return trainingSet.words[randomIndex][want] === currAns ? selectRandomAnswer(currAns) : trainingSet.words[randomIndex][want];
        }
    }

    const shuffle = (set) => { //takes an array and shuffles the stuff inside
        if (set.words.length > 0) {
            let shuffled = set.words
                .map((value) => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value);
            console.log(shuffled);
            setShuffledSet(shuffled);
            setRemainingSet(shuffled);
        } else {
            goToPage("finishPage");
            console.log("DONE!");
            //maybe have a command to render the graph objects here? bc exit conidition
        }
    };

    const presentNext = useCallback(() => {
        let nextSet = [...remainingSet]; //makes a deep copy
        let next = nextSet.pop();
        setRemainingSet(nextSet);
        setTerm(next[given]);
        setKey(next[want]);
        if(isMultipleChoice){
            assignMC(next[want]); //assigns the multiple choice answers/questions
        }
        setCurrChar(next["character"]);
        setCurrPinyin(next["pinyin"]);
        setCurrDefinition(next["definition"]);
    }, [given, remainingSet, want]);

    const prepareNext = useCallback(() => {
        if (remainingSet.length > 0) {
            presentNext();
        } else {
            console.log("filtering!");
            // filter out the ones that have been answered correctly 3 times
            let newTrainingSet = { ...trainingSet };
            newTrainingSet.words = newTrainingSet.words.filter((word) => {
                //this area iterates through the set adding ones in that shouldnt be removed
                return ((answerCounts[word[want]] || 0) < 3) && !(((answerCounts[word[want]] || 0) >= 2) && ((wrongCounts[word[want]] || 0) === 0));
            });
            console.log(newTrainingSet);
            shuffle(newTrainingSet);
        }
    }, [want, remainingSet, answerCounts, trainingSet, presentNext]);

    useEffect(() => {
        prepareNext();
    }, [shuffledSet]);

    useEffect(() => {
        // shuffle the set
        shuffle(trainingSet);
    }, [trainingSet]);

    const handleSubmit = (event) => {
        console.log("isMultipleChoice", isMultipleChoice);
        if(!isMultipleChoice){
            event.preventDefault();
        }
        //when this happens {answer} will be set to the persons answer so here is where handle a "submission"
        if (submissionNum % 2 === 0) {
            //the "answering" part of submission (here is where you input answer)
            setKeyText(false); //resets the correct answer which is displayed after submission
            setAnswer(""); //resets the submission box holding the answer
            setFormColor("black");
            setButtonState("primary");
            setButtonText("SUBMIT");

            setIsSubmitting(false);
            //reassigns the value of {answer} based on the algorithm
            //reassigns the value of {term} based on the algorithm
            prepareNext();
        } else {
            //below is the intermediary state of submission (here is where displays right/wrong)
            setKeyText(true);
            setTerm("");
            setIsSubmitting(true);

            //we don't setAnswer here because not sure if want to leave persons answer in the textbox
            if (answer === key || (event === answerPlacement)) {
                if(isMultipleChoice) { 
                    setAnswer1("CORRECT!");
                    setAnswer2("CORRECT!");
                    setAnswer3("CORRECT!");
                    setAnswer4("CORRECT!");
                }
                setIsCorrect(true);
                setFormColor("green");
                setButtonState("success");
                setButtonText("CORRECT!");

                //if the person got it right
                setAnswerCounts((answerCounts) => {
                    let newAnswerCounts = { ...answerCounts };
                    newAnswerCounts[key] = (newAnswerCounts[key] || 0) + 1;
                    console.log("RIGHT", newAnswerCounts);
                    return newAnswerCounts;
                });

                //interact with the algorithm
            } else {
                if(isMultipleChoice) { 
                    setAnswer1("INCORRECT");
                    setAnswer2("INCORRECT!");
                    setAnswer3("INCORRECT!");
                    setAnswer4("INCORRECT");
                }
                setIsCorrect(false);
                setFormColor("red");
                setButtonState("danger");
                setButtonText("INCORRECT");
                //if the person got it wrong

                setWrongCounts((answerCounts) => {
                    let newAnswerCounts = { ...answerCounts };
                    newAnswerCounts[key] = (newAnswerCounts[key] || 0) + 1;
                    console.log("WRONG", newAnswerCounts);
                    return newAnswerCounts;
                });
                //interact with the algorithm
            }
        }
        setSubmissionNum((submissionNum) => submissionNum + 1); //increments the counter which alternates the stuff it does
    };

    return (
        <Card body style={{ width: cardWidth }}>
            <Stack
                direction='horizontal'
                style={{
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                }}
            >
                <Stack gap={0}>
                    <Card.Title>
                        Testing {want} given {given}
                    </Card.Title>
                    <Card.Title>{setChoice}</Card.Title>
                </Stack>

                <CloseButton
                    onClick={() => {
                        goToPage("menu");
                        //anything it needs to do to 'reset' this page?
                        //like what if you quit in the middle of the intermediary stage
                        //also interactions with the algorithm
                    }}
                />
            </Stack>
            <Card.Body>
                <Form onSubmit={handleSubmit}>
                    <Stack gap={1}>
                        <Stack gap={2}>
                            <Form.Label
                                style={{
                                    fontSize: getFontSize(term.length)/*would love to make this font size variable*/,
                                }}
                            >
                                {term}
                            </Form.Label>
                            <Form.Label
                                style={{
                                    fontSize:
                                        "25px" /*same here but less necessary*/,
                                }}
                            >
                                {keyText &&
                                    <Stack>
                                        <Form.Label style={{ fontSize: "50px" }}>{currChar}</Form.Label>
                                        <Form.Label>{currPinyin}</Form.Label>
                                        <Form.Label>{currDefinition}</Form.Label>
                                    </Stack>
                                }
                            </Form.Label>

                            { !isMultipleChoice && 
                                <Form.Control
                                style={formStyle}
                                spellCheck='false'
                                placeholder='Answer'
                                id='responseArea'
                                readOnly={isSubmitting}
                                type='text'
                                value={answer}
                                onChange={(event) =>
                                    setAnswer(event.target.value)
                                }
                                />
                            }
                        </Stack>
                        { !isMultipleChoice &&
                        <Button type='submit' variant={buttonState}>
                            {buttonText}
                        </Button>
                        }
                        { isMultipleChoice &&
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
                                <Button style={{fontSize:'10px', minWidth: '165px'}} variant={buttonState} onClick={() => {
                                    handleSubmit(0);
                                }}>{answer1}</Button>
                                <Button style={{fontSize:'10px', minWidth: '165px'}} variant={buttonState} onClick={() => {
                                    handleSubmit(1);
                                }}>{answer2}</Button>
                            </Stack>
                            <Stack
                                direction='vertical'
                                gap={1}
                                style={{
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                            }}
                            >       
                                <Button style={{fontSize:'10px', minWidth: '165px'}} variant={buttonState} onClick={() => {
                                    handleSubmit(2);
                                }}>{answer3}</Button>
                                <Button style={{fontSize:'10px', minWidth: '165px'}} variant={buttonState} onClick={() => {
                                    handleSubmit(3);
                                }}>{answer4}</Button>
                            </Stack>
                        </Stack>
                        }
                        
                    </Stack>
                </Form>
            </Card.Body>
        </Card>
    );
}
