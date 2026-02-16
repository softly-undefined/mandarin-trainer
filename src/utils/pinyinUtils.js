import { convert, pinyin } from 'pinyin-pro';

const TONE_MARK_CHAR_REGEX = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛńňǹḿŃŇǸḾ]/;
const PINYIN_TOKEN_REGEX = /[A-Za-züÜvV:āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜĀÁǍÀĒÉĚÈĪÍǏÌŌÓǑÒŪÚǓÙǕǗǙǛńňǹḿŃŇǸḾ]+/g;
const NUMBERED_PINYIN_TOKEN_REGEX = /[A-Za-züÜvV:]+[1-5]/g;
const HANZI_REGEX = /[\u3400-\u9fff]/;

export function toToneNumberPinyin(value) {
    if (!value) return '';

    const converted = String(value).replace(PINYIN_TOKEN_REGEX, (token) => {
        if (!TONE_MARK_CHAR_REGEX.test(token)) {
            return token;
        }
        return convert(token, { format: 'symbolToNum' });
    });

    return converted.replace(/ü/g, 'v').replace(/Ü/g, 'V');
}

export function toToneMarkPinyin(value) {
    if (!value) return '';

    return String(value).replace(NUMBERED_PINYIN_TOKEN_REGEX, (token) =>
        convert(token.replace(/u:/gi, (char) => (char === 'U:' ? 'V' : 'v')), { format: 'numToSymbol' })
    );
}

export function formatPinyinForDisplay(value, easyTypePinyin) {
    if (!value) return '';
    return easyTypePinyin ? toToneNumberPinyin(value) : toToneMarkPinyin(value);
}

export function normalizePinyinForCompare(value) {
    if (!value) return '';
    return toToneNumberPinyin(value)
        .toLowerCase()
        .replace(/u:/g, 'v')
        .replace(/ü/g, 'v')
        .replace(/\s+/g, '')
        .replace(/[’']/g, '');
}

export function suggestPinyinFromChinese(text, easyTypePinyin = false) {
    if (!text || !HANZI_REGEX.test(text)) {
        return '';
    }

    const suggestion = pinyin(text, {
        toneType: easyTypePinyin ? 'num' : 'symbol',
        nonZh: 'removed',
        separator: ' ',
        type: 'string',
    });

    const normalized = suggestion.trim().replace(/\s+/g, ' ');
    if (easyTypePinyin) {
        return normalized.replace(/ü/g, 'v').replace(/Ü/g, 'V');
    }
    return normalized;
}
