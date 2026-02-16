import * as OpenCC from 'opencc-js';

const twToCn = OpenCC.Converter({ from: 'tw', to: 'cn' });
const cnToTw = OpenCC.Converter({ from: 'cn', to: 'tw' });

export function tradToSimplified(text) {
    if (!text) return text;
    return twToCn(text);
}

export function simplifiedToTrad(text) {
    if (!text) return text;
    return cnToTw(text);
}

/**
 * Normalizes a vocab item to ensure both `character` (Simplified) and `characterTrad` (Traditional) exist.
 * Legacy items only have `character` which may be either script — this converts in both directions.
 * tradToSimplified is a no-op on already-Simplified text, and simplifiedToTrad is a no-op on already-Traditional.
 */
export function normalizeVocabItem(item) {
    if (!item) return item;

    // Already normalized
    if (item.characterTrad) {
        // Fix bad backfill: if both fields are identical, re-derive the Traditional variant
        if (item.characterTrad === item.character) {
            const trad = simplifiedToTrad(item.character);
            if (trad !== item.characterTrad) {
                return { ...item, characterTrad: trad };
            }
        }
        return item;
    }

    // Legacy item: convert in both directions from the original
    const original = item.character;

    return {
        ...item,
        character: tradToSimplified(original),
        characterTrad: simplifiedToTrad(original),
    };
}

export function normalizeVocabItems(items) {
    if (!items || !Array.isArray(items)) return items;
    return items.map(normalizeVocabItem);
}
