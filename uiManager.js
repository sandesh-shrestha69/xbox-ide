import { XBOX_CONTROLLER_BUTTONS } from './constants';

export class UIManager {
    constructor() {
        this.elements = {};
    }

    addElement(id, element) {
        this.elements[id] = element;
    }

    getElement(id) {
        return this.elements[id];
    }

    focusElement(id) {
        const element = this.getElement(id);
        if (element) {
            element.focus();
        }
    }
}

export const uiManager = new UIManager();

// Add radial menu element
const radialMenu = document.createElement('div');
radialMenu.id = 'radial-menu';
radialMenu.textContent = controllerInput.radialMenuOptions[controllerInput.currentOptionIndex];
document.body.appendChild(radialMenu);
uiManager.addElement('radial-menu', radialMenu);

// Hide radial menu initially
radialMenu.style.display = 'none';

// Show radial menu when it's active
controllerInput.on(XBOX_CONTROLLER_BUTTONS.X, () => {
    if (controllerInput.radialMenuActive) {
        radialMenu.style.display = 'block';
    } else {
        radialMenu.style.display = 'none';
    }
});
