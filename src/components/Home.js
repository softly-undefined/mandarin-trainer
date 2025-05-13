import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button, Card, Container, Row, Col, Stack } from "react-bootstrap";
import { getUserVocabSets } from "../services/vocabSetService";
import VocabSetEditor from "./VocabSetEditor";

export default function Home(props) {
    const {
        goToPage,
    } = props;

    const { currentUser } = useAuth();

    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingSet, setEditingSet] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        async function loadSets() {
            try {
                const userSets = await getUserVocabSets(currentUser.uid);
                setSets(userSets);
            } catch (error) {
                console.error("Error loading sets:", error);
            } finally {
                setLoading(false);
            }
        }

        if (currentUser) {
            loadSets();
        }
    }, [currentUser]);

    const handleStartLearning = (set) => {
        goToPage("startLearning", set); // Pass the set to StartLearning
    };

    const handleBack = () => {
        setEditingSet(null);
        setIsCreating(false);
    };

    if (loading) return <div>Loading...</div>;

    if (editingSet || isCreating) {
        return <VocabSetEditor set={editingSet} goToPage={handleBack} />;
    }

    return (
        <Container className="py-4" style={{ overflowY: "auto", maxHeight: "100vh" }}>
            <Row className="mb-4">
                <Col><h2>Your Vocabulary Sets</h2></Col>
                <Col xs="auto">
                    <Button variant="secondary" onClick={() => setIsCreating(true)}>Create New Set</Button>
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
