import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button, Card, Container, Row, Col, Stack } from "react-bootstrap";
import { getUserVocabSets, ensureSetSlug } from "../services/vocabSetService";
import VocabSetEditor from "./VocabSetEditor";
import { FaCog } from 'react-icons/fa';
import { useTheme } from "../contexts/ThemeContext";

export default function Home(props) {
    const {
        goToPage,
    } = props;

    const { currentUser } = useAuth();
    const { isDarkMode } = useTheme();

    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingSet, setEditingSet] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [handledEditQuery, setHandledEditQuery] = useState(false);

    const loadSets = async () => {
        try {
            const userSets = await getUserVocabSets(currentUser.uid);
            setSets(userSets);
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
            if (!slug) {
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
        try {
            let slug = set.slug;
            if (!slug) {
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
                        <Button
                            style={{
                                backgroundColor: "transparent",
                                border: "none",
                                padding: 0,
                                color: isDarkMode ? "#ffffff" : "#000000"
                            }}
                            variant="light"
                            onClick={() => goToPage("settings")}
                        >
                            <FaCog size={20} />
                        </Button>
                    </Stack>
                </Col>
            </Row>
    
            <Row xs={1} md={2} lg={3} className="g-4">
                {sets.map((set) => (
                    <Col key={set.id}>
                        <Card 
                            style={{ 
                                backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
                                borderColor: isDarkMode ? "#404040" : "#dee2e6"
                            }}
                        >
                            <Card.Body>
                                <Card.Title style={{ color: isDarkMode ? "#ffffff" : "#000000" }}>
                                    {set.setName}
                                </Card.Title>
                                <Card.Text style={{ color: isDarkMode ? "#cccccc" : "#6c757d" }}>
                                    {set.vocabItems?.length || 0} items
                                </Card.Text>
                                <Stack direction="horizontal" gap={2}>
                                    <Button 
                                        variant={isDarkMode ? "outline-light" : "outline-primary"} 
                                        onClick={() => setEditingSet(set)}
                                    >
                                        Edit
                                    </Button>
                                    <Button 
                                        variant={isDarkMode ? "outline-success" : "success"} 
                                        onClick={() => handleStartLearning(set)}
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
