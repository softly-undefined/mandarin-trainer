import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';
import { getUserVocabSets } from '../services/vocabSetService';
import VocabSetEditor from './VocabSetEditor';

export default function MySets({ goToPage }) {
    const { currentUser } = useAuth();
    const [sets, setSets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingSet, setEditingSet] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        async function loadSets() {
            if (currentUser) {
                try {
                    const userSets = await getUserVocabSets(currentUser.uid);
                    setSets(userSets);
                } catch (error) {
                    console.error("Error loading sets:", error);
                } finally {
                    setLoading(false);
                }
            }
        }
        loadSets();
    }, [currentUser]);
    

    const handleCreateSet = () => {
        setIsCreating(true);
        setEditingSet(null);
    };

    const handleEditSet = (set) => {
        setEditingSet(set);
        setIsCreating(false);
    };

    const handleSetUpdated = async () => {
        setEditingSet(null);
        setIsCreating(false);
    
        // Repeat the loadSets logic here
        if (currentUser) {
            try {
                const userSets = await getUserVocabSets(currentUser.uid);
                setSets(userSets);
            } catch (error) {
                console.error("Error loading sets:", error);
            } finally {
                setLoading(false);
            }
        }
    };
    

    if (loading) return <div>Loading...</div>;

    if (editingSet || isCreating) {
        return (
            <VocabSetEditor 
                set={isCreating ? undefined : editingSet} 
                goToPage={goToPage}
                onSetUpdated={handleSetUpdated}
            />

        );
    }

    return (
        <Container className="py-4">
            <Row className="mb-4">
                <Col>
                    <h2>My Vocabulary Sets</h2>
                </Col>
                <Col xs="auto">
                    <Button variant="outline-secondary" onClick={() => goToPage('menu')}>
                        Back to Menu
                    </Button>
                </Col>
            </Row>

            <Button
                variant="primary"
                className="mb-4"
                onClick={handleCreateSet}
            >
                Create New Set
            </Button>

            <Row xs={1} md={2} lg={3} className="g-4">
                {sets.map((set) => (
                    <Col key={set.id}>
                        <Card>
                            <Card.Body>
                                <Card.Title>{set.setName}</Card.Title>
                                <Card.Text>{set.vocabItems?.length || 0} items</Card.Text>
                                <Button
                                    variant="outline-primary"
                                    onClick={() => handleEditSet(set)}
                                >
                                    Edit
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}
