define(["require", "exports", "./app.files", "./utils/PerformanceHelper", "kaitai-struct-compiler"], function (require, exports, app_files_1, PerformanceHelper_1, KaitaiStructCompiler) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SchemaUtils {
        static ksyNameToJsName(ksyName, isProp) {
            return ksyName.split("_").map((x, i) => i === 0 && isProp ? x : x.ucFirst()).join("");
        }
        ;
        static collectTypes(types, parent) {
            if (parent.types) {
                parent.typesByJsName = {};
                Object.keys(parent.types).forEach(name => {
                    var jsName = SchemaUtils.ksyNameToJsName(name, false);
                    parent.typesByJsName[jsName] = types[jsName] = parent.types[name];
                    SchemaUtils.collectTypes(types, parent.types[name]);
                });
            }
            if (parent.instances) {
                parent.instancesByJsName = {};
                Object.keys(parent.instances).forEach(name => {
                    var jsName = SchemaUtils.ksyNameToJsName(name, true);
                    parent.instancesByJsName[jsName] = parent.instances[name];
                });
            }
        }
        static collectKsyTypes(schema) {
            var types = {};
            SchemaUtils.collectTypes(types, schema);
            var typeName = SchemaUtils.ksyNameToJsName(schema.meta.id, false);
            types[typeName] = schema;
            return types;
        }
    }
    class JsImporter {
        importYaml(name, mode) {
            return new Promise(function (resolve, reject) {
                console.log(`import yaml: ${name}, mode: ${mode}`);
                return app_files_1.fss.kaitai.get(`formats/${name}.ksy`).then(ksyContent => {
                    var ksyModel = YAML.parse(ksyContent);
                    return resolve(ksyModel);
                });
            });
        }
    }
    class CompilationError {
        constructor(type, error) {
            this.type = type;
            this.error = error;
        }
    }
    exports.CompilationError = CompilationError;
    class CompilerService {
        constructor() {
            this.jsImporter = new JsImporter();
        }
        compile(srcYaml, kslang, debug) {
            var perfYamlParse = PerformanceHelper_1.performanceHelper.measureAction("YAML parsing");
            try {
                this.ksySchema = YAML.parse(srcYaml);
                this.ksyTypes = SchemaUtils.collectKsyTypes(this.ksySchema);
                // we have to modify the schema (add typesByJsName for example) before sending into the compiler so we need a copy
                var compilerSchema = YAML.parse(srcYaml);
            }
            catch (parseErr) {
                return Promise.reject(new CompilationError("yaml", parseErr));
            }
            perfYamlParse.done();
            //console.log("ksySchema", ksySchema);
            if (kslang === "json")
                return Promise.resolve();
            else {
                var perfCompile = PerformanceHelper_1.performanceHelper.measureAction("Compilation");
                var ks = new KaitaiStructCompiler();
                var rReleasePromise = (debug === false || debug === "both") ? ks.compile(kslang, compilerSchema, this.jsImporter, false) : Promise.resolve(null);
                var rDebugPromise = (debug === true || debug === "both") ? ks.compile(kslang, compilerSchema, this.jsImporter, true) : Promise.resolve(null);
                //console.log("rReleasePromise", rReleasePromise, "rDebugPromise", rDebugPromise);
                return perfCompile.done(Promise.all([rReleasePromise, rDebugPromise]))
                    .then(([rRelease, rDebug]) => {
                    //console.log("rRelease", rRelease, "rDebug", rDebug);
                    return rRelease && rDebug ? { debug: rDebug, release: rRelease } : rRelease ? rRelease : rDebug;
                }).catch(compileErr => Promise.reject(new CompilationError("kaitai", compileErr)));
            }
        }
    }
    exports.CompilerService = CompilerService;
});
//# sourceMappingURL=KaitaiServices.js.map