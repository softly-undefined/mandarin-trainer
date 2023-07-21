import { useState, useEffect, useMemo, useCallback } from "react";
import {
    Stack,
    Card,
    Form,
    Button,
    ButtonGroup,
    ToggleButton,
    Spinner,
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
    } = props; //should probably change this to get only given, want, and set because we dont need to change them

    const [term, setTerm] = useState(""); //change this initial value
    const [key, setKey] = useState(""); //change this initial value
    const [answer, setAnswer] = useState("");
    const [keyText, setKeyText] = useState("");

    const [submissionNum, setSubmissionNum] = useState(1); //does the alternating intermediary state
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isCorrect, setIsCorrect] = useState(false);
    const [isDefault, setIsDefault] = useState(true);
    const [formColor, setFormColor] = useState("black"); //sets color of wrongright

    const [buttonState, setButtonState] = useState("primary");
    const [buttonText, setButtonText] = useState("SUBMIT");

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
                return ((answerCounts[word[want]] || 0) < 3) && !(((answerCounts[word[want]] || 0) >= 2) && ((wrongCounts[word[want]] || 0) == 0));
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
        event.preventDefault();
        //when this happens {answer} will be set to the persons answer so here is where handle a "submission"
        if (submissionNum % 2 === 0) {
            //the "answering" part of submission (here is where you input answer)
            setKeyText(""); //resets the correct answer which is displayed after submission
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
            setKeyText(key);
            setIsSubmitting(true);

            //we don't setAnswer here because not sure if want to leave persons answer in the textbox
            if (answer === key) {
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
        <Card body style={{ width: "400px" }}>
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
                            <Stack gap={0}>
                                <Form.Label
                                    style={{
                                        fontSize:
                                            "50px" /*would love to make this font size variable*/,
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
                                    {keyText || ""}
                                </Form.Label>
                            </Stack>
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
                        </Stack>
                        <Button type='submit' variant={buttonState}>
                            {buttonText}
                        </Button>
                    </Stack>
                </Form>
            </Card.Body>
        </Card>
    );
}
