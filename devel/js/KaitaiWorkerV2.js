"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
let baseDir = new URL('../', currentScriptSrc).href;
function importAll(...fns) {
    importScripts(...fns.map(fn => new URL(fn, baseDir).href));
}
var window = self;
try {
    importAll('lib/kaitai/kaitai-struct-compiler-fastopt.js', 'lib/kaitai/yaml.js');
    var compiler = new KaitaiStructCompiler();
    console.log('Kaitai Worker V2!', compiler, methods, YAML);
    var ksy;
    methods.compile = (ksyCode) => __awaiter(this, void 0, void 0, function* () {
        ksy = YAML.parse(ksyCode);
        var releaseCode = yield compiler.compile('javascript', ksy, null, false);
        var debugCode = yield compiler.compile('javascript', ksy, null, true);
        return { releaseCode, debugCode };
    });
}
catch (e) {
    console.log("Worker error", e);
}
//# sourceMappingURL=KaitaiWorkerV2.js.map