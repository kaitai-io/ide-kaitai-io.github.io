var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "localforage", "vue", "./app.layout", "./app.files", "./parsedToTree", "./app.worker", "./FileDrop", "../utils", "../ui/ComponentLoader", "../ui/Components/ConverterPanel", "./ExportToJson", "../ui/Component", "./KaitaiServices", "./app.errors", "kaitai-struct-compiler"], function (require, exports, localforage, Vue, app_layout_1, app_files_1, parsedToTree_1, app_worker_1, FileDrop_1, utils_1, ComponentLoader_1, ConverterPanel_1, ExportToJson_1, Component_1, KaitaiServices_1, app_errors_1, KaitaiStructCompiler) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    $.jstree.defaults.core.force_text = true;
    function ga(category, action, label, value) {
        console.log(`[GA Event] cat:${category} act:${action} lab:${label || ""}`);
        if (typeof window["_ga"] !== "undefined")
            window["_ga"]("send", "event", category, action, label, value);
    }
    exports.ga = ga;
    const qs = {};
    location.search.substr(1).split("&").map(x => x.split("=")).forEach(x => qs[x[0]] = x[1]);
    let AppVM = class AppVM extends Vue {
        constructor() {
            super(...arguments);
            this.converterPanelModel = new ConverterPanel_1.ConverterPanelModel();
            this.selectionStart = -1;
            this.selectionEnd = -1;
            this.unparsed = [];
            this.byteArrays = [];
            this.disableLazyParsing = false;
        }
        selectInterval(interval) { this.selectionChanged(interval.start, interval.end); }
        selectionChanged(start, end) { this.ui.hexViewer.setSelection(start, end); }
        exportToJson(hex) { ExportToJson_1.exportToJson(hex).then(json => this.ui.layout.addEditorTab("json export", json, "json")); }
        about() { $("#welcomeModal").modal(); }
    };
    AppVM = __decorate([
        Component_1.default
    ], AppVM);
    class AppController {
        constructor() {
            this.compilerService = new KaitaiServices_1.CompilerService();
            this.ui = new app_layout_1.UI();
            this.vm = new AppVM();
            this.errors = null;
            this.ksyFsItemName = "ksyFsItem";
            this.lastKsyContent = null;
            this.blockRecursive = false;
            this.selectedInTree = false;
            this.formatReady = null;
            this.inputReady = null;
        }
        init() {
            this.vm.ui = this.ui;
            this.ui.init();
            this.errors = new app_errors_1.ErrorWindowHandler(this.ui.layout.getLayoutNodeById("mainArea"));
            app_files_1.initFileTree();
        }
        isKsyFile(fn) { return fn.toLowerCase().endsWith(".ksy"); }
        compile(srcYamlFsItem, srcYaml, kslang, debug) {
            return this.compilerService.compile(srcYamlFsItem, srcYaml, kslang, debug).then(result => {
                ga("compile", "success");
                return result;
            }, (error) => {
                ga("compile", "error", `${error.type}: ${error.error}`);
                this.errors.handle(error.error);
                return Promise.reject(error);
            });
        }
        async recompile() {
            let ksyFsItem = await localforage.getItem(this.ksyFsItemName);
            var srcYaml = this.ui.ksyEditor.getValue();
            var changed = this.lastKsyContent !== srcYaml;
            if (changed && (ksyFsItem.fsType === "kaitai" || ksyFsItem.fsType === "static")) {
                let fsItem = await app_files_1.addKsyFile("localStorage", ksyFsItem.fn.replace(".ksy", "_modified.ksy"), srcYaml);
                localforage.setItem(this.ksyFsItemName, fsItem);
            }
            if (changed)
                await app_files_1.fss[ksyFsItem.fsType].put(ksyFsItem.fn, srcYaml);
            let compiled = await this.compile(ksyFsItem, srcYaml, "javascript", "both");
            if (!compiled)
                return;
            var fileNames = Object.keys(compiled.release);
            let debugUserTypes = localStorage.getItem("userTypes") || "";
            if (debugUserTypes)
                debugUserTypes += "\n\n";
            this.ui.genCodeViewer.setValue(debugUserTypes + fileNames.map(x => compiled.release[x]).join(""), -1);
            this.ui.genCodeDebugViewer.setValue(debugUserTypes + fileNames.map(x => compiled.debug[x]).join(""), -1);
            await this.reparse();
        }
        async reparse() {
            try {
                await Promise.all([this.inputReady, this.formatReady]);
                let debugCode = this.ui.genCodeDebugViewer.getValue();
                let jsClassName = this.compilerService.ksySchema.meta.id.split("_").map((x) => x.ucFirst()).join("");
                await app_worker_1.workerMethods.initCode(debugCode, jsClassName, this.compilerService.ksyTypes);
                let exportedRoot = await app_worker_1.workerMethods.reparse(this.vm.disableLazyParsing);
                kaitaiIde.root = exportedRoot;
                //console.log("reparse exportedRoot", exportedRoot);
                this.ui.parsedDataTreeHandler = new parsedToTree_1.ParsedTreeHandler(this.ui.parsedDataTreeCont.getElement(), exportedRoot, this.compilerService.ksyTypes);
                await this.ui.parsedDataTreeHandler.initNodeReopenHandling();
                this.ui.hexViewer.onSelectionChanged();
                this.ui.parsedDataTreeHandler.jstree.on("select_node.jstree", (e, selectNodeArgs) => {
                    var node = selectNodeArgs.node;
                    //console.log("node", node);
                    var exp = this.ui.parsedDataTreeHandler.getNodeData(node).exported;
                    if (exp && exp.path)
                        $("#parsedPath").text(exp.path.join("/"));
                    if (!this.blockRecursive && exp && exp.start < exp.end) {
                        this.selectedInTree = true;
                        //console.log("setSelection", exp.ioOffset, exp.start);
                        this.ui.hexViewer.setSelection(exp.ioOffset + exp.start, exp.ioOffset + exp.end - 1);
                        this.selectedInTree = false;
                    }
                });
                this.errors.handle(null);
            }
            catch (error) {
                this.errors.handle(error);
            }
        }
        async loadFsItem(fsItem, refreshGui = true) {
            if (!fsItem || fsItem.type !== "file")
                return;
            var contentRaw = await app_files_1.fss[fsItem.fsType].get(fsItem.fn);
            if (this.isKsyFile(fsItem.fn)) {
                let content = contentRaw;
                localforage.setItem(this.ksyFsItemName, fsItem);
                this.lastKsyFsItem = fsItem;
                this.lastKsyContent = content;
                if (this.ui.ksyEditor.getValue() !== content)
                    this.ui.ksyEditor.setValue(content, -1);
                var ksyEditor = this.ui.layout.getLayoutNodeById("ksyEditor");
                ksyEditor.container.setTitle(fsItem.fn);
            }
            else {
                let content = contentRaw;
                this.inputFsItem = fsItem;
                this.inputContent = content;
                localforage.setItem("inputFsItem", fsItem);
                this.dataProvider = {
                    length: content.byteLength,
                    get(offset, length) {
                        return new Uint8Array(content, offset, length);
                    }
                };
                this.ui.hexViewer.setDataProvider(this.dataProvider);
                this.ui.layout.getLayoutNodeById("inputBinaryTab").setTitle(fsItem.fn);
                await app_worker_1.workerMethods.setInput(content);
                if (refreshGui) {
                    await this.reparse();
                    this.ui.hexViewer.resize();
                }
            }
        }
        addNewFiles(files) {
            return Promise.all(files.map(file => (this.isKsyFile(file.file.name) ? file.read("text") : file.read("arrayBuffer"))
                .then(content => app_files_1.fss.local.put(file.file.name, content))))
                .then(fsItems => {
                app_files_1.refreshFsNodes();
                return fsItems.length === 1 ? this.loadFsItem(fsItems[0]) : Promise.resolve(null);
            });
        }
        refreshSelectionInput() {
            this.vm.selectionStart = this.ui.hexViewer.selectionStart;
            this.vm.selectionEnd = this.ui.hexViewer.selectionEnd;
        }
        onHexViewerSelectionChanged() {
            //console.log("setSelection", ui.hexViewer.selectionStart, ui.hexViewer.selectionEnd);
            localStorage.setItem("selection", JSON.stringify({ start: this.ui.hexViewer.selectionStart, end: this.ui.hexViewer.selectionEnd }));
            var start = this.ui.hexViewer.selectionStart;
            var hasSelection = start !== -1;
            this.refreshSelectionInput();
            if (this.ui.parsedDataTreeHandler && hasSelection && !this.selectedInTree) {
                var intervals = this.ui.parsedDataTreeHandler.intervalHandler.searchRange(this.ui.hexViewer.mouseDownOffset || start);
                if (intervals.items.length > 0) {
                    //console.log("selected node", intervals[0].id);
                    this.blockRecursive = true;
                    this.ui.parsedDataTreeHandler.activatePath(intervals.items[0].exp.path).then(() => this.blockRecursive = false);
                }
            }
            this.vm.converterPanelModel.update(this.dataProvider, start);
        }
    }
    exports.app = new AppController();
    var kaitaiIde = window["kaitaiIde"] = {};
    kaitaiIde.version = "0.1";
    kaitaiIde.commitId = "5d9fb119933464ec1a17d65964cdaa3ed6a98dca";
    kaitaiIde.commitDate = "2020-09-13 14:18:25";
    $(() => {
        $("#webIdeVersion").text(kaitaiIde.version);
        $("#webideCommitId")
            .attr("href", `https://github.com/kaitai-io/kaitai_struct_webide/commit/${kaitaiIde.commitId}`)
            .text(kaitaiIde.commitId.substr(0, 7));
        $("#webideCommitDate").text(kaitaiIde.commitDate);
        $("#compilerVersion").text(new KaitaiStructCompiler().version + " (" + new KaitaiStructCompiler().buildDate + ")");
        $("#welcomeDoNotShowAgain").click(() => localStorage.setItem("doNotShowWelcome", "true"));
        if (localStorage.getItem("doNotShowWelcome") !== "true")
            $("#welcomeModal").modal();
        exports.app.init();
        ComponentLoader_1.componentLoader.load(["Components/ConverterPanel", "Components/Stepper", "Components/SelectionInput"]).then(() => {
            new Vue({ data: { model: exports.app.vm.converterPanelModel } }).$mount("#converterPanel");
            exports.app.vm.$mount("#infoPanel");
            exports.app.vm.$watch("disableLazyParsing", () => exports.app.reparse());
        });
        exports.app.ui.hexViewer.onSelectionChanged = () => exports.app.onHexViewerSelectionChanged();
        exports.app.refreshSelectionInput();
        exports.app.ui.genCodeDebugViewer.commands.addCommand({ name: "compile", bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
            exec: function (editor) { exports.app.reparse(); } });
        exports.app.ui.ksyEditor.commands.addCommand({ name: "compile", bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
            exec: function (editor) { exports.app.recompile(); } });
        FileDrop_1.initFileDrop("fileDrop", (files) => exports.app.addNewFiles(files));
        async function loadCachedFsItem(cacheKey, defFsType, defSample) {
            let fsItem = await localforage.getItem(cacheKey);
            await exports.app.loadFsItem(fsItem || { fsType: defFsType, fn: defSample, type: "file" }, false);
        }
        exports.app.inputReady = loadCachedFsItem("inputFsItem", "kaitai", "samples/sample1.zip");
        exports.app.formatReady = loadCachedFsItem(exports.app.ksyFsItemName, "kaitai", "formats/archive/zip.ksy");
        exports.app.inputReady.then(() => {
            var storedSelection = JSON.parse(localStorage.getItem("selection"));
            if (storedSelection)
                exports.app.ui.hexViewer.setSelection(storedSelection.start, storedSelection.end);
        });
        var editDelay = new utils_1.Delayed(500);
        if (!("noAutoCompile" in qs))
            exports.app.ui.ksyEditor.on("change", () => editDelay.do(() => exports.app.recompile()));
        var inputContextMenu = $("#inputContextMenu");
        var downloadInput = $("#inputContextMenu .downloadItem");
        $("#hexViewer").on("contextmenu", e => {
            downloadInput.toggleClass("disabled", exports.app.ui.hexViewer.selectionStart === -1);
            inputContextMenu.css({ display: "block" });
            var x = Math.min(e.pageX, $(window).width() - inputContextMenu.width());
            var h = inputContextMenu.height();
            var y = e.pageY > ($(window).height() - h) ? e.pageY - h : e.pageY;
            inputContextMenu.css({ left: x, top: y });
            return false;
        });
        function ctxAction(obj, callback) {
            obj.find("a").on("click", e => {
                if (!obj.hasClass("disabled")) {
                    inputContextMenu.hide();
                    callback(e);
                }
            });
        }
        $(document).on("mousedown", e => {
            if ($(e.target).parents(".dropdown-menu").length === 0)
                $(".dropdown").hide();
        });
        ctxAction(downloadInput, e => {
            var start = exports.app.ui.hexViewer.selectionStart, end = exports.app.ui.hexViewer.selectionEnd;
            var newFn = `${exports.app.inputFsItem.fn.split("/").last()}_0x${start.toString(16)}-0x${end.toString(16)}.bin`;
            utils_1.saveFile(new Uint8Array(exports.app.inputContent, start, end - start + 1), newFn);
        });
        kaitaiIde.app = exports.app;
        utils_1.precallHook(exports.app.ui.layout.layout.constructor["__lm"].controls, "DragProxy", () => ga("layout", "window_drag"));
        $("body").on("mousedown", ".lm_drag_handle", () => { ga("layout", "splitter_drag"); });
    });
});
//# sourceMappingURL=app.js.map