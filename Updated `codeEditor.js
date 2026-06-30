import { XBOX_CONTROLLER_BUTTONS } from './constants';

export class CodeEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.textarea = document.createElement('textarea');
        this.textarea.id = 'code-editor';
        this.container.appendChild(this.textarea);

        controllerInput.on(XBOX_CONTROLLER_BUTTONS.A, () => {
            // Save file logic
            const content = this.textarea.value;
            saveFile('path/to/save/file', content);
        });

        controllerInput.on(XBOX_CONTROLLER_BUTTONS.B, () => {
            // Undo logic
            this.undo();
        });

        controllerInput.on(XBOX_CONTROLLER_BUTTONS.X, () => {
            // Redo logic
            this.redo();
        });

        controllerInput.on(XBOX_CONTROLLER_BUTTONS.Y, () => {
            // Cut logic
            this.cut();
        });
    }

    focus() {
        this.textarea.focus();
    }

    insertText(text) {
        const cursorPos = this.textarea.selectionStart;
        const textBeforeCursor = this.textarea.value.substring(0, cursorPos);
        const textAfterCursor = this.textarea.value.substring(cursorPos);
        this.textarea.value = textBeforeCursor + text + textAfterCursor;
        this.textarea.focus();
        this.textarea.setSelectionRange(cursorPos + text.length, cursorPos + text.length);
    }

    undo() {
        // Implement undo logic
        if (this.undoStack.length > 0) {
            const previousContent = this.undoStack.pop();
            this.redoStack.push(this.textarea.value);
            this.textarea.value = previousContent;
            this.textarea.focus();
        }
    }

    redo() {
        // Implement redo logic
        if (this.redoStack.length > 0) {
            const nextContent = this.redoStack.pop();
            this.undoStack.push(this.textarea.value);
            this.textarea.value = nextContent;
            this.textarea.focus();
        }
    }

    cut() {
        const selectedText = this.textarea.value.substring(this.textarea.selectionStart, this.textarea.selectionEnd);
        if (selectedText) {
            navigator.clipboard.writeText(selectedText).then(() => {
                this.textarea.value = this.textarea.value.replace(selectedText, '');
                this.textarea.focus();
            });
        }
    }

    copy() {
        const selectedText = this.textarea.value.substring(this.textarea.selectionStart, this.textarea.selectionEnd);
        if (selectedText) {
            navigator.clipboard.writeText(selectedText).then(() => {
                // No need to modify the textarea value
            });
        }
    }

    paste() {
        navigator.clipboard.readText().then(text => {
            const cursorPos = this.textarea.selectionStart;
            const textBeforeCursor = this.textarea.value.substring(0, cursorPos);
            const textAfterCursor = this.textarea.value.substring(cursorPos);
            this.textarea.value = textBeforeCursor + text + textAfterCursor;
            this.textarea.focus();
            this.textarea.setSelectionRange(cursorPos + text.length, cursorPos + text.length);
        });
    }

    moveCursor(direction) {
        const cursorPos = this.textarea.selectionStart;
        let newCursorPos;

        switch (direction) {
            case 'left':
                newCursorPos = Math.max(0, cursorPos - 1);
                break;
            case 'right':
                newCursorPos = Math.min(this.textarea.value.length, cursorPos + 1);
                break;
            case 'up':
                const lines = this.textarea.value.substring(0, cursorPos).split('\n');
                if (lines.length > 1) {
                    const currentLineLength = lines[lines.length - 1].length;
                    newCursorPos = cursorPos - currentLineLength - 1;
                } else {
                    newCursorPos = Math.max(0, cursorPos - 1);
                }
                break;
            case 'down':
                const nextLines = this.textarea.value.substring(cursorPos).split('\n');
                if (nextLines.length > 1) {
                    const currentLineLength = lines[lines.length - 1].length;
                    newCursorPos = cursorPos + currentLineLength + 2;
                } else {
                    newCursorPos = Math.min(this.textarea.value.length, cursorPos + 1);
                }
                break;
            default:
                newCursorPos = cursorPos;
        }

        this.textarea.setSelectionRange(newCursorPos, newCursorPos);
    }

    navigate(direction) {
        // Implement navigation logic
        switch (direction) {
            case 'up':
                // Navigate up logic
                console.log('Navigating up');
                break;
            case 'down':
                // Navigate down logic
                console.log('Navigating down');
                break;
            case 'left':
                // Navigate left logic
                console.log('Navigating left');
                break;
            case 'right':
                // Navigate right logic
                console.log('Navigating right');
                break;
        }
    }

    get undoStack() {
        return this._undoStack || (this._undoStack = []);
    }

    set undoStack(stack) {
        this._undoStack = stack;
    }

    get redoStack() {
        return this._redoStack || (this._redoStack = []);
    }

    set redoStack(stack) {
        this._redoStack = stack;
    }
}
