import { controllerInput } from './controllerInput';
import { uiManager } from './uiManager';
import { codeEditor } from './codeEditor';

// Initialize UI elements
const editorContainer = document.createElement('div');
editorContainer.id = 'code-editor-container';
document.body.appendChild(editorContainer);

// Focus on the code editor when the app starts
codeEditor.focus();

// Example of adding a button to the UI
const openButton = document.createElement('button');
openButton.textContent = 'Open File';
openButton.addEventListener('click', () => {
    controllerInput.emit(XBOX_CONTROLLER_BUTTONS.B);
});
document.body.appendChild(openButton);

const saveButton = document.createElement('button');
saveButton.textContent = 'Save File';
saveButton.addEventListener('click', () => {
    controllerInput.emit(XBOX_CONTROLLER_BUTTONS.A);
});
document.body.appendChild(saveButton);
