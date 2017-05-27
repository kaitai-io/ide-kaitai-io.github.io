var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "./ui/ComponentLoader", "./ui/Component", "jquery"], function (require, exports, Vue, ComponentLoader_1, Component_1, $) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let App = class App extends Vue {
        constructor() {
            super(...arguments);
            this.selectedUri = null;
        }
        get fileTree() { return this.$refs["fileTree"]; }
        openFile(fsItem, data) {
            console.log("openFile", fsItem, data);
            this.selectedUri = fsItem.uri.uri;
        }
        generateParser() {
            console.log("generateParser", arguments);
        }
    };
    App = __decorate([
        Component_1.default
    ], App);
    ComponentLoader_1.componentLoader.load(["Components/TreeView", "Components/ContextMenu", "Components/InputModal", "Parts/FileTree"]).then(() => {
        var app = new App({ el: "#app" });
        app.fileTree.init();
        window["app"] = app;
        $('body').tooltip({ selector: '[data-toggle="tooltip"]', container: 'body', trigger: "click hover" });
    });
});
//# sourceMappingURL=sandbox.js.map