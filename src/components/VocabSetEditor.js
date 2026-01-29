import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Container, Row, Col, Form, Table, Alert } from 'react-bootstrap';
import { createVocabSet, updateVocabSet, deleteVocabSet, MAX_WORDS_PER_SET } from '../services/vocabSetService';
import { useTheme } from '../contexts/ThemeContext';

export default function VocabSetEditor({ set, goToPage, onSetUpdated }) {
    const { currentUser } = useAuth();
    const { isDarkMode } = useTheme();
    const [setName, setSetName] = useState(set?.setName || '');
    const [vocabItems, setVocabItems] = useState(set?.vocabItems || []);
    const [newItem, setNewItem] = useState({ character: '', pinyin: '', definition: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingIndex, setEditingIndex] = useState(null);

    const handleAddItem = (e) => {
        e.preventDefault();
        if (!newItem.character || !newItem.pinyin || !newItem.definition) return;

        const updated = [...vocabItems];

        if (editingIndex !== null) {
            updated[editingIndex] = newItem;
            setEditingIndex(null);
        } else {
            if (vocabItems.length >= MAX_WORDS_PER_SET) {
                setError(`Maximum limit of ${MAX_WORDS_PER_SET} words per set reached`);
                return;
            }
            updated.push(newItem);
        }

        setVocabItems(updated);
        setNewItem({ character: '', pinyin: '', definition: '' });
        setError('');
    };

    const handleDeleteItem = (index) => {
        const updatedItems = [...vocabItems];
        updatedItems.splice(index, 1);
        setVocabItems(updatedItems);
    };

    const handleSave = async () => {
        try {
            setError('');
            if (set) {
                await updateVocabSet(set.id, {
                    setName,
                    vocabItems,
                    updatedAt: new Date()
                });
            } else {
                await createVocabSet(currentUser.uid, setName, vocabItems);
            }
            setSuccess('Set saved successfully!');
            if (onSetUpdated) {
                await onSetUpdated();
            }
            setTimeout(() => goToPage('home'), 500);
        } catch (error) {
            console.error("Error saving set:", error);
            setError(error.message);
        }
    };
    
    const handleDeleteSet = async () => {
        if (window.confirm('Are you sure you want to delete this set? This action cannot be undone.')) {
            try {
                await deleteVocabSet(set.id);
                if (onSetUpdated) {
                    await onSetUpdated();
                }
                goToPage('home');
            } catch (error) {
                console.error("Error deleting set:", error);
                setError(error.message);
            }
        }
    };

    const handleBack = () => {
        goToPage('home');
    };

    const cardStyle = isDarkMode
        ? { backgroundColor: '#23272b', color: '#fff', borderColor: '#444' }
        : {};
    const inputStyle = isDarkMode
        ? { backgroundColor: '#181a1b', color: '#fff', border: '1px solid #444' }
        : {};
    const thStyle = isDarkMode
        ? { backgroundColor: '#181a1b', color: '#fff' }
        : {};

    return (
        <div style={{ maxHeight: "100vh", overflowY: "auto", padding: "1rem", background: isDarkMode ? '#181a1b' : undefined }}>
            {isDarkMode && (
                <style>{`
                    .vocab-darkmode-input::placeholder {
                        color: #b0b0b0 !important;
                        opacity: 1 !important;
                    }
                `}</style>
            )}
            <Container className="py-4">
                <Row className="mb-4">
                    <Col>
                        <h2 style={{ color: isDarkMode ? '#fff' : undefined }}>{set ? 'Edit Set' : 'Create New Set'}</h2>
                    </Col>
                    <Col xs="auto">
                        <Button variant={isDarkMode ? "outline-light" : "outline-secondary"} onClick={handleBack}>
                            Back to My Sets
                        </Button>
                    </Col>
                </Row>

                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form className="mb-4">
                    <Form.Group className="mb-3">
                        <Form.Label style={{ color: isDarkMode ? '#fff' : undefined }}>Set Name</Form.Label>
                        <Form.Control
                            type="text"
                            value={setName}
                            onChange={(e) => setSetName(e.target.value)}
                            placeholder="Enter set name"
                            style={inputStyle}
                            className={isDarkMode ? 'vocab-darkmode-input' : ''}
                        />
                    </Form.Group>
                </Form>

                <Card className="mb-4" style={cardStyle}>
                    <Card.Body>
                        <Card.Title style={{ color: isDarkMode ? '#fff' : undefined }}>Add New Vocabulary Item</Card.Title>
                        <Form onSubmit={handleAddItem}>
                            <Row>
                                <Col>
                                    <Form.Control
                                        type="text"
                                        placeholder="字"
                                        value={newItem.character}
                                        onChange={(e) => setNewItem({ ...newItem, character: e.target.value })}
                                        style={inputStyle}
                                        className={isDarkMode ? 'vocab-darkmode-input' : ''}
                                    />
                                </Col>
                                <Col>
                                    <Form.Control
                                        type="text"
                                        placeholder="Pinyin"
                                        value={newItem.pinyin}
                                        onChange={(e) => setNewItem({ ...newItem, pinyin: e.target.value })}
                                        style={inputStyle}
                                        className={isDarkMode ? 'vocab-darkmode-input' : ''}
                                    />
                                </Col>
                                <Col>
                                    <Form.Control
                                        type="text"
                                        placeholder="Definition"
                                        value={newItem.definition}
                                        onChange={(e) => setNewItem({ ...newItem, definition: e.target.value })}
                                        style={inputStyle}
                                        className={isDarkMode ? 'vocab-darkmode-input' : ''}
                                    />
                                </Col>
                                <Col xs="auto">
                                    <Button type="submit" variant={isDarkMode ? "outline-light" : "primary"}>
                                        {editingIndex !== null ? "Update" : "Add"}
                                    </Button>
                                </Col>
                            </Row>
                        </Form>
                    </Card.Body>
                </Card>

                <h5 className="mb-2" style={{ color: isDarkMode ? '#fff' : undefined }}>Set Length: {vocabItems.length}</h5>

                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
                    <Table striped bordered hover>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr>
                                <th style={thStyle}>Character</th>
                                <th style={thStyle}>Pinyin</th>
                                <th style={thStyle}>Definition</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vocabItems.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.character}</td>
                                    <td>{item.pinyin}</td>
                                    <td>{item.definition}</td>
                                    <td>
                                        <Button
                                            variant={isDarkMode ? "outline-light" : "outline-secondary"}
                                            size="sm"
                                            className="me-2"
                                            onClick={() => {
                                                setNewItem(item);
                                                setEditingIndex(index);
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant={isDarkMode ? "outline-danger" : "outline-danger"}
                                            size="sm"
                                            onClick={() => handleDeleteItem(index)}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                <div className="d-grid gap-2">
                    <Button
                        variant={isDarkMode ? "outline-light" : "primary"}
                        size="lg"
                        onClick={handleSave}
                        disabled={!setName || vocabItems.length === 0}
                    >
                        Save Set
                    </Button>
                    {set && (
                        <Button
                            variant={isDarkMode ? "outline-danger" : "danger"}
                            size="lg"
                            onClick={handleDeleteSet}
                        >
                            Delete Set
                        </Button>
                    )}
                </div>
            </Container>
        </div>
    );
}
