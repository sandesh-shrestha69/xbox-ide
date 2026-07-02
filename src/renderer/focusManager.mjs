export class FocusManager {
    constructor() {
        this.zones = [];
        this.activeZone = 0;
        this.activeItem = null;
    }

    registerZone(zone) {
        if (!this.zones.find(z => z.id === zone.id)) {
            this.zones.push(zone);
        }
    }

    get currentZone() { return this.zones[this.activeZone]; }

    focusZone(index) {
        if (index < 0 || index >= this.zones.length) return;
        this.activeZone = index;
        const zone = this.zones[this.activeZone];
        if (zone) zone.focus();
    }

    focusNextZone() {
        this.focusZone((this.activeZone + 1) % this.zones.length);
    }

    focusPrevZone() {
        this.focusZone((this.activeZone - 1 + this.zones.length) % this.zones.length);
    }

    navigate(dx, dy) {
        const zone = this.currentZone;
        if (zone) zone.navigate(dx, dy);
    }

    confirm() {
        const zone = this.currentZone;
        if (zone) zone.confirm();
    }

    back() {
        const zone = this.currentZone;
        if (zone) zone.back();
    }

    context() {
        const zone = this.currentZone;
        if (zone) zone.context();
    }

    selectItem(el) {
        if (this.activeItem) {
            this.activeItem.classList.remove('focused');
        }
        this.activeItem = el;
        if (this.activeItem) {
            this.activeItem.classList.add('focused');
            this.activeItem.scrollIntoView({ block: 'nearest' });
        }
    }

    clearFocus() {
        if (this.activeItem) {
            this.activeItem.classList.remove('focused');
            this.activeItem = null;
        }
    }
}
