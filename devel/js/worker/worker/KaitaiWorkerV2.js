/// <reference path="../../lib/ts-types/kaitai.d.ts" />
/// <reference path="../KsySchema.ts" />
define(["require", "exports", "kaitai-struct-compiler", "KaitaiStream", "yamljs", "./ObjectExporter", "./JsonExporter", "./SchemaUtils", "./TemplateCompiler"], function (require, exports, KaitaiStructCompiler, KaitaiStream, yamljs_1, ObjectExporter_1, JsonExporter_1, SchemaUtils_1, TemplateCompiler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class KaitaiServices {
        constructor() {
            this.ksys = {};
            this.kaitaiCompiler = new KaitaiStructCompiler();
            this.templateCompiler = new TemplateCompiler_1.TemplateCompiler();
        }
        initCode() {
            if (!this.jsCode)
                return false;
            if (this.classes && this.objectExporter)
                return true;
            this.classes = {};
            var self = this;
            function define(name, deps, callback) {
                self.classes[name] = callback();
                self.mainClassName = name;
            }
            define["amd"] = true;
            eval(this.jsCode.replace(/if \(typeof require(.|\n)*?require\([^;]*;/g, ""));
            console.log("compileKsy", this.mainClassName, this.classes);
            this.objectExporter = new ObjectExporter_1.ObjectExporter(this.classes);
            for (const ksy of Object.values(this.ksys))
                this.objectExporter.addKsyTypes(SchemaUtils_1.SchemaUtils.collectKsyTypes(ksy));
            return true;
        }
        async getMissingImports() {
            const missingImports = new Set();
            for (const ksyUri of Object.keys(this.ksys)) {
                const ksyUriParts = ksyUri.split("/");
                const parentUri = ksyUriParts.slice(0, ksyUriParts.length - 1).join("/");
                const ksy = this.ksys[ksyUri];
                if (!ksy.meta || !ksy.meta.imports)
                    continue;
                for (const importFn of ksy.meta.imports) {
                    const importUri = `${parentUri}/${importFn}.ksy`;
                    if (!(importUri in this.ksys))
                        missingImports.add(importUri);
                }
            }
            return Array.from(missingImports);
        }
        async setKsys(ksyCodes) {
            for (const importFn of Object.keys(ksyCodes))
                this.ksys[importFn] = yamljs_1.YAML.parse(ksyCodes[importFn]);
            return await this.getMissingImports();
        }
        async compile(ksyUri, template) {
            this.jsCode = this.classes = this.objectExporter = null;
            const ksy = this.ksys[ksyUri];
            var releaseCode, debugCode;
            if (template) {
                const templateSchema = yamljs_1.YAML.parse(template);
                releaseCode = await this.templateCompiler.compile(templateSchema, ksy, this, false);
                debugCode = await this.templateCompiler.compile(templateSchema, ksy, this, true);
            }
            else {
                releaseCode = await this.kaitaiCompiler.compile("javascript", ksy, this, false);
                debugCode = await this.kaitaiCompiler.compile("javascript", ksy, this, true);
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
        async export(options) {
            if (!this.initCode())
                return null;
            this.objectExporter.noLazy = options.noLazy;
            this.objectExporter.arrayLenLimit = options.arrayLenLimit;
            options = options || {};
            if (options.path) {
                let path = Array.from(options.path);
                let propName = path.pop();
                let parent = this.parsed;
                for (const item of path)
                    parent = parent[item];
                const arrayRange = options.arrayRange;
                if (arrayRange)
                    return this.objectExporter.exportArray(parent, propName, options.path, arrayRange.from, arrayRange.to);
                else
                    return this.objectExporter.exportProperty(parent, propName, options.path);
            }
            else
                return this.objectExporter.exportValue(this.parsed, null, []);
        }
        async getCompilerInfo() {
            return { version: this.kaitaiCompiler.version, buildDate: this.kaitaiCompiler.buildDate };
        }
        async generateParser(ksyContent, lang, debug) {
            const ksy = yamljs_1.YAML.parse(ksyContent);
            const compiledCode = await this.kaitaiCompiler.compile(lang, ksy, this, debug);
            return compiledCode;
        }
        async importYaml(name, mode) {
            for (const ksyUri of Object.keys(this.ksys))
                if (ksyUri.endsWith(`/${name}.ksy`))
                    return this.ksys[ksyUri];
            throw new Error(`importYaml failed: ${name}. Available ksys: ${Object.keys(this.ksys).join(", ")}`);
        }
        async exportToJson(useHex) {
            if (!this.initCode())
                return null;
            this.objectExporter.noLazy = true;
            this.objectExporter.arrayLenLimit = null;
            const exported = await this.objectExporter.exportValue(this.parsed, null, []);
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