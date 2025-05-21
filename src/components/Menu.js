import { useState, useEffect } from "react";
import { Button, Card, Form, Stack, ButtonGroup, ToggleButton } from "react-bootstrap";
import { FaCog } from 'react-icons/fa';
import { getUserVocabSets } from "../services/vocabSetService";
import { useAuth } from "../contexts/AuthContext";

export default function Menu(props) {
    const {
        given,
        setGiven,
        want,
        setWant,
        setChoice,
        setSetChoice,
        goToPage,
        setResponseCounts,
        setLearnedOverTime,
        setCurrentSetName
    } = props;

    const { currentUser } = useAuth();
    const [customSets, setCustomSets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSets = async () => {
            try {
                console.log("Loading sets for user:", currentUser.uid);
                const sets = await getUserVocabSets(currentUser.uid);
                console.log("Loaded sets:", sets);
                if (sets && sets.length > 0) {
                    setCustomSets(sets);
                    // If no set is selected, select the first one by default
                    if (!setChoice) {
                        setSetChoice(`custom_${sets[0].id}`);
                    }
                } else {
                    console.log("No sets found for user");
                    setCustomSets([]);
                }
            } catch (error) {
                console.error("Error loading sets:", error);
                setCustomSets([]);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            loadSets();
        }
    }, [currentUser, setChoice, setSetChoice]);

    const handleSetChange = (event) => {
        const selectedSet = event.target.value;
        console.log("Selected set value:", selectedSet);
        const setId = selectedSet.replace('custom_', '');
        const selectedSetData = customSets.find(set => set.id === setId);
        console.log("Selected set data:", selectedSetData);
        setSetChoice(selectedSet);
        // Pass the set name to the parent component
        if (selectedSetData) {
            setCurrentSetName(selectedSetData.setName);
        } else {
            console.error("No set data found for selected set");
            setCurrentSetName("");
        }
    };

    const answerTypes = [
        {
            name: "Pinyin",
            value: "pinyin",
        },
        {
            name: "Character",
            value: "character",
        },
        {
            name: "Definition",
            value: "definition",
        },
    ];

    if (loading) {
        return <div>Loading sets...</div>;
    }

    if (!currentUser) {
        return <div>Please sign in to view your sets</div>;
    }

    return (
        <Card body style={{ width: "400px" }}>
            <Stack
                direction='horizontal'
                style={{
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "5px",
                }}
            >
                <Card.Title style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={process.env.PUBLIC_URL + '/finallogo.png'} alt="Mandarin Trainer Logo" style={{ height: 32, width: 32 }} />
                    Mandarin Trainer
                </Card.Title>
                <Button 
                    style={{
                        backgroundColor: "transparent",
                        border: "none"
                    }}
                    variant="light"
                    onClick={() => goToPage("settings")}
                > 
                    <FaCog /> 
                </Button>
            </Stack>
            <Stack gap={3}>
                <Form.Select
                    value={setChoice}
                    onChange={handleSetChange}
                >
                    <option value="">Choose a set (if empty click "Manage My Sets")</option>
                    {customSets.map((set) => (
                        <option key={set.id} value={`custom_${set.id}`}>
                            {set.setName}
                        </option>
                    ))}
                </Form.Select>

                <Stack
                    direction='horizontal'
                    gap={3}
                    style={{
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
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

                    <Stack>
                        <h6 style={{ textAlign: "center" }}>Test for</h6>
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
                        setResponseCounts([]);
                        setLearnedOverTime([]);
                        goToPage("testingZone");
                    }}
                    disabled={!setChoice || !given || !want}
                >
                    Start Testing
                </Button>

                <Button
                    variant="secondary"
                    onClick={() => goToPage("mySets")}
                >
                    Manage My Sets
                </Button>
            </Stack>
        </Card>
    );
}
