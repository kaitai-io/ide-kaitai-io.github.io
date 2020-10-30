var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "../Component", "../UIHelper"], function (require, exports, Vue, Component_1, UIHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ContextMenu = class ContextMenu extends Vue {
        constructor() {
            super(...arguments);
            this.visible = false;
            this.item = null;
            this.top = "0";
            this.left = "0";
        }
        open(event, model) {
            this.item = model;
            const parentRect = this.$el.parentElement.getBoundingClientRect();
            this.top = (event.pageY - parentRect.top) + "px";
            this.left = (event.pageX - parentRect.left) + "px";
            this.visible = true;
            window.addEventListener("click", this.clickHandler, true);
            window.addEventListener("keyup", this.escapeHandler, true);
        }
        escapeHandler(e) {
            if (e.keyCode === 27)
                this.hide();
        }
        clickHandler(e) {
            if (!this.$el.contains(e.target))
                this.hide();
        }
        hide() {
            window.removeEventListener("click", this.clickHandler, true);
            window.removeEventListener("keyup", this.escapeHandler, true);
            this.visible = false;
        }
    };
    ContextMenu = __decorate([
        Component_1.default
    ], ContextMenu);
    exports.ContextMenu = ContextMenu;
    let MenuItem = class MenuItem extends Vue {
        get ctxMenu() { return UIHelper_1.default.findParent(this, ContextMenu); }
        click(event) {
            if (!this.enabled || !("click" in this["_events"]))
                return;
            this.ctxMenu.visible = false;
            this.$emit("click");
            event.preventDefault();
        }
    };
    MenuItem = __decorate([
        Component_1.default({ props: { "icon": {}, "enabled": { default: true } } })
    ], MenuItem);
    exports.MenuItem = MenuItem;
});
//# sourceMappingURL=ContextMenu.js.map