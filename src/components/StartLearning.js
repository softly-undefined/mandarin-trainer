import { Button, ButtonGroup, ToggleButton, Card, Stack, Form, Alert } from "react-bootstrap";
import { useTheme } from "../contexts/ThemeContext";
import { useScript } from "../contexts/ScriptContext";
import { usePinyin } from "../contexts/PinyinContext";
import { useEffect, useState } from "react";
import { FaCog } from 'react-icons/fa';
import { useAuth } from "../contexts/AuthContext";

export default function StartLearning({
    set,
    goToPage,
    given,
    setGiven,
    want,
    setWant,
    setSetChoice,
    setCurrentSetName,
    setResponseCounts,
    setLearnedOverTime,
    isMultipleChoice,
    setIsMultipleChoice,
    showSettingsShortcut = false,
    backLabel = "Back",
    onBack
}) {
    const { isDarkMode } = useTheme();
    const { getDisplayChar } = useScript();
    const { formatPinyin } = usePinyin();
    const { currentUser } = useAuth();
    const [showVocab, setShowVocab] = useState(false);
    const answerTypes = [
        { name: "Pinyin", value: "pinyin" },
        { name: "Character", value: "character" },
        { name: "Definition", value: "definition" },
    ];

    // Set default values if not already set
    useEffect(() => {
        if (!given) setGiven("definition");
        if (!want) setWant("character");
    }, []);

    const MIN_WORDS_REQUIRED = 5;
    const hasEnoughWords = set?.vocabItems?.length >= MIN_WORDS_REQUIRED;
    const isOwner = Boolean(currentUser?.uid) && (set?.ownerId === currentUser.uid || set?.userId === currentUser.uid);

    const cardStyle = isDarkMode
        ? { backgroundColor: "#23272b", color: "#fff", borderColor: "#444" }
        : {};
    const headerStyle = isDarkMode ? { color: "#fff" } : {};
    const labelStyle = isDarkMode ? { color: "#fff" } : {};

    if (!set) {
        return null;
    }

    const handleEditSet = () => {
        if (!isOwner) {
            return;
        }

        const base = process.env.PUBLIC_URL || "";
        window.location.assign(`${base}/?editSet=${encodeURIComponent(set.id)}`);
    };

    const renderHeader = () => (
        <div style={{ position: "relative", paddingRight: "2rem" }}>
            {showSettingsShortcut && (
                <Button
                    variant="link"
                    size="sm"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (goToPage) {
                            goToPage("settings");
                        } else {
                            const base = process.env.PUBLIC_URL || "";
                            window.location.href = `${base}/settings`;
                        }
                    }}
                    style={{
                        position: "absolute",
                        top: "-4px",
                        right: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: isDarkMode ? "#fff" : "#000",
                        textDecoration: "none",
                        padding: 0
                    }}
                >
                    <FaCog size={20} color={isDarkMode ? "#fff" : "#000"} />
                </Button>
            )}
            <div style={{ textAlign: "center" }}>
                <h5 style={{ marginBottom: "0.25rem", ...headerStyle, wordBreak: "break-word" }}>
                    {set.setName}
                </h5>
                <div style={{ marginBottom: "0.35rem", fontWeight: 600, color: isDarkMode ? "#d0d0d0" : "#444" }}>
                    {set?.vocabItems?.length || 0} terms
                </div>
                <h6 style={{ marginBottom: "0.5rem", ...headerStyle }}>Select Learning Mode</h6>
            </div>
        </div>
    );

    const renderMain = () => (
        <>
            {renderHeader()}

            {!hasEnoughWords && (
                <Alert variant="warning">
                    This set needs at least {MIN_WORDS_REQUIRED} words to start learning. 
                    Current word count: {set?.vocabItems?.length || 0}
                </Alert>
            )}

            <Stack
                direction='horizontal'
                gap={3}
                style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}
            >
                {/* Given Section */}
                <Stack style={{ flex: 1, minWidth: "140px" }}>
                    <h6 style={{ 
                        textAlign: "center", 
                        ...labelStyle,
                        textDecoration: "underline",
                        marginBottom: "0.5rem"
                    }}>Given</h6>
                    <ButtonGroup vertical>
                        {answerTypes.map((radio, idx) => (
                            <ToggleButton
                                key={idx}
                                id={`given-${idx}`}
                                type='radio'
                                name='given'
                                value={radio.value}
                                variant={given === radio.value ? (isDarkMode ? "light" : "primary") : (isDarkMode ? "outline-light" : "outline-primary")}
                                checked={given === radio.value}
                                onChange={(e) => setGiven(e.currentTarget.value)}
                                style={{ borderRadius: "10px", border: "none", marginBottom: "6px" }}
                            >
                                {radio.name}
                            </ToggleButton>
                        ))}
                    </ButtonGroup>
                </Stack>

                {/* Test For Section */}
                <Stack style={{ flex: 1, minWidth: "140px" }}>
                    <h6 style={{ 
                        textAlign: "center", 
                        ...labelStyle,
                        textDecoration: "underline",
                        marginBottom: "0.5rem"
                    }}>Test For</h6>
                    <ButtonGroup vertical>
                        {answerTypes.map((radio, idx) => (
                            <ToggleButton
                                key={idx}
                                id={`want-${idx}`}
                                type='radio'
                                name='want'
                                value={radio.value}
                                variant={want === radio.value ? (isDarkMode ? "success" : "success") : (isDarkMode ? "outline-success" : "outline-success")}
                                checked={want === radio.value}
                                onChange={(e) => setWant(e.currentTarget.value)}
                                style={{ borderRadius: "10px", border: "none", marginBottom: "6px" }}
                            >
                                {radio.name}
                            </ToggleButton>
                        ))}
                    </ButtonGroup>
                </Stack>
            </Stack>

            <Stack style={{ alignItems: "center" }}>
                <Form.Check 
                    type="switch"
                    id="multiple-choice-switch"
                    label="Multiple Choice"
                    checked={isMultipleChoice}
                    onChange={(e) => setIsMultipleChoice(e.target.checked)}
                    style={{ 
                        color: isDarkMode ? '#ffffff' : '#000000',
                        fontSize: '1.1rem',
                        marginBottom: '1rem'
                    }}
                />
            </Stack>

            <Stack gap={4.8}>
                <Button
                    variant={isDarkMode ? "light" : "primary"}
                    onClick={() => {
                        setSetChoice(`custom_${set.id}`);
                        setCurrentSetName(set.setName);
                        setResponseCounts([]);
                        setLearnedOverTime([]);
                        goToPage("testingZone");
                    }}
                    disabled={!given || !want || !hasEnoughWords}
                    style={{ 
                        borderRadius: "12px 12px 0 0",
                        fontWeight: 600,
                        fontSize: "1.05rem"
                    }}
                >
                    Start
                </Button>

                <Button
                    variant="success"
                    onClick={() => setShowVocab(true)}
                    style={{ 
                        width: "100%", 
                        fontWeight: 600,
                        fontSize: "1.05rem",
                        borderRadius: 0
                    }}
                    aria-label="View vocabulary items in this set"
                >
                    View Vocab
                </Button>

                <Button
                    variant={isDarkMode ? "outline-light" : "secondary"}
                    onClick={() => {
                        if (onBack) return onBack();
                        if (goToPage) {
                            goToPage("home");
                        } else {
                            const base = process.env.PUBLIC_URL || "";
                            window.location.assign(`${base}/`);
                        }
                    }}
                    style={{ 
                        borderRadius: "0 0 12px 12px",
                        fontWeight: 600,
                        fontSize: "1.05rem"
                    }}
                >
                    My Sets
                </Button>
            </Stack>
        </>
    );

    const renderVocab = () => (
        <>
            <div style={{ textAlign: "center" }}>
                <h5 style={{ marginBottom: "0.25rem", ...headerStyle, wordBreak: "break-word" }}>
                    {set.setName}
                </h5>
                <h6 style={{ marginBottom: "0.75rem", ...headerStyle }}>Vocabulary Preview</h6>
            </div>

            <div
                style={{
                    width: "100%",
                    border: isDarkMode ? "1px solid #444" : "1px solid #dee2e6",
                    borderRadius: "10px",
                    padding: "1rem",
                    backgroundColor: isDarkMode ? "#181a1b" : "#f8f9fa",
                    color: isDarkMode ? "#fff" : "#000",
                    maxHeight: "480px",
                    overflowY: "auto",
                }}
            >
                {set?.vocabItems?.length ? (
                    <table style={{ width: "100%", fontSize: "0.95rem", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", border: isDarkMode ? "1px solid #444" : "1px solid #ced4da", padding: "0.5rem" }}>Character</th>
                                <th style={{ textAlign: "left", border: isDarkMode ? "1px solid #444" : "1px solid #ced4da", padding: "0.5rem" }}>Pinyin</th>
                                <th style={{ textAlign: "left", border: isDarkMode ? "1px solid #444" : "1px solid #ced4da", padding: "0.5rem" }}>Definition</th>
                            </tr>
                        </thead>
                        <tbody>
                            {set.vocabItems.map((item, idx) => (
                                <tr key={idx}>
                                    <td style={{ verticalAlign: "top", border: isDarkMode ? "1px solid #444" : "1px solid #ced4da", padding: "0.5rem" }}>{getDisplayChar(item)}</td>
                                    <td style={{ verticalAlign: "top", border: isDarkMode ? "1px solid #444" : "1px solid #ced4da", padding: "0.5rem" }}>{formatPinyin(item.pinyin)}</td>
                                    <td style={{ verticalAlign: "top", border: isDarkMode ? "1px solid #444" : "1px solid #ced4da", padding: "0.5rem" }}>{item.definition}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div>No vocab items.</div>
                )}
            </div>

            <Button
                variant={isOwner ? (isDarkMode ? "outline-light" : "outline-primary") : "outline-secondary"}
                onClick={handleEditSet}
                disabled={!isOwner}
                style={{ marginTop: "1.4rem", marginBottom: "0.75rem" }}
            >
                {isOwner ? "Edit Set" : "Must be your set to edit"}
            </Button>

            <Button
                variant={isDarkMode ? "outline-light" : "secondary"}
                onClick={() => setShowVocab(false)}
                style={{ marginTop: 0 }}
            >
                Back
            </Button>
        </>
    );

    return (
        <Card 
            body 
            className="mx-auto my-4" 
            style={{ 
                width: "100%", 
                maxWidth: "420px", 
                border: isDarkMode ? "1px solid #444" : "1px solid #dee2e6",
                padding: "1.5rem",
                ...cardStyle
            }}
            >
            <Stack gap={3}>
                {showVocab ? renderVocab() : renderMain()}
            </Stack>
        </Card>
    );
}
