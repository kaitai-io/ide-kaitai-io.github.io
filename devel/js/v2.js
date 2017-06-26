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
    filetree.$on("open-file", (treeNode, data) => {
        var str = new TextDecoder().decode(new Uint8Array(data));
        ksyEditor.setValue(str);
    });
    (function () {
        return __awaiter(this, void 0, void 0, function* () {
            var sandbox = SandboxHandler_1.SandboxHandler.create("https://webide-usercontent.kaitai.io");
            yield sandbox.eval("console.log('hello from sandbox', location)");
        });
    })();
});
//# sourceMappingURL=v2.js.map