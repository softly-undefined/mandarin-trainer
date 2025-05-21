import { useAuth } from '../contexts/AuthContext';
import { Button } from 'react-bootstrap';
import { FaGoogle } from 'react-icons/fa';

export default function SignIn() {
    const { signInWithGoogle, error } = useAuth();

    return (
        <div className="d-flex flex-column align-items-center justify-content-center p-4">
            <h2 className="mb-4">Welcome to Mandarin Trainer v5</h2>
            <Button 
                variant="outline-primary" 
                onClick={() => {
                    console.log("Google sign-in clicked");
                    signInWithGoogle();
                }}
                className="d-flex align-items-center gap-2 mb-3"
            >
                <FaGoogle />
                Sign in with Google
            </Button>
            {error && (
                <div className="text-danger">
                    {error}
                </div>
            )}
        </div>
    );
} 