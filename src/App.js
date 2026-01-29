import { useState, useEffect } from "react";
import { Stack } from "react-bootstrap";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./contexts/AuthContext";

import Menu from "./components/Menu";
import TestingZone from "./components/TestingZone";
import ReviewSet from "./components/ReviewSet";
import FinishPage from "./components/FinishPage";
import Settings from "./components/Settings";
import SignIn from "./components/SignIn";
import MySets from "./components/MySets";
import Home from "./components/Home";
import StartLearning from "./components/StartLearning";
import { getSetBySlug } from "./services/vocabSetService";


function AppContent() {
    const { currentUser } = useAuth();
    const [given, setGiven] = useState("");
    const [want, setWant] = useState("");
    const [setChoice, setSetChoice] = useState(""); //which dataset
    const [currentSetName, setCurrentSetName] = useState("");

    //Code for the Multiple Choice in Settings
    const [isMultipleChoice, setIsMultipleChoice] = useState(false);
    const [multipleChoiceValue, setMultipleChoiceValue] = useState([2]);

    //Code for Traditional in Settings
    const [isTraditional, setIsTraditional] = useState(false);
    const [traditionalValue, setTraditionalValue] = useState([2]);

    //to show or not to show each of the pages
    const [showHome, setShowHome] = useState(true);
    const [showReviewSet, setShowReviewSet] = useState(false);
    const [showTestingZone, setShowTestingZone] = useState(false);
    const [showFinishPage, setShowFinishPage] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showStartLearning, setShowStartLearning] = useState(false);
    const [showMySets, setShowMySets] = useState(false);
    const [learningSet, setLearningSet] = useState(null);
    const [externalSet, setExternalSet] = useState(null);

    // Shared set handling
    const [shareSet, setShareSet] = useState(null);
    const [shareLoading, setShareLoading] = useState(false);
    const [shareError, setShareError] = useState(null);

    const [responseCounts, setResponseCounts] = useState([]); // creates an array of 1's and 0's based on right/wrong

    const [learnedOverTime, setLearnedOverTime] = useState([]); //This has to deal with the graph in FinishPage

    const getShareSlug = () => {
        const segments = window.location.pathname.split("/").filter(Boolean);
        const idx = segments.findIndex((s) => s === "set");
        if (idx !== -1 && segments[idx + 1]) {
            return segments[idx + 1];
        }
        return null;
    };

    const shareSlug = getShareSlug();

    useEffect(() => {
        let active = true;
        const loadShare = async () => {
            if (!shareSlug) return;
            setShareLoading(true);
            setShareError(null);
            try {
                const s = await getSetBySlug(shareSlug);
                if (!active) return;
                if (!s || s.isPublic !== true) {
                    setShareError("Set not found or not public.");
                } else {
                    setLearningSet(s);
                    setExternalSet(s);
                    setCurrentSetName(s.setName || "");
                    setResponseCounts([]);
                    setLearnedOverTime([]);
                    setShowHome(false);
                    setShowReviewSet(false);
                    setShowTestingZone(false);
                    setShowFinishPage(false);
                    setShowSettings(false);
                    setShowMySets(false);
                    setShowStartLearning(true);
                    if (!given) setGiven("definition");
                    if (!want) setWant("character");
                }
            } catch (err) {
                if (active) setShareError("Error loading shared set.");
            } finally {
                if (active) setShareLoading(false);
            }
        };
        loadShare();
        return () => { active = false; };
    }, [shareSlug, given, want]);

    if (shareSlug) {
        if (shareLoading) return <div style={{ textAlign: "center", marginTop: "2rem" }}>Loading shared set...</div>;
        if (shareError) return <div style={{ textAlign: "center", marginTop: "2rem" }}>{shareError}</div>;
        // Allow anonymous use for shared sets: skip SignIn gate
    } else if (!currentUser) {
        return <SignIn />;
    }

    function goToPage(pageName, payload) {
        setShowHome(false);
        setShowReviewSet(false);
        setShowTestingZone(false);
        setShowFinishPage(false);
        setShowSettings(false);
        setShowMySets(false);
        setShowStartLearning(false);
        
        if (pageName === "home" || pageName === "menu" || pageName === "mySets") {
            setShowHome(true); // redirect both old routes to home
            console.log("isMultipleChoice", isMultipleChoice);
        } else if (pageName === "reviewSet") {
            setShowReviewSet(true);
        } else if (pageName === "testingZone") {
            setShowTestingZone(true);
        } else if (pageName === "finishPage") {
            setShowFinishPage(true);
        } else if (pageName === "settings") {
            setShowSettings(true);
        } else if (pageName === "mySets") {
            setShowMySets(true);
        } else if (pageName === "startLearning") {
            const nextSet = payload?.set || payload;
            setLearningSet(nextSet); // set passed
            setExternalSet(payload?.fromShare ? nextSet : null);
            setShowStartLearning(true);
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
                {showHome && (
                    <Home goToPage={goToPage} />
                )}


                {/* {showMySets && (
                    <MySets goToPage={goToPage} />
                )} */}

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
                        learnedOverTime={learnedOverTime}
                        setLearnedOverTime={setLearnedOverTime}
                        currentSetName={currentSetName}
                        externalSet={externalSet || learningSet}
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
                        learnedOverTime={learnedOverTime}
                        currentSetName={currentSetName}
                    />
                )}

                {showSettings && (
                    <Settings
                        goToPage={goToPage}
                        isTraditional={isTraditional}
                        setIsTraditional={setIsTraditional}
                        traditionalValue={traditionalValue}
                        setTraditionalValue={setTraditionalValue}
                    />
                )}

                {showStartLearning && (
                    <StartLearning
                        set={learningSet}
                        goToPage={goToPage}
                        given={given}
                        want={want}
                        setGiven={setGiven}
                        setWant={setWant}
                        setSetChoice={setSetChoice}
                        setCurrentSetName={setCurrentSetName}
                        setResponseCounts={setResponseCounts}
                        setLearnedOverTime={setLearnedOverTime}
                        isMultipleChoice={isMultipleChoice}
                        setIsMultipleChoice={setIsMultipleChoice}
                        showSettingsShortcut
                        backLabel="Back"
                        onBack={undefined}
                        onStart={() => {
                            setResponseCounts([]);
                            setLearnedOverTime([]);
                            setExternalSet(learningSet);
                            setCurrentSetName(learningSet?.setName || "");
                            goToPage("testingZone");
                        }}
                    />
                )}
            </Stack>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <AppContent />
            </ThemeProvider>
        </AuthProvider>
    );
}
