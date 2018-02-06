define(["require", "exports", "jquery"], function (require, exports, $) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FileUtils {
        static readBlob(blob) {
            return new Promise(function (resolve, reject) {
                const reader = new FileReader();
                reader.onload = function () { resolve(reader.result); };
                reader.onerror = function (e) { reject(e); };
                reader.readAsArrayBuffer(blob);
            });
        }
        static async processFileList(fileList) {
            const result = {};
            for (let file of Array.from(fileList))
                result[file.name] = await FileUtils.readBlob(file);
            return result;
        }
        static openFilesWithDialog() {
            return new Promise((resolve, reject) => {
                const input = $(`<input type="file" multiple />`);
                input.on("change", async (e) => {
                    const result = FileUtils.processFileList(e.target.files);
                    input.remove();
                    resolve(result);
                }).click();
            });
        }
        static saveFile(filename, data) {
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style.display = "none";
            var blob = new Blob([data], { type: "octet/stream" });
            var url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    }
    exports.FileUtils = FileUtils;
});
//# sourceMappingURL=FileUtils.js.map