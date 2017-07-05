define(["require", "exports", "./AppLayout", "./ui/Parts/FileTree", "ace/ace", "./SandboxHandler"], function (require, exports, AppLayout_1, FileTree_1, ace, SandboxHandler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    window["layout"] = AppLayout_1.Layout;
    var filetree = new FileTree_1.FileTree();
    filetree.init();
    filetree.$mount(AppLayout_1.Layout.fileTree.element);
    function setupEditor(parent, lang) {
        var editor = ace.edit(parent.element);
        editor.setTheme("ace/theme/monokai");
        editor.getSession().setMode(`ace/mode/${lang}`);
        if (lang === "yaml")
            editor.setOption("tabSize", 2);
        editor.$blockScrolling = Infinity; // TODO: remove this line after they fix ACE not to throw warning to the console
        parent.container.on("resize", () => editor.resize());
        return editor;
    }
    var ksyEditor = setupEditor(AppLayout_1.Layout.ksyEditor, "yaml");
    var jsCode = setupEditor(AppLayout_1.Layout.jsCode, "javascript");
    var jsCodeDebug = setupEditor(AppLayout_1.Layout.jsCodeDebug, "javascript");
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
        await sandbox.loadScript(new URL("js/worker/ImportLoader.js", location.href).href);
        await sandbox.loadScript(new URL("js/worker/KaitaiWorkerV2.js", location.href).href);
        await openFile("https:///formats/archive/zip.ksy");
        var compilationResult = await sandbox.compile(ksyContent);
        console.log("compilationResult", compilationResult);
        jsCode.setValue(Object.values(compilationResult.releaseCode).join("\n"), -1);
        jsCodeDebug.setValue(compilationResult.debugCodeAll, -1);
        let input = await FileTree_1.fss.read("https:///samples/sample1.zip");
        await sandbox.setInput(input);
        await sandbox.parse();
    })();
});
//# sourceMappingURL=v2.js.map