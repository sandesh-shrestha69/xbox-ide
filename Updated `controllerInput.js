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
                if (!this.radialMenuActive) {
                    this.openRadialMenu();
                } else {
                    this.closeRadialMenu();
                }
                break;
            case XBOX_CONTROLLER_BUTTONS.X:
                if (this.radialMenuActive) {
                    this.moveRadialMenuOption(-1);
                }
                break;
            case XBOX_CONTROLLER_BUTTONS.Y:
                if (this.radialMenuActive) {
                    this.moveRadialMenuOption(1);
                }
                break;
            case XBOX_CONTROLLER_BUTTONS.LEFT_STICK_UP:
                codeEditor.moveCursor('up');
                break;
            case XBOX_CONTROLLER_BUTTONS.LEFT_STICK_DOWN:
                codeEditor.moveCursor('down');
                break;
            case XBOX_CONTROLLER_BUTTONS.LEFT_STICK_LEFT:
                codeEditor.moveCursor('left');
                break;
            case XBOX_CONTROLLER_BUTTONS.LEFT_STICK_RIGHT:
                codeEditor.moveCursor('right');
                break;
            case XBOX_CONTROLLER_BUTTONS.DPAD_UP:
                this.navigate('up');
                break;
            case XBOX_CONTROLLER_BUTTONS.DPAD_DOWN:
                this.navigate('down');
                break;
            case XBOX_CONTROLLER_BUTTONS.DPAD_LEFT:
                this.navigate('left');
                break;
            case XBOX_CONTROLLER_BUTTONS.DPAD_RIGHT:
                this.navigate('right');
                break;
            default:
                // Handle other controller inputs
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
    }

    insertText(text) {
        const cursorPos = codeEditor.textarea.selectionStart;
        const textBeforeCursor = codeEditor.textarea.value.substring(0, cursorPos);
        const textAfterCursor = codeEditor.textarea.value.substring(cursorPos);
        codeEditor.textarea.value = textBeforeCursor + text + textAfterCursor;
        codeEditor.textarea.focus();
        codeEditor.textarea.setSelectionRange(cursorPos + text.length, cursorPos + text.length);
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
