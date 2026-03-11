export function shuffleWords(words) {
    return words
        .map((value) => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
}

export function buildValidWordsFromSet(selectedSet) {
    if (!selectedSet?.vocabItems || !Array.isArray(selectedSet.vocabItems)) {
        return [];
    }

    return selectedSet.vocabItems
        .filter((item) =>
            item &&
            item.character &&
            item.pinyin &&
            item.definition &&
            item.character.trim() !== '' &&
            item.pinyin.trim() !== '' &&
            item.definition.trim() !== ''
        )
        .map((item) => ({
            character: item.character,
            characterTrad: item.characterTrad || '',
            pinyin: item.pinyin,
            definition: item.definition,
        }));
}

export function resolveWordField(word, field, getDisplayChar) {
    if (!word) return '';
    if (field === 'character') {
        return getDisplayChar(word);
    }
    return word[field];
}

export function buildPromptFromWord(word, given, want, getDisplayChar) {
    return {
        term: resolveWordField(word, given, getDisplayChar),
        key: resolveWordField(word, want, getDisplayChar),
        currChar: getDisplayChar(word),
        currPinyin: word?.pinyin || '',
        currDefinition: word?.definition || '',
    };
}

export function hasRequiredWordFields(word, given, want) {
    if (!word) return false;
    return Boolean(word[given] && word[want] && word.character && word.pinyin && word.definition);
}
