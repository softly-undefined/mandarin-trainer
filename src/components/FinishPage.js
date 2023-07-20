import { useState, useEffect } from 'react'
import { Stack, Card, Form, Button, ButtonGroup, ToggleButton, Spinner, CloseButton, Table } from 'react-bootstrap'

export default function Menu(props) {

    const { setChoice } = props;
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

            <Stack gap="3">
                This is where I want to put graphs and stuff analyzing your performance and success rates and stuff later.


                <Button variant="success" onClick={() => {
                    //changes the current page to the menu
                    //literally does the same exact thing as the close button
                    //i just feel its necessary to have both because ppl
                    //are stupid
                }}>RETURN HOME</Button>
            </Stack>
        </Card>
    )
}


