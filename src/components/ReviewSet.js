
import { useState, useEffect } from 'react'
import { Stack, Card, Form, Button, ButtonGroup, ToggleButton, Spinner, CloseButton, Table } from 'react-bootstrap'
import data from './dictionary.json'

export default function Menu(props) {

    const { setChoice, setSetChoice } = props;


    //use Table to make this the thing
    //ok heer we go

    return (
        <Card body style={{ width: "400px" }}>
            <Stack direction="horizontal" style={{ justifyContent: "space-between", alignItems: "right" }}>
                <Card.Title>
                    {setChoice}
                </Card.Title>
                <CloseButton 
                    //code for the close button
                    //go back to the menu area somehow
                    //anything it needs to do to 'reset' this page?
                    //like what if you quit in the middle of the intermediary stage
                    //also interactions with the algorithm
                />
            </Stack>

            <Table>
                <thead>
                    <tr>
                        <th>Term</th>
                        <th>PINYIN</th>
                        <th>Definition</th>
                    </tr>
                </thead>
                <tbody>
                    {data.sets.map((set) =>
                        set.setName === setChoice &&
                        set.words.map((word) => (
                            <tr key={word}>
                                <td>{word.word}</td>
                                <td>{word.pinyin}</td>
                                <td>{word.definition}</td>
                            </tr>
                        )
                        ))}

                </tbody>
            </Table>



            {/* <Card.Body>
                <Stack gap={1}>
                    <Stack gap={2}>
                        <Stack gap={0}>
                            <Form.Label style={{ fontSize: '25px' }}>鐘點費</Form.Label>
                            <Form.Label style={{ fontSize: '25px' }}> answer here?</Form.Label>
                        </Stack>
                    </Stack>
                </Stack>

            </Card.Body> */}
        </Card>
    )
}


