const KEYWORDS = [
    'function', 'class', 'let', 'const', 'if', 'else', 'for', 'while', 'return'
];

export function getAutoCompletionSuggestions(text) {
    const words = text.split(' ').map(word => word.trim());
    const lastWord = words[words.length - 1];
    return KEYWORDS.filter(keyword => keyword.startsWith(lastWord));
}
