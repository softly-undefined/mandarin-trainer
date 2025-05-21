import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button, Card, Container, Row, Col, Stack } from "react-bootstrap";
import { getUserVocabSets } from "../services/vocabSetService";
import VocabSetEditor from "./VocabSetEditor";
import { FaCog } from 'react-icons/fa';

export default function Home(props) {
    const {
        goToPage,
    } = props;

    const { currentUser } = useAuth();

    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingSet, setEditingSet] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

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

    const handleStartLearning = (set) => {
        goToPage("startLearning", set);
    };

    const handleBack = () => {
        setEditingSet(null);
        setIsCreating(false);
    };

    const handleSetUpdated = async () => {
        await loadSets();
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
                <Col><h2>Your Vocabulary Sets</h2></Col>
                <Col xs="auto">
                    <Stack direction="horizontal" gap={2}>
                        <Button variant="secondary" onClick={() => setIsCreating(true)}>Create New Set</Button>
                        <Button
                            style={{
                                backgroundColor: "transparent",
                                border: "none",
                                padding: 0
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
                        <Card>
                            <Card.Body>
                                <Card.Title>{set.setName}</Card.Title>
                                <Card.Text>{set.vocabItems?.length || 0} items</Card.Text>
                                <Stack direction="horizontal" gap={2}>
                                    <Button variant="outline-primary" onClick={() => setEditingSet(set)}>Edit</Button>
                                    <Button variant="success" onClick={() => handleStartLearning(set)}>Learn</Button>
                                </Stack>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}
