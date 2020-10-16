define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Conversion {
        static utf8BytesToStr(bytes) {
            return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
        }
        static strToUtf8Bytes(str) {
            return new TextEncoder().encode(str).buffer;
        }
    }
    exports.Conversion = Conversion;
});
//# sourceMappingURL=Conversion.js.map