export class UserManual {
    constructor() {
        this.el = document.getElementById('right-panel');
        this.contentEl = document.getElementById('minimap-content');
        this.headerEl = document.getElementById('minimap-header');
        this._visible = false;
    }

    show() {
        this._visible = true;
        this.el.classList.add('open');
        this.headerEl.textContent = 'CONTROLS';
        this._render();
    }

    hide() {
        this._visible = false;
        this.el.classList.remove('open');
    }

    toggle() {
        if (this._visible) this.hide();
        else this.show();
    }

    _render() {
        this.contentEl.innerHTML = `
<div style="padding:4px;font-size:11px;color:#d4d4d4;font-family:monospace;line-height:1.6">
<div style="color:#4ec9b0;font-weight:bold;font-size:12px;margin-bottom:6px;">XBOX IDE — CONTROLS</div>

<div style="color:#569cd6;margin:8px 0 4px;">NAVIGATION</div>
<div>D-Pad         Move focus / select</div>
<div>Left Stick    Move cursor (light) / focus (hard)</div>
<div>Right Stick   Scroll editor</div>
<div>LT / RT       Previous / Next focus zone</div>

<div style="color:#569cd6;margin:8px 0 4px;">ACTIONS</div>
<div>A            Confirm / open / select</div>
<div>B            Back / close overlay</div>
<div>X            Context menu</div>
<div>Y            Command palette</div>

<div style="color:#569cd6;margin:8px 0 4px;">TABS & KEYBOARD</div>
<div>LB           Previous tab / keyboard layer</div>
<div>RB           Next tab / keyboard layer</div>
<div>BACK / L3    Toggle on-screen keyboard</div>

<div style="color:#569cd6;margin:8px 0 4px;">SYSTEM</div>
<div>START        Settings</div>

<div style="color:#569cd6;margin:8px 0 4px;">FOCUS ZONES</div>
<div>0  Explorer   File tree navigation</div>
<div>1  Editor     Code editing area</div>
<div>2  Find       Find/replace overlay</div>
<div>3  Git        Git status panel</div>
<div>4  Terminal   Shell terminal</div>
<div>5  Split      Split editor panes</div>

<div style="color:#569cd6;margin:8px 0 4px;">KEYBOARD LAYERS</div>
<div>ABC  Uppercase letters</div>
<div>abc  Lowercase letters</div>
<div>123  Numbers & symbols</div>
<div>#+=  Extended symbols</div>
<div>KW   Python keywords</div>
<div>LB/RB cycles layers</div>

<div style="color:#569cd6;margin:8px 0 4px;">COMMANDS (Y then search)</div>
<div>file.open        Open file</div>
<div>file.save        Save</div>
<div>file.new         New file</div>
<div>file.saveAs      Save As</div>
<div>find.open        Find</div>
<div>find.replace     Find & Replace</div>
<div>git.toggle       Git panel</div>
<div>git.commit       Git commit</div>
<div>terminal.focus   Terminal</div>
<div>keyboard.toggle  Keyboard</div>
<div>settings.open    Settings</div>
<div>split.horizontal Split editor</div>
<div>explorer.toggle  Toggle sidebar</div>
<div>panel.toggle     Toggle panel</div>
<div>editor.format    Format code</div>
<div>editor.comment   Toggle comment</div>
</div>`;
    }
}
