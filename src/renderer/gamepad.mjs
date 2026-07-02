export class GamepadManager {
    constructor(commandRegistry, focusManager, editorController, keyboardOverlay) {
        this.cmds = commandRegistry;
        this.focus = focusManager;
        this.editor = editorController;
        this.kbd = keyboardOverlay;
        this.deadZone = 0.15;
        this.cooldown = 150;
        this.axisCooldown = 120;
        this._lastInput = {};
        this._lastAxis = {};
        this._running = false;
        this._prevButtons = [];
        this._prevAxes = [];

        this.BUTTON_INDEX = {
            A: 0, B: 1, X: 2, Y: 3,
            LB: 4, RB: 5, LT: 6, RT: 7,
            BACK: 8, START: 9, LS: 10, RS: 11,
            DPAD_UP: 12, DPAD_DOWN: 13, DPAD_LEFT: 14, DPAD_RIGHT: 15,
        };

        this._repeaterTimers = {};
        this.repeatDelay = 300;
        this.repeatRate = 80;
    }

    start() {
        this._running = true;
        this._poll();
    }

    stop() { this._running = false; }

    _poll() {
        if (!this._running) return;
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gp = gamepads[0];
        if (gp) {
            this._processButtons(gp);
            this._processAxes(gp);
        }
        requestAnimationFrame(() => this._poll());
    }

    _processButtons(gp) {
        const now = Date.now();
        for (let i = 0; i < gp.buttons.length; i++) {
            const pressed = gp.buttons[i].pressed;
            const prev = this._prevButtons[i] || false;
            const cooldown = this._lastInput[i] || 0;

            if (i === 0) { // A
                if (pressed && !prev && now - cooldown > this.cooldown) {
                    this._lastInput[i] = now;
                    this.focus.confirm();
                }
            } else if (i === 1) { // B
                if (pressed && !prev && now - cooldown > this.cooldown) {
                    this._lastInput[i] = now;
                    this.focus.back();
                }
            } else if (i === 2) { // X
                if (pressed && !prev && now - cooldown > this.cooldown) {
                    this._lastInput[i] = now;
                    this.cmds.execute('contextMenu');
                }
            } else if (i === 3) { // Y
                if (pressed && !prev && now - cooldown > this.cooldown) {
                    this._lastInput[i] = now;
                    this.cmds.execute('commandPalette.open');
                }
            } else if (i === 4) { // LB
                if (pressed && !prev && now - cooldown > this.cooldown) {
                    this._lastInput[i] = now;
                    if (this.kbd.isOpen) this.kbd.prevLayer();
                    else this.cmds.execute('tab.prev');
                }
            } else if (i === 5) { // RB
                if (pressed && !prev && now - cooldown > this.cooldown) {
                    this._lastInput[i] = now;
                    if (this.kbd.isOpen) this.kbd.nextLayer();
                    else this.cmds.execute('tab.next');
                }
            } else if (i === 6) { // LT
                if (pressed && !prev && now - cooldown > this.cooldown) {
                    this._lastInput[i] = now;
                    this.focus.focusPrevZone();
                }
            } else if (i === 7) { // RT
                if (pressed && !prev && now - cooldown > this.cooldown) {
                    this._lastInput[i] = now;
                    this.focus.focusNextZone();
                }
            } else if (i === 8) { // BACK
                if (pressed && !prev && now - cooldown > this.cooldown) {
                    this._lastInput[i] = now;
                    this.cmds.execute('keyboard.toggle');
                }
            } else if (i === 9) { // START
                if (pressed && !prev && now - cooldown > this.cooldown) {
                    this._lastInput[i] = now;
                    this.cmds.execute('settings.open');
                }
            } else if (i === 10) { // LS
                if (pressed && !prev && now - cooldown > this.cooldown) {
                    this._lastInput[i] = now;
                    this.cmds.execute('keyboard.toggle');
                }
            } else if (i === 12) { // DPAD UP
                if (pressed && !prev && now - cooldown > this.cooldown) {
                    this._lastInput[i] = now;
                    this.focus.navigate(0, -1);
                }
            } else if (i === 13) { // DPAD DOWN
                if (pressed && !prev && now - cooldown > this.cooldown) {
                    this._lastInput[i] = now;
                    this.focus.navigate(0, 1);
                }
            } else if (i === 14) { // DPAD LEFT
                if (pressed && !prev && now - cooldown > this.cooldown) {
                    this._lastInput[i] = now;
                    this.focus.navigate(-1, 0);
                }
            } else if (i === 15) { // DPAD RIGHT
                if (pressed && !prev && now - cooldown > this.cooldown) {
                    this._lastInput[i] = now;
                    this.focus.navigate(1, 0);
                }
            }
            this._prevButtons[i] = pressed;
        }
    }

    _processAxes(gp) {
        const now = Date.now();
        if (gp.axes.length < 4) return;
        const lx = gp.axes[0];
        const ly = gp.axes[1];
        const rx = gp.axes[2];
        const ry = gp.axes[3];

        let lxAbs = Math.abs(lx);
        let lyAbs = Math.abs(ly);
        let rxAbs = Math.abs(rx);
        let ryAbs = Math.abs(ry);

        if (lxAbs < this.deadZone) lxAbs = 0;
        if (lyAbs < this.deadZone) lyAbs = 0;
        if (rxAbs < this.deadZone) rxAbs = 0;
        if (ryAbs < this.deadZone) ryAbs = 0;

        if (rxAbs > this.deadZone || ryAbs > this.deadZone) {
            this.editor.scroll(rx * rxAbs * 0.5, ry * ryAbs * 0.5);
        }

        if (lxAbs > this.deadZone || lyAbs > this.deadZone) {
            const lxSign = Math.sign(lx);
            const lySign = Math.sign(ly);
            const prevLx = this._prevAxes[0] || 0;
            const prevLy = this._prevAxes[1] || 0;

            if (lxAbs > this.deadZone && (lxSign !== Math.sign(prevLx) || now - (this._lastAxis['lx'] || 0) > this.axisCooldown)) {
                this._lastAxis['lx'] = now;
                if (lxAbs > 0.7) this.focus.navigate(lxSign, 0);
                else this.editor.moveCursor(lxSign, 0);
            }
            if (lyAbs > this.deadZone && (lySign !== Math.sign(prevLy) || now - (this._lastAxis['ly'] || 0) > this.axisCooldown)) {
                this._lastAxis['ly'] = now;
                if (lyAbs > 0.7) this.focus.navigate(0, lySign);
                else this.editor.moveCursor(0, lySign);
            }
        }

        this._prevAxes[0] = lx;
        this._prevAxes[1] = ly;
        this._prevAxes[2] = rx;
        this._prevAxes[3] = ry;
    }
}
