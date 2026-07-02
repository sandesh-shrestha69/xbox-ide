export class SnippetManager {
    constructor(editorController) {
        this.editor = editorController;
        this._snippets = this._defaultSnippets();
        this._registerProvider();
    }

    _defaultSnippets() {
        return {
            javascript: [
                { prefix: 'log', body: 'console.log(${1:value});', description: 'Log to console' },
                { prefix: 'fn', body: 'function ${1:name}(${2:args}) {\n    ${3}\n}', description: 'Function declaration' },
                { prefix: 'af', body: '(${1:args}) => ${2:expr}', description: 'Arrow function' },
                { prefix: 'cl', body: 'class ${1:Name} {\n    constructor(${2:args}) {\n        ${3}\n    }\n}', description: 'Class declaration' },
                { prefix: 'im', body: 'import ${1:default} from \'${2:module}\';', description: 'Import statement' },
                { prefix: 'ex', body: 'export ${1:default} ${2:value};', description: 'Export statement' },
                { prefix: 'req', body: 'const ${1:name} = require(\'${2:module}\');', description: 'Require module' },
                { prefix: 'for', body: 'for (let ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${3}\n}', description: 'For loop' },
                { prefix: 'af', body: 'async function ${1:name}(${2:args}) {\n    ${3}\n}', description: 'Async function' },
                { prefix: 'prom', body: 'new Promise((resolve, reject) => {\n    ${1}\n});', description: 'Promise constructor' },
            ],
            python: [
                { prefix: 'def', body: 'def ${1:name}(${2:args}):\n    ${3:pass}', description: 'Function definition' },
                { prefix: 'cls', body: 'class ${1:Name}:\n    def __init__(self, ${2:args}):\n        ${3:pass}', description: 'Class definition' },
                { prefix: 'for', body: 'for ${1:item} in ${2:iterable}:\n    ${3}', description: 'For loop' },
                { prefix: 'if', body: 'if ${1:condition}:\n    ${2}', description: 'If statement' },
                { prefix: 'ife', body: 'if ${1:condition}:\n    ${2}\nelse:\n    ${3}', description: 'If-else statement' },
                { prefix: 'while', body: 'while ${1:condition}:\n    ${2}', description: 'While loop' },
                { prefix: 'with', body: 'with open(\'${1:file}\') as ${2:f}:\n    ${3}', description: 'With statement' },
                { prefix: 'try', body: 'try:\n    ${1}\nexcept ${2:Exception} as ${3:e}:\n    ${4}', description: 'Try-except block' },
            ],
            typescript: [
                { prefix: 'iface', body: 'interface ${1:Name} {\n    ${2}\n}', description: 'Interface declaration' },
                { prefix: 'type', body: 'type ${1:Name} = ${2:string};', description: 'Type alias' },
                { prefix: 'enum', body: 'enum ${1:Name} {\n    ${2}\n}', description: 'Enum declaration' },
                { prefix: 'af', body: '(${1:args}): ${2:void} => {\n    ${3}\n}', description: 'Arrow function' },
                { prefix: 'cl', body: 'class ${1:Name} {\n    constructor(${2:args}) {\n        ${3}\n    }\n}', description: 'Class declaration' },
            ],
            html: [
                { prefix: 'doc', body: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>${1:Document}</title>\n</head>\n<body>\n    ${2}\n</body>\n</html>', description: 'HTML document template' },
                { prefix: 'div', body: '<div${1: class="${2:name}"}>${3}</div>', description: 'Div element' },
                { prefix: 'btn', body: '<button${1: class="${2:btn}"}>${3}</button>', description: 'Button element' },
                { prefix: 'img', body: '<img src="${1:url}" alt="${2:text}">', description: 'Image element' },
                { prefix: 'link', body: '<link rel="stylesheet" href="${1:style.css}">', description: 'Link stylesheet' },
            ],
            css: [
                { prefix: 'flex', body: 'display: flex;\njustify-content: ${1:center};\nalign-items: ${2:center};', description: 'Flexbox centering' },
                { prefix: 'grid', body: 'display: grid;\ngrid-template-columns: ${1:1fr};', description: 'CSS Grid' },
                { prefix: 'anim', body: '@keyframes ${1:name} {\n    0% { ${2} }\n    100% { ${3} }\n}', description: 'Keyframe animation' },
                { prefix: 'media', body: '@media (${1:max-width}: ${2:768px}) {\n    ${3}\n}', description: 'Media query' },
            ],
        };
    }

    _registerProvider() {
        if (!window.monaco) return;
        monaco.languages.registerCompletionItemProvider('*', {
            triggerCharacters: ['.', '$', '@', '/'],
            provideCompletionItems: (model, position) => {
                const lang = model.getLanguageId();
                const word = model.getWordUntilPosition(position);
                const textUntil = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: Math.max(1, position.column - 20),
                    endLineNumber: position.lineNumber,
                    endColumn: position.column,
                });
                const prefixMatch = textUntil.match(/(\w+)$/);
                const prefix = prefixMatch ? prefixMatch[1] : '';
                if (!prefix || prefix.length < 1) return { suggestions: [] };
                const langSnippets = this._snippets[lang] || [];
                const allSnippets = [];
                for (const [, v] of Object.entries(this._snippets)) {
                    allSnippets.push(...v);
                }
                const matched = (langSnippets.length > 0 ? langSnippets : allSnippets)
                    .filter(s => s.prefix.startsWith(prefix) && s.prefix !== prefix)
                    .slice(0, 10);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };
                return {
                    suggestions: matched.map(s => ({
                        label: s.prefix,
                        detail: s.description,
                        insertText: s.body,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range,
                    })),
                };
            },
        });
    }

    expandEmmet(abbr) {
        const expansions = {
            '!': '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    \n</body>\n</html>',
            'div': '<div></div>',
            'span': '<span></span>',
            'p': '<p></p>',
            'a': '<a href=""></a>',
            'img': '<img src="" alt="">',
            'input': '<input type="text">',
            'button': '<button></button>',
            'ul': '<ul>\n    <li></li>\n</ul>',
            'ol': '<ol>\n    <li></li>\n</ol>',
            'li': '<li></li>',
            'table': '<table>\n    <tr>\n        <td></td>\n    </tr>\n</table>',
            'tr': '<tr></tr>',
            'td': '<td></td>',
            'th': '<th></th>',
            'form': '<form action="">\n    \n</form>',
            'nav': '<nav>\n    \n</nav>',
            'header': '<header>\n    \n</header>',
            'footer': '<footer>\n    \n</footer>',
            'section': '<section>\n    \n</section>',
            'article': '<article>\n    \n</article>',
            'main': '<main>\n    \n</main>',
            'aside': '<aside>\n    \n</aside>',
            'h1': '<h1></h1>',
            'h2': '<h2></h2>',
            'h3': '<h3></h3>',
            'br': '<br>',
            'hr': '<hr>',
        };
        const expanded = expansions[abbr];
        if (expanded) {
            this.editor.insertText(expanded);
            return true;
        }
        if (abbr.includes('>') || abbr.includes('+') || abbr.includes('.')) {
            this.editor.insertText(`<${abbr}></${abbr.split(/[>+.]/)[0]}>`);
            return true;
        }
        return false;
    }

    insertSnippet(snippetId) {
        for (const [, v] of Object.entries(this._snippets)) {
            const found = v.find(s => s.prefix === snippetId);
            if (found) {
                const lang = this.editor.editor?.getModel()?.getLanguageId() || 'javascript';
                const sel = this.editor.editor?.getSelection();
                const range = sel || { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 };
                this.editor.editor?.executeEdits('snippet', [
                    { range, text: found.body, forceMoveMarkers: true },
                ]);
                return true;
            }
        }
        return false;
    }
}
