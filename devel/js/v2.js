System.register(["./AppLayout", "./ui/Parts/FileTree", "./ui/ComponentLoader"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var AppLayout_1, FileTree_1, ComponentLoader_1, filetree;
    return {
        setters: [
            function (AppLayout_1_1) {
                AppLayout_1 = AppLayout_1_1;
            },
            function (FileTree_1_1) {
                FileTree_1 = FileTree_1_1;
            },
            function (ComponentLoader_1_1) {
                ComponentLoader_1 = ComponentLoader_1_1;
            }
        ],
        execute: function () {
            window["layout"] = AppLayout_1.Layout;
            // <file-tree ref="fileTree" @open-file="openFile" @generate-parser="generateParser"></file-tree>
            // "Components/TreeView", "Components/ContextMenu", "Components/InputModal", "Parts/FileTree"
            console.log('load done?', Object.keys(ComponentLoader_1.componentLoader.templatePromises));
            filetree = new FileTree_1.FileTree();
            filetree.init();
            filetree.$mount(AppLayout_1.Layout.fileTree.element);
            //componentLoader.load([]).then(() => {
            //    var filetree = new FileTree();
            //    filetree.init();
            //    filetree.$mount(Layout.fileTree.element);
            //});
            console.log('fileTree container', AppLayout_1.Layout.fileTree.element);
        }
    };
});
//# sourceMappingURL=v2.js.map