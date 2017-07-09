"use strict";
/// <reference path="../../lib/ts-types/kaitai.d.ts" />
/// <reference path="../KsySchema.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const KaitaiStructCompiler = require("kaitai-struct-compiler");
const KaitaiStream = require("KaitaiStream");
const yamljs_1 = require("yamljs");
const ObjectExporter_1 = require("./ObjectExporter");
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
        this.objectExporter = new ObjectExporter_1.ObjectExporter(this.ksy.types, this.classes);
        return { releaseCode, debugCode, debugCodeAll };
    }
    setInput(input) {
        this.input = input;
        console.log("setInput", this.input);
    }
    parse() {
        var mainClass = this.classes[this.mainClassName];
        this.parsed = new mainClass(new KaitaiStream(this.input, 0));
        this.parsed._read();
        console.log("parsed", this.parsed);
    }
    export() {
        return this.objectExporter.exportValue(this.parsed, null, []);
    }
    getCompilerInfo() {
        return { version: this.compiler.version, buildDate: this.compiler.buildDate };
    }
}
try {
    var kaitaiServices = api.kaitaiServices = new KaitaiServices();
    console.log("Kaitai Worker V2!", api);
}
catch (e) {
    console.log("Worker error", e);
}
//# sourceMappingURL=KaitaiWorkerV2.js.map