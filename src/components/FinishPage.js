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

export default function Menu(props) {
    const { setChoice, goToPage } = props;

    return (
        <Card body style={{ width: "400px" }}>
            <Stack
                direction='horizontal'
                style={{
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                }}
            >
                <Card.Title style={{ flexGrow: 1 }}>{setChoice}</Card.Title>
                <CloseButton onClick={() => goToPage("menu")} />
            </Stack>

            <Stack gap='3'>

                !Work in progress: going to have statistics here about how many you got right and wrong later!

                <Button
                    variant='success'
                    onClick={() => {
                        goToPage("menu");
                    }}
                >
                    RETURN HOME
                </Button>
            </Stack>
        </Card>
    );
}