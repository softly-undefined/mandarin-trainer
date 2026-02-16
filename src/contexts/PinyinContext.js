import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { formatPinyinForDisplay } from '../utils/pinyinUtils';

const PinyinContext = createContext();

export function usePinyin() {
    return useContext(PinyinContext);
}

export function PinyinProvider({ children }) {
    const [easyTypePinyin, setEasyTypePinyinState] = useState(() => {
        const saved = localStorage.getItem('easyTypePinyin');
        return saved !== null ? JSON.parse(saved) : false;
    });

    const setEasyTypePinyin = useCallback((value) => {
        const next = Boolean(value);
        localStorage.setItem('easyTypePinyin', JSON.stringify(next));
        setEasyTypePinyinState(next);
    }, []);

    const toggleEasyTypePinyin = useCallback(() => {
        setEasyTypePinyinState((prev) => {
            const next = !prev;
            localStorage.setItem('easyTypePinyin', JSON.stringify(next));
            return next;
        });
    }, []);

    const formatPinyin = useCallback(
        (value) => formatPinyinForDisplay(value, easyTypePinyin),
        [easyTypePinyin]
    );

    const value = useMemo(
        () => ({
            easyTypePinyin,
            setEasyTypePinyin,
            toggleEasyTypePinyin,
            formatPinyin,
        }),
        [easyTypePinyin, formatPinyin, setEasyTypePinyin, toggleEasyTypePinyin]
    );

    return <PinyinContext.Provider value={value}>{children}</PinyinContext.Provider>;
}
