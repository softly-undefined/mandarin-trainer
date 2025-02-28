import { useState, useEffect } from "react";
import {
    Stack,
    Card,
    Form,
    Button,
    ButtonGroup,
    ToggleButton,
    Spinner,
    CloseButton,
    Table,
} from "react-bootstrap";

export default function Menu(props) {
    const { 
        setChoice, 
        goToPage,
        responseCounts,
        setResponseCounts
    } = props;

    const [rightCount, setRightCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);


    useEffect( () => {
        getRightWrong(responseCounts);
        console.log("IS THIS EVER WRITING");
    }, [responseCounts]);

    const getRightWrong = (array) => {
        if(array.length > 0){
            array.forEach((value) => {
                if(value === 0){
                    setWrongCount(wrongCount + 1);
                }else {
                    setRightCount(rightCount + 1);
                }
            });
        } 
    }


    return (
        <Card body style={{ width: "400px" }}>
            <Stack
                direction='horizontal'
                style={{
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                }}
            >
                <Card.Title style={{ flexGrow: 1 }}>{setChoice}</Card.Title>
                <CloseButton onClick={() => goToPage("menu")} />
            </Stack>

            <Stack gap='3'>

                !You finished! Go you!

                <Stack
                    direction='horizontal'
                    style={{
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "5px",
                    }}
                >
                    <Stack>
                        {rightCount}
                    </Stack>
                    <Stack>
                        {wrongCount}
                    </Stack>

                </Stack>

                <Button
                    variant='success'
                    onClick={() => {
                        goToPage("menu");
                    }}
                >
                    RETURN HOME
                </Button>
            </Stack>
        </Card>
    );
}
