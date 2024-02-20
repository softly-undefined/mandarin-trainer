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
    const { goToPage, 

            isMultipleChoice, 
            setIsMultipleChoice, 
            multipleChoiceValue, 
            setMultipleChoiceValue,

            isTraditional,
            setIsTraditional,
            traditionalValue,
            setTraditionalValue

            
    } = props;

    const handleMCChange = (val) => {
        setMultipleChoiceValue(val);
        if(val === 1) {
            setIsMultipleChoice(true);
        }else {
            setIsMultipleChoice(false);
        }
    };
    const handleTraditionalChange = (val) => {
        setTraditionalValue(val);
        if(val === 1) {
            setIsTraditional(true);
        }else {
            setIsTraditional(false);
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
                    <ToggleButtonGroup type="radio" name="mcToggle" value={multipleChoiceValue} onChange={handleMCChange}>
                        <ToggleButton id="mc-tbg-btn-1" value={1}>
                            ON
                        </ToggleButton>
                        <ToggleButton id="mc-tbg-btn-2" value={2}>
                            OFF
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
                <Stack
                    direction='horizontal'
                    style={{
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "5px",
                    }}
                >
                    <Card.Title>Traditional Characters </Card.Title>
                    <ToggleButtonGroup type="radio" name="tcToggle" value={traditionalValue} onChange={handleTraditionalChange}>
                        <ToggleButton id="tc-tbg-btn-1" value={1}>
                            ON
                        </ToggleButton>
                        <ToggleButton id="tc-tbg-btn-2" value={2}>
                            OFF
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>

            </Card.Body>
        </Card>
    );
}
