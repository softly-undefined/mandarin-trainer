import { useState, useEffect } from "react";
import {
    Stack,
    Card,
    Form,
    Button,
    ButtonGroup,
    ToggleButton,
    CloseButton
} from "react-bootstrap";
import data from "./dictionary.json";
import { FaChessPawn } from 'react-icons/fa';

export default function Menu(props) {
    const {
        given,
        setGiven,
        want,
        setWant,
        setChoice,
        setSetChoice,
        goToPage,
    } = props;

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
                    <Card.Title>Mandarin Trainer BETA</Card.Title>
                    <Button 
                        style={{
                            backgroundColor: "transparent",
                            border: "none"
                        }}
                        variant="light"
                        onClick={() => {
                            goToPage("settings");
                        }}
                    > <FaChessPawn /> </Button> 
            </Stack>
            <Card.Body>
                <Stack gap={3}>
                    <Stack gap={1}>
                        <Form.Select
                            aria-label='WordSet'
                            value={setChoice}
                            onChange={(event) =>
                                setSetChoice(event.target.value)
                            }
                        >
                            <option>select a set</option>
                            {data.sets.map((setChoice) => (
                                <option
                                    key={setChoice.setName}
                                    value={setChoice.setName}
                                >
                                    {setChoice.setName}
                                </option>
                            ))}
                        </Form.Select>
                        <Button
                            onClick={() => {
                                if (setChoice) {
                                    goToPage("reviewSet");
                                }
                            }}
                        >
                            Review Set
                        </Button>
                    </Stack>

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
                                        onChange={(e) =>
                                            setGiven(e.currentTarget.value)
                                        }
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
                                        onChange={(e) =>
                                            setWant(e.currentTarget.value)
                                        }
                                    >
                                        {radio.name}
                                    </ToggleButton>
                                ))}
                            </ButtonGroup>
                        </Stack>
                    </Stack>

                    <Button
                        variant='success'
                        disabled={!setChoice || !given || !want}
                        onClick={() => {
                            //kicks off the testing zone
                            if (setChoice != "select a learning set") {
                                goToPage("testingZone");
                            }
                            //set off the algorithm (how do that)
                        }}
                    >
                        GO!
                    </Button>
                </Stack>
            </Card.Body>
        </Card>
    );
}
