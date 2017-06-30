var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    var ksyEditor = setupEditor(AppLayout_1.Layout.ksyEditor, 'yaml');
    var jsCode = setupEditor(AppLayout_1.Layout.jsCode, 'javascript');
    var jsCodeDebug = setupEditor(AppLayout_1.Layout.jsCodeDebug, 'javascript');
    filetree.$on("open-file", (treeNode) => {
        console.log(treeNode);
        openFile(treeNode.uri.uri);
    });
    var ksyContent;
    function openFile(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            let content = yield FileTree_1.fss.read(uri);
            if (uri.endsWith(".ksy")) {
                ksyContent = new TextDecoder().decode(new Uint8Array(content));
                ksyEditor.setValue(ksyContent, -1);
            }
        });
    }
    (function () {
        return __awaiter(this, void 0, void 0, function* () {
            var sandbox = SandboxHandler_1.SandboxHandler.create("https://webide-usercontent.kaitai.io");
            yield sandbox.loadScript(new URL('js/KaitaiWorkerV2.js', location.href).href);
            yield openFile("https:///formats/archive/zip.ksy");
            var compilationResult = yield sandbox.compile(ksyContent);
            console.log('compilationResult', compilationResult);
            jsCode.setValue(Object.values(compilationResult.releaseCode)[0], -1);
            jsCodeDebug.setValue(Object.values(compilationResult.debugCode)[0], -1);
        });
    })();
});
//# sourceMappingURL=v2.js.map