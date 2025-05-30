import { Button, ButtonGroup, ToggleButton, Card, Stack, Form, Alert } from "react-bootstrap";
import { useTheme } from "../contexts/ThemeContext";
import { useEffect } from "react";

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
    const { isDarkMode } = useTheme();
    const answerTypes = [
        { name: "Pinyin", value: "pinyin" },
        { name: "Character", value: "character" },
        { name: "Definition", value: "definition" },
    ];

    // Set default values if not already set
    useEffect(() => {
        if (!given) setGiven("definition");
        if (!want) setWant("character");
    }, []);

    const MIN_WORDS_REQUIRED = 5;
    const hasEnoughWords = set?.vocabItems?.length >= MIN_WORDS_REQUIRED;

    const cardStyle = isDarkMode
        ? { backgroundColor: "#23272b", color: "#fff", borderColor: "#444" }
        : {};
    const headerStyle = isDarkMode ? { color: "#fff" } : {};
    const labelStyle = isDarkMode ? { color: "#fff" } : {};

    return (
        <Card 
            body 
            className="mx-auto my-4" 
            style={{ 
                width: "100%", 
                maxWidth: "420px", 
                border: "none", 
                padding: "1.5rem",
                ...cardStyle
            }}
            >
            <Stack gap={3}>
                <div style={{ textAlign: "center" }}>
                    <h5 style={{ marginBottom: "0.5rem", ...headerStyle }}>Select Learning Mode</h5>
                    <div style={{ fontWeight: "600", fontSize: "1.1rem", ...headerStyle }}>{set.setName}</div>
                </div>

                {!hasEnoughWords && (
                    <Alert variant="warning">
                        This set needs at least {MIN_WORDS_REQUIRED} words to start learning. 
                        Current word count: {set?.vocabItems?.length || 0}
                    </Alert>
                )}

                <Stack
                    direction='horizontal'
                    gap={3}
                    style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}
                >
                    {/* Given Section */}
                    <Stack style={{ flex: 1, minWidth: "140px" }}>
                        <h6 style={{ 
                            textAlign: "center", 
                            ...labelStyle,
                            textDecoration: "underline",
                            marginBottom: "0.5rem"
                        }}>Given</h6>
                        <ButtonGroup vertical>
                            {answerTypes.map((radio, idx) => (
                                <ToggleButton
                                    key={idx}
                                    id={`given-${idx}`}
                                    type='radio'
                                    name='given'
                                    value={radio.value}
                                    variant={given === radio.value ? (isDarkMode ? "light" : "primary") : (isDarkMode ? "outline-light" : "outline-primary")}
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
                        <h6 style={{ 
                            textAlign: "center", 
                            ...labelStyle,
                            textDecoration: "underline",
                            marginBottom: "0.5rem"
                        }}>Test For</h6>
                        <ButtonGroup vertical>
                            {answerTypes.map((radio, idx) => (
                                <ToggleButton
                                    key={idx}
                                    id={`want-${idx}`}
                                    type='radio'
                                    name='want'
                                    value={radio.value}
                                    variant={want === radio.value ? (isDarkMode ? "success" : "success") : (isDarkMode ? "outline-success" : "outline-success")}
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
                    <Form.Check 
                        type="switch"
                        id="multiple-choice-switch"
                        label="Multiple Choice"
                        checked={isMultipleChoice}
                        onChange={(e) => setIsMultipleChoice(e.target.checked)}
                        style={{ 
                            color: isDarkMode ? '#ffffff' : '#000000',
                            fontSize: '1.1rem',
                            marginBottom: '1rem'
                        }}
                    />
                </Stack>

                <Button
                    variant={isDarkMode ? "light" : "primary"}
                    onClick={() => {
                        setSetChoice(`custom_${set.id}`);
                        setCurrentSetName(set.setName);
                        setResponseCounts([]);
                        setLearnedOverTime([]);
                        goToPage("testingZone");
                    }}
                    disabled={!given || !want || !hasEnoughWords}
                >
                    Start
                </Button>

                <Button variant={isDarkMode ? "outline-light" : "secondary"} onClick={() => goToPage("home")}>
                    Back
                </Button>
            </Stack>
        </Card>
    );
}
