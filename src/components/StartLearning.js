import { Button, ButtonGroup, ToggleButton, Card, Stack, Form, Alert } from "react-bootstrap";
import { useTheme } from "../contexts/ThemeContext";
import { useScript } from "../contexts/ScriptContext";
import { usePinyin } from "../contexts/PinyinContext";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getProfileHandle, getUserProfileById } from "../services/userProfileService";
import { FaStar } from "react-icons/fa";
import { getSetStarCount, isSetStarredByUser, setVocabSetStarred } from "../services/vocabSetService";
import UserAvatarButton from "./UserAvatarButton";

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
    const [ownerProfile, setOwnerProfile] = useState(null);
    const [starCount, setStarCount] = useState(0);
    const [isStarred, setIsStarred] = useState(false);
    const [isStarLoading, setIsStarLoading] = useState(false);
    const answerTypes = [
        { name: "Pinyin", value: "pinyin" },
        { name: "Character", value: "character" },
        { name: "Definition", value: "definition" },
    ];
    const ownerUid = set?.ownerId || set?.userId || null;

    // Set default values if not already set
    useEffect(() => {
        if (!given) setGiven("definition");
        if (!want) setWant("character");
    }, []);

    useEffect(() => {
        let active = true;

        const loadOwnerProfile = async () => {
            if (!ownerUid) {
                setOwnerProfile(null);
                return;
            }

            try {
                const profile = await getUserProfileById(ownerUid);
                if (active) {
                    if (profile) {
                        setOwnerProfile(profile);
                    } else {
                        setOwnerProfile({
                            uid: ownerUid,
                            username: set?.ownerUsername || '',
                            displayName: set?.ownerDisplayName || '',
                            photoURL: set?.ownerPhotoURL || '',
                        });
                    }
                }
            } catch (error) {
                console.error("Error loading set owner profile:", error);
                if (active) {
                    setOwnerProfile({
                        uid: ownerUid,
                        username: set?.ownerUsername || '',
                        displayName: set?.ownerDisplayName || '',
                        photoURL: set?.ownerPhotoURL || '',
                    });
                }
            }
        };

        loadOwnerProfile();
        return () => {
            active = false;
        };
    }, [ownerUid, set?.ownerDisplayName, set?.ownerPhotoURL, set?.ownerUsername]);

    const MIN_WORDS_REQUIRED = 5;
    const hasEnoughWords = set?.vocabItems?.length >= MIN_WORDS_REQUIRED;
    const isOwner = Boolean(currentUser?.uid) && (set?.ownerId === currentUser.uid || set?.userId === currentUser.uid);
    const ownerName =
        ownerProfile?.username ||
        ownerProfile?.displayName ||
        set?.ownerUsername ||
        set?.ownerDisplayName ||
        (isOwner ? "You" : "Set creator");
    const canToggleStar = Boolean(currentUser?.uid) && !isOwner;

    useEffect(() => {
        if (!set) {
            setStarCount(0);
            setIsStarred(false);
            return;
        }

        setStarCount(getSetStarCount(set));
        setIsStarred(isSetStarredByUser(set, currentUser?.uid));
    }, [set, currentUser?.uid]);

    const cardStyle = isDarkMode
        ? { backgroundColor: "#23272b", color: "#fff", borderColor: "#444" }
        : { backgroundColor: "#FFF2DC", borderColor: "#e7dccb" };
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

    const handleOpenOwnerProfile = () => {
        if (!ownerUid) return;
        const ownerHandle = getProfileHandle(ownerProfile, ownerUid);
        const base = process.env.PUBLIC_URL || "";
        window.location.assign(`${base}/u/${ownerHandle}`);
    };

    const handleToggleStar = async () => {
        if (!set?.id || !currentUser?.uid || !canToggleStar) {
            return;
        }

        try {
            setIsStarLoading(true);
            const updated = await setVocabSetStarred(set.id, currentUser.uid, !isStarred);
            setStarCount(getSetStarCount(updated));
            setIsStarred(isSetStarredByUser(updated, currentUser.uid));
        } catch (error) {
            console.error("Error toggling set star:", error);
            if (error?.code === 'permission-denied') {
                alert("Unable to star due Firebase permissions. Please check Firestore rules for star writes.");
            } else {
                alert("Unable to update star right now.");
            }
        } finally {
            setIsStarLoading(false);
        }
    };

    const renderHeader = () => (
        <div style={{ position: "relative", paddingRight: "2rem", paddingLeft: "2.75rem" }}>
            <Button
                variant="link"
                size="sm"
                onClick={handleToggleStar}
                disabled={!canToggleStar || isStarLoading}
                style={{
                    position: "absolute",
                    top: "-4px",
                    left: 0,
                    padding: 0,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: isStarred ? "#DB6C46" : "#9aa0a6",
                    textDecoration: "none",
                }}
                title={
                    isOwner
                        ? "Creators are automatically starred"
                        : currentUser
                            ? "Toggle star"
                            : "Sign in to star sets"
                }
            >
                <FaStar size={18} />
                <span style={{ color: isDarkMode ? "#fff" : "#000", fontWeight: 600 }}>{starCount}</span>
            </Button>

            {showSettingsShortcut && (
                <div
                    style={{
                        position: "absolute",
                        top: "-4px",
                        right: 0,
                    }}
                >
                    <UserAvatarButton
                        size={32}
                        title="Settings"
                        onClick={(e) => {
                            if (e?.preventDefault) e.preventDefault();
                            if (e?.stopPropagation) e.stopPropagation();
                            if (goToPage) {
                                goToPage("settings");
                            }
                        }}
                    />
                </div>
            )}
            <div style={{ textAlign: "center" }}>
                <h5 style={{ marginBottom: "0.25rem", ...headerStyle, wordBreak: "break-word" }}>
                    {set.setName}
                </h5>
                {ownerUid && (
                    <Button
                        variant="link"
                        size="sm"
                        onClick={handleOpenOwnerProfile}
                        style={{
                            padding: 0,
                            marginBottom: "0.25rem",
                            color: isDarkMode ? "#9ec5fe" : "#0d6efd",
                            textDecoration: "underline",
                        }}
                    >
                        by {ownerName}
                    </Button>
                )}
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
                    backgroundColor: isDarkMode ? "#181a1b" : "#FFF2DC",
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
