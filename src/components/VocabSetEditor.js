import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Container, Row, Col, Form, Table, Alert } from 'react-bootstrap';
import { createVocabSet, updateVocabSet, deleteVocabSet, ensureSetSlug, MAX_WORDS_PER_SET } from '../services/vocabSetService';
import { useTheme } from '../contexts/ThemeContext';
import { useScript } from '../contexts/ScriptContext';
import { usePinyin } from '../contexts/PinyinContext';
import { tradToSimplified, simplifiedToTrad } from '../utils/chineseConverter';
import { suggestPinyinFromChinese } from '../utils/pinyinUtils';

const AUTO_SAVE_MS = 8000;

export default function VocabSetEditor({ set, goToPage, onSetUpdated }) {
    const { currentUser } = useAuth();
    const { isDarkMode } = useTheme();
    const { isTraditional, getDisplayChar, showAltScript } = useScript();
    const { easyTypePinyin, formatPinyin } = usePinyin();
    const [setName, setSetName] = useState(set?.setName || '');
    const [vocabItems, setVocabItems] = useState(set?.vocabItems || []);
    const initialNameRef = useRef(set?.setName || '');
    const initialItemsRef = useRef(set?.vocabItems || []);
    const [newItem, setNewItem] = useState({ character: '', characterTrad: '', pinyin: '', definition: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingIndex, setEditingIndex] = useState(null);
    const [pinyinManuallyEdited, setPinyinManuallyEdited] = useState(false);
    const [autoSaveNotice, setAutoSaveNotice] = useState('');
    const restoredDraftRef = useRef(false);

    const draftKey = useMemo(() => {
        if (!currentUser?.uid) {
            return null;
        }
        return `vocabSetDraft:${currentUser.uid}:${set?.id || 'new'}`;
    }, [currentUser?.uid, set?.id]);

    const draftPayload = useMemo(() => (
        JSON.stringify({
            setName,
            vocabItems,
            newItem,
            editingIndex,
            pinyinManuallyEdited,
            updatedAt: Date.now()
        })
    ), [setName, vocabItems, newItem, editingIndex, pinyinManuallyEdited]);

    const clearDraft = () => {
        if (!draftKey) {
            return;
        }
        localStorage.removeItem(draftKey);
        setAutoSaveNotice('');
    };

    const saveDraftNow = useCallback(() => {
        if (!draftKey) {
            return;
        }

        if (!setName.trim() && vocabItems.length === 0 && !newItem.character && !newItem.characterTrad && !newItem.pinyin && !newItem.definition) {
            return;
        }

        localStorage.setItem(draftKey, draftPayload);
        setAutoSaveNotice(`Draft autosaved at ${new Date().toLocaleTimeString()}`);
    }, [draftKey, draftPayload, newItem.character, newItem.characterTrad, newItem.definition, newItem.pinyin, setName, vocabItems.length]);

    useEffect(() => {
        restoredDraftRef.current = false;
        setAutoSaveNotice('');
    }, [draftKey]);

    useEffect(() => {
        if (!draftKey || restoredDraftRef.current) {
            return;
        }

        const rawDraft = localStorage.getItem(draftKey);
        if (!rawDraft) {
            restoredDraftRef.current = true;
            return;
        }

        try {
            const parsed = JSON.parse(rawDraft);
            if (typeof parsed.setName === 'string') {
                setSetName(parsed.setName);
            }
            if (Array.isArray(parsed.vocabItems)) {
                setVocabItems(parsed.vocabItems);
            }
            if (parsed.newItem && typeof parsed.newItem === 'object') {
                setNewItem({
                    character: parsed.newItem.character || '',
                    characterTrad: parsed.newItem.characterTrad || '',
                    pinyin: parsed.newItem.pinyin || '',
                    definition: parsed.newItem.definition || ''
                });
            }
            if (typeof parsed.editingIndex === 'number' || parsed.editingIndex === null) {
                setEditingIndex(parsed.editingIndex);
            }
            if (typeof parsed.pinyinManuallyEdited === 'boolean') {
                setPinyinManuallyEdited(parsed.pinyinManuallyEdited);
            }
            setAutoSaveNotice('Recovered autosaved draft.');
        } catch (restoreError) {
            console.error('Failed to restore draft:', restoreError);
        } finally {
            restoredDraftRef.current = true;
        }
    }, [draftKey]);

    useEffect(() => {
        if (!draftKey || !restoredDraftRef.current) {
            return;
        }

        const interval = setInterval(() => {
            saveDraftNow();
        }, AUTO_SAVE_MS);

        return () => clearInterval(interval);
    }, [draftKey, saveDraftNow]);

    const applyPrimaryCharacterInput = (value) => {
        const nextItem = isTraditional
            ? { ...newItem, characterTrad: value, character: tradToSimplified(value) }
            : { ...newItem, character: value, characterTrad: simplifiedToTrad(value) };

        const suggestion = suggestPinyinFromChinese(value, easyTypePinyin);
        const canAutoFill = !pinyinManuallyEdited || !nextItem.pinyin.trim();

        if (suggestion && canAutoFill) {
            setNewItem({ ...nextItem, pinyin: suggestion });
            setPinyinManuallyEdited(false);
            return;
        }

        setNewItem(nextItem);
    };

    useEffect(() => {
        if (!draftKey) {
            return;
        }

        const handleBeforeUnload = () => {
            saveDraftNow();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [draftKey, saveDraftNow]);

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
        setNewItem({ character: '', characterTrad: '', pinyin: '', definition: '' });
        setPinyinManuallyEdited(false);
        setError('');
    };

    const handleDeleteItem = (index) => {
        const updatedItems = [...vocabItems];
        updatedItems.splice(index, 1);
        setVocabItems(updatedItems);
    };

    const persistSet = async () => {
        let setId = set?.id;
        if (set) {
            await updateVocabSet(set.id, {
                setName,
                vocabItems,
                updatedAt: new Date()
            });
        } else {
            setId = await createVocabSet(currentUser.uid, setName, vocabItems);
        }

        if (onSetUpdated) {
            await onSetUpdated();
        }

        return setId;
    };

    const handleSave = async () => {
        try {
            setError('');
            await persistSet();
            clearDraft();
            setSuccess('Set saved successfully!');
            setTimeout(() => goToPage('home'), 500);
        } catch (error) {
            console.error("Error saving set:", error);
            setError(error.message);
        }
    };

    const handleLearn = async () => {
        try {
            setError('');
            const setId = await persistSet();
            clearDraft();
            setSuccess('Set saved successfully!');

            let slug = set?.slug;
            if (!slug) {
                slug = await ensureSetSlug(setId);
            }

            const base = process.env.PUBLIC_URL || '';
            window.location.assign(`${base}/set/${slug}`);
        } catch (error) {
            console.error("Error saving and starting learning:", error);
            setError(error.message);
        }
    };
    
    const handleDeleteSet = async () => {
        if (window.confirm('Are you sure you want to delete this set? This action cannot be undone.')) {
            try {
                await deleteVocabSet(set.id);
                clearDraft();
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
        const initialName = initialNameRef.current || '';
        const initialItems = initialItemsRef.current || [];
        const hasChanges =
            setName !== initialName ||
            JSON.stringify(vocabItems) !== JSON.stringify(initialItems);

        if (!hasChanges || window.confirm('Discard unsaved changes and go back to My Sets?')) {
            goToPage('home');
        }
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
        <div
            style={{
                maxHeight: "100vh",
                overflowY: "auto",
                padding: "1rem",
                background: isDarkMode ? '#181a1b' : undefined
            }}
            className={isDarkMode ? 'vocab-scroll-dark' : ''}
        >
            {isDarkMode && (
                <style>{`
                    .vocab-darkmode-input::placeholder {
                        color: #b0b0b0 !important;
                        opacity: 1 !important;
                    }
                    .vocab-scroll-dark::-webkit-scrollbar {
                        width: 10px;
                    }
                    .vocab-scroll-dark::-webkit-scrollbar-track {
                        background: #111;
                    }
                    .vocab-scroll-dark::-webkit-scrollbar-thumb {
                        background: #444;
                        border-radius: 6px;
                    }
                    .vocab-scroll-dark::-webkit-scrollbar-thumb:hover {
                        background: #666;
                    }
                    .vocab-table-dark {
                        background-color: #111 !important;
                        color: #fff !important;
                    }
                    .vocab-table-dark th {
                        background-color: #1f1f1f !important;
                        color: #fff !important;
                        border-color: #3a3a3a !important;
                    }
                    .vocab-table-dark td {
                        border-color: #3a3a3a !important;
                        background-color: #161616 !important;
                        color: #fff !important;
                    }
                    .vocab-table-dark tbody tr {
                        color: #fff !important;
                    }
                    .vocab-table-dark tbody tr td {
                        color: #fff !important;
                    }
                    .vocab-table-dark tbody tr:nth-child(odd) {
                        background-color: #161616 !important;
                    }
                    .vocab-table-dark tbody tr:nth-child(even) {
                        background-color: #1d1d1d !important;
                    }
                    .vocab-table-dark tbody tr:hover {
                        background-color: #2a2a2a !important;
                    }
                    .vocab-table-dark thead tr {
                        background-color: #1f1f1f !important;
                        border-color: #3a3a3a !important;
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
                {autoSaveNotice && <Alert variant="info">{autoSaveNotice}</Alert>}

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
                            <Row className="mb-2">
                                <Col>
                                    <Form.Control
                                        type="text"
                                        placeholder={isTraditional ? "繁體字 (Traditional)" : "简体字 (Simplified)"}
                                        value={isTraditional ? (newItem.characterTrad || '') : (newItem.character || '')}
                                        onChange={(e) => applyPrimaryCharacterInput(e.target.value)}
                                        style={inputStyle}
                                        className={isDarkMode ? 'vocab-darkmode-input' : ''}
                                    />
                                </Col>
                                <Col>
                                    <Form.Control
                                        type="text"
                                        placeholder="Pinyin"
                                        value={newItem.pinyin}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setNewItem({ ...newItem, pinyin: value });
                                            setPinyinManuallyEdited(value.trim() !== '');
                                        }}
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
                            {showAltScript && (
                                <Row>
                                    <Col>
                                        <Form.Control
                                            type="text"
                                            placeholder={isTraditional ? "简体 (Simplified)" : "繁體 (Traditional)"}
                                            value={isTraditional ? (newItem.character || '') : (newItem.characterTrad || '')}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (isTraditional) {
                                                    setNewItem({ ...newItem, character: val });
                                                } else {
                                                    setNewItem({ ...newItem, characterTrad: val });
                                                }
                                            }}
                                            style={{ ...inputStyle, fontSize: '0.85rem', opacity: 0.7 }}
                                            className={isDarkMode ? 'vocab-darkmode-input' : ''}
                                        />
                                    </Col>
                                    <Col />
                                    <Col />
                                    <Col xs="auto" style={{ visibility: 'hidden' }}>
                                        <Button variant="primary">Add</Button>
                                    </Col>
                                </Row>
                            )}
                        </Form>
                    </Card.Body>
                </Card>

                <h5 className="mb-2" style={{ color: isDarkMode ? '#fff' : undefined }}>Set Length: {vocabItems.length}</h5>

        <div
            style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}
            className={isDarkMode ? 'vocab-scroll-dark' : ''}
        >
            <Table striped bordered hover className={isDarkMode ? 'vocab-table-dark' : ''}>
                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr>
                                <th style={thStyle}>Character</th>
                                {showAltScript && <th style={thStyle}>{isTraditional ? "Simplified" : "Traditional"}</th>}
                                <th style={thStyle}>Pinyin</th>
                                <th style={thStyle}>Definition</th>
                                <th style={thStyle}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vocabItems.map((item, index) => (
                                <tr key={index}>
                                    <td>{getDisplayChar(item)}</td>
                                    {showAltScript && <td style={{ fontSize: '0.85em', opacity: 0.7 }}>{isTraditional ? item.character : item.characterTrad}</td>}
                                    <td>{formatPinyin(item.pinyin)}</td>
                                    <td>{item.definition}</td>
                                    <td>
                                        <Button
                                            variant={isDarkMode ? "outline-light" : "outline-secondary"}
                                            size="sm"
                                            className="me-2"
                                            onClick={() => {
                                                setNewItem(item);
                                                setEditingIndex(index);
                                                setPinyinManuallyEdited(false);
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
                        Save
                    </Button>
                    <Button
                        variant={isDarkMode ? "outline-success" : "success"}
                        size="lg"
                        onClick={handleLearn}
                        disabled={!setName || vocabItems.length === 0}
                    >
                        Learn
                    </Button>
                    {set && (
                        <Button
                            variant={isDarkMode ? "outline-danger" : "danger"}
                            size="lg"
                            onClick={handleDeleteSet}
                        >
                            Delete
                        </Button>
                    )}
                </div>
            </Container>
        </div>
    );
}
