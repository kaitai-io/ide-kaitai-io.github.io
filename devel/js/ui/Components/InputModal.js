var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "../Component", "jquery"], function (require, exports, Vue, Component_1, $) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let InputModal = class InputModal extends Vue {
        constructor() {
            super(...arguments);
            this.value = "";
        }
        get inputEl() { return (this.$refs["input"]); }
        show(action = "show") {
            if (action === "show")
                this.value = "";
            $(this.$el).modal(action);
        }
        mounted() {
            $(this.$el).on("shown.bs.modal", () => this.inputEl.focus());
        }
        okClick() {
            this.show("hide");
            this.$emit('ok', this.value);
        }
    };
    InputModal = __decorate([
        Component_1.default({ props: { title: {}, okText: { default: "OK" }, paramName: {} } })
    ], InputModal);
    exports.InputModal = InputModal;
});
//# sourceMappingURL=InputModal.js.map