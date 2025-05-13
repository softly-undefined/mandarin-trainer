import { useState } from "react";
import { Button, Card, Stack, ToggleButtonGroup, ToggleButton } from "react-bootstrap";

export default function Settings(props) {
    const { goToPage, isMultipleChoice, setIsMultipleChoice, multipleChoiceValue, setMultipleChoiceValue } = props;

    const handleMCChange = (val) => {
        setMultipleChoiceValue(val);
        if(val === 1) {
            setIsMultipleChoice(true);
        } else {
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
                    <Button
                        variant="outline-secondary"
                        onClick={() => goToPage("menu")}
                    >
                        Back to Menu
                    </Button>
                </Stack>
                <Stack gap={3} style={{ marginTop: "20px" }}>
                    <Stack
                        direction='horizontal'
                        style={{
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "5px",
                        }}
                    >
                        <Card.Title>Multiple Choice</Card.Title>
                        <ToggleButtonGroup type="radio" name="mcToggle" value={multipleChoiceValue} onChange={handleMCChange}>
                            <ToggleButton id="mc-tbg-btn-1" value={1}>
                                ON
                            </ToggleButton>
                            <ToggleButton id="mc-tbg-btn-2" value={2}>
                                OFF
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>
                </Stack>
            </Card.Body>
        </Card>
    );
}
