define(["require", "exports", "./AppView", "./LocalSettings", "./ui/Parts/FileTree", "./utils", "./ui/Parts/ParsedTree", "./ParsedMap", "./KaitaiSandbox", "./utils/Conversion"], function (require, exports, AppView_1, LocalSettings_1, FileTree_1, utils_1, ParsedTree_1, ParsedMap_1, KaitaiSandbox_1, Conversion_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AppController {
        constructor() {
            this.blockSelection = false;
        }
        async start() {
            this.initView();
            await this.initWorker();
            await this.openFile(LocalSettings_1.localSettings.latestKsyUri);
            await this.openFile(LocalSettings_1.localSettings.latestInputUri);
        }
        initView() {
            this.view = new AppView_1.AppView();
            this.view.fileTree.$on("open-file", (treeNode) => {
                console.log("treeView openFile", treeNode);
                this.openFile(treeNode.uri.uri);
            });
            var editDelay = new utils_1.Delayed(500);
            this.view.ksyEditor.on("change", () => editDelay.do(() => this.compile(this.view.ksyEditor.getValue())));
            this.view.hexViewer.onSelectionChanged = () => {
                this.setSelection(this.view.hexViewer.selectionStart, this.view.hexViewer.selectionEnd);
            };
            this.view.parsedTree.treeView.$on("selected", (node) => {
                this.setSelection(node.value.start, node.value.end - 1, "ParsedTree");
                this.view.infoPanel.parsedPath = node.value.path.join("/");
            });
            this.view.fileTree.$on("generate-parser", async (lang, aceLang, debug, ksyContent) => {
                const generatedFiles = await this.sandbox.kaitaiServices.generateParser(ksyContent, lang, debug);
                for (let fileName in generatedFiles)
                    this.view.addFileView(fileName, generatedFiles[fileName], aceLang);
            });
            this.view.dragAndDrop.$on("files-uploaded", async (files) => {
                const newFileUris = await this.view.fileTree.uploadFiles(files);
                if (newFileUris.length === 1)
                    this.openFile(newFileUris[0]);
            });
        }
        async setSelection(start, end, origin) {
            if (this.blockSelection)
                return;
            this.blockSelection = true;
            try {
                this.view.hexViewer.setSelection(start, end);
                this.view.converterPanel.model.update(this.dataProvider, start);
                this.view.infoPanel.selectionStart = start;
                this.view.infoPanel.selectionEnd = end;
                let itemMatches = this.parsedMap.intervalHandler.searchRange(start, end).items;
                if (itemMatches.length > 0) {
                    let itemPathToSelect = itemMatches[0].exp.path.join("/");
                    this.view.infoPanel.parsedPath = itemPathToSelect;
                    if (origin !== "ParsedTree") {
                        let node = await this.openNode(itemPathToSelect);
                        this.view.parsedTree.treeView.setSelected(node);
                    }
                }
                LocalSettings_1.localSettings.latestSelection = { start, end };
            }
            finally {
                this.blockSelection = false;
            }
        }
        async initWorker() {
            this.sandbox = await KaitaiSandbox_1.InitKaitaiSandbox();
            var compilerInfo = await this.sandbox.kaitaiServices.getCompilerInfo();
            this.view.aboutModal.compilerVersion = compilerInfo.version;
            this.view.aboutModal.compilerBuildDate = compilerInfo.buildDate;
        }
        async openFile(uri) {
            let content = await FileTree_1.fss.read(uri);
            if (uri.endsWith(".ksy")) {
                LocalSettings_1.localSettings.latestKsyUri = uri;
                const ksyContent = Conversion_1.Conversion.utf8BytesToStr(content);
                this.compile(ksyContent);
            }
            else {
                LocalSettings_1.localSettings.latestInputUri = uri;
                this.setInput(content);
            }
        }
        async compile(ksyContent) {
            if (this.view.ksyEditor.getValue() !== ksyContent)
                this.view.ksyEditor.setValue(ksyContent, -1);
            try {
                this.view.hideErrors();
                var compilationResult = await this.sandbox.kaitaiServices.compile(ksyContent);
                console.log("compilationResult", compilationResult);
                this.view.jsCode.setValue(Object.values(compilationResult.releaseCode).join("\n"), -1);
                this.view.jsCodeDebug.setValue(compilationResult.debugCodeAll, -1);
                await this.reparse();
            }
            catch (e) {
                if (e instanceof KaitaiSandbox_1.ParseError) {
                    //e.value.parsedLine
                }
                if (e instanceof Error)
                    this.view.showError(e.message);
                console.log("compile error", typeof e, e);
            }
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
            this.exported = await this.sandbox.kaitaiServices.export();
            console.log("exported", this.exported);
            this.parsedMap = new ParsedMap_1.ParsedMap(this.exported);
            this.view.infoPanel.unparsed = this.parsedMap.unparsed;
            this.view.infoPanel.byteArrays = this.parsedMap.byteArrays;
            this.view.hexViewer.setIntervals(this.parsedMap.intervalHandler);
            this.view.parsedTree.rootNode = null;
            await this.view.nextTick(() => this.view.parsedTree.rootNode = new ParsedTree_1.ParsedTreeRootNode(new ParsedTree_1.ParsedTreeNode("", this.exported)));
            this.setSelection(LocalSettings_1.localSettings.latestSelection.start, LocalSettings_1.localSettings.latestSelection.end);
        }
        async openNode(path) {
            let pathParts = path.split("/");
            var currNode = this.view.parsedTree.treeView.children[0];
            for (let pathPart of pathParts) {
                await currNode.openNode();
                currNode = currNode.children.find(x => x.model.value.path.last() === pathPart);
                if (!currNode) {
                    console.error(`openNode: next node not found: ${pathPart} (${path})`);
                    return;
                }
            }
            await currNode.openNode();
            return currNode;
        }
    }
    var app = window["ide"] = new AppController();
    app.start();
});
//# sourceMappingURL=v2.js.map