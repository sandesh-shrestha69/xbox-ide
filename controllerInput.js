import { XBOX_CONTROLLER_BUTTONS } from './constants';

export class ControllerInput {
    constructor() {
        this.listeners = {};
        this.radialMenuActive = false;
        this.radialMenuOptions = ['Function', 'If/Else', 'Loop', 'Class'];
        this.currentOptionIndex = 0;
    }

    on(button, callback) {
        if (!this.listeners[button]) {
            this.listeners[button] = [];
        }
        this.listeners[button].push(callback);
    }

    emit(button, event) {
        if (this.listeners[button]) {
            this.listeners[button].forEach(callback => callback(event));
        }
    }

    handleControllerInput(event) {
        const { button } = event;
        switch (button) {
            case XBOX_CONTROLLER_BUTTONS.A:
                if (this.radialMenuActive) {
                    this.selectRadialMenuOption();
                } else {
                    // Handle other actions
                }
                break;
            case XBOX_CONTROLLER_BUTTONS.B:
                if (this.radialMenuActive) {
                    this.closeRadialMenu();
                } else {
                    // Handle other actions
                }
                break;
            case XBOX_CONTROLLER_BUTTONS.X:
                if (!this.radialMenuActive) {
                    this.openRadialMenu();
                } else {
                    // Handle other actions
                }
                break;
            case XBOX_CONTROLLER_BUTTONS.Y:
                // Handle other actions
                break;
            case XBOX_CONTROLLER_BUTTONS.LEFT_STICK_UP:
                if (this.radialMenuActive) {
                    this.moveRadialMenuOption(-1);
                } else {
                    // Handle other actions
                }
                break;
            case XBOX_CONTROLLER_BUTTONS.LEFT_STICK_DOWN:
                if (this.radialMenuActive) {
                    this.moveRadialMenuOption(1);
                } else {
                    // Handle other actions
                }
                break;
            default:
                // Handle other actions
                break;
        }
    }

    openRadialMenu() {
        this.radialMenuActive = true;
        uiManager.focusElement('radial-menu');
    }

    closeRadialMenu() {
        this.radialMenuActive = false;
        uiManager.focusElement('code-editor-container');
    }

    moveRadialMenuOption(offset) {
        this.currentOptionIndex = (this.currentOptionIndex + offset + this.radialMenuOptions.length) % this.radialMenuOptions.length;
        uiManager.getElement('radial-menu').textContent = this.radialMenuOptions[this.currentOptionIndex];
    }

    selectRadialMenuOption() {
        const selectedOption = this.radialMenuOptions[this.currentOptionIndex];
        switch (selectedOption) {
            case 'Function':
                codeEditor.insertText('function myFunction() {\n\n}');
                break;
            case 'If/Else':
                codeEditor.insertText('if (condition) {\n\n} else {\n\n}');
                break;
            case 'Loop':
                codeEditor.insertText('for (let i = 0; i < length; i++) {\n\n}');
                break;
            case 'Class':
                codeEditor.insertText('class MyClass {\n\n}');
                break;
        }
        this.closeRadialMenu();
    }

    insertText(text) {
        const cursorPos = codeEditor.textarea.selectionStart;
        const textBeforeCursor = codeEditor.textarea.value.substring(0, cursorPos);
        const textAfterCursor = codeEditor.textarea.value.substring(cursorPos);
        codeEditor.textarea.value = textBeforeCursor + text + textAfterCursor;
        codeEditor.textarea.focus();
        codeEditor.textarea.setSelectionRange(cursorPos + text.length, cursorPos + text.length);
    }
}

export const controllerInput = new ControllerInput();
