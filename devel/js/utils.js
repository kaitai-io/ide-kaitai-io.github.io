define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function downloadFile(url) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        return new Promise((resolve, reject) => {
            xhr.onload = e => resolve(xhr.response);
            xhr.onerror = reject;
            xhr.send();
        });
    }
    exports.downloadFile = downloadFile;
    function saveFile(data, filename) {
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
    exports.saveFile = saveFile;
    class Delayed {
        constructor(delay) {
            this.delay = delay;
        }
        do(func) {
            if (this.timeout)
                clearTimeout(this.timeout);
            this.timeout = setTimeout(function () {
                this.timeout = null;
                func();
            }, this.delay);
        }
    }
    exports.Delayed = Delayed;
    class EventSilencer {
        constructor() {
            this.silence = false;
        }
        silenceThis(callback) {
            this.silence = true;
            callback();
            this.silence = false;
        }
        do(callback) {
            if (!this.silence)
                callback();
        }
    }
    exports.EventSilencer = EventSilencer;
    class Convert {
        static utf8StrToBytes(str) {
            return new TextEncoder("utf-8").encode(str);
        }
    }
    exports.Convert = Convert;
    function asciiEncode(bytes) {
        var len = bytes.byteLength;
        var binary = "";
        for (var i = 0; i < len; i++)
            binary += String.fromCharCode(bytes[i]);
        return binary;
    }
    exports.asciiEncode = asciiEncode;
    function hexEncode(bytes) {
        var len = bytes.byteLength;
        var binary = "0x";
        for (var i = 0; i < len; i++)
            binary += bytes[i].toString(16);
        return binary;
    }
    exports.hexEncode = hexEncode;
    function arrayBufferToBase64(buffer) {
        var bytes = new Uint8Array(buffer);
        var binary = asciiEncode(bytes);
        return window.btoa(binary);
    }
    exports.arrayBufferToBase64 = arrayBufferToBase64;
    function readBlob(blob, mode, ...args) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () { resolve(reader.result); };
            reader.onerror = function (e) { reject(e); };
            reader["readAs" + mode[0].toUpperCase() + mode.substr(1)](blob, ...args);
        });
    }
    exports.readBlob = readBlob;
    function htmlescape(str) {
        return $("<div/>").text(str).html();
    }
    exports.htmlescape = htmlescape;
    function processFiles(files) {
        var resFiles = [];
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            resFiles.push({ file: file, read: function (mode) { return readBlob(this.file, mode); } });
        }
        return resFiles;
    }
    exports.processFiles = processFiles;
    function openFilesWithDialog(callback) {
        $(`<input type="file" multiple />`).on("change", e => {
            var files = processFiles(e.target.files);
            callback(files);
        }).click();
    }
    exports.openFilesWithDialog = openFilesWithDialog;
    function s(strings, ...values) {
        var result = strings[0];
        for (var i = 1; i < strings.length; i++)
            result += htmlescape(values[i - 1]) + strings[i];
        return result;
    }
    exports.s = s;
    function collectAllObjects(root) {
        var objects = [];
        function process(value) {
            objects.push(value);
            if (value.type === ObjectType.Object)
                Object.keys(value.object.fields).forEach(fieldName => process(value.object.fields[fieldName]));
            else if (value.type === ObjectType.Array)
                value.arrayItems.forEach(arrItem => process(arrItem));
        }
        process(root);
        return objects;
    }
    exports.collectAllObjects = collectAllObjects;
    function precallHook(parent, name, callback) {
        var original = parent[name];
        parent[name] = function () {
            callback();
            original.apply(this, arguments);
        };
        parent[name].prototype = original.prototype;
    }
    exports.precallHook = precallHook;
});
//# sourceMappingURL=utils.js.map