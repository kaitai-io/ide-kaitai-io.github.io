define(["require", "exports", "./WorkerShared"], function (require, exports, WorkerShared_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ObjectExporter {
        constructor(classes) {
            this.classes = classes;
            this.noLazy = false;
            this.arrayLenLimit = 100;
            this.ksyTypes = {};
        }
        addKsyTypes(ksyTypes) {
            for (const typeName of Object.keys(ksyTypes))
                this.ksyTypes[typeName] = ksyTypes[typeName];
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
        exportArray(parent, arrayPropName, arrayPath, from, to) {
            const array = parent[arrayPropName];
            const debug = parent._debug[arrayPropName];
            let result = [];
            for (let i = from; i <= to; i++)
                result[i - from] = this.exportValue(array[i], debug && debug.arr[i], arrayPath.concat(i.toString()));
            return result;
        }
        exportProperty(obj, propName, objPath) {
            let propertyValue = undefined;
            let propertyException = null;
            try {
                propertyValue = obj[propName];
            }
            catch (e) {
                propertyException = e;
                try {
                    propertyValue = obj[propName];
                }
                catch (e2) { /* same as previous or does not happen */ }
            }
            const exportedProperty = this.exportValue(propertyValue, obj._debug["_m_" + propName], objPath.concat(propName));
            exportedProperty.exception = propertyException;
            return exportedProperty;
        }
        asciiEncode(bytes) {
            var len = bytes.byteLength;
            var binary = "";
            for (var i = 0; i < len; i++)
                binary += String.fromCharCode(bytes[i]);
            return binary;
        }
        hexEncode(bytes) {
            var len = bytes.byteLength;
            var binary = "0x";
            for (var i = 0; i < len; i++)
                binary += bytes[i].toString(16);
            return binary;
        }
        getWebIdeRepr(exp) {
            if (exp.type !== WorkerShared_1.ObjectType.Object)
                return [];
            var ksyType = this.ksyTypes[exp.object.class];
            var repr = ksyType && ksyType["-webide-representation"];
            if (!repr)
                return [];
            function ksyNameToJsName(ksyName) { return ksyName.split("_").map((x, i) => (i === 0 ? x : x.ucFirst())).join(""); }
            return ArrayHelper.flatten(repr.split(/\{(.*?)\}/).map((value, idx) => {
                if (idx % 2 === 0) {
                    return [{ type: "text", value }];
                }
                else {
                    var currItem = exp;
                    var parts = value.split(":");
                    var format = { sep: ", " };
                    if (parts.length > 1)
                        parts[1].split(",").map(x => x.split("=")).forEach(kv => format[kv[0]] = kv.length > 1 ? kv[1] : true);
                    parts[0].split(".").forEach(k => {
                        if (!currItem || !currItem.object)
                            currItem = null;
                        else {
                            var child = k === "_parent" ? currItem.parent : currItem.object.fields[ksyNameToJsName(k)];
                            // TODO: add warning
                            //if (!child)
                            //    console.log("[webrepr] child not found in object", currItem, k);
                            currItem = child;
                        }
                    });
                    const result = { type: "value" };
                    let resArr = [result];
                    if (!currItem)
                        result.value = "";
                    else if (currItem.type === WorkerShared_1.ObjectType.Object)
                        resArr = this.getWebIdeRepr(currItem);
                    else if (format.str && currItem.type === WorkerShared_1.ObjectType.TypedArray)
                        result.value = this.asciiEncode(currItem.bytes);
                    else if (format.hex && currItem.type === WorkerShared_1.ObjectType.TypedArray)
                        result.value = this.hexEncode(currItem.bytes);
                    else if (currItem.type === WorkerShared_1.ObjectType.Primitive && Number.isInteger(currItem.primitiveValue))
                        result.value = format.dec ? `${currItem.primitiveValue}` : currItem.enumStringValue || `0x${currItem.primitiveValue.toString(16)}`;
                    else if (currItem.type === WorkerShared_1.ObjectType.Array) {
                        const sepObj = { type: "text", value: format.sep };
                        resArr = [sepObj];
                        for (const item of currItem.arrayItems)
                            resArr.push(...this.getWebIdeRepr(item), sepObj);
                    }
                    else
                        result.value = (currItem.primitiveValue || "").toString();
                    return resArr;
                }
            }));
        }
        exportValue(obj, debug, path) {
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
                const array = obj;
                result.arrayLength = array.length;
                result.isLazyArray = this.arrayLenLimit && array.length > this.arrayLenLimit;
                if (!result.isLazyArray)
                    result.arrayItems = array.map((item, i) => this.exportValue(item, debug && debug.arr[i], path.concat(i.toString())));
            }
            else if (result.type === WorkerShared_1.ObjectType.Object) {
                var childIoOffset = obj._io._byteOffset;
                if (result.start === childIoOffset) { // new KaitaiStream was used, fix start position
                    result.ioOffset = childIoOffset;
                    result.start -= childIoOffset;
                    result.end -= childIoOffset;
                }
                result.object = { class: obj.constructor.name, instances: {}, fields: {} };
                var ksyType = this.ksyTypes[result.object.class];
                for (var key of Object.keys(obj).filter(x => x[0] !== "_"))
                    result.object.fields[key] = this.exportValue(obj[key], obj._debug[key], path.concat(key));
                Object.getOwnPropertyNames(obj.constructor.prototype).filter(x => x[0] !== "_" && x !== "constructor").forEach(propName => {
                    var ksyInstanceData = ksyType && ksyType.instancesByJsName[propName];
                    var eagerLoad = ksyInstanceData && ksyInstanceData["-webide-parse-mode"] === "eager";
                    if (eagerLoad || this.noLazy) {
                        const exportedProperty = this.exportProperty(obj, propName, path);
                        result.object.fields[propName] = exportedProperty;
                    }
                    else
                        result.object.instances[propName] = { path: path.concat(propName), offset: 0 };
                });
            }
            else
                console.log(`Unknown object type: ${result.type}`);
            try {
                result.representation = this.getWebIdeRepr(result);
            }
            catch (e) {
                result.exception = result.exception || e.toString();
            }
            return result;
        }
    }
    exports.ObjectExporter = ObjectExporter;
});
