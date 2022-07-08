var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "../Component", "../../HexViewer", "../../utils/FileUtils", "../../FileSystem/FsUri"], function (require, exports, Vue, Component_1, HexViewer_1, FileUtils_1, FsUri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BinaryPanel = class BinaryPanel extends Vue {
        mounted() {
            this.hexViewer = new HexViewer_1.HexViewer(this.$el.querySelector(".hexViewer"));
        }
        openContextMenu(e) {
            this.$refs["ctxMenu"].open(e, null);
        }
        setInput(dataProvider, uri = null) {
            this.uri = uri;
            this.hexViewer.setDataProvider(dataProvider);
        }
        async downloadSelected() {
            const start = this.hexViewer.selectionStart, end = this.hexViewer.selectionEnd;
            const data = await this.hexViewer.dataProvider.get(start, end - start + 1);
            const uri = new FsUri_1.FsUri(this.uri);
            await FileUtils_1.FileUtils.saveFile(`${uri.nameWoExtension}_0x${start.toString(16)}-0x${end.toString(16)}.${uri.extension}`, data);
        }
    };
    BinaryPanel = __decorate([
        Component_1.default
    ], BinaryPanel);
    exports.BinaryPanel = BinaryPanel;
});
