define(["require", "exports", "./AppLayout", "./ui/Parts/FileTree", "ace/ace"], function (require, exports, AppLayout_1, FileTree_1, ace) {
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
        parent.container.on("resize", () => editor.resize());
        return editor;
    }
    var ksyEditor = setupEditor(AppLayout_1.Layout.ksyEditor, 'yaml');
    filetree.$on("open-file", (treeNode, data) => {
        var str = new TextDecoder().decode(new Uint8Array(data));
        ksyEditor.setValue(str);
    });
});
//# sourceMappingURL=v2.js.map