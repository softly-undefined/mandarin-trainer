import { useState, useEffect } from 'react'
import { Stack, Card, Form, Button, ButtonGroup, ToggleButton } from 'react-bootstrap'
import data from './dictionary.json'

export default function Menu(props) {

    const { given, setGiven, want, setWant, setChoice, setSetChoice } = props;

    const answerTypes = [
        {
            name: "Pinyin",
            value: "pinyin"
        },
        {
            name: "Character",
            value: "character",
        },
        {
            name: "Definition",
            value: "definition"
        }
    ]

    return (
        <Card body style={{ width: "400px" }}>
            <Card.Title>
                Mandarin Trainer BETA零
            </Card.Title>
            <Card.Body>
                <Stack gap={3}>

                    <Stack gap={1}>
                        <Form.Select aria-label="WordSet" value={setChoice} onChange={(event) => setSetChoice(event.target.value)} >
                            <option>select a learning set</option>
                            {data.sets.map((setChoice) => (
                                <option key={setChoice.setName} value={setChoice.setName}>{setChoice.setName}</option>
                            ))}
                        </Form.Select>
                        <Button onClick={() => {
                            //This should switch the element being shown to the ReviewSet Element
                            //Needs to make sure "set" has a value before submitting
                        }}>
                            Review Set
                        </Button>
                    </Stack>

                    <Stack direction="horizontal" gap={3} style={{ justifyContent: "space-between", alignItems: "center" }}>

                        <Stack>
                            <h6 style={{ textAlign: "center" }}>Given</h6>
                            <ButtonGroup vertical>
                                {answerTypes.map((radio, idx) => (
                                    <ToggleButton
                                        key={idx}
                                        id={`given-${idx}`}
                                        type="radio"
                                        name="given"
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
                                        type="radio"
                                        name="want"
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

                    <Button variant="success" onClick={() => {
                        //changes the current page to the TestingZone page
                        //set off the algorithm (how do that)
                        //need to make sure "set", "given", and "want" have values before submitting
                    }}>
                        GO!
                    </Button>

                </Stack>
            </Card.Body>
        </Card>
    )
}