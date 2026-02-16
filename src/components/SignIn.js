import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Container } from 'react-bootstrap';
import { FaGoogle } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

export default function SignIn() {
    const { signInWithGoogle, error } = useAuth();
    const { isDarkMode } = useTheme();

    return (
        <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <Card 
                style={{ 
                    width: '400px',
                    backgroundColor: isDarkMode ? '#2d2d2d' : '#FFF2DC',
                    borderColor: isDarkMode ? '#404040' : '#dee2e6'
                }}
            >
                <Card.Body className="d-flex flex-column align-items-center p-4">
                    <div className="d-flex align-items-center gap-3 mb-4">
                        <img 
                            src={process.env.PUBLIC_URL + '/roundedfinallogo.png'} 
                            alt="Mandarin Trainer Logo" 
                            style={{ height: 48, width: 48 }} 
                        />
                        <h2 style={{ 
                            margin: 0,
                            color: isDarkMode ? '#ffffff' : '#000000'
                        }}>
                            Mandarin Trainer
                        </h2>
                    </div>
                    
                    <p className="text-center mb-4" style={{ 
                        color: isDarkMode ? '#cccccc' : '#6c757d'
                    }}>
                        Sign in to access your vocabulary sets and track your progress
                    </p>

                    <Button 
                        variant={isDarkMode ? "outline-light" : "outline-primary"}
                        onClick={() => {
                            console.log("Google sign-in clicked");
                            signInWithGoogle();
                        }}
                        className="d-flex align-items-center gap-2 mb-3 w-100 justify-content-center py-2"
                        size="lg"
                    >
                        <FaGoogle />
                        Sign in with Google
                    </Button>

                    {error && (
                        <div className="text-danger mt-3 text-center">
                            {error}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
} 
