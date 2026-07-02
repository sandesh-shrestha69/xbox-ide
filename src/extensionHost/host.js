process.on('message', (msg) => {
    if (msg.type === 'completion') {
        const mock = mockCompletions(msg.text);
        process.send({ type: 'completions', id: msg.id, suggestions: mock });
    }
    if (msg.type === 'diagnostics') {
        const diag = mockDiagnostics(msg.filePath, msg.content);
        process.send({ type: 'diagnostics', filePath: msg.filePath, markers: diag });
    }
    if (msg.type === 'ping') {
        process.send({ type: 'pong' });
    }
});

function mockCompletions(text) {
    const keywords = [
        'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'do',
        'return', 'class', 'import', 'export', 'from', 'async', 'await',
        'try', 'catch', 'finally', 'throw', 'switch', 'case', 'break',
        'continue', 'typeof', 'instanceof', 'new', 'delete', 'this',
        'super', 'extends', 'get', 'set', 'static', 'constructor',
        'null', 'undefined', 'true', 'false', 'NaN',
        'console.log', 'console.error', 'console.warn',
        'Array.from', 'Array.isArray', 'Object.keys', 'Object.values',
        'JSON.stringify', 'JSON.parse',
    ];
    const lastWord = text.split(/[\s\n(){}\[\];:,.=+-/*&|^~<>!?]+/).pop() || '';
    if (!lastWord) return [];
    return keywords
        .filter(k => k.startsWith(lastWord))
        .slice(0, 15)
        .map(k => ({ label: k, insertText: k, type: 'keyword' }));
}

function mockDiagnostics(filePath, content) {
    const lines = content.split('\n');
    const markers = [];
    const varDecl = /(?:let|const|var|function|class)\s+(\w+)/g;
    const declared = new Set();
    const skipWords = new Set([
        'let','const','var','function','return','if','else','elif',
        'for','while','class','import','export','from','this','super',
        'true','false','null','undefined','typeof','new','delete',
        'async','await','try','catch','throw','switch','case',
        'break','continue','in','of','instanceof','void','with',
        'yield','lambda','def','pass','raise','except','finally',
        'global','nonlocal','assert','del','print','len','range',
        'console','Object','Array','JSON','Promise','Number',
        'String','Math','Date','RegExp','Set','Map','Symbol',
        'document','window','setTimeout','setInterval',
        'fetch','require','module','exports','process',
        '__dirname','__filename','exports',
    ]);
    lines.forEach((line, i) => {
        let m;
        while ((m = varDecl.exec(line)) !== null) declared.add(m[1]);
    });

    lines.forEach((line, i) => {
        const clean = line.replace(/['"`][^'\"`]*['"`]/g, '').replace(/\/\/.*$/g, '');
        const tokens = clean.split(/[\s,;(){}\[\]+\-*/%=<>!&|^~?:]+/);
        const seen = new Set();
        for (const token of tokens) {
            const base = token.split('.')[0];
            if (!base || base.length < 3) continue;
            if (skipWords.has(base)) continue;
            if (declared.has(base)) continue;
            if (base[0] !== base[0].toLowerCase()) continue;
            if (seen.has(base)) continue;
            seen.add(base);
            markers.push({
                line: i + 1,
                column: line.indexOf(base) + 1,
                message: `'${base}' may be undefined`,
                severity: 'warning',
            });
            return;
        }
    });
    return markers;
}
