define(["require", "exports", "./AppView", "./LocalSettings", "./ui/Parts/FileTree", "./utils", "./SandboxHandler", "./ui/Parts/ParsedTree"], function (require, exports, AppView_1, LocalSettings_1, FileTree_1, utils_1, SandboxHandler_1, ParsedTree_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AppController {
        async start() {
            this.initView();
            await this.initWorker();
            await this.openFile(LocalSettings_1.localSettings.latestKsyUri);
            await this.openFile(LocalSettings_1.localSettings.latestInputUri);
        }
        initView() {
            this.view = new AppView_1.AppView();
            this.view.fileTree.$on("open-file", (treeNode) => {
                console.log('treeView openFile', treeNode);
                this.openFile(treeNode.uri.uri);
            });
            var editDelay = new utils_1.Delayed(500);
            this.view.ksyEditor.on("change", () => editDelay.do(() => this.setKsyContent(this.view.ksyEditor.getValue())));
            this.view.hexViewer.onSelectionChanged = () => {
                console.log("selectionChanged");
                this.view.converterPanel.model.update(this.dataProvider, this.view.hexViewer.selectionStart);
                this.view.infoPanel.selectionStart = this.view.hexViewer.selectionStart;
                this.view.infoPanel.selectionEnd = this.view.hexViewer.selectionEnd;
            };
        }
        async initWorker() {
            this.sandbox = SandboxHandler_1.SandboxHandler.create("https://webide-usercontent.kaitai.io");
            await this.sandbox.loadScript(new URL("js/worker/worker/ImportLoader.js", location.href).href);
            await this.sandbox.loadScript(new URL("js/worker/worker/KaitaiWorkerV2.js", location.href).href);
            var compilerInfo = await this.sandbox.kaitaiServices.getCompilerInfo();
            this.view.aboutModal.compilerVersion = compilerInfo.version;
            this.view.aboutModal.compilerBuildDate = compilerInfo.buildDate;
        }
        async openFile(uri) {
            let content = await FileTree_1.fss.read(uri);
            if (uri.endsWith(".ksy")) {
                LocalSettings_1.localSettings.latestKsyUri = uri;
                let ksyContent = new TextDecoder().decode(new Uint8Array(content));
                this.setKsyContent(ksyContent);
            }
            else {
                LocalSettings_1.localSettings.latestInputUri = uri;
                this.setInput(content);
            }
        }
        async setKsyContent(ksyContent) {
            if (this.view.ksyEditor.getValue() !== ksyContent)
                this.view.ksyEditor.setValue(ksyContent, -1);
            var compilationResult = await this.sandbox.kaitaiServices.compile(ksyContent);
            console.log("compilationResult", compilationResult);
            this.view.jsCode.setValue(Object.values(compilationResult.releaseCode).join("\n"), -1);
            this.view.jsCodeDebug.setValue(compilationResult.debugCodeAll, -1);
            await this.reparse();
        }
        async setInput(input) {
            this.dataProvider = {
                length: input.byteLength,
                get(offset, length) { return new Uint8Array(input, offset, length); }
            };
            this.view.hexViewer.setDataProvider(this.dataProvider);
            this.view.converterPanel.model.update(this.dataProvider, 0);
            await this.sandbox.kaitaiServices.setInput(input);
            await this.reparse();
        }
        async reparse() {
            await this.sandbox.kaitaiServices.parse();
            let exported = await this.sandbox.kaitaiServices.export();
            console.log("exported", exported);
            this.view.parsedTree.rootNode = new ParsedTree_1.ParsedTreeRootNode(new ParsedTree_1.ParsedTreeNode("", exported));
        }
    }
    var app = window["ide"] = new AppController();
    app.start();
});
//# sourceMappingURL=v2.js.map