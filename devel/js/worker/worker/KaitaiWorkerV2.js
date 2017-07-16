/// <reference path="../../lib/ts-types/kaitai.d.ts" />
/// <reference path="../KsySchema.ts" />
define(["require", "exports", "kaitai-struct-compiler", "KaitaiStream", "yamljs", "./ObjectExporter", "./JsonExporter", "./SchemaUtils"], function (require, exports, KaitaiStructCompiler, KaitaiStream, yamljs_1, ObjectExporter_1, JsonExporter_1, SchemaUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class KaitaiServices {
        constructor() {
            this.compiler = new KaitaiStructCompiler();
        }
        async compile(ksyCode) {
            this.ksyCode = ksyCode;
            this.ksy = yamljs_1.YAML.parse(ksyCode);
            var releaseCode = await this.compiler.compile("javascript", this.ksy, null, false);
            var debugCode = await this.compiler.compile("javascript", this.ksy, null, true);
            var debugCodeAll = this.jsCode = Object.values(debugCode).join("\n");
            this.classes = {};
            var self = this;
            function define(name, deps, callback) {
                self.classes[name] = callback();
                self.mainClassName = name;
            }
            define["amd"] = true;
            eval(debugCodeAll);
            console.log("compileKsy", this.mainClassName, this.classes);
            const ksyTypes = SchemaUtils_1.SchemaUtils.collectKsyTypes(this.ksy);
            this.objectExporter = new ObjectExporter_1.ObjectExporter(ksyTypes, this.classes);
            return { releaseCode, debugCode, debugCodeAll };
        }
        async setInput(input) {
            this.input = input;
            console.log("setInput", this.input);
        }
        async parse() {
            var mainClass = this.classes[this.mainClassName];
            this.parsed = new mainClass(new KaitaiStream(this.input, 0));
            this.parsed._read();
            console.log("parsed", this.parsed);
        }
        async export() {
            return this.objectExporter.exportValue(this.parsed, null, []);
        }
        async getCompilerInfo() {
            return { version: this.compiler.version, buildDate: this.compiler.buildDate };
        }
        async generateParser(ksyContent, lang, debug) {
            const ksy = yamljs_1.YAML.parse(ksyContent);
            const compiledCode = await this.compiler.compile(lang, ksy, null, debug);
            return compiledCode;
        }
        async exportToJson(useHex) {
            const exported = await this.objectExporter.exportValue(this.parsed, null, [], true);
            const json = new JsonExporter_1.JsonExporter(useHex).export(exported);
            return json;
        }
    }
    try {
        var kaitaiServices = api.kaitaiServices = new KaitaiServices();
        console.log("Kaitai Worker V2!", api);
    }
    catch (e) {
        console.log("Worker error", e);
    }
});
//# sourceMappingURL=KaitaiWorkerV2.js.map