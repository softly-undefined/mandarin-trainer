import { useState, useEffect } from "react";
import { Stack } from "react-bootstrap";

import Menu from "./components/Menu";
import TestingZone from "./components/TestingZone";
import ReviewSet from "./components/ReviewSet";
import FinishPage from "./components/FinishPage";
import Settings from "./components/Settings";

function App() {
    const [given, setGiven] = useState("");
    const [want, setWant] = useState("");
    const [setChoice, setSetChoice] = useState(""); //which dataset
    const [isMultipleChoice, setIsMultipleChoice] = useState(false);
    const [value, setValue] = useState([2]);

    //to show or not to show each of the pages
    const [showMenu, setShowMenu] = useState(true);
    const [showReviewSet, setShowReviewSet] = useState(false);
    const [showTestingZone, setShowTestingZone] = useState(false);
    const [showFinishPage, setShowFinishPage] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const [responseCounts, setResponseCounts] = useState([]); // creates an array of 1's and 0's based on right/wrong

    function goToPage(pageName) {
        setShowMenu(false);
        setShowReviewSet(false);
        setShowTestingZone(false);
        setShowFinishPage(false);
        setShowSettings(false);
        if (pageName === "menu") {
            setShowMenu(true);
            console.log("isMultipleChoice", isMultipleChoice);
        } else if (pageName === "reviewSet") {
            setShowReviewSet(true);
        } else if (pageName === "testingZone") {
            setShowTestingZone(true);
        } else if (pageName === "finishPage") {
            setShowFinishPage(true);
        } else if (pageName === "settings") {
            setShowSettings(true);
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
                        isMultipleChoice={isMultipleChoice}
                        responseCounts={responseCounts}
                        setResponseCounts={setResponseCounts}
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
                    <FinishPage 
                        setChoice={setChoice} 
                        goToPage={goToPage} 
                        responseCounts={responseCounts}
                        setResponseCounts={setResponseCounts}
                    />
                )}

                {showSettings && (
                    <Settings
                        isMultipleChoice={isMultipleChoice}
                        setIsMultipleChoice={setIsMultipleChoice}
                        goToPage={goToPage}
                        value={value}
                        setValue={setValue}
                    />
                )}
            </Stack>
        </div>
    );
}

export default App;
