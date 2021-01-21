var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "jquery", "../Component"], function (require, exports, Vue, $, Component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let SelectionInputPart = class SelectionInputPart extends Vue {
        constructor() {
            super(...arguments);
            this.text = "";
            this.focused = false;
        }
        get parent() { return this.$parent; }
        get width() { return this.getTextWidth(this.text); }
        mounted() {
            this.inputSizeEl = $("<span>").css({ display: "none" }).appendTo(this.parent.$el);
            this.$watch("text", () => this.parent.inputChanged(this));
        }
        getTextWidth(text) {
            return this.inputSizeEl ? this.inputSizeEl.text(text).width() : 0;
        }
        move(dir) { this.parent.move(this, dir); }
        get value() {
            var result = parseInt(this.text);
            return isNaN(result) ? null : result;
        }
    };
    SelectionInputPart = __decorate([
        Component_1.default
    ], SelectionInputPart);
    exports.SelectionInputPart = SelectionInputPart;
    let SelectionInput = class SelectionInput extends Vue {
        constructor() {
            super(...arguments);
            this.maxLength = Infinity;
            this.useHexAddr = true;
            this.hasSelection = false;
        }
        get startPart() { return this.$refs["startPart"]; }
        get endPart() { return this.$refs["endPart"]; }
        mounted() {
            this.$watch("start", () => this.sourceChanged());
            this.$watch("end", () => this.sourceChanged());
        }
        sourceChanged() {
            this.hasSelection = this.start !== -1;
            this.setAddrInput(this.startPart, this.hasSelection ? this.start : null);
            this.setAddrInput(this.endPart, this.hasSelection && this.start !== this.end ? this.end : null);
        }
        setAddrInput(ctrl, value) {
            const newValue = value < 0 ? 0 : value >= this.maxLength ? this.maxLength - 1 : value;
            ctrl.text = newValue === null ? "" : this.useHexAddr ? `0x${newValue.toString(16)}` : `${newValue}`;
        }
        move(ctrl, dir) {
            this.setAddrInput(ctrl, (ctrl.value || this.startPart.value || 0) + dir);
        }
        inputChanged(ctrl) {
            if (ctrl.value !== null)
                this.useHexAddr = ctrl.text.startsWith("0x");
            var start = this.startPart.value;
            var end = this.endPart.value;
            if (ctrl.focused)
                this.$emit("selection-changed", start !== null ? start : -1, end === null || end < start ? start : end);
        }
    };
    SelectionInput = __decorate([
        Component_1.default({ props: ["start", "end"] })
    ], SelectionInput);
    exports.SelectionInput = SelectionInput;
});
