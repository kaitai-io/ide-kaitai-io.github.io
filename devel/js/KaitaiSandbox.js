define(["require", "exports", "./SandboxHandler"], function (require, exports, SandboxHandler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ParseError extends Error {
        constructor(text, value) {
            super(`YAML parsing error in line ${value.parsedLine}: "${value.snippet}"`);
            this.value = value;
        }
    }
    exports.ParseError = ParseError;
    async function InitKaitaiSandbox() {
        var handler = new SandboxHandler_1.SandboxHandler("https://webide-usercontent.kaitai.io");
        handler.errorHandlers = { "ParseException": ParseError };
        var sandbox = handler.createProxy();
        await sandbox.loadScript(new URL("js/worker/worker/ImportLoader.js", location.href).href);
        await sandbox.loadScript(new URL("js/worker/worker/KaitaiWorkerV2.js", location.href).href);
        return sandbox;
    }
    exports.InitKaitaiSandbox = InitKaitaiSandbox;
});
//# sourceMappingURL=KaitaiSandbox.js.map