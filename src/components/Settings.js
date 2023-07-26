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
    ToggleButtonGroup
} from "react-bootstrap";

export default function Menu(props) {
    const { goToPage, isMultipleChoice, setIsMultipleChoice } = props;

    const [value, setValue] = useState([2]);
    const handleChange = (val) => {
        setValue(val);
        if(val === 1) {
            setIsMultipleChoice(true);
        }else {
            setIsMultipleChoice(false);
        }
    };

    return (
        <Card style={{ width: "400px", maxHeight: "90%" }}>
            <Card.Body style={{ height: "100%", overflow: "hidden" }}>
                <Stack
                    direction='horizontal'
                    style={{
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "5px",
                    }}
                >
                    <Card.Title>Settings</Card.Title>
                    <CloseButton
                        onClick={() => {
                            goToPage("menu");
                        }}
                    />
                </Stack>
                <Stack
                    direction='horizontal'
                    style={{
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "5px",
                    }}
                >
                    <Card.Title>Multiple Choice: </Card.Title>
                    <ToggleButtonGroup type="radio" name="mcToggle" value={value} onChange={handleChange}>
                        <ToggleButton id="tbg-btn-1" value={1}>
                            ON
                        </ToggleButton>
                        <ToggleButton id="tbg-btn-2" value={2}>
                            OFF
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

            </Card.Body>
        </Card>
    );
}
