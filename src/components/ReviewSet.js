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
} from "react-bootstrap";
import data from "./dictionary.json";

export default function Menu(props) {
    const { setChoice, setSetChoice, goToPage } = props;
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
                    <Card.Title>{setChoice}</Card.Title>
                    <CloseButton
                        onClick={() => {
                            goToPage("menu");
                        }}
                    />
                </Stack>

                <div style={{ height: "100%", overflow: "auto" }}>
                    <Table style={{ height: "auto", overflow: "hidden" }}>
                        <thead>
                            <tr>
                                <th>Term</th>
                                <th>PINYIN</th>
                                <th>Definition</th>
                            </tr>
                        </thead>
                        <tbody style={{ overflow: "auto" }}>
                            {data.sets.map(
                                (set) =>
                                    set.setName === setChoice &&
                                    set.words.map((word) => (
                                        <tr key={word}>
                                            <td>{word.character}</td>
                                            <td>{word.pinyin}</td>
                                            <td>{word.definition}</td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </Table>
                </div>
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
            </Card.Body>
        </Card>
    );
}
