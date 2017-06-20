System.register(["localforage", "vue", "./app.layout", "./app.files", "./parsedToTree", "./app.worker", "./FileDrop", "./utils/PerformanceHelper", "./utils", "./ui/ComponentLoader", "./ui/Components/ConverterPanel", "./ExportToJson", "./ui/Component", "./KaitaiServices", "./app.errors"], function (exports_1, context_1) {
    "use strict";
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __moduleName = context_1 && context_1.id;
    function ga(category, action, label, value) {
        console.log(`[GA Event] cat:${category} act:${action} lab:${label || ""}`);
        if (typeof window["_ga"] !== "undefined")
            window["_ga"]("send", "event", category, action, label, value);
    }
    exports_1("ga", ga);
    var localforage, Vue, app_layout_1, app_files_1, parsedToTree_1, app_worker_1, FileDrop_1, PerformanceHelper_1, utils_1, utils_2, ComponentLoader_1, ConverterPanel_1, ExportToJson_1, Component_1, KaitaiServices_1, app_errors_1, AppVM, AppController, app;
    return {
        setters: [
            function (localforage_1) {
                localforage = localforage_1;
            },
            function (Vue_1) {
                Vue = Vue_1;
            },
            function (app_layout_1_1) {
                app_layout_1 = app_layout_1_1;
            },
            function (app_files_1_1) {
                app_files_1 = app_files_1_1;
            },
            function (parsedToTree_1_1) {
                parsedToTree_1 = parsedToTree_1_1;
            },
            function (app_worker_1_1) {
                app_worker_1 = app_worker_1_1;
            },
            function (FileDrop_1_1) {
                FileDrop_1 = FileDrop_1_1;
            },
            function (PerformanceHelper_1_1) {
                PerformanceHelper_1 = PerformanceHelper_1_1;
            },
            function (utils_1_1) {
                utils_1 = utils_1_1;
                utils_2 = utils_1_1;
            },
            function (ComponentLoader_1_1) {
                ComponentLoader_1 = ComponentLoader_1_1;
            },
            function (ConverterPanel_1_1) {
                ConverterPanel_1 = ConverterPanel_1_1;
            },
            function (ExportToJson_1_1) {
                ExportToJson_1 = ExportToJson_1_1;
            },
            function (Component_1_1) {
                Component_1 = Component_1_1;
            },
            function (KaitaiServices_1_1) {
                KaitaiServices_1 = KaitaiServices_1_1;
            },
            function (app_errors_1_1) {
                app_errors_1 = app_errors_1_1;
            }
        ],
        execute: function () {
            $.jstree.defaults.core.force_text = true;
            AppVM = class AppVM extends Vue {
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
            AppController = class AppController {
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
                compile(srcYaml, kslang, debug) {
                    return this.compilerService.compile(srcYaml, kslang, debug).then(result => {
                        ga("compile", "success");
                        return result;
                    }, (error) => {
                        ga("compile", "error", `${error.type}: ${error.error}`);
                        this.errors.handle(error.error);
                        return Promise.reject(error);
                    });
                }
                recompile() {
                    return localforage.getItem(this.ksyFsItemName).then(ksyFsItem => {
                        var srcYaml = this.ui.ksyEditor.getValue();
                        var changed = this.lastKsyContent !== srcYaml;
                        var copyPromise = Promise.resolve();
                        if (changed && (ksyFsItem.fsType === "kaitai" || ksyFsItem.fsType === "static"))
                            copyPromise = app_files_1.addKsyFile("localStorage", ksyFsItem.fn.replace(".ksy", "_modified.ksy"), srcYaml)
                                .then(fsItem => localforage.setItem(this.ksyFsItemName, fsItem));
                        return copyPromise.then(() => changed ? app_files_1.fss[ksyFsItem.fsType].put(ksyFsItem.fn, srcYaml) : Promise.resolve()).then(() => {
                            return this.compile(srcYaml, "javascript", "both").then(compiled => {
                                if (!compiled)
                                    return;
                                var fileNames = Object.keys(compiled.release);
                                console.log("ksyFsItem", ksyFsItem);
                                this.ui.genCodeViewer.setValue(fileNames.map(x => compiled.release[x]).join(""), -1);
                                this.ui.genCodeDebugViewer.setValue(fileNames.map(x => compiled.debug[x]).join(""), -1);
                                return this.reparse();
                            });
                        });
                    });
                }
                reparse() {
                    return PerformanceHelper_1.performanceHelper.measureAction("Parse initialization", Promise.all([this.inputReady, this.formatReady]).then(() => {
                        var debugCode = this.ui.genCodeDebugViewer.getValue();
                        var jsClassName = this.compilerService.ksySchema.meta.id.split("_").map((x) => x.ucFirst()).join("");
                        return app_worker_1.workerMethods.initCode(debugCode, jsClassName, this.compilerService.ksyTypes);
                    })).then(() => {
                        //console.log("recompiled");
                        PerformanceHelper_1.performanceHelper.measureAction("Parsing", app_worker_1.workerMethods.reparse(this.vm.disableLazyParsing).then(exportedRoot => {
                            //console.log("reparse exportedRoot", exportedRoot);
                            kaitaiIde.root = exportedRoot;
                            this.ui.parsedDataTreeHandler = new parsedToTree_1.ParsedTreeHandler(this.ui.parsedDataTreeCont.getElement(), exportedRoot, this.compilerService.ksyTypes);
                            PerformanceHelper_1.performanceHelper.measureAction("Tree / interval handling", this.ui.parsedDataTreeHandler.initNodeReopenHandling())
                                .then(() => this.ui.hexViewer.onSelectionChanged(), e => this.errors.handle(e));
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
                        }, error => this.errors.handle(error)));
                    });
                }
                loadFsItem(fsItem, refreshGui = true) {
                    if (!fsItem || fsItem.type !== "file")
                        return Promise.resolve();
                    return app_files_1.fss[fsItem.fsType].get(fsItem.fn).then((content) => {
                        if (this.isKsyFile(fsItem.fn)) {
                            localforage.setItem(this.ksyFsItemName, fsItem);
                            this.lastKsyFsItem = fsItem;
                            this.lastKsyContent = content;
                            if (this.ui.ksyEditor.getValue() !== content)
                                this.ui.ksyEditor.setValue(content, -1);
                            var ksyEditor = this.ui.layout.getLayoutNodeById("ksyEditor");
                            ksyEditor.container.setTitle(fsItem.fn);
                            return Promise.resolve();
                        }
                        else {
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
                            return app_worker_1.workerMethods.setInput(content).then(() => (refreshGui ?
                                this.reparse().then(() => this.ui.hexViewer.resize()) : Promise.resolve()));
                        }
                    });
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
            };
            exports_1("app", app = new AppController());
            localStorage.setItem("lastVersion", kaitaiIde.version);
            $(() => {
                $("#webIdeVersion").text(kaitaiIde.version);
                $("#compilerVersion").text(new io.kaitai.struct.MainJs().version + " (" + new io.kaitai.struct.MainJs().buildDate + ")");
                $("#welcomeDoNotShowAgain").click(() => localStorage.setItem("doNotShowWelcome", "true"));
                if (localStorage.getItem("doNotShowWelcome") !== "true")
                    $("#welcomeModal").modal();
                app.init();
                ComponentLoader_1.componentLoader.load(["ConverterPanel", "Stepper", "SelectionInput"]).then(() => {
                    new Vue({ data: { model: app.vm.converterPanelModel } }).$mount("#converterPanel");
                    app.vm.$mount("#infoPanel");
                    app.vm.$watch("disableLazyParsing", () => app.reparse());
                });
                app.ui.hexViewer.onSelectionChanged = () => app.onHexViewerSelectionChanged();
                app.refreshSelectionInput();
                app.ui.genCodeDebugViewer.commands.addCommand({
                    name: "compile",
                    bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
                    exec: function (editor) { app.reparse(); }
                });
                FileDrop_1.initFileDrop("fileDrop", app.addNewFiles);
                function loadCachedFsItem(cacheKey, defFsType, defSample) {
                    return localforage.getItem(cacheKey).then((fsItem) => app.loadFsItem(fsItem || { fsType: defFsType, fn: defSample, type: "file" }, false));
                }
                app.inputReady = loadCachedFsItem("inputFsItem", "kaitai", "samples/sample1.zip");
                app.formatReady = loadCachedFsItem(app.ksyFsItemName, "kaitai", "formats/archive/zip.ksy");
                app.inputReady.then(() => {
                    var storedSelection = JSON.parse(localStorage.getItem("selection"));
                    if (storedSelection)
                        app.ui.hexViewer.setSelection(storedSelection.start, storedSelection.end);
                });
                var editDelay = new utils_2.Delayed(500);
                app.ui.ksyEditor.on("change", () => editDelay.do(() => app.recompile()));
                var inputContextMenu = $("#inputContextMenu");
                var downloadInput = $("#inputContextMenu .downloadItem");
                $("#hexViewer").on("contextmenu", e => {
                    downloadInput.toggleClass("disabled", app.ui.hexViewer.selectionStart === -1);
                    inputContextMenu.css({ display: "block", left: e.pageX, top: e.pageY });
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
                $(document).on("mouseup", e => {
                    if ($(e.target).parents(".dropdown-menu").length === 0)
                        $(".dropdown").hide();
                });
                ctxAction(downloadInput, e => {
                    var start = app.ui.hexViewer.selectionStart, end = app.ui.hexViewer.selectionEnd;
                    var newFn = `${app.inputFsItem.fn.split("/").last()}_0x${start.toString(16)}-0x${end.toString(16)}.bin`;
                    utils_1.saveFile(new Uint8Array(app.inputContent, start, end - start + 1), newFn);
                });
                kaitaiIde.app = app;
                utils_1.precallHook(app.ui.layout.layout.constructor["__lm"].controls, "DragProxy", () => ga("layout", "window_drag"));
                $("body").on("mousedown", ".lm_drag_handle", () => { ga("layout", "splitter_drag"); });
            });
        }
    };
});
//# sourceMappingURL=app.js.map