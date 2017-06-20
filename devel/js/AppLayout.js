System.register(["./LayoutManagerV2"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var LayoutManagerV2_1, Layout;
    return {
        setters: [
            function (LayoutManagerV2_1_1) {
                LayoutManagerV2_1 = LayoutManagerV2_1_1;
            }
        ],
        execute: function () {
            Layout = class Layout {
            };
            exports_1("Layout", Layout);
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
                .addClosableComponent(c => c.addComponent("errors", { height: 100, isClosable: true }), false, c => Layout.errors = c)));
            Layout.manager.root.init();
        }
    };
});
//# sourceMappingURL=AppLayout.js.map