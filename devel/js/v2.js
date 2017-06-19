define(["require", "exports", "./AppLayout", "./ui/Parts/FileTree", "./ui/ComponentLoader"], function (require, exports, AppLayout_1, FileTree_1, ComponentLoader_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    window["layout"] = AppLayout_1.Layout;
    // <file-tree ref="fileTree" @open-file="openFile" @generate-parser="generateParser"></file-tree>
    // "Components/TreeView", "Components/ContextMenu", "Components/InputModal", "Parts/FileTree"
    console.log('load done?', Object.keys(ComponentLoader_1.componentLoader.templatePromises));
    var filetree = new FileTree_1.FileTree();
    filetree.init();
    filetree.$mount(AppLayout_1.Layout.fileTree.element);
    //componentLoader.load([]).then(() => {
    //    var filetree = new FileTree();
    //    filetree.init();
    //    filetree.$mount(Layout.fileTree.element);
    //});
    console.log('fileTree container', AppLayout_1.Layout.fileTree.element);
});
//# sourceMappingURL=v2.js.map