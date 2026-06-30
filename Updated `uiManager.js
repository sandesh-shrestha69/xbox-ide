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

    updateRadialMenuVisibility(visible) {
        const radialMenu = this.getElement('radial-menu');
        if (radialMenu) {
            radialMenu.style.display = visible ? 'block' : 'none';
        }
    }
}
