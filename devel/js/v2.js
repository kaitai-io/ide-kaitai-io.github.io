define(["require", "exports", "./AppLayout", "./ui/Parts/FileTree", "./ui/Parts/InfoPanel", "./SandboxHandler", "./HexViewer", "./ui/Components/ConverterPanel", "./ui/Parts/AboutModal"], function (require, exports, AppLayout_1, FileTree_1, InfoPanel_1, SandboxHandler_1, HexViewer_1, ConverterPanel_1, AboutModal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    window["layout"] = AppLayout_1.Layout;
    var filetree = new FileTree_1.FileTree();
    filetree.init();
    filetree.$mount(AppLayout_1.Layout.fileTree.element);
    var ksyEditor = AppLayout_1.LayoutHelper.setupEditor(AppLayout_1.Layout.ksyEditor, "yaml");
    var jsCode = AppLayout_1.LayoutHelper.setupEditor(AppLayout_1.Layout.jsCode, "javascript");
    var jsCodeDebug = AppLayout_1.LayoutHelper.setupEditor(AppLayout_1.Layout.jsCodeDebug, "javascript");
    var hexViewer = new HexViewer_1.HexViewer(AppLayout_1.Layout.inputBinary.element);
    var aboutModal = new AboutModal_1.AboutModal();
    var infoPanel = new InfoPanel_1.InfoPanel();
    var converterPanel = new ConverterPanel_1.ConverterPanel();
    infoPanel.$mount(AppLayout_1.Layout.infoPanel.element);
    converterPanel.$mount(AppLayout_1.Layout.converterPanel.element);
    infoPanel.aboutModal = aboutModal;
    filetree.$on("open-file", (treeNode) => {
        console.log(treeNode);
        openFile(treeNode.uri.uri);
    });
    var ksyContent;
    async function openFile(uri) {
        let content = await FileTree_1.fss.read(uri);
        if (uri.endsWith(".ksy")) {
            ksyContent = new TextDecoder().decode(new Uint8Array(content));
            ksyEditor.setValue(ksyContent, -1);
        }
    }
    (async function () {
        var sandbox = SandboxHandler_1.SandboxHandler.create("https://webide-usercontent.kaitai.io");
        await sandbox.loadScript(new URL("js/worker/worker/ImportLoader.js", location.href).href);
        await sandbox.loadScript(new URL("js/worker/worker/KaitaiWorkerV2.js", location.href).href);
        await openFile("https:///formats/archive/zip.ksy");
        var compilationResult = await sandbox.kaitaiServices.compile(ksyContent);
        console.log("compilationResult", compilationResult);
        jsCode.setValue(Object.values(compilationResult.releaseCode).join("\n"), -1);
        jsCodeDebug.setValue(compilationResult.debugCodeAll, -1);
        let input = await FileTree_1.fss.read("https:///samples/sample1.zip");
        var dataProvider = {
            length: input.byteLength,
            get(offset, length) { return new Uint8Array(input, offset, length); }
        };
        hexViewer.setDataProvider(dataProvider);
        converterPanel.model.update(dataProvider, 0);
        hexViewer.onSelectionChanged = () => {
            console.log("selectionChanged");
            converterPanel.model.update(dataProvider, hexViewer.selectionStart);
            infoPanel.selectionStart = hexViewer.selectionStart;
            infoPanel.selectionEnd = hexViewer.selectionEnd;
        };
        await sandbox.kaitaiServices.setInput(input);
        await sandbox.kaitaiServices.parse();
        let exported = await sandbox.kaitaiServices.export();
        console.log("exported", exported);
        var compilerInfo = await sandbox.kaitaiServices.getCompilerInfo();
        aboutModal.compilerVersion = compilerInfo.version;
        aboutModal.compilerBuildDate = compilerInfo.buildDate;
    })();
});
//# sourceMappingURL=v2.js.map