define(["require", "exports", "./AppView", "./LocalSettings", "./ui/Parts/FileTree", "./utils", "./SandboxHandler", "./ui/Parts/ParsedTree", "./ParsedMap"], function (require, exports, AppView_1, LocalSettings_1, FileTree_1, utils_1, SandboxHandler_1, ParsedTree_1, ParsedMap_1) {
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
                console.log('treeView openFile', treeNode);
                this.openFile(treeNode.uri.uri);
            });
            var editDelay = new utils_1.Delayed(500);
            this.view.ksyEditor.on("change", () => editDelay.do(() => this.setKsyContent(this.view.ksyEditor.getValue())));
            this.view.hexViewer.onSelectionChanged = () => {
                this.setSelection(this.view.hexViewer.selectionStart, this.view.hexViewer.selectionEnd);
            };
            this.view.parsedTree.treeView.$on("selected", (node) => {
                this.setSelection(node.value.start, node.value.end - 1, "ParsedTree");
                this.view.infoPanel.parsedPath = node.value.path.join("/");
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
                    let itemPathToSelect = itemMatches[0].exp.path.join('/');
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