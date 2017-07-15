define(["require", "exports", "vue", "jquery", "./AppLayout", "./ui/Parts/ParsedTree", "./ui/Components/ConverterPanel", "./ui/Parts/InfoPanel", "./ui/Parts/AboutModal", "./HexViewer", "./ui/Parts/FileTree", "./ui/Parts/ErrorWindow", "./ui/Components/DragAndDrop"], function (require, exports, Vue, $, AppLayout_1, ParsedTree_1, ConverterPanel_1, InfoPanel_1, AboutModal_1, HexViewer_1, FileTree_1, ErrorWindow_1, DragAndDrop_1) {
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
            this.dragAndDrop = new DragAndDrop_1.DragAndDrop();
            this.dragAndDrop.$mount($("<div>").appendTo(document.body).get(0));
        }
        nextTick(action) {
            return new Promise((resolve, reject) => {
                Vue.nextTick(() => {
                    try {
                        action();
                        resolve();
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            });
        }
        showError(errorMsg) {
            this.layout.errors.show();
            var errorWnd = new ErrorWindow_1.ErrorWindow();
            errorWnd.errorMsg = errorMsg;
            errorWnd.$mount($("<div>").appendTo(this.layout.errors.component.element).get(0));
        }
        hideErrors() {
            this.layout.errors.hide();
        }
        addFileView(title, content, lang) {
            const component = this.layout.files.addComponent(title, { isClosable: true });
            const editor = AppLayout_1.LayoutHelper.setupEditor(component, lang);
            editor.setValue(content, -1);
            return editor;
        }
    }
    exports.AppView = AppView;
});
//# sourceMappingURL=AppView.js.map