"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WorkerShared_1 = require("./WorkerShared");
class ObjectExporter {
    constructor(ksyTypes, classes) {
        this.ksyTypes = ksyTypes;
        this.classes = classes;
    }
    static isUndef(obj) { return typeof obj === "undefined"; }
    static getObjectType(obj) {
        if (obj instanceof Uint8Array)
            return WorkerShared_1.ObjectType.TypedArray;
        else if (obj === null || typeof obj !== "object")
            return ObjectExporter.isUndef(obj) ? WorkerShared_1.ObjectType.Undefined : WorkerShared_1.ObjectType.Primitive;
        else if (Array.isArray(obj))
            return WorkerShared_1.ObjectType.Array;
        else
            return WorkerShared_1.ObjectType.Object;
    }
    exportValue(obj, debug, path, noLazy) {
        var result = {
            start: debug && debug.start,
            end: debug && debug.end,
            ioOffset: debug && debug.ioOffset,
            path: path,
            type: ObjectExporter.getObjectType(obj)
        };
        if (result.type === WorkerShared_1.ObjectType.TypedArray)
            result.bytes = obj;
        else if (result.type === WorkerShared_1.ObjectType.Primitive || result.type === WorkerShared_1.ObjectType.Undefined) {
            result.primitiveValue = obj;
            if (debug && debug.enumName) {
                result.enumName = debug.enumName;
                var enumObj = this.classes;
                debug.enumName.split(".").forEach(p => enumObj = enumObj[p]);
                var flagCheck = 0, flagSuccess = true;
                var flagStr = Object.keys(enumObj).filter(x => isNaN(x)).filter(x => {
                    if (flagCheck & enumObj[x]) {
                        flagSuccess = false;
                        return false;
                    }
                    flagCheck |= enumObj[x];
                    return obj & enumObj[x];
                }).join("|");
                //console.log(debug.enumName, enumObj, enumObj[obj], flagSuccess, flagStr);
                result.enumStringValue = enumObj[obj] || (flagSuccess && flagStr);
            }
        }
        else if (result.type === WorkerShared_1.ObjectType.Array) {
            result.arrayItems = obj.map((item, i) => this.exportValue(item, debug && debug.arr[i], path.concat(i.toString()), noLazy));
        }
        else if (result.type === WorkerShared_1.ObjectType.Object) {
            var childIoOffset = obj._io._byteOffset;
            if (result.start === childIoOffset) {
                result.ioOffset = childIoOffset;
                result.start -= childIoOffset;
                result.end -= childIoOffset;
            }
            result.object = { class: obj.constructor.name, instances: {}, fields: {} };
            var ksyType = this.ksyTypes[result.object.class];
            for (var key of Object.keys(obj).filter(x => x[0] !== "_"))
                result.object.fields[key] = this.exportValue(obj[key], obj._debug[key], path.concat(key), noLazy);
            Object.getOwnPropertyNames(obj.constructor.prototype).filter(x => x[0] !== "_" && x !== "constructor").forEach(propName => {
                var ksyInstanceData = ksyType && ksyType.instancesByJsName[propName];
                var eagerLoad = ksyInstanceData && ksyInstanceData["-webide-parse-mode"] === "eager";
                if (eagerLoad || noLazy)
                    result.object.fields[propName] = this.exportValue(obj[propName], obj._debug["_m_" + propName], path.concat(propName), noLazy);
                else
                    result.object.instances[propName] = { path: path.concat(propName), offset: 0 };
            });
        }
        else
            console.log(`Unknown object type: ${result.type}`);
        return result;
    }
}
exports.ObjectExporter = ObjectExporter;
//# sourceMappingURL=ObjectExporter.js.map