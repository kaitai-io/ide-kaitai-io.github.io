define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ucFirst(str) { return str.charAt(0).toUpperCase() + str.slice(1); }
    class SchemaUtils {
        static ksyNameToJsName(ksyName, isProp) {
            return ksyName.split("_").map((x, i) => i === 0 && isProp ? x : ucFirst(x)).join("");
        }
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
    exports.SchemaUtils = SchemaUtils;
});
//# sourceMappingURL=SchemaUtils.js.map