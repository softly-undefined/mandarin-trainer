import { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Row, Stack } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import {
    ensureSetSlug,
    getPublicVocabSetsByUser,
    getPublicVocabSetsByUsername,
    getSetStarCount,
    isSetStarredByUser,
    setVocabSetStarred,
} from "../services/vocabSetService";
import { getUserProfileByHandle, sanitizeUsername } from "../services/userProfileService";
import { FaStar } from "react-icons/fa";
import UserAvatarButton from "./UserAvatarButton";

function getDisplayName(profile, fallbackUser, fallbackHandle) {
    return (
        profile?.username ||
        profile?.displayName ||
        fallbackUser?.username ||
        fallbackUser?.displayName ||
        fallbackUser?.email?.split('@')[0] ||
        `User ${fallbackHandle?.slice?.(0, 6) || ''}`
    );
}

function isSetOwnedByUser(set, uid) {
    if (!uid) return false;
    return set?.ownerId === uid || set?.userId === uid;
}

export default function ProfilePage({ profileHandle, onOpenSettings }) {
    const { currentUser, userProfile } = useAuth();
    const { isDarkMode } = useTheme();
    const [profile, setProfile] = useState(null);
    const [publicSets, setPublicSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profileImageFailed, setProfileImageFailed] = useState(false);
    const [activeStarSetIds, setActiveStarSetIds] = useState({});

    const [resolvedProfileUid, setResolvedProfileUid] = useState('');
    const isOwnProfile = Boolean(currentUser?.uid) && currentUser.uid === resolvedProfileUid;

    const fallbackUser = useMemo(() => {
        if (isOwnProfile) {
            return {
                username: userProfile?.username || '',
                displayName: userProfile?.displayName || currentUser?.displayName,
                email: currentUser?.email,
                photoURL: userProfile?.photoURL || currentUser?.photoURL || '',
            };
        }
        return null;
    }, [currentUser?.displayName, currentUser?.email, currentUser?.photoURL, isOwnProfile, userProfile?.displayName, userProfile?.photoURL, userProfile?.username]);

    useEffect(() => {
        let active = true;

        const load = async () => {
            if (!profileHandle) {
                setError('Invalid profile.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');
            setResolvedProfileUid('');

            try {
                const profileResult = await Promise.allSettled([
                    getUserProfileByHandle(profileHandle),
                ]);

                if (!active) return;

                const loadedProfile =
                    profileResult[0].status === 'fulfilled'
                        ? profileResult[0].value
                        : null;

                if (loadedProfile) {
                    setProfile(loadedProfile);
                    setResolvedProfileUid(loadedProfile.uid || '');
                } else {
                    if (profileResult[0].status === 'rejected') {
                        console.error("Error loading profile details:", profileResult[0].reason);
                    }
                    setProfile(null);
                }

                let sets = [];
                let setsError = null;

                if (loadedProfile?.uid) {
                    try {
                        sets = await getPublicVocabSetsByUser(loadedProfile.uid);
                    } catch (err) {
                        if (loadedProfile.username) {
                            try {
                                sets = await getPublicVocabSetsByUsername(loadedProfile.username);
                            } catch (fallbackErr) {
                                setsError = fallbackErr;
                            }
                        } else {
                            setsError = err;
                        }
                    }
                } else {
                    const [setsByUidResult, setsByUsernameResult] = await Promise.allSettled([
                        getPublicVocabSetsByUser(profileHandle),
                        getPublicVocabSetsByUsername(profileHandle),
                    ]);

                    if (setsByUidResult.status === 'fulfilled' && setsByUidResult.value?.length) {
                        sets = setsByUidResult.value;
                    } else if (setsByUsernameResult.status === 'fulfilled') {
                        sets = setsByUsernameResult.value || [];
                    }

                    if (setsByUidResult.status === 'rejected' && setsByUsernameResult.status === 'rejected') {
                        setsError = setsByUidResult.reason || setsByUsernameResult.reason;
                    }
                }

                setPublicSets(sets || []);

                if (!loadedProfile && sets.length > 0) {
                    const firstSet = sets[0];
                    setProfile({
                        uid: firstSet.ownerId || firstSet.userId || '',
                        username: firstSet.ownerUsername || sanitizeUsername(profileHandle),
                        displayName: firstSet.ownerDisplayName || '',
                        photoURL: firstSet.ownerPhotoURL || '',
                    });
                    setResolvedProfileUid(firstSet.ownerId || firstSet.userId || '');
                } else if (loadedProfile && sets.length > 0) {
                    const firstSet = sets[0];
                    const mergedProfile = {
                        ...loadedProfile,
                        username: loadedProfile.username || firstSet.ownerUsername || sanitizeUsername(profileHandle),
                        displayName: loadedProfile.displayName || firstSet.ownerDisplayName || '',
                        photoURL: loadedProfile.photoURL || firstSet.ownerPhotoURL || '',
                    };
                    setProfile(mergedProfile);
                }

                if (setsError) {
                    console.error("Error loading public profile sets:", setsError);
                    setError('Unable to load this profile right now.');
                } else {
                    setError('');
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        load();
        return () => {
            active = false;
        };
    }, [profileHandle]);

    const profileName = getDisplayName(profile, fallbackUser, profileHandle);
    const showAsUsername = Boolean(profile?.username || fallbackUser?.username);
    const profileTitle = showAsUsername ? `@${profileName}` : profileName;
    const profilePhoto = profile?.photoURL || fallbackUser?.photoURL || '';
    const showProfileImage = Boolean(profilePhoto) && !profileImageFailed;

    useEffect(() => {
        setProfileImageFailed(false);
    }, [profilePhoto, profileHandle]);

    const handleOpenSet = async (set) => {
        try {
            let slug = set.slug;
            if (!slug && isOwnProfile) {
                slug = await ensureSetSlug(set.id);
                setPublicSets((prev) => prev.map((s) => (s.id === set.id ? { ...s, slug } : s)));
            }

            if (!slug) {
                alert("This set does not have a share link yet.");
                return;
            }

            const base = process.env.PUBLIC_URL || "";
            window.location.assign(`${base}/set/${slug}`);
        } catch (err) {
            console.error("Error opening profile set:", err);
            alert("Unable to open this set right now.");
        }
    };

    const handleCopyLink = async (set) => {
        try {
            let slug = set.slug;
            if (!slug && isOwnProfile) {
                slug = await ensureSetSlug(set.id);
                setPublicSets((prev) => prev.map((s) => (s.id === set.id ? { ...s, slug } : s)));
            }
            if (!slug) {
                alert("This set does not have a share link yet.");
                return;
            }
            const basePath = process.env.PUBLIC_URL || '';
            const url = `${window.location.origin}${basePath}/set/${slug}`;
            await navigator.clipboard.writeText(url);
            alert("Share link copied to clipboard");
        } catch (error) {
            console.error("Error copying profile set link:", error);
            alert("Unable to copy link right now.");
        }
    };

    const goHome = () => {
        const base = process.env.PUBLIC_URL || "";
        window.location.assign(`${base}/`);
    };

    const handleToggleStar = async (set) => {
        if (!currentUser?.uid) {
            return;
        }

        if (isSetOwnedByUser(set, currentUser.uid)) {
            return;
        }

        const currentlyStarred = isSetStarredByUser(set, currentUser.uid);
        setActiveStarSetIds((prev) => ({ ...prev, [set.id]: true }));

        try {
            const updatedSet = await setVocabSetStarred(set.id, currentUser.uid, !currentlyStarred);
            setPublicSets((prev) =>
                prev.map((item) => (item.id === updatedSet.id ? updatedSet : item))
            );
        } catch (toggleError) {
            console.error("Error toggling profile star:", toggleError);
            if (toggleError?.code === 'permission-denied') {
                alert("Unable to star due Firebase permissions. Please check Firestore rules for star writes.");
            } else {
                alert("Unable to update star right now.");
            }
        } finally {
            setActiveStarSetIds((prev) => {
                const next = { ...prev };
                delete next[set.id];
                return next;
            });
        }
    };

    if (loading) {
        return <div style={{ marginTop: "2rem", textAlign: "center" }}>Loading profile...</div>;
    }

    return (
        <Container className="py-4" style={{ overflowY: "auto", maxHeight: "100vh" }}>
            <Row className="mb-4" style={{ alignItems: "center" }}>
                <Col>
                    <Stack direction="horizontal" gap={3} style={{ alignItems: "center" }}>
                        {showProfileImage ? (
                            <img
                                src={profilePhoto}
                                alt={`${profileName} avatar`}
                                onError={() => setProfileImageFailed(true)}
                                style={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: isDarkMode ? "2px solid #666" : "2px solid #ced4da",
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: "1.8rem",
                                    border: isDarkMode ? "2px solid #666" : "2px solid #ced4da",
                                    backgroundColor: isDarkMode ? "#2f3338" : "#f1f3f5",
                                    color: isDarkMode ? "#fff" : "#212529",
                                }}
                            >
                                {profileName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h2 style={{ marginBottom: 0 }}>{profileTitle}</h2>
                            {profile?.displayName && profile?.displayName !== profileName && (
                                <div style={{ color: isDarkMode ? "#b8bec4" : "#6c757d" }}>
                                    {profile.displayName}
                                </div>
                            )}
                            <div style={{ color: isDarkMode ? "#b8bec4" : "#6c757d" }}>
                                {isOwnProfile ? "Your Public Sets" : "Public Sets"}
                            </div>
                        </div>
                    </Stack>
                </Col>
                <Col xs="auto">
                    <Stack direction="horizontal" gap={3} style={{ alignItems: "center" }}>
                        <Button
                            variant={isDarkMode ? "outline-light" : "outline-secondary"}
                            onClick={goHome}
                        >
                            Home
                        </Button>
                        {currentUser && (
                            <UserAvatarButton
                                onClick={onOpenSettings}
                                title="Settings"
                            />
                        )}
                    </Stack>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            <div className="mb-3">
                <Badge bg={isDarkMode ? "light" : "secondary"} text={isDarkMode ? "dark" : "light"}>
                    {publicSets.length} public set{publicSets.length === 1 ? "" : "s"}
                </Badge>
            </div>

            {publicSets.length === 0 && !error && (
                <Alert variant={isDarkMode ? "secondary" : "light"}>
                    {isOwnProfile
                        ? "You have no public sets yet. Edit a set and enable Public set to show it here."
                        : "No public sets to show yet."}
                </Alert>
            )}

            <Row xs={1} md={2} lg={3} className="g-4">
                {publicSets.map((set) => (
                    <Col key={set.id}>
                        <Card
                            style={{
                                backgroundColor: isDarkMode ? "#2d2d2d" : "#FFF2DC",
                                borderColor: isDarkMode ? "#404040" : "#dee2e6",
                            }}
                        >
                            <Card.Body style={{ position: "relative", paddingRight: "3.35rem" }}>
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => handleToggleStar(set)}
                                    disabled={!currentUser || isSetOwnedByUser(set, currentUser.uid) || Boolean(activeStarSetIds[set.id])}
                                    style={{
                                        position: "absolute",
                                        top: "0.75rem",
                                        right: "0.9rem",
                                        padding: 0,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        color: isSetStarredByUser(set, currentUser?.uid) ? "#DB6C46" : "#9aa0a6",
                                        textDecoration: "none",
                                    }}
                                    title={
                                        isSetOwnedByUser(set, currentUser?.uid)
                                            ? "Creators are always starred"
                                            : currentUser
                                                ? "Toggle star"
                                                : "Sign in to star sets"
                                    }
                                >
                                    <FaStar size={18} />
                                    <span style={{ color: isDarkMode ? "#fff" : "#000" }}>{getSetStarCount(set)}</span>
                                </Button>

                                <Card.Title style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
                                    {set.setName}
                                </Card.Title>
                                <Card.Text style={{ color: isDarkMode ? "#cccccc" : "#6c757d" }}>
                                    {set.vocabItems?.length || 0} items
                                </Card.Text>
                                <Stack direction="horizontal" gap={2}>
                                    <Button
                                        variant={isDarkMode ? "outline-success" : "success"}
                                        onClick={() => handleOpenSet(set)}
                                    >
                                        Learn
                                    </Button>
                                    <Button
                                        variant={isDarkMode ? "outline-info" : "info"}
                                        onClick={() => handleCopyLink(set)}
                                    >
                                        Share
                                    </Button>
                                </Stack>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}
