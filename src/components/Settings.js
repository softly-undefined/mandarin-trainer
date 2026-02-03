import { Button, Card, Stack, Form } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function Settings(props) {
    const { onBack, goToPage } = props;
    const { currentUser, logout } = useAuth();
    const { isDarkMode, toggleDarkMode } = useTheme();

    const handleLogout = async () => {
        try {
            await logout();
            // The AuthContext will automatically redirect to SignIn
        } catch (error) {
            console.error("Failed to log out:", error);
        }
    };

    const cardStyle = isDarkMode
        ? { backgroundColor: "#23272b", color: "#fff", borderColor: "#444" }
        : {};
    const infoBoxStyle = isDarkMode
        ? { padding: "10px", backgroundColor: "#181a1b", borderRadius: "5px", textAlign: "center", color: "#fff" }
        : { padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "5px", textAlign: "center" };

    return (
        <Card style={{ width: "400px", maxHeight: "90%", ...cardStyle }}>
            <Card.Body style={{ height: "100%", overflow: "hidden" }}>
                <Stack
                    direction='horizontal'
                    style={{
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "5px",
                    }}
                >
                    <Card.Title style={{ color: isDarkMode ? "#fff" : undefined }}>Settings</Card.Title>
                    <Button
                        variant={isDarkMode ? "outline-light" : "outline-secondary"}
                        onClick={() => {
                            if (onBack) {
                                onBack();
                            } else if (goToPage) {
                                goToPage("home");
                            } else {
                                window.history.back();
                            }
                        }}
                    >
                        Back
                    </Button>
                </Stack>

                <Stack gap={3} style={{ marginTop: "20px" }}>
                    <div style={infoBoxStyle}>
                        <div style={{ fontSize: "0.9rem", color: isDarkMode ? "#b0b0b0" : "#6c757d" }}>
                            {currentUser ? "Logged in as" : "Not logged in"}
                        </div>
                        <div style={{ 
                            fontSize: "1.1rem", 
                            fontWeight: "500",
                            wordBreak: "break-all",
                            color: isDarkMode ? "#fff" : undefined
                        }}>
                            {currentUser ? currentUser.email : "Sign in to save and edit sets"}
                        </div>
                    </div>

                    <Form>
                        <Form.Check 
                            type="switch"
                            id="dark-mode-switch"
                            label="Dark Mode"
                            checked={isDarkMode}
                            onChange={toggleDarkMode}
                            style={{ fontSize: "1.1rem", color: isDarkMode ? "#fff" : undefined }}
                        />
                    </Form>

                    {currentUser ? (
                        <Button 
                            variant="danger" 
                            onClick={handleLogout}
                            style={{ marginTop: "10px" }}
                        >
                            Log Out
                        </Button>
                    ) : (
                        <Button
                            variant={isDarkMode ? "light" : "primary"}
                            style={{ marginTop: "10px" }}
                            onClick={() => {
                                const base = process.env.PUBLIC_URL || "";
                                if (goToPage) {
                                    goToPage("home");
                                } else {
                                    window.location.assign(`${base}/`);
                                }
                            }}
                        >
                            Log In
                        </Button>
                    )}
                </Stack>
            </Card.Body>
        </Card>
    );
}
