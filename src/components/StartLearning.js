import { Button, ButtonGroup, ToggleButton, Card, Stack, Form } from "react-bootstrap";

export default function StartLearning({
    set,
    goToPage,
    given,
    setGiven,
    want,
    setWant,
    setSetChoice,
    setCurrentSetName,
    setResponseCounts,
    setLearnedOverTime,
    isMultipleChoice,
    setIsMultipleChoice
}) {
    const answerTypes = [
        { name: "Pinyin", value: "pinyin" },
        { name: "Character", value: "character" },
        { name: "Definition", value: "definition" },
    ];

    return (
        <Card 
            body 
            className="mx-auto my-4" 
            style={{ 
                width: "100%", 
                maxWidth: "420px", 
                border: "none", 
                padding: "1.5rem" 
            }}
            >
            <Stack gap={3}>
                <div style={{ textAlign: "center" }}>
                    <h5 style={{ marginBottom: "0.5rem" }}>Select Learning Mode</h5>
                    <div style={{ fontWeight: "600", fontSize: "1.1rem" }}>{set.setName}</div>
                </div>

                <Stack
                    direction='horizontal'
                    gap={3}
                    style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}
                >
                    {/* Given Section */}
                    <Stack style={{ flex: 1, minWidth: "140px" }}>
                        <h6 style={{ textAlign: "center" }}>Given</h6>
                        <ButtonGroup vertical>
                            {answerTypes.map((radio, idx) => (
                                <ToggleButton
                                    key={idx}
                                    id={`given-${idx}`}
                                    type='radio'
                                    name='given'
                                    value={radio.value}
                                    variant={given === radio.value ? "primary" : "outline-primary"}
                                    checked={given === radio.value}
                                    onChange={(e) => setGiven(e.currentTarget.value)}
                                    style={{ borderRadius: "10px", border: "none", marginBottom: "6px" }}
                                >
                                    {radio.name}
                                </ToggleButton>
                            ))}
                        </ButtonGroup>
                    </Stack>

                    {/* Test For Section */}
                    <Stack style={{ flex: 1, minWidth: "140px" }}>
                        <h6 style={{ textAlign: "center" }}>Test For</h6>
                        <ButtonGroup vertical>
                            {answerTypes.map((radio, idx) => (
                                <ToggleButton
                                    key={idx}
                                    id={`want-${idx}`}
                                    type='radio'
                                    name='want'
                                    value={radio.value}
                                    variant={want === radio.value ? "success" : "outline-success"}
                                    checked={want === radio.value}
                                    onChange={(e) => setWant(e.currentTarget.value)}
                                    style={{ borderRadius: "10px", border: "none", marginBottom: "6px" }}
                                >
                                    {radio.name}
                                </ToggleButton>
                            ))}
                        </ButtonGroup>
                    </Stack>
                </Stack>

                <Stack style={{ alignItems: "center" }}>
                    {/* <h6 style={{ textAlign: "center", marginBottom: "10px" }}>Mode</h6> */}
                    <Stack direction="horizontal" gap={2} style={{ justifyContent: "center" }}>
                        <Button
                            variant={!isMultipleChoice ? "primary" : "outline-primary"}
                            onClick={() => setIsMultipleChoice(false)}
                            style={{ 
                                border: "none", 
                                minWidth: "140px",
                                fontSize: "1rem"
                            }}
                        >
                            Free Response
                        </Button>
                        <Button
                            variant={isMultipleChoice ? "primary" : "outline-primary"}
                            onClick={() => setIsMultipleChoice(true)}
                            style={{ 
                                border: "none", 
                                minWidth: "140px",
                                fontSize: "1rem"
                            }}
                        >
                            Multiple Choice
                        </Button>
                    </Stack>
                </Stack>

                <Button
                    variant="primary"
                    onClick={() => {
                        setSetChoice(`custom_${set.id}`);
                        setCurrentSetName(set.setName);
                        setResponseCounts([]);
                        setLearnedOverTime([]);
                        goToPage("testingZone");
                    }}
                    disabled={!given || !want}
                >
                    Start
                </Button>

                <Button variant="secondary" onClick={() => goToPage("home")}>
                    Back
                </Button>
            </Stack>
        </Card>
    );
}
