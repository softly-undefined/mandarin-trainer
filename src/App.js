import { useState, useEffect } from "react";
import {
    Stack,
    Card,
    Form,
    Button,
    ButtonGroup,
    ToggleButton,
} from "react-bootstrap";

import Menu from "./components/Menu";
import TestingZone from "./components/TestingZone";
import ReviewSet from "./components/ReviewSet";
import FinishPage from "./components/FinishPage";

function App() {
    const [given, setGiven] = useState("");
    const [want, setWant] = useState("");
    const [setChoice, setSetChoice] = useState("");

    //to show or not to show each of the pages
    const [showMenu, setShowMenu] = useState(true);
    const [showReviewSet, setShowReviewSet] = useState(false);
    const [showTestingZone, setShowTestingZone] = useState(false);
    const [showFinishPage, setShowFinishPage] = useState(false);

    function goToPage(pageName) {
        setShowMenu(false);
        setShowReviewSet(false);
        setShowTestingZone(false);
        setShowFinishPage(false);
        if (pageName === "menu") {
            setShowMenu(true);
        } else if (pageName === "reviewSet") {
            setShowReviewSet(true);
        } else if (pageName === "testingZone") {
            setShowTestingZone(true);
        } else if (pageName === "finishPage") {
            setShowFinishPage(true);
        }
    }

    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <Stack
                style={{
                    width: "100%",
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                {showMenu && (
                    <Menu
                        given={given}
                        setGiven={setGiven}
                        want={want}
                        setWant={setWant}
                        setChoice={setChoice}
                        setSetChoice={setSetChoice}
                        goToPage={goToPage}
                    />
                )}

                {showTestingZone && (
                    <TestingZone
                        given={given}
                        setGiven={setGiven}
                        want={want}
                        setWant={setWant}
                        setChoice={setChoice}
                        setSetChoice={setSetChoice}
                        goToPage={goToPage}
                    />
                )}

                {showReviewSet && (
                    <ReviewSet
                        setChoice={setChoice}
                        setSetChoice={setSetChoice}
                        goToPage={goToPage}
                    />
                )}

                {showFinishPage && (
                    <FinishPage setChoice={setChoice} goToPage={goToPage} />
                )}
            </Stack>
        </div>
    );
}

export default App;
