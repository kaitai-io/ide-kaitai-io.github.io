define(["require", "exports", "./AppView", "./LocalSettings", "./ui/Parts/FileTree", "./ui/Parts/ParsedTree", "./ParsedMap", "./KaitaiSandbox", "./utils/Conversion", "./FileSystem/FsUri", "./ui/UIHelper"], function (require, exports, AppView_1, LocalSettings_1, FileTree_1, ParsedTree_1, ParsedMap_1, KaitaiSandbox_1, Conversion_1, FsUri_1, UIHelper_1) {
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
            await this.openFile(LocalSettings_1.localSettings.latestKcyUri);
            await this.openFile(LocalSettings_1.localSettings.latestInputUri);
        }
        initView() {
            this.view = new AppView_1.AppView();
            this.view.fileTree.$on("open-file", (treeNode) => {
                console.log("treeView openFile", treeNode);
                this.openFile(treeNode.uri.uri);
            });
            this.ksyChangeHandler = new UIHelper_1.EditorChangeHandler(this.view.ksyEditor, 500, (newContent, userChange) => this.inputFileChanged("Ksy", newContent, userChange));
            this.templateChangeHandler = new UIHelper_1.EditorChangeHandler(this.view.templateEditor, 500, (newContent, userChange) => this.inputFileChanged("Kcy", newContent, userChange));
            this.view.hexViewer.onSelectionChanged = () => {
                this.setSelection(this.view.hexViewer.selectionStart, this.view.hexViewer.selectionEnd, "HexViewer");
            };
            this.view.parsedTree.treeView.$on("selected", (node) => {
                if (!node.value)
                    return; // instance-only
                this.setSelection(node.value.start, node.value.end - 1, "ParsedTree");
                this.view.infoPanel.parsedPath = node.value.path.join("/");
            });
            this.view.fileTree.$on("generate-parser", async (lang, aceLang, debug, ksyContent) => {
                const generatedFiles = await this.sandbox.kaitaiServices.generateParser(ksyContent, lang, debug);
                for (let fileName in generatedFiles)
                    this.view.addFileView(fileName, generatedFiles[fileName], aceLang);
            });
            this.view.dragAndDrop.$on("files-uploaded", async (files) => {
                await this.view.fileTree.uploadFiles(files);
            });
            this.view.infoPanel.exportToJson = async (hex) => {
                const json = await this.sandbox.kaitaiServices.exportToJson(hex);
                this.view.addFileView("json export", json, "json");
            };
            this.view.infoPanel.selectionChanged = (start, end) => this.setSelection(start, end, "InfoPanel");
            this.view.infoPanel.$watch("disableLazyParsing", () => this.reparse());
        }
        async setSelection(start, end, origin) {
            if (this.blockSelection || end < start)
                return;
            this.blockSelection = true;
            try {
                this.view.hexViewer.setSelection(start, end);
                this.view.converterPanel.model.update(this.dataProvider, start);
                this.view.infoPanel.selectionStart = start;
                this.view.infoPanel.selectionEnd = end;
                const itemMatches = this.parsedMap.intervalHandler.searchRange(start, end).items;
                const itemPathToSelect = itemMatches.length > 0 ? itemMatches[0].exp.path.join("/") : LocalSettings_1.localSettings.latestPath;
                this.view.infoPanel.parsedPath = itemPathToSelect;
                if (origin !== "ParsedTree") {
                    const node = await this.view.parsedTree.open(itemPathToSelect);
                    this.view.parsedTree.treeView.setSelected(node);
                }
                LocalSettings_1.localSettings.latestSelection = { start, end };
                LocalSettings_1.localSettings.latestPath = itemPathToSelect;
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
            if (uri === null)
                return;
            let content = await FileTree_1.fss.read(uri);
            if (uri.endsWith(".ksy")) {
                LocalSettings_1.localSettings.latestKsyUri = uri;
                const ksyContent = Conversion_1.Conversion.utf8BytesToStr(content);
                this.view.layout.ksyEditor.title = new FsUri_1.FsUri(uri).name;
                this.ksyChangeHandler.setContent(ksyContent);
            }
            else if (uri.endsWith(".kcy")) {
                LocalSettings_1.localSettings.latestKcyUri = uri;
                const tplContent = Conversion_1.Conversion.utf8BytesToStr(content);
                this.templateChangeHandler.setContent(tplContent);
            }
            else {
                LocalSettings_1.localSettings.latestInputUri = uri;
                this.view.layout.inputBinary.title = new FsUri_1.FsUri(uri).name;
                this.setInput(content, uri);
            }
        }
        async inputFileChanged(type, newContent, userChange) {
            const settingKey = `latest${type}Uri`;
            if (userChange)
                LocalSettings_1.localSettings[settingKey] = await this.view.fileTree.writeFile(LocalSettings_1.localSettings[settingKey], Conversion_1.Conversion.strToUtf8Bytes(newContent), false);
            await this.recompile();
        }
        async setupImports(mainKsyUri, ksyContent) {
            let currImports = { [mainKsyUri]: ksyContent };
            while (true) {
                const newImports = await this.sandbox.kaitaiServices.setKsys(currImports);
                console.log("newImports", newImports);
                if (newImports.length === 0)
                    break;
                currImports = {};
                for (const importUri of newImports) {
                    const importStr = Conversion_1.Conversion.utf8BytesToStr(await FileTree_1.fss.read(importUri));
                    if (!importStr)
                        throw new Error(`File not found: ${importUri}`);
                    currImports[importUri] = importStr;
                }
            }
        }
        async recompile() {
            try {
                this.view.hideErrors();
                const ksyContent = this.ksyChangeHandler.getContent();
                const template = this.templateChangeHandler.getContent();
                const mainKsyUri = LocalSettings_1.localSettings.latestKsyUri;
                await this.setupImports(mainKsyUri, ksyContent);
                const compilationResult = await this.sandbox.kaitaiServices.compile(mainKsyUri, template);
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
        async setInput(input, uri = null) {
            this.dataProvider = {
                length: input.byteLength,
                get(offset, length) { return new Uint8Array(input, offset, length); }
            };
            this.view.binaryPanel.setInput(this.dataProvider, uri);
            this.view.converterPanel.model.update(this.dataProvider, 0);
            await this.sandbox.kaitaiServices.setInput(input);
            await this.reparse();
        }
        onNewObjectsExported(objs) {
            this.parsedMap.addObjects(objs);
            this.view.infoPanel.unparsed = this.parsedMap.unparsed;
            this.view.infoPanel.byteArrays = this.parsedMap.byteArrays;
            this.view.hexViewer.setIntervals(this.parsedMap.intervalHandler);
        }
        async reparse() {
            const arrayLenLimit = 100;
            try {
                await this.sandbox.kaitaiServices.parse();
            }
            finally {
                const exportStartTime = performance.now();
                this.exported = await this.sandbox.kaitaiServices.export({ noLazy: this.view.infoPanel.disableLazyParsing, arrayLenLimit });
                console.log("exported", this.exported, `${performance.now() - exportStartTime}ms`);
                if (!this.exported)
                    return;
                Object.freeze(this.exported); // prevent Vue from converting this object to an observable one
                const parseMapStartTime = performance.now();
                this.parsedMap = new ParsedMap_1.ParsedMap();
                this.onNewObjectsExported([this.exported]);
                console.log("parsed", `${performance.now() - parseMapStartTime}ms`);
                this.view.parsedTree.rootNode = null;
                await this.view.nextTick(() => {
                    var rootNode = this.view.parsedTree.rootNode = new ParsedTree_1.ParsedTreeRootNode(new ParsedTree_1.ParsedTreeNode(null, "", this.exported));
                    rootNode.loadInstance = async (path) => {
                        const instanceExport = await this.sandbox.kaitaiServices.export({ path, arrayLenLimit });
                        this.onNewObjectsExported([instanceExport]);
                        return instanceExport;
                    };
                    rootNode.loadLazyArray = async (arrayPath, from, to) => {
                        const array = await this.sandbox.kaitaiServices.export({ path: arrayPath, arrayRange: { from, to } });
                        this.onNewObjectsExported(array);
                        return array;
                    };
                });
                this.setSelection(LocalSettings_1.localSettings.latestSelection.start, LocalSettings_1.localSettings.latestSelection.end, "Reparse");
            }
        }
    }
    var app = window["ide"] = new AppController();
    app.start();
});
//# sourceMappingURL=v2.js.map