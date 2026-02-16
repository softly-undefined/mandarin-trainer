import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

function getFallbackInitial(currentUser, userProfile) {
    const label = userProfile?.displayName || currentUser?.displayName || currentUser?.email || "?";
    return label.charAt(0).toUpperCase();
}

export default function UserAvatarButton({ onClick, size = 34, title = "Settings" }) {
    const { currentUser, userProfile } = useAuth();
    const { isDarkMode } = useTheme();
    const avatarUrl = userProfile?.photoURL || currentUser?.photoURL || '';
    const fallbackInitial = getFallbackInitial(currentUser, userProfile);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setImageFailed(false);
    }, [avatarUrl, currentUser?.uid]);

    if (!currentUser) {
        return null;
    }

    const showImage = Boolean(avatarUrl) && !imageFailed;

    return (
        <Button
            onClick={onClick}
            title={title}
            variant="link"
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                padding: 0,
                border: isDarkMode ? "2px solid #666" : "2px solid #ced4da",
                overflow: "hidden",
                backgroundColor: "transparent",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
            }}
            aria-label={title}
        >
            {showImage ? (
                <img
                    src={avatarUrl}
                    alt="User avatar"
                    onError={() => setImageFailed(true)}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                    }}
                />
            ) : (
                <span
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        color: isDarkMode ? "#fff" : "#212529",
                        backgroundColor: isDarkMode ? "#2f3338" : "#f1f3f5",
                        fontSize: `${Math.max(12, Math.floor(size / 2.2))}px`,
                    }}
                >
                    {fallbackInitial}
                </span>
            )}
        </Button>
    );
}
