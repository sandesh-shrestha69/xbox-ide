# xbox-ide

A code editor designed for use with an Xbox controller. Built with Electron.

## Features

- **Controller-driven UI** - Navigate, edit, and manage files entirely with an Xbox controller
- **Syntax highlighting** - Powered by Prism.js for JavaScript, TypeScript, Python, HTML, CSS, and more
- **IntelliSense** - Autocomplete popup with JavaScript keywords and snippets
- **File management** - Open/save dialogs, recent files, file tree explorer
- **Multi-tab editing** - Open multiple files with tab switching
- **Snippet insertion** - Quick code templates (function, if/else, loop, class) via radial menu
- **Voice control** - Speech recognition for common commands
- **Line numbers & gutter** - Full editor with line numbering
- **Settings panel** - Theme (dark/light), font size, tab size, word wrap
- **Keyboard fallback** - Arrow keys + A/B/X/Y mapped to controller buttons

## Controller Layout

| Button | Action |
|--------|--------|
| A | Select / Confirm |
| B | Open file / Close |
| X | Open snippet radial menu |
| Y | Save file |
| LB / RB | Switch tabs |
| DPAD | Navigate file tree |
| Left Stick | Navigate radial menu |
| START | Settings panel |
| BACK | Close tab / Close panel |

## Getting Started

```bash
npm install
npm start
```

Use `--dev` flag to open DevTools on startup.

## License

MIT
