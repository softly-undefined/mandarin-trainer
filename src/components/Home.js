import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button, Card, Container, Row, Col, Stack, Badge } from "react-bootstrap";
import {
    ensureSetSlug,
    getSetStarCount,
    getStarredVocabSetsForUser,
    getUserVocabSets,
    isSetStarredByUser,
    setVocabSetStarred,
} from "../services/vocabSetService";
import { getUserProfilesByIds } from "../services/userProfileService";
import VocabSetEditor from "./VocabSetEditor";
import { useTheme } from "../contexts/ThemeContext";
import UserAvatarButton from "./UserAvatarButton";
import { FaStar } from "react-icons/fa";

function isSetOwnedByUser(set, uid) {
    if (!uid) return false;
    return set?.ownerId === uid || set?.userId === uid;
}

export default function Home(props) {
    const {
        goToPage,
    } = props;

    const { currentUser } = useAuth();
    const { isDarkMode } = useTheme();

    const [sets, setSets] = useState([]);
    const [starredSets, setStarredSets] = useState([]);
    const [creatorProfiles, setCreatorProfiles] = useState({});
    const [loading, setLoading] = useState(true);
    const [editingSet, setEditingSet] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [handledEditQuery, setHandledEditQuery] = useState(false);
    const [activeStarSetIds, setActiveStarSetIds] = useState({});

    const loadSets = async () => {
        if (!currentUser?.uid) return;

        try {
            const [userSets, allStarred] = await Promise.all([
                getUserVocabSets(currentUser.uid),
                getStarredVocabSetsForUser(currentUser.uid),
            ]);

            const starredFromOthers = allStarred.filter((set) => !isSetOwnedByUser(set, currentUser.uid));

            setSets(userSets);
            setStarredSets(starredFromOthers);

            const ownerIds = Array.from(
                new Set(
                    starredFromOthers
                        .map((set) => set.ownerId || set.userId)
                        .filter((uid) => uid && uid !== currentUser.uid)
                )
            );

            if (ownerIds.length > 0) {
                const profiles = await getUserProfilesByIds(ownerIds);
                setCreatorProfiles(profiles);
            } else {
                setCreatorProfiles({});
            }
        } catch (error) {
            console.error("Error loading sets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            loadSets();
        }
    }, [currentUser]);

    useEffect(() => {
        if (loading || handledEditQuery) {
            return;
        }

        const url = new URL(window.location.href);
        const editSetId = url.searchParams.get("editSet");
        if (!editSetId) {
            setHandledEditQuery(true);
            return;
        }

        const matchingSet = sets.find((s) => s.id === editSetId);
        if (matchingSet) {
            setEditingSet(matchingSet);
        }

        url.searchParams.delete("editSet");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        setHandledEditQuery(true);
    }, [loading, handledEditQuery, sets]);

    const handleStartLearning = async (set) => {
        try {
            let slug = set.slug;
            const isOwner = isSetOwnedByUser(set, currentUser?.uid);

            if (!slug) {
                if (!isOwner) {
                    alert("This set is missing a share link right now.");
                    return;
                }
                slug = await ensureSetSlug(set.id);
                await loadSets();
            }
            const base = process.env.PUBLIC_URL || "";
            window.location.assign(`${base}/set/${slug}`);
        } catch (error) {
            console.error("Error starting learning:", error);
        }
    };

    const handleBack = () => {
        setEditingSet(null);
        setIsCreating(false);
    };

    const handleSetUpdated = async () => {
        await loadSets();
    };

    const handleCopyLink = async (set) => {
        if (set?.isPublic === false) {
            alert("Private sets cannot be shared. Set it to Public in the editor to share.");
            return;
        }

        try {
            let slug = set.slug;
            const isOwner = isSetOwnedByUser(set, currentUser?.uid);

            if (!slug) {
                if (!isOwner) {
                    alert("This set is missing a share link right now.");
                    return;
                }
                slug = await ensureSetSlug(set.id);
                await loadSets();
            }
            const basePath = process.env.PUBLIC_URL || '';
            const url = `${window.location.origin}${basePath}/set/${slug}`;
            await navigator.clipboard.writeText(url);
            alert("Share link copied to clipboard");
        } catch (error) {
            console.error("Error copying link:", error);
            alert("Unable to copy link right now.");
        }
    };

    const ownPublicSets = useMemo(
        () => sets.filter((set) => set.isPublic !== false),
        [sets]
    );

    const ownPrivateSets = useMemo(
        () => sets.filter((set) => set.isPublic === false),
        [sets]
    );

    const handleToggleStar = async (set) => {
        if (!currentUser?.uid) {
            return;
        }

        const ownerId = set.userId || set.ownerId;
        if (isSetOwnedByUser(set, currentUser.uid)) {
            return;
        }

        const currentlyStarred = isSetStarredByUser(set, currentUser.uid);
        setActiveStarSetIds((prev) => ({ ...prev, [set.id]: true }));

        try {
            const updatedSet = await setVocabSetStarred(set.id, currentUser.uid, !currentlyStarred);

            setSets((prev) =>
                prev.map((item) => (item.id === updatedSet.id ? updatedSet : item))
            );

            const nowStarred = isSetStarredByUser(updatedSet, currentUser.uid);
            setStarredSets((prev) => {
                const exists = prev.some((item) => item.id === updatedSet.id);
                if (!nowStarred) {
                    return prev.filter((item) => item.id !== updatedSet.id);
                }
                if (exists) {
                    return prev.map((item) => (item.id === updatedSet.id ? updatedSet : item));
                }
                return [updatedSet, ...prev];
            });

            if (!creatorProfiles[ownerId]) {
                const fetched = await getUserProfilesByIds([ownerId]);
                setCreatorProfiles((prev) => ({ ...prev, ...fetched }));
            }
        } catch (error) {
            console.error("Error toggling star:", error);
            if (error?.code === 'permission-denied') {
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

    const renderSetCard = (set, context) => {
        const ownerId = set.userId || set.ownerId;
        const isOwner = isSetOwnedByUser(set, currentUser?.uid);
        const isStarred = isSetStarredByUser(set, currentUser?.uid);
        const starCount = getSetStarCount(set);
        const isStarBusy = Boolean(activeStarSetIds[set.id]);
        const creatorName =
            creatorProfiles[ownerId]?.username ||
            creatorProfiles[ownerId]?.displayName ||
            set.ownerUsername ||
            set.ownerDisplayName ||
            "Unknown creator";
        const showCreator = !isOwner && context !== 'ownPublic' && context !== 'ownPrivate';

        return (
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
                            disabled={isOwner || isStarBusy}
                            style={{
                                position: "absolute",
                                top: "0.75rem",
                                right: "0.9rem",
                                padding: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                color: isStarred ? "#DB6C46" : "#9aa0a6",
                                textDecoration: "none",
                            }}
                            title={isOwner ? "Creators are always starred" : "Toggle star"}
                        >
                            <FaStar size={18} />
                            <span style={{ color: isDarkMode ? "#fff" : "#000" }}>{starCount}</span>
                        </Button>

                        <Card.Title style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
                            {set.setName}
                        </Card.Title>
                        <Card.Text style={{ color: isDarkMode ? "#cccccc" : "#6c757d" }}>
                            {set.vocabItems?.length || 0} items
                        </Card.Text>

                        {showCreator && (
                            <Card.Text style={{ color: isDarkMode ? "#b8bec4" : "#6c757d", marginBottom: "0.5rem" }}>
                                by {creatorName}
                            </Card.Text>
                        )}

                        <Stack direction="horizontal" gap={2} style={{ marginBottom: "0.75rem", alignItems: "center" }}>
                            <Badge bg={set.isPublic === false ? "secondary" : "success"}>
                                {set.isPublic === false ? "Private" : "Public"}
                            </Badge>
                        </Stack>

                        <Stack direction="horizontal" gap={2}>
                            {isOwner && (
                                <Button
                                    variant={isDarkMode ? "outline-light" : "primary"}
                                    onClick={() => setEditingSet(set)}
                                >
                                    Edit
                                </Button>
                            )}
                            <Button
                                variant={isDarkMode ? "outline-success" : "success"}
                                onClick={() => handleStartLearning(set)}
                            >
                                Learn
                            </Button>
                            <Button
                                variant={isDarkMode ? "outline-info" : "info"}
                                disabled={set.isPublic === false}
                                onClick={() => handleCopyLink(set)}
                            >
                                Share
                            </Button>
                        </Stack>
                    </Card.Body>
                </Card>
            </Col>
        );
    };

    const renderSetSection = (title, setList, context, emptyMessage) => (
        <section style={{ marginTop: "1.25rem" }}>
            <h4 style={{ marginBottom: "0.75rem" }}>{title}</h4>
            {setList.length === 0 ? (
                <div style={{ color: isDarkMode ? "#b8bec4" : "#6c757d", marginBottom: "1rem" }}>
                    {emptyMessage}
                </div>
            ) : (
                <Row xs={1} md={2} lg={3} className="g-4">
                    {setList.map((set) => renderSetCard(set, context))}
                </Row>
            )}
        </section>
    );

    if (loading) return <div>Loading...</div>;

    if (editingSet || isCreating) {
        return (
            <VocabSetEditor 
                set={editingSet} 
                goToPage={handleBack}
                onSetUpdated={handleSetUpdated}
            />
        );
    }

    return (
        <Container className="py-4" style={{ overflowY: "auto", maxHeight: "100vh" }}>
            <Row className="mb-4" style={{ alignItems: "center" }}>
                <Col>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={process.env.PUBLIC_URL + '/roundedfinallogo.png'} alt="Mandarin Trainer Logo" style={{ height: 32, width: 32 }} />
                        <h2>Mandarin Trainer</h2>
                    </div>
                </Col>
                <Col xs="auto">
                    <Stack direction="horizontal" gap={4}>
                        <Button 
                            variant={isDarkMode ? "outline-light" : "secondary"} 
                            onClick={() => setIsCreating(true)}
                        >
                            Create New Set
                        </Button>
                        <UserAvatarButton onClick={() => goToPage("settings")} title="Settings" />
                    </Stack>
                </Col>
            </Row>

            {renderSetSection("My Public Sets", ownPublicSets, "ownPublic", "No public sets yet.")}
            {renderSetSection("My Private Sets", ownPrivateSets, "ownPrivate", "No private sets yet.")}
            {renderSetSection("Starred Sets", starredSets, "starred", "Star sets to have them appear here.")}
        </Container>
    );
}
