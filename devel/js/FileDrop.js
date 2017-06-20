System.register(["./utils"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
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
    exports_1("initFileDrop", initFileDrop);
    var utils_1;
    return {
        setters: [
            function (utils_1_1) {
                utils_1 = utils_1_1;
            }
        ],
        execute: function () {
        }
    };
});
//# sourceMappingURL=FileDrop.js.map