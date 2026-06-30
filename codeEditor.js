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
            saveFile('path/to/save/file.txt', content);
        });

        controllerInput.on(XBOX_CONTROLLER_BUTTONS.B, () => {
            // Open file logic
            openFile('path/to/open/file.txt');
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
}

export const codeEditor = new CodeEditor('code-editor-container');
