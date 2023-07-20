import { useState, useEffect } from 'react'
import { Stack, Card, Form, Button, ButtonGroup, ToggleButton, Spinner, CloseButton } from 'react-bootstrap'

export default function Menu(props) {

    const { given, setGiven, want, setWant, setChoice, setSetChoice, setShowTestingZone, setShowMenu, showTestingZone, showMenu } = props; //should probably change this to get only given, want, and set because we dont need to change them

    const [term, setTerm] = useState('zhong1 dian3 fei4'); //change this initial value
    const [key, setKey] = useState('鐘點費'); //change this initial value
    const [answer, setAnswer] = useState('');
    const [keyText, setKeyText] = useState('');

    const [submissionNum, setSubmissionNum] = useState(1); //does the alternating intermediary state
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isCorrect, setIsCorrect] = useState(false);
    const [isDefault, setIsDefault] = useState(true);
    const [formColor, setFormColor] = useState('black'); //sets color of wrongright

    const [buttonState, setButtonState] = useState('primary');
    const [buttonText, setButtonText] = useState('SUBMIT');

    const formStyle = {
        color: formColor
    }

    let array = [];
    let wrongArray = [];



    const handleSubmit = (event) => {
        event.preventDefault();
        //when this happens {answer} will be set to the persons answer so here is where handle a "submission"
        if(submissionNum % 2 === 0){  //the "answering" part of submission
            setKeyText(''); //resets the correct answer which is displayed after submission
            setAnswer(''); //resets the submission box holding the answer
            setFormColor('black');
            setButtonState('primary');
            setButtonText('SUBMIT');

            //setIsDefault(true); //makes the thing white again

            setIsSubmitting(false);
            //reassigns the value of {answer} based on the algorithm
            //reassigns the value of {term} based on the algorithm

        }else { //below is the intermediary state of submission
            setKeyText(key); 
            setIsSubmitting(true);
            //setIsDefault(false); //disables the thing from being white
            
            //we don't setAnswer here because not sure if want to leave persons answer in the textbox
            if(answer === key) {
                setIsCorrect(true);
                setFormColor('green');
                setButtonState('success');
                setButtonText('CORRECT!');
                //if the person got it right
                //make something green
                //interact with the algorithm

            }else {
                setIsCorrect(false);
                setFormColor('red');
                setButtonState('danger');
                setButtonText('INCORRECT');
                //if the person got it wrong
                //make something red
                //make the person retype? im thinking maybe not
                //interact with the algorithm

            }
        }
        setSubmissionNum((submissionNum) => submissionNum + 1); //increments the counter which alternates the stuff it does
    }




    return (
        <Card body style={{ width: "400px" }}>
            <Stack direction="horizontal" style={{ justifyContent: "space-between", alignItems: "right" }}>
                <Stack gap={0}>
                    <Card.Title>
                        Testing {want} given {given}
                    </Card.Title>
                    <Card.Title>
                        {setChoice}
                    </Card.Title>
                </Stack>

                <CloseButton onClick={() => {
                    //go back to the menu area somehow
                    //anything it needs to do to 'reset' this page?
                    //like what if you quit in the middle of the intermediary stage
                    //also interactions with the algorithm
                }}/>
            </Stack>
            <Card.Body>
                <Form onSubmit={handleSubmit}>
                    <Stack gap={1}>
                        <Stack gap={2}>
                            <Stack gap={0}>
                                <Form.Label style={{ fontSize: '50px' /*would love to make this font size variable*/}}>{term}</Form.Label>
                                <Form.Label style={{ fontSize: '25px' /*same here but less necessary*/}}>{keyText || ''}</Form.Label>
                            </Stack>
                            <Form.Control style={formStyle} spellCheck="false" placeholder="Answer" id="responseArea" readOnly={isSubmitting} type="text" value={answer} onChange={(event) => setAnswer(event.target.value)}/>
                        </Stack>
                        <Button type="submit" variant={buttonState}>{buttonText}</Button>
                    </Stack>
                </Form>
            </Card.Body>
        </Card>
    )
}