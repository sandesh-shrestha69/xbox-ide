import { ControllerInput } from './controllerInput';
import { UIManager } from './uiManager';
import { CodeEditor } from './codeEditor';

const controllerInput = new ControllerInput();
const uiManager = new UIManager();
const codeEditor = new CodeEditor('code-editor-container');

// Initialize radial menu
const radialMenu = document.getElementById('radial-menu');
uiManager.addElement('radial-menu', radialMenu);

// Handle right joystick movement to show/hide radial menu
controllerInput.on(XBOX_CONTROLLER_BUTTONS.RIGHT_STICK_UP, () => {
    uiManager.updateRadialMenuVisibility(true);
});

controllerInput.on(XBOX_CONTROLLER_BUTTONS.RIGHT_STICK_DOWN, () => {
    uiManager.updateRadialMenuVisibility(false);
});
