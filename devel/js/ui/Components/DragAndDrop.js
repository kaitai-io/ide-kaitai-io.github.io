var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "jquery", "../Component", "../../utils/FileUtils"], function (require, exports, Vue, $, Component_1, FileUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DragAndDrop = class DragAndDrop extends Vue {
        constructor() {
            super(...arguments);
            this.visible = false;
        }
        mounted() {
            var dragLeaveClear;
            var fileDropShadow = $(this.$el);
            var parent = $(this.$el.parentElement);
            console.log("dragAndDrop parent", parent);
            parent.on("dragover", event => {
                event.preventDefault();
                event.stopPropagation();
                if (dragLeaveClear) {
                    clearTimeout(dragLeaveClear);
                    dragLeaveClear = null;
                }
                fileDropShadow.show();
            });
            parent.on("dragleave", event => {
                event.preventDefault();
                event.stopPropagation();
                if (dragLeaveClear)
                    clearTimeout(dragLeaveClear);
                dragLeaveClear = setTimeout(function () { fileDropShadow.hide(); }, 100);
            });
            parent.on("drop", async (event) => {
                event.preventDefault();
                event.stopPropagation();
                fileDropShadow.hide();
                var fileList = event.originalEvent.dataTransfer.files;
                var files = await FileUtils_1.FileUtils.processFileList(fileList);
                this.$emit("files-uploaded", files);
            });
        }
    };
    DragAndDrop = __decorate([
        Component_1.default
    ], DragAndDrop);
    exports.DragAndDrop = DragAndDrop;
});
