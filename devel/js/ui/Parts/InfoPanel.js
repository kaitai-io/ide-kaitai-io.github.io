var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "../Component", "../Components/Stepper", "../Components/SelectionInput"], function (require, exports, Vue, Component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let InfoPanel = class InfoPanel extends Vue {
        constructor() {
            super(...arguments);
            this.selectionStart = -1;
            this.selectionEnd = -1;
            this.unparsed = [];
            this.byteArrays = [];
            this.disableLazyParsing = false;
            this.parsedPath = "";
        }
        selectInterval(interval) { this.selectionChanged(interval.start, interval.end); }
        selectionChanged(start, end) { }
        exportToJson(hex) { }
        about() { this.aboutModal.show(); }
    };
    InfoPanel = __decorate([
        Component_1.default
    ], InfoPanel);
    exports.InfoPanel = InfoPanel;
});
//# sourceMappingURL=InfoPanel.js.map