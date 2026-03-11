import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Check if user has a saved preference
        const savedTheme = localStorage.getItem('darkMode');
        return savedTheme ? JSON.parse(savedTheme) : false;
    });

    useEffect(() => {
        // Save preference to localStorage
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));

        const background = isDarkMode ? '#1a1a1a' : '#FDF5E9';
        const textColor = isDarkMode ? '#ffffff' : '#000000';

        // Apply theme globally to reduce flashing across navigations/repaints.
        document.documentElement.style.backgroundColor = background;
        document.documentElement.style.color = textColor;
        document.body.style.backgroundColor = background;
        document.body.style.color = textColor;

        const root = document.getElementById('root');
        if (root) {
            root.style.backgroundColor = background;
            root.style.color = textColor;
        }

        const themeMeta = document.querySelector('meta[name="theme-color"]');
        if (themeMeta) {
            themeMeta.setAttribute('content', background);
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => {
        setIsDarkMode(prev => !prev);
    };

    const value = {
        isDarkMode,
        toggleDarkMode
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
} 
