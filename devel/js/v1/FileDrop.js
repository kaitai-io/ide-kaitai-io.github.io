define(["require", "exports", "../utils"], function (require, exports, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function initFileDrop(containerId, callback) {
        var dragLeaveClear;
        var body = $("body");
        var fileDropShadow = $("#" + containerId);
        body.on("dragover", function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (dragLeaveClear) {
                clearTimeout(dragLeaveClear);
                dragLeaveClear = null;
            }
            fileDropShadow.show();
        });
        body.on("dragleave", function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (dragLeaveClear)
                clearTimeout(dragLeaveClear);
            dragLeaveClear = setTimeout(function () { fileDropShadow.hide(); }, 100);
        });
        body.on("drop", function (event) {
            event.preventDefault();
            event.stopPropagation();
            fileDropShadow.hide();
            var files = event.originalEvent.dataTransfer.files;
            var resFiles = utils_1.processFiles(files);
            callback(resFiles);
        });
    }
    exports.initFileDrop = initFileDrop;
});
