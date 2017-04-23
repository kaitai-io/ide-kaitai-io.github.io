var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "localforage", "vue", "./app.layout", "./app.errors", "./app.files", "./parsedToTree", "./app.worker", "./FileDrop", "./utils/PerformanceHelper", "./utils", "./utils", "./ui/ComponentLoader", "./ui/Components/ConverterPanel", "./ExportToJson", "./ui/Component"], function (require, exports, localforage, Vue, app_layout_1, app_errors_1, app_files_1, parsedToTree_1, app_worker_1, FileDrop_1, PerformanceHelper_1, utils_1, utils_2, ComponentLoader_1, ConverterPanel_1, ExportToJson_1, Component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    $.jstree.defaults.core.force_text = true;
    function ga(category, action, label, value) {
        console.log(`[GA Event] cat:${category} act:${action} lab:${label || ""}`);
        if (typeof window["_ga"] !== "undefined")
            window["_ga"]("send", "event", category, action, label, value);
    }
    exports.ga = ga;
    var ksySchema;
    var ksyTypes;
    class JsImporter {
        importYaml(name, mode) {
            return new Promise(function (resolve, reject) {
                console.log(`import yaml: ${name}, mode: ${mode}`);
                return app_files_1.fss.kaitai.get(`formats/${name}.ksy`).then(ksyContent => {
                    var ksyModel = YAML.parse(ksyContent);
                    return resolve(ksyModel);
                });
            });
        }
    }
    var jsImporter = new JsImporter();
    function compile(srcYaml, kslang, debug) {
        var perfYamlParse = PerformanceHelper_1.performanceHelper.measureAction("YAML parsing");
        var compilerSchema;
        try {
            kaitaiIde.ksySchema = ksySchema = YAML.parse(srcYaml);
            function collectKsyTypes(schema) {
                var types = {};
                function ksyNameToJsName(ksyName, isProp) { return ksyName.split("_").map((x, i) => i === 0 && isProp ? x : x.ucFirst()).join(""); }
                function collectTypes(parent) {
                    if (parent.types) {
                        parent.typesByJsName = {};
                        Object.keys(parent.types).forEach(name => {
                            var jsName = ksyNameToJsName(name, false);
                            parent.typesByJsName[jsName] = types[jsName] = parent.types[name];
                            collectTypes(parent.types[name]);
                        });
                    }
                    if (parent.instances) {
                        parent.instancesByJsName = {};
                        Object.keys(parent.instances).forEach(name => {
                            var jsName = ksyNameToJsName(name, true);
                            parent.instancesByJsName[jsName] = parent.instances[name];
                        });
                    }
                }
                collectTypes(schema);
                types[ksyNameToJsName(schema.meta.id, false)] = schema;
                return types;
            }
            kaitaiIde.ksyTypes = ksyTypes = collectKsyTypes(ksySchema);
            compilerSchema = YAML.parse(srcYaml); // we have to modify before sending into the compiler so we need a copy
            function removeWebIdeKeys(obj) {
                Object.keys(obj).filter(x => x.startsWith("-webide-")).forEach(keyName => delete obj[keyName]);
            }
            function filterOutExtensions(type) {
                removeWebIdeKeys(type);
                if (type.types)
                    Object.keys(type.types).forEach(typeName => filterOutExtensions(type.types[typeName]));
                if (type.instances)
                    Object.keys(type.instances).forEach(instanceName => removeWebIdeKeys(type.instances[instanceName]));
            }
            filterOutExtensions(compilerSchema);
        }
        catch (parseErr) {
            ga("compile", "error", `yaml: ${parseErr}`);
            app_errors_1.showError("YAML parsing error: ", parseErr);
            return;
        }
        perfYamlParse.done();
        //console.log("ksySchema", ksySchema);
        if (kslang === "json")
            return Promise.resolve();
        else {
            var perfCompile = PerformanceHelper_1.performanceHelper.measureAction("Compilation");
            var ks = new io.kaitai.struct.MainJs();
            var rReleasePromise = (debug === false || debug === "both") ? ks.compile(kslang, compilerSchema, jsImporter, false) : Promise.resolve(null);
            var rDebugPromise = (debug === true || debug === "both") ? ks.compile(kslang, compilerSchema, jsImporter, true) : Promise.resolve(null);
            //console.log("rReleasePromise", rReleasePromise, "rDebugPromise", rDebugPromise);
            return perfCompile.done(Promise.all([rReleasePromise, rDebugPromise]))
                .then(([rRelease, rDebug]) => {
                ga("compile", "success");
                //console.log("rRelease", rRelease, "rDebug", rDebug);
                return rRelease && rDebug ? { debug: rDebug, release: rRelease } : rRelease ? rRelease : rDebug;
            })
                .catch(compileErr => {
                ga("compile", "error", `kaitai: ${compileErr}`);
                app_errors_1.showError("KS compilation error: ", compileErr);
                return;
            });
        }
    }
    exports.compile = compile;
    function isKsyFile(fn) { return fn.toLowerCase().endsWith(".ksy"); }
    var ksyFsItemName = "ksyFsItem";
    var lastKsyContent = null;
    function recompile() {
        return localforage.getItem(ksyFsItemName).then(ksyFsItem => {
            var srcYaml = app_layout_1.ui.ksyEditor.getValue();
            var changed = lastKsyContent !== srcYaml;
            var copyPromise = Promise.resolve();
            if (changed && (ksyFsItem.fsType === "kaitai" || ksyFsItem.fsType === "static"))
                copyPromise = app_files_1.addKsyFile("localStorage", ksyFsItem.fn.replace(".ksy", "_modified.ksy"), srcYaml)
                    .then(fsItem => localforage.setItem(ksyFsItemName, fsItem));
            return copyPromise.then(() => changed ? app_files_1.fss[ksyFsItem.fsType].put(ksyFsItem.fn, srcYaml) : Promise.resolve()).then(() => {
                return compile(srcYaml, "javascript", "both").then(compiled => {
                    if (!compiled)
                        return;
                    var fileNames = Object.keys(compiled.release);
                    console.log("ksyFsItem", ksyFsItem);
                    app_layout_1.ui.genCodeViewer.setValue(fileNames.map(x => compiled.release[x]).join(""), -1);
                    app_layout_1.ui.genCodeDebugViewer.setValue(fileNames.map(x => compiled.debug[x]).join(""), -1);
                    return reparse();
                });
            });
        });
    }
    var formatReady = null;
    var inputReady = null;
    var selectedInTree = false;
    var blockRecursive = false;
    function reparse() {
        app_errors_1.handleError(null);
        return PerformanceHelper_1.performanceHelper.measureAction("Parse initialization", Promise.all([inputReady, formatReady]).then(() => {
            var debugCode = app_layout_1.ui.genCodeDebugViewer.getValue();
            var jsClassName = kaitaiIde.ksySchema.meta.id.split("_").map((x) => x.ucFirst()).join("");
            return app_worker_1.workerMethods.initCode(debugCode, jsClassName, ksyTypes);
        })).then(() => {
            //console.log("recompiled");
            PerformanceHelper_1.performanceHelper.measureAction("Parsing", app_worker_1.workerMethods.reparse($("#disableLazyParsing").is(":checked")).then(exportedRoot => {
                //console.log("reparse exportedRoot", exportedRoot);
                kaitaiIde.root = exportedRoot;
                app_layout_1.ui.parsedDataTreeHandler = new parsedToTree_1.ParsedTreeHandler(app_layout_1.ui.parsedDataTreeCont.getElement(), exportedRoot, ksyTypes);
                PerformanceHelper_1.performanceHelper.measureAction("Tree / interval handling", app_layout_1.ui.parsedDataTreeHandler.initNodeReopenHandling())
                    .then(() => app_layout_1.ui.hexViewer.onSelectionChanged(), e => app_errors_1.handleError(e));
                app_layout_1.ui.parsedDataTreeHandler.jstree.on("select_node.jstree", function (e, selectNodeArgs) {
                    var node = selectNodeArgs.node;
                    //console.log("node", node);
                    var exp = app_layout_1.ui.parsedDataTreeHandler.getNodeData(node).exported;
                    if (exp && exp.path)
                        $("#parsedPath").text(exp.path.join("/"));
                    if (!blockRecursive && exp && exp.start < exp.end) {
                        selectedInTree = true;
                        //console.log("setSelection", exp.ioOffset, exp.start);
                        app_layout_1.ui.hexViewer.setSelection(exp.ioOffset + exp.start, exp.ioOffset + exp.end - 1);
                        selectedInTree = false;
                    }
                });
            }, error => app_errors_1.handleError(error)));
        });
    }
    var inputContent, inputFsItem, lastKsyFsItem;
    function loadFsItem(fsItem, refreshGui = true) {
        if (!fsItem || fsItem.type !== "file")
            return Promise.resolve();
        return app_files_1.fss[fsItem.fsType].get(fsItem.fn).then((content) => {
            if (isKsyFile(fsItem.fn)) {
                localforage.setItem(ksyFsItemName, fsItem);
                lastKsyFsItem = fsItem;
                lastKsyContent = content;
                if (app_layout_1.ui.ksyEditor.getValue() !== content)
                    app_layout_1.ui.ksyEditor.setValue(content, -1);
                app_layout_1.getLayoutNodeById("ksyEditor").container.setTitle(fsItem.fn);
                return Promise.resolve();
            }
            else {
                inputFsItem = fsItem;
                inputContent = content;
                localforage.setItem("inputFsItem", fsItem);
                exports.dataProvider = {
                    length: content.byteLength,
                    get(offset, length) {
                        return new Uint8Array(content, offset, length);
                    }
                };
                app_layout_1.ui.hexViewer.setDataProvider(exports.dataProvider);
                app_layout_1.getLayoutNodeById("inputBinaryTab").setTitle(fsItem.fn);
                return app_worker_1.workerMethods.setInput(content).then(() => refreshGui ? reparse().then(() => app_layout_1.ui.hexViewer.resize()) : Promise.resolve());
            }
        });
    }
    exports.loadFsItem = loadFsItem;
    function addNewFiles(files) {
        return Promise.all(files.map(file => (isKsyFile(file.file.name) ? file.read("text") : file.read("arrayBuffer"))
            .then(content => app_files_1.fss.local.put(file.file.name, content))))
            .then(fsItems => {
            app_files_1.refreshFsNodes();
            return fsItems.length === 1 ? loadFsItem(fsItems[0]) : Promise.resolve(null);
        });
    }
    exports.addNewFiles = addNewFiles;
    localStorage.setItem("lastVersion", kaitaiIde.version);
    var converterPanelModel = new ConverterPanel_1.ConverterPanelModel();
    let App = class App extends Vue {
        constructor() {
            super(...arguments);
            this.selectionStart = -1;
            this.selectionEnd = -1;
            this.unparsed = [];
            this.byteArrays = [];
        }
        selectInterval(interval) {
            this.selectionChanged(interval.start, interval.end);
        }
        selectionChanged(start, end) {
            app_layout_1.ui.hexViewer.setSelection(start, end);
        }
    };
    App = __decorate([
        Component_1.default
    ], App);
    exports.app = new App();
    $(() => {
        $("#webIdeVersion").text(kaitaiIde.version);
        $("#compilerVersion").text(new io.kaitai.struct.MainJs().version + " (" + new io.kaitai.struct.MainJs().buildDate + ")");
        $("#welcomeDoNotShowAgain").click(() => localStorage.setItem("doNotShowWelcome", "true"));
        if (localStorage.getItem("doNotShowWelcome") !== "true")
            $("#welcomeModal").modal();
        $("#aboutWebIde").on("click", () => $("#welcomeModal").modal());
        ComponentLoader_1.componentLoader.load(["ConverterPanel", "Stepper", "SelectionInput"]).then(() => {
            new Vue({ el: "#converterPanel", data: { model: converterPanelModel } });
            exports.app.$mount("#infoPanel");
        });
        function refreshSelectionInput() {
            exports.app.selectionStart = app_layout_1.ui.hexViewer.selectionStart;
            exports.app.selectionEnd = app_layout_1.ui.hexViewer.selectionEnd;
        }
        app_layout_1.ui.hexViewer.onSelectionChanged = () => {
            //console.log("setSelection", ui.hexViewer.selectionStart, ui.hexViewer.selectionEnd);
            localStorage.setItem("selection", JSON.stringify({ start: app_layout_1.ui.hexViewer.selectionStart, end: app_layout_1.ui.hexViewer.selectionEnd }));
            var start = app_layout_1.ui.hexViewer.selectionStart;
            var hasSelection = start !== -1;
            refreshSelectionInput();
            if (app_layout_1.ui.parsedDataTreeHandler && hasSelection && !selectedInTree) {
                var intervals = app_layout_1.ui.parsedDataTreeHandler.intervalHandler.searchRange(app_layout_1.ui.hexViewer.mouseDownOffset || start);
                if (intervals.items.length > 0) {
                    //console.log("selected node", intervals[0].id);
                    blockRecursive = true;
                    app_layout_1.ui.parsedDataTreeHandler.activatePath(intervals.items[0].exp.path).then(() => blockRecursive = false);
                }
            }
            converterPanelModel.update(exports.dataProvider, start);
        };
        refreshSelectionInput();
        app_layout_1.ui.genCodeDebugViewer.commands.addCommand({
            name: "compile",
            bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
            exec: function (editor) { reparse(); }
        });
        FileDrop_1.initFileDrop("fileDrop", addNewFiles);
        function loadCachedFsItem(cacheKey, defFsType, defSample) {
            return localforage.getItem(cacheKey).then((fsItem) => loadFsItem(fsItem || { fsType: defFsType, fn: defSample, type: "file" }, false));
        }
        inputReady = loadCachedFsItem("inputFsItem", "kaitai", "samples/sample1.zip");
        formatReady = loadCachedFsItem(ksyFsItemName, "kaitai", "formats/archive/zip.ksy");
        inputReady.then(() => {
            var storedSelection = JSON.parse(localStorage.getItem("selection"));
            if (storedSelection)
                app_layout_1.ui.hexViewer.setSelection(storedSelection.start, storedSelection.end);
        });
        var editDelay = new utils_2.Delayed(500);
        app_layout_1.ui.ksyEditor.on("change", () => editDelay.do(() => recompile()));
        var inputContextMenu = $("#inputContextMenu");
        var downloadInput = $("#inputContextMenu .downloadItem");
        $("#hexViewer").on("contextmenu", e => {
            downloadInput.toggleClass("disabled", app_layout_1.ui.hexViewer.selectionStart === -1);
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
            var start = app_layout_1.ui.hexViewer.selectionStart, end = app_layout_1.ui.hexViewer.selectionEnd;
            //var fnParts = /^(.*?)(\.[^.]+)?$/.exec(inputFsItem.fn.split("/").last());
            //var newFn = `${fnParts[1]}_0x${start.toString(16)}-0x${end.toString(16)}${fnParts[2] || ""}`;
            var newFn = `${inputFsItem.fn.split("/").last()}_0x${start.toString(16)}-0x${end.toString(16)}.bin`;
            utils_1.saveFile(new Uint8Array(inputContent, start, end - start + 1), newFn);
        });
        kaitaiIde.ui = app_layout_1.ui;
        $("#exportToJson, #exportToJsonHex").on("click", e => ExportToJson_1.exportToJson(e.target.id === "exportToJsonHex"));
        $("#disableLazyParsing").on("click", reparse);
        utils_1.precallHook(kaitaiIde.ui.layout.constructor.__lm.controls, "DragProxy", () => ga("layout", "window_drag"));
        $("body").on("mousedown", ".lm_drag_handle", () => { ga("layout", "splitter_drag"); });
    });
});
//# sourceMappingURL=app.js.map