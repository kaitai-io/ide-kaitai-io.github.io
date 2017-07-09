define(["require", "exports", "./LayoutManagerV2", "ace/ace"], function (require, exports, LayoutManagerV2_1, ace) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Layout {
    }
    exports.Layout = Layout;
    class LayoutHelper {
        static setupEditor(parent, lang) {
            var editor = ace.edit(parent.element);
            editor.setTheme("ace/theme/monokai");
            editor.getSession().setMode(`ace/mode/${lang}`);
            if (lang === "yaml")
                editor.setOption("tabSize", 2);
            editor.$blockScrolling = Infinity; // TODO: remove this line after they fix ACE not to throw warning to the console
            parent.container.on("resize", () => editor.resize());
            return editor;
        }
    }
    exports.LayoutHelper = LayoutHelper;
    Layout.manager = new LayoutManagerV2_1.LayoutManager();
    Layout.manager.root
        .addHorizontal(mainCols => mainCols
        .addComponent("files", { width: 200 }, c => Layout.fileTree = c)
        .addVertical(errorArea => errorArea
        .addHorizontal(middleArea => middleArea
        .addVertical(middleCol => middleCol
        .addComponent(".ksy editor", c => Layout.ksyEditor = c)
        .addComponent("object tree", c => Layout.objectTree = c))
        .addVertical(rightCol => rightCol.setConfig({ width: 38 })
        .addTabs(files => Layout.files = files
        .addComponent("JS code", c => Layout.jsCode = c)
        .addComponent("JS code (debug)", c => Layout.jsCodeDebug = c)
        .addComponent("input binary", c => Layout.inputBinary = c))
        .addHorizontal(rightPanel => rightPanel.setConfig({ height: 20 })
        .addComponent("info panel", { width: 260 }, c => Layout.infoPanel = c)
        .addComponent("converter", c => Layout.converterPanel = c))))
        .addClosableComponent(c => c.addComponent("errors", { height: 100, isClosable: true }), false, c => Layout.errors = c)));
    Layout.manager.root.init();
});
//# sourceMappingURL=AppLayout.js.map