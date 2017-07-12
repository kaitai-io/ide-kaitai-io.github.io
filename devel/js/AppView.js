define(["require", "exports", "./AppLayout", "./ui/Parts/ParsedTree", "./ui/Components/ConverterPanel", "./ui/Parts/InfoPanel", "./ui/Parts/AboutModal", "./HexViewer", "./ui/Parts/FileTree"], function (require, exports, AppLayout_1, ParsedTree_1, ConverterPanel_1, InfoPanel_1, AboutModal_1, HexViewer_1, FileTree_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AppView {
        constructor() {
            this.layout = new AppLayout_1.Layout();
            this.fileTree = new FileTree_1.FileTree();
            this.fileTree.init();
            this.fileTree.$mount(this.layout.fileTree.element);
            this.ksyEditor = AppLayout_1.LayoutHelper.setupEditor(this.layout.ksyEditor, "yaml");
            this.jsCode = AppLayout_1.LayoutHelper.setupEditor(this.layout.jsCode, "javascript");
            this.jsCodeDebug = AppLayout_1.LayoutHelper.setupEditor(this.layout.jsCodeDebug, "javascript");
            this.aboutModal = new AboutModal_1.AboutModal();
            this.hexViewer = new HexViewer_1.HexViewer(this.layout.inputBinary.element);
            this.layout.inputBinary.container.on("resize", () => this.hexViewer.resize());
            this.infoPanel = new InfoPanel_1.InfoPanel();
            this.infoPanel.$mount(this.layout.infoPanel.element);
            this.infoPanel.aboutModal = this.aboutModal;
            this.converterPanel = new ConverterPanel_1.ConverterPanel();
            this.converterPanel.$mount(this.layout.converterPanel.element);
            this.parsedTree = new ParsedTree_1.ParsedTree();
            this.parsedTree.$mount(this.layout.objectTree.element);
        }
    }
    exports.AppView = AppView;
});
//# sourceMappingURL=AppView.js.map