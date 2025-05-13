import { Button, ButtonGroup, ToggleButton, Card, Stack } from "react-bootstrap";

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
    setLearnedOverTime
}) {
    console.log("🧪 StartLearning → Given:", given, "Want:", want); // 👈 Add this here

    const answerTypes = [
        { name: "Pinyin", value: "pinyin" },
        { name: "Character", value: "character" },
        { name: "Definition", value: "definition" },
    ];

    return (
        <Card body style={{ width: "400px" }}>
            <Stack gap={3}>
                <h5>Select Learning Mode for: {set.setName}</h5>

                <Stack
                    direction='horizontal'
                    gap={3}
                    style={{ justifyContent: "space-between", alignItems: "center" }}
                >
                    {/* Given Section */}
                    <Stack>
                        <h6 style={{ textAlign: "center" }}>Given</h6>
                        <ButtonGroup vertical>
                            {answerTypes.map((radio, idx) => (
                                <ToggleButton
                                    key={idx}
                                    id={`given-${idx}`}
                                    type='radio'
                                    name='given'
                                    value={radio.value}
                                    checked={given === radio.value}
                                    onChange={(e) => setGiven(e.currentTarget.value)}
                                >
                                    {radio.name}
                                </ToggleButton>
                            ))}
                        </ButtonGroup>
                    </Stack>

                    {/* Test For Section */}
                    <Stack>
                        <h6 style={{ textAlign: "center" }}>Test For</h6>
                        <ButtonGroup vertical>
                            {answerTypes.map((radio, idx) => (
                                <ToggleButton
                                    key={idx}
                                    id={`want-${idx}`}
                                    type='radio'
                                    name='want'
                                    value={radio.value}
                                    checked={want === radio.value}
                                    onChange={(e) => setWant(e.currentTarget.value)}
                                >
                                    {radio.name}
                                </ToggleButton>
                            ))}
                        </ButtonGroup>
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
