var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "../Component", "jquery", "../../LocalSettings", "bootstrap"], function (require, exports, Vue, Component_1, $, LocalSettings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let AboutModal = class AboutModal extends Vue {
        constructor() {
            super(...arguments);
            this.webideVersion = "?";
            this.webideCommitUrl = "https://github.com/kaitai-io/kaitai_struct_webide/commits";
            this.webideCommitId = "?";
            this.webideCommitDate = "?";
            this.compilerVersion = "?";
            this.compilerBuildDate = "?";
        }
        created() {
            this.$mount(document.createElement("div"));
        }
        mounted() {
            if (LocalSettings_1.localSettings.showAboutOnStart)
                this.show();
        }
        doNotShowOnStart() {
            LocalSettings_1.localSettings.showAboutOnStart = false;
        }
        show() {
            $(this.$el).modal();
        }
    };
    AboutModal = __decorate([
        Component_1.default
    ], AboutModal);
    exports.AboutModal = AboutModal;
});
//# sourceMappingURL=AboutModal.js.map