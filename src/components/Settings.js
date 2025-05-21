import { Button, Card, Stack } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

export default function Settings(props) {
    const { goToPage } = props;
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            // The AuthContext will automatically redirect to SignIn
        } catch (error) {
            console.error("Failed to log out:", error);
        }
    };

    return (
        <Card style={{ width: "400px", maxHeight: "90%" }}>
            <Card.Body style={{ height: "100%", overflow: "hidden" }}>
                <Stack
                    direction='horizontal'
                    style={{
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "5px",
                    }}
                >
                    <Card.Title>Settings</Card.Title>
                    <Button
                        variant="outline-secondary"
                        onClick={() => goToPage("menu")}
                    >
                        Back to Menu
                    </Button>
                </Stack>

                <Stack gap={3} style={{ marginTop: "20px" }}>
                    <Button 
                        variant="danger" 
                        onClick={handleLogout}
                        style={{ marginTop: "20px" }}
                    >
                        Log Out
                    </Button>
                </Stack>
            </Card.Body>
        </Card>
    );
}
