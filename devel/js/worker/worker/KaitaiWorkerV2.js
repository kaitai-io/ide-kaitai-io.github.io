/// <reference path="../../lib/ts-types/kaitai.d.ts" />
/// <reference path="../KsySchema.ts" />
define(["require", "exports", "kaitai-struct-compiler", "KaitaiStream", "yamljs", "./ObjectExporter", "./JsonExporter", "./SchemaUtils", "./TemplateCompiler"], function (require, exports, KaitaiStructCompiler, KaitaiStream, yamljs_1, ObjectExporter_1, JsonExporter_1, SchemaUtils_1, TemplateCompiler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class KaitaiServices {
        constructor() {
            this.kaitaiCompiler = new KaitaiStructCompiler();
            this.templateCompiler = new TemplateCompiler_1.TemplateCompiler();
        }
        initCode() {
            if (!this.jsCode)
                return false;
            if (this.classes)
                return true;
            this.classes = {};
            var self = this;
            function define(name, deps, callback) {
                self.classes[name] = callback();
                self.mainClassName = name;
            }
            define["amd"] = true;
            eval(this.jsCode);
            console.log("compileKsy", this.mainClassName, this.classes);
            const ksyTypes = SchemaUtils_1.SchemaUtils.collectKsyTypes(this.ksy);
            this.objectExporter = new ObjectExporter_1.ObjectExporter(ksyTypes, this.classes);
            return true;
        }
        async compile(ksyCode, template) {
            this.jsCode = this.classes = this.objectExporter = null;
            this.ksyCode = ksyCode;
            this.ksy = yamljs_1.YAML.parse(ksyCode);
            var releaseCode, debugCode;
            if (template) {
                const templateSchema = yamljs_1.YAML.parse(template);
                releaseCode = await this.templateCompiler.compile(templateSchema, this.ksy, null, false);
                debugCode = await this.templateCompiler.compile(templateSchema, this.ksy, null, true);
            }
            else {
                releaseCode = await this.kaitaiCompiler.compile("javascript", this.ksy, null, false);
                debugCode = await this.kaitaiCompiler.compile("javascript", this.ksy, null, true);
            }
            this.jsCode = Object.values(debugCode).join("\n");
            return { releaseCode, debugCode, debugCodeAll: this.jsCode };
        }
        async setInput(input) {
            this.input = input;
            console.log("setInput", this.input);
        }
        async parse() {
            if (!this.initCode())
                return;
            var mainClass = this.classes[this.mainClassName];
            this.parsed = new mainClass(new KaitaiStream(this.input, 0));
            this.parsed._read();
            console.log("parsed", this.parsed);
        }
        async export(noLazy) {
            if (!this.initCode())
                return null;
            return this.objectExporter.exportValue(this.parsed, null, [], noLazy);
        }
        async exportInstance(path) {
            let curr = this.parsed;
            let parent = null;
            for (const item of path) {
                parent = curr;
                curr = curr[item];
            }
            return this.objectExporter.exportValue(curr, parent._debug[path.last()], path);
        }
        async getCompilerInfo() {
            return { version: this.kaitaiCompiler.version, buildDate: this.kaitaiCompiler.buildDate };
        }
        async generateParser(ksyContent, lang, debug) {
            const ksy = yamljs_1.YAML.parse(ksyContent);
            const compiledCode = await this.kaitaiCompiler.compile(lang, ksy, null, debug);
            return compiledCode;
        }
        async exportToJson(useHex) {
            if (!this.initCode())
                return null;
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