define(["require", "exports", "./LayoutManagerV2"], function (require, exports, LayoutManagerV2_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Layout {
    }
    exports.Layout = Layout;
    Layout.manager = new LayoutManagerV2_1.LayoutManager();
    Layout.manager.root
        .addHorizontal(mainCols => mainCols
        .addComponent("files", { width: 200 }, c => Layout.fileTree = c)
        .addVertical(errorArea => errorArea
        .addHorizontal(middleArea => middleArea
        .addVertical(middleCol => middleCol
        .addComponent(".ksy editor", c => Layout.ksy = c)
        .addComponent("object tree", c => Layout.objectTree = c))
        .addVertical(rightCol => rightCol
        .addTabs(files => Layout.files = files
        .addComponent("JS code", c => Layout.jsCode = c)
        .addComponent("JS code (debug)", c => Layout.jsCodeDebug = c))
        .addHorizontal(rightPanel => rightPanel
        .addComponent("info panel", c => Layout.infoPanel = c)
        .addComponent("converter", c => Layout.converterPanel = c))))
        .addClosableComponent(c => c.addComponent("errors", { height: 100, isClosable: true }), c => Layout.errors = c)));
    Layout.manager.root.init();
});
//# sourceMappingURL=AppLayout.js.map