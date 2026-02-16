import { useEffect, useRef, useState } from "react";
import { Button, Card, Stack, Form } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useScript } from "../contexts/ScriptContext";
import { usePinyin } from "../contexts/PinyinContext";
import {
    getProfileHandle,
    getUsernameValidationMessage,
    sanitizeUsername,
} from "../services/userProfileService";

export default function Settings(props) {
    const { onBack, goToPage } = props;
    const {
        currentUser,
        userProfile,
        logout,
        saveProfilePhoto,
        saveUsername,
    } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { isTraditional, toggleScript, showAltScript, toggleAltScript } = useScript();
    const { easyTypePinyin, toggleEasyTypePinyin } = usePinyin();
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [photoMessage, setPhotoMessage] = useState('');
    const [photoError, setPhotoError] = useState('');
    const [profileShareMessage, setProfileShareMessage] = useState('');
    const [usernameDraft, setUsernameDraft] = useState('');
    const [usernameMessage, setUsernameMessage] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [isSavingUsername, setIsSavingUsername] = useState(false);
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const fileInputRef = useRef(null);

    const avatarUrl = userProfile?.photoURL || currentUser?.photoURL || '';
    const [avatarImageFailed, setAvatarImageFailed] = useState(false);
    const profileLabel = userProfile?.displayName || currentUser?.displayName || currentUser?.email || '?';
    const showAvatarImage = Boolean(avatarUrl) && !avatarImageFailed;

    useEffect(() => {
        setAvatarImageFailed(false);
    }, [avatarUrl, currentUser?.uid]);

    useEffect(() => {
        if (!isEditingUsername) {
            setUsernameDraft(userProfile?.username || '');
        }
    }, [userProfile?.username, currentUser?.uid, isEditingUsername]);

    const handleLogout = async () => {
        try {
            await logout();
            // The AuthContext will automatically redirect to SignIn
        } catch (error) {
            console.error("Failed to log out:", error);
        }
    };

    const handleChoosePhotoClick = () => {
        if (!currentUser) return;
        setProfileShareMessage('');
        fileInputRef.current?.click();
    };

    const handlePhotoFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setPhotoError('');
        setPhotoMessage('');
        setProfileShareMessage('');

        if (!file.type.startsWith('image/')) {
            setPhotoError('Please choose an image file.');
            event.target.value = '';
            return;
        }

        const maxSizeBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            setPhotoError('Image must be 5MB or smaller.');
            event.target.value = '';
            return;
        }

        try {
            setIsUploadingPhoto(true);
            await saveProfilePhoto(file);
            setPhotoMessage('Profile photo updated.');
        } catch (error) {
            console.error("Failed to upload profile photo:", error);
            setPhotoError('Failed to update photo. Please try again.');
        } finally {
            setIsUploadingPhoto(false);
            event.target.value = '';
        }
    };

    const handleOpenProfile = () => {
        if (!currentUser?.uid) return;
        setProfileShareMessage('');
        setUsernameMessage('');
        setUsernameError('');
        const handle = getProfileHandle(userProfile, currentUser.uid);
        const base = process.env.PUBLIC_URL || "";
        window.location.assign(`${base}/u/${handle}`);
    };

    const handleShareProfile = async () => {
        if (!currentUser?.uid) return;

        try {
            setProfileShareMessage('');
            setUsernameMessage('');
            setUsernameError('');
            const handle = getProfileHandle(userProfile, currentUser.uid);
            const basePath = process.env.PUBLIC_URL || '';
            const url = `${window.location.origin}${basePath}/u/${handle}`;
            await navigator.clipboard.writeText(url);
            setProfileShareMessage('Profile link copied to clipboard.');
        } catch (error) {
            console.error("Failed to copy profile link:", error);
            setProfileShareMessage('Unable to copy profile link right now.');
        }
    };

    const handleSaveUsername = async () => {
        if (!currentUser?.uid) return;

        const normalized = sanitizeUsername(usernameDraft);
        const validationError = getUsernameValidationMessage(normalized);
        setUsernameMessage('');
        setUsernameError('');
        setProfileShareMessage('');

        if (validationError) {
            setUsernameError(validationError);
            return;
        }

        try {
            setIsSavingUsername(true);
            const savedUsername = await saveUsername(normalized);
            setUsernameDraft(savedUsername);
            setIsEditingUsername(false);
            setUsernameMessage(`Username updated to @${savedUsername}.`);
        } catch (error) {
            console.error("Failed to update username:", error);
            if (error?.code === 'username-taken') {
                setUsernameError('That username is already taken.');
            } else if (error?.code === 'invalid-username') {
                setUsernameError(error.message || 'Invalid username.');
            } else {
                setUsernameError('Unable to update username right now.');
            }
        } finally {
            setIsSavingUsername(false);
        }
    };

    const handleStartUsernameEdit = () => {
        setUsernameDraft(userProfile?.username || '');
        setUsernameMessage('');
        setUsernameError('');
        setProfileShareMessage('');
        setIsEditingUsername(true);
    };

    const handleCancelUsernameEdit = () => {
        setUsernameDraft(userProfile?.username || '');
        setUsernameMessage('');
        setUsernameError('');
        setIsEditingUsername(false);
    };

    const cardStyle = isDarkMode
        ? { backgroundColor: "#23272b", color: "#fff", borderColor: "#444" }
        : { backgroundColor: "#FFF2DC", borderColor: "#e7dccb" };
    const infoBoxStyle = isDarkMode
        ? { padding: "10px", backgroundColor: "#181a1b", borderRadius: "5px", textAlign: "center", color: "#fff" }
        : { padding: "10px", backgroundColor: "#FFF2DC", borderRadius: "5px", textAlign: "center", border: "1px solid #e7dccb" };
    const profileButtonVariant = isDarkMode ? "outline-light" : "primary";
    const toggleHelpStyle = {
        fontSize: "0.85rem",
        marginTop: "0.2rem",
        marginBottom: "0.5rem",
        color: isDarkMode ? "#b8bec4" : "#6c757d",
    };

    return (
        <Card style={{ width: "400px", maxHeight: "90%", ...cardStyle }}>
            <Card.Body style={{ height: "100%", overflow: "hidden" }}>
                <Stack
                    direction='horizontal'
                    style={{
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "5px",
                    }}
                >
                    <Card.Title style={{ color: isDarkMode ? "#fff" : undefined }}>Settings</Card.Title>
                    <Button
                        variant={isDarkMode ? "outline-light" : "outline-secondary"}
                        onClick={() => {
                            if (onBack) {
                                onBack();
                            } else if (goToPage) {
                                goToPage("home");
                            } else {
                                window.history.back();
                            }
                        }}
                    >
                        Back
                    </Button>
                </Stack>

                <Stack gap={3} style={{ marginTop: "20px" }}>
                    <div style={infoBoxStyle}>
                        <div style={{ fontSize: "0.9rem", color: isDarkMode ? "#b0b0b0" : "#6c757d" }}>
                            {currentUser ? "Logged in as" : "Not logged in"}
                        </div>
                        <div style={{ 
                            fontSize: "1.1rem", 
                            fontWeight: "500",
                            wordBreak: "break-all",
                            color: isDarkMode ? "#fff" : undefined
                        }}>
                            {currentUser ? currentUser.email : "Sign in to save and edit sets"}
                        </div>
                        {currentUser && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    marginTop: '0.9rem',
                                }}
                            >
                            {showAvatarImage ? (
                                <img
                                    src={avatarUrl}
                                    alt="Profile"
                                    onError={() => setAvatarImageFailed(true)}
                                    style={{
                                        width: 88,
                                        height: 88,
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: isDarkMode ? '2px solid #666' : '2px solid #ced4da',
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: 88,
                                        height: 88,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: isDarkMode ? '2px solid #666' : '2px solid #ced4da',
                                        backgroundColor: isDarkMode ? '#2f3338' : '#f1f3f5',
                                        color: isDarkMode ? '#fff' : '#212529',
                                        fontWeight: 700,
                                        fontSize: '2rem',
                                    }}
                                >
                                    {profileLabel.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handlePhotoFileChange}
                            />

                            <Stack direction="horizontal" gap={2} style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Button
                                    size="sm"
                                    variant={profileButtonVariant}
                                    onClick={handleChoosePhotoClick}
                                    disabled={isUploadingPhoto}
                                >
                                    {isUploadingPhoto ? "Uploading..." : "Change Picture"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant={profileButtonVariant}
                                    onClick={handleOpenProfile}
                                >
                                    My Public Profile
                                </Button>
                                <Button
                                    size="sm"
                                    variant={profileButtonVariant}
                                    onClick={handleShareProfile}
                                >
                                    Share Profile
                                </Button>
                            </Stack>

                            <div style={{ width: "100%", maxWidth: "320px" }}>
                                {!isEditingUsername ? (
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.45rem" }}>
                                            @{userProfile?.username || usernameDraft || "user"}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={profileButtonVariant}
                                            onClick={handleStartUsernameEdit}
                                            disabled={!currentUser}
                                        >
                                            Change Username
                                        </Button>
                                    </div>
                                ) : (
                                    <Stack direction="horizontal" gap={2}>
                                        <Form.Control
                                            type="text"
                                            value={usernameDraft}
                                            placeholder="username"
                                            onChange={(e) => {
                                                setUsernameDraft(e.target.value);
                                                setUsernameMessage('');
                                                setUsernameError('');
                                            }}
                                            disabled={isSavingUsername}
                                        />
                                        <Button
                                            size="sm"
                                            variant={profileButtonVariant}
                                            onClick={handleSaveUsername}
                                            disabled={isSavingUsername || !currentUser}
                                        >
                                            {isSavingUsername ? "Saving..." : "Save"}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={isDarkMode ? "outline-light" : "secondary"}
                                            onClick={handleCancelUsernameEdit}
                                            disabled={isSavingUsername}
                                        >
                                            Cancel
                                        </Button>
                                    </Stack>
                                )}
                            </div>

                            {photoMessage && (
                                <div style={{ color: isDarkMode ? "#9de7b2" : "#198754", fontSize: "0.9rem", textAlign: "center" }}>
                                    {photoMessage}
                                </div>
                            )}
                            {photoError && (
                                <div style={{ color: isDarkMode ? "#ff9da1" : "#dc3545", fontSize: "0.9rem", textAlign: "center" }}>
                                    {photoError}
                                </div>
                            )}
                            {profileShareMessage && (
                                <div style={{ color: isDarkMode ? "#b8d8ff" : "#0d6efd", fontSize: "0.9rem", textAlign: "center" }}>
                                    {profileShareMessage}
                                </div>
                            )}
                            {usernameMessage && (
                                <div style={{ color: isDarkMode ? "#9de7b2" : "#198754", fontSize: "0.9rem", textAlign: "center" }}>
                                    {usernameMessage}
                                </div>
                            )}
                            {usernameError && (
                                <div style={{ color: isDarkMode ? "#ff9da1" : "#dc3545", fontSize: "0.9rem", textAlign: "center" }}>
                                    {usernameError}
                                </div>
                            )}
                            </div>
                        )}
                    </div>

                    <Form>
                        <Form.Check
                            type="switch"
                            id="dark-mode-switch"
                            label="Dark Mode"
                            checked={isDarkMode}
                            onChange={toggleDarkMode}
                            style={{ fontSize: "1.1rem", color: isDarkMode ? "#fff" : undefined }}
                        />
                        <div style={toggleHelpStyle}>
                            Uses a darker color theme that is easier on the eyes in low light.
                        </div>
                        <Form.Check
                            type="switch"
                            id="traditional-switch"
                            label="Traditional Chinese"
                            checked={isTraditional}
                            onChange={toggleScript}
                            style={{ fontSize: "1.1rem", color: isDarkMode ? "#fff" : undefined }}
                        />
                        <div style={toggleHelpStyle}>
                            Shows traditional characters as your main writing system.
                        </div>
                        <Form.Check
                            type="switch"
                            id="alt-script-switch"
                            label="Show Alternative Script"
                            checked={showAltScript}
                            onChange={toggleAltScript}
                            style={{ fontSize: "1.1rem", color: isDarkMode ? "#fff" : undefined }}
                        />
                        <div style={toggleHelpStyle}>
                            Displays the other script version beside each character when available.
                        </div>
                        <Form.Check
                            type="switch"
                            id="easytype-pinyin-switch"
                            label="easyType PINYIN"
                            checked={easyTypePinyin}
                            onChange={toggleEasyTypePinyin}
                            style={{ fontSize: "1.1rem", color: isDarkMode ? "#fff" : undefined }}
                        />
                        <div style={{ ...toggleHelpStyle, marginBottom: 0 }}>
                            Uses numbered pinyin (for example, han4 yu3) instead of tone marks.
                        </div>
                    </Form>

                    {currentUser ? (
                        <Button 
                            variant="danger" 
                            onClick={handleLogout}
                            style={{ marginTop: "10px" }}
                        >
                            Log Out
                        </Button>
                    ) : (
                        <Button
                            variant={isDarkMode ? "light" : "primary"}
                            style={{ marginTop: "10px" }}
                            onClick={() => {
                                const base = process.env.PUBLIC_URL || "";
                                if (goToPage) {
                                    goToPage("home");
                                } else {
                                    window.location.assign(`${base}/`);
                                }
                            }}
                        >
                            Log In
                        </Button>
                    )}
                </Stack>
            </Card.Body>
        </Card>
    );
}
