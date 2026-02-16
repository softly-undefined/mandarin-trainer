import { useState, useEffect } from "react";
import { Stack } from "react-bootstrap";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ScriptProvider } from "./contexts/ScriptContext";
import { useAuth } from "./contexts/AuthContext";

import TestingZone from "./components/TestingZone";
import FinishPage from "./components/FinishPage";
import Settings from "./components/Settings";
import SignIn from "./components/SignIn";
import Home from "./components/Home";
import StartLearning from "./components/StartLearning";
import { getSetBySlug } from "./services/vocabSetService";


function AppContent() {
    const { currentUser } = useAuth();
    const [given, setGiven] = useState("");
    const [want, setWant] = useState("");
    const [setChoice, setSetChoice] = useState(""); //which dataset
    const [currentSetName, setCurrentSetName] = useState("");
    const [termCount, setTermCount] = useState(0);

    //Code for the Multiple Choice in Settings
    const [isMultipleChoice, setIsMultipleChoice] = useState(false);
    const [multipleChoiceValue, setMultipleChoiceValue] = useState([2]);

    //to show or not to show each of the pages
    const [showHome, setShowHome] = useState(true);
    const [showTestingZone, setShowTestingZone] = useState(false);
    const [showFinishPage, setShowFinishPage] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showStartLearning, setShowStartLearning] = useState(false);
    const [learningSet, setLearningSet] = useState(null);
    const [externalSet, setExternalSet] = useState(null);
    const [currentPage, setCurrentPage] = useState("home");
    const [lastPage, setLastPage] = useState("home");
    const [settingsReturnPage, setSettingsReturnPage] = useState({ page: "home", payload: null });

    const [shareLoading, setShareLoading] = useState(false);
    const [shareError, setShareError] = useState(null);
    const [shareShowLoader, setShareShowLoader] = useState(false);

    const [responseCounts, setResponseCounts] = useState([]); // creates an array of 1's and 0's based on right/wrong

    const [learnedOverTime, setLearnedOverTime] = useState([]); //This has to deal with the graph in FinishPage

    const getPathSegments = () => window.location.pathname.split("/").filter(Boolean);
    const pathSegments = getPathSegments();

    const getShareSlug = () => {
        const idx = pathSegments.findIndex((s) => s === "set");
        if (idx !== -1 && pathSegments[idx + 1]) {
            return pathSegments[idx + 1];
        }
        return null;
    };

    const shareSlug = getShareSlug();
    const isSettingsPath = pathSegments.includes("settings");

    useEffect(() => {
        let active = true;
        const loadShare = async () => {
            if (!shareSlug) return;
            setShareLoading(true);
            setShareError(null);
            setShareShowLoader(false);
            const timer = setTimeout(() => {
                if (active) setShareShowLoader(true);
            }, 2000);
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
                    setShowTestingZone(false);
                    setShowFinishPage(false);
                    setShowSettings(false);
                    setShowStartLearning(true);
                    setCurrentPage("startLearning");
                    if (!given) setGiven("definition");
                    if (!want) setWant("character");
                }
            } catch (err) {
                if (active) setShareError("Error loading shared set.");
            } finally {
                if (active) setShareLoading(false);
                clearTimeout(timer);
            }
        };
        loadShare();
        return () => { active = false; };
    }, [shareSlug, given, want]);

    const shouldShowSignIn = !currentUser && !isSettingsPath && !shareSlug;

    if (shareSlug) {
        if (shareLoading && showHome) return null; // avoid flash while state still home
        if (shareLoading && shareShowLoader) return <div style={{ textAlign: "center", marginTop: "2rem" }}>Loading set...</div>;
        if (shareError) return <div style={{ textAlign: "center", marginTop: "2rem" }}>{shareError}</div>;
        // Allow anonymous use for shared sets: skip SignIn gate
    } else if (shouldShowSignIn) {
        return <SignIn />;
    }

    function goToPage(pageName, payload) {
        const priorPage = currentPage || "home";
        setLastPage(priorPage);
        setCurrentPage(pageName);
        setShowHome(false);
        setShowTestingZone(false);
        setShowFinishPage(false);
        setShowSettings(false);
        setShowStartLearning(false);

        const base = process.env.PUBLIC_URL || "";
        if (!currentUser && shareSlug && (pageName === "home" || pageName === "menu")) {
            window.location.assign(`${base}/`);
            return;
        }
        
        if (pageName === "home" || pageName === "menu") {
            // Ensure URL resets to app root when coming from a shared /set/:slug path
            const homeUrl = `${base}/`;
            if (window.location.pathname.includes("/set/")) {
                window.location.assign(homeUrl);
                return;
            }
            setShowHome(true); // redirect both old routes to home
            console.log("isMultipleChoice", isMultipleChoice);
        } else if (pageName === "testingZone") {
            setShowTestingZone(true);
        } else if (pageName === "finishPage") {
            setShowFinishPage(true);
        } else if (pageName === "settings") {
            setSettingsReturnPage({
                page: payload?.returnTo || priorPage || "home",
                payload: payload?.returnPayload || (priorPage === "startLearning" ? learningSet : null),
            });
            setShowSettings(true);
        } else if (pageName === "startLearning") {
            const nextSet = payload?.set || payload || learningSet || externalSet;
            if (nextSet) {
                setLearningSet(nextSet);
                setExternalSet(nextSet);
                setShowStartLearning(true);
            } else {
                setShowHome(true);
            }
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
                {isSettingsPath && showSettings && (
                    <Settings
                        onBack={() => {
                            goToPage(settingsReturnPage.page, settingsReturnPage.payload);
                        }}
                    />
                )}

                {showHome && (
                    <Home goToPage={goToPage} />
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
                        learnedOverTime={learnedOverTime}
                        setLearnedOverTime={setLearnedOverTime}
                        currentSetName={currentSetName}
                        externalSet={externalSet || learningSet}
                        onTermCountChange={setTermCount}
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
                        given={given}
                        want={want}
                        termCount={termCount}
                    />
                )}

                {showSettings && !isSettingsPath && (
                    <Settings
                        onBack={() => {
                            goToPage(settingsReturnPage.page, settingsReturnPage.payload);
                        }}
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
                <ScriptProvider>
                    <AppContent />
                </ScriptProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}
