import { createContext, useContext, useState } from 'react';

const ScriptContext = createContext();

export function useScript() {
    return useContext(ScriptContext);
}

export function ScriptProvider({ children }) {
    const [scriptPref, setScriptPref] = useState(() => {
        const saved = localStorage.getItem('scriptPref');
        return saved || 'simplified';
    });

    const [showAltScript, setShowAltScript] = useState(() => {
        const saved = localStorage.getItem('showAltScript');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const toggleScript = () => {
        setScriptPref(prev => {
            const next = prev === 'simplified' ? 'traditional' : 'simplified';
            localStorage.setItem('scriptPref', next);
            return next;
        });
    };

    const isTraditional = scriptPref === 'traditional';

    /**
     * Returns the appropriate character display for a vocab item based on script preference.
     */
    const getDisplayChar = (item) => {
        if (!item) return '';
        if (isTraditional && item.characterTrad) return item.characterTrad;
        return item.character || '';
    };

    const toggleAltScript = () => {
        setShowAltScript(prev => {
            const next = !prev;
            localStorage.setItem('showAltScript', JSON.stringify(next));
            return next;
        });
    };

    const value = {
        scriptPref,
        setScriptPref: (pref) => {
            localStorage.setItem('scriptPref', pref);
            setScriptPref(pref);
        },
        toggleScript,
        isTraditional,
        getDisplayChar,
        showAltScript,
        toggleAltScript,
    };

    return (
        <ScriptContext.Provider value={value}>
            {children}
        </ScriptContext.Provider>
    );
}
