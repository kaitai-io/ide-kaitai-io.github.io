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
        const handler = new SandboxHandler_1.SandboxHandler("https://webide-usercontent.kaitai.io");
        handler.errorHandlers = { "ParseException": ParseError };
        const sandbox = handler.createProxy();
        const npmDir = "lib/_npm";
        await sandbox.loadScript(new URL("js/AmdLoader.js", location.href).href);
        await sandbox.eval(`
        loader.projectBase = "${window.location.href}";
        loader.paths = {
            "yamljs": "${npmDir}/yamljs/yaml",
            "KaitaiStream": "${npmDir}/kaitai-struct/KaitaiStream",
            "kaitai-struct-compiler": "${npmDir}/kaitai-struct-compiler/kaitai-struct-compiler"
        }`);
        await sandbox.loadScript(new URL("js/extensions.js", location.href).href);
        await sandbox.loadScript(new URL("js/worker/worker/KaitaiWorkerV2.js", location.href).href);
        return sandbox;
    }
    exports.InitKaitaiSandbox = InitKaitaiSandbox;
    async function InitKaitaiWithoutSandbox() {
        window["api"] = {};
        await loader.require(["/worker/KaitaiWorkerV2"]);
        return window["api"];
    }
    exports.InitKaitaiWithoutSandbox = InitKaitaiWithoutSandbox;
});
//# sourceMappingURL=KaitaiSandbox.js.map