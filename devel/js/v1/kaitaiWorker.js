"use strict";
// issue: https://github.com/Microsoft/TypeScript/issues/582
var myself = self;
var wi = {
    MainClass: null,
    ksyTypes: null,
    inputBuffer: null,
    ioInput: null,
    root: null,
    exported: null,
};
var hooks = { nodeFilter: null };
function isUndef(obj) { return typeof obj === "undefined"; }
function getObjectType(obj) {
    if (obj instanceof Uint8Array)
        return ObjectType.TypedArray;
    else if (obj === null || typeof obj !== "object")
        return isUndef(obj) ? ObjectType.Undefined : ObjectType.Primitive;
    else if (Array.isArray(obj))
        return ObjectType.Array;
    else
        return ObjectType.Object;
}
function exportValue(obj, debug, hasRawAttr, path, noLazy) {
    adjustDebug(debug);
    var result = {
        start: debug && debug.start,
        end: debug && debug.end,
        incomplete: debug && debug.incomplete,
        validationError: (debug && debug.validationError) || undefined,
        ioOffset: debug && debug.ioOffset,
        path: path,
        type: getObjectType(obj)
    };
    if (result.type === ObjectType.TypedArray)
        result.bytes = obj;
    else if (result.type === ObjectType.Primitive || result.type === ObjectType.Undefined) {
        result.primitiveValue = obj;
        if (debug && debug.enumName) {
            result.enumName = debug.enumName;
            var enumObj = myself;
            var enumPath = debug.enumName.split(".");
            // Because of https://github.com/kaitai-io/kaitai_struct/issues/1074,
            // KSC-generated modules export a plain object (not the constructor
            // function directly) - for example, the exported value from the
            // `Zip.js` module is `{ Zip: function (_io, _parent, _root) {...} }`.
            //
            // This means we have to use the top-level name twice in the path resolution.
            enumPath.unshift(enumPath[0]);
            enumPath.forEach(p => enumObj = enumObj[p]);
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
    else if (result.type === ObjectType.Array) {
        if (debug && debug.arr) {
            result.arrayItems = debug.arr.map((itemDebug, i) => exportValue(obj[i], itemDebug, hasRawAttr, path.concat(i.toString()), noLazy));
            if (result.incomplete) {
                debug.end = inferDebugEnd(debug.arr);
                result.end = debug.end;
            }
        }
        else {
            result.arrayItems = obj.map((item, i) => exportValue(item, undefined, hasRawAttr, path.concat(i.toString()), noLazy));
        }
    }
    else if (result.type === ObjectType.Object) {
        const hasSubstream = hasRawAttr && obj._io;
        if (result.incomplete && hasSubstream) {
            debug.end = debug.start + obj._io.size;
            result.end = debug.end;
        }
        result.object = { class: obj.constructor.name, instances: {}, fields: {} };
        const ksyType = wi.ksyTypes[result.object.class];
        const fieldNames = new Set(Object.keys(obj));
        if (obj._debug) {
            Object.keys(obj._debug).forEach(k => fieldNames.add(k));
        }
        const fieldNamesArr = Array.from(fieldNames).filter(x => x[0] !== "_");
        fieldNamesArr
            .forEach(key => result.object.fields[key] = exportValue(obj[key], obj._debug && obj._debug[key], fieldNames.has(`_raw_${key}`), path.concat(key), noLazy));
        if (result.incomplete && !hasSubstream && obj._debug) {
            debug.end = inferDebugEnd(fieldNamesArr.map(key => obj._debug[key]));
            result.end = debug.end;
        }
        const propNames = obj.constructor !== Object ?
            Object.getOwnPropertyNames(obj.constructor.prototype).filter(x => x[0] !== "_" && x !== "constructor") : [];
        for (const propName of propNames) {
            const ksyInstanceData = ksyType && ksyType.instancesByJsName && ksyType.instancesByJsName[propName] || {};
            const parseMode = ksyInstanceData["-webide-parse-mode"];
            const eagerLoad = parseMode === "eager" || (parseMode !== "lazy" && ksyInstanceData.value);
            if (Object.prototype.hasOwnProperty.call(obj, `_m_${propName}`) || eagerLoad || noLazy)
                result.object.fields[propName] = fetchInstance(obj, propName, path, noLazy);
            else
                result.object.instances[propName] = { path: path.concat(propName), offset: 0 };
        }
    }
    else
        console.log(`Unknown object type: ${result.type}`);
    return result;
}
function inferDebugEnd(debugs) {
    const inferredEnd = debugs
        .reduce((acc, debug) => debug && debug.end > acc ? debug.end : acc, Number.NEGATIVE_INFINITY);
    if (inferredEnd === Number.NEGATIVE_INFINITY) {
        return;
    }
    return inferredEnd;
}
function fetchInstance(obj, propName, objPath, noLazy) {
    let value;
    let instanceError;
    try {
        value = obj[propName];
    }
    catch (e) {
        instanceError = e;
    }
    if (instanceError !== undefined) {
        try {
            // retry once (important for validation errors)
            value = obj[propName];
        }
        catch (e) { }
    }
    const instHasRawAttr = Object.prototype.hasOwnProperty.call(obj, `_raw__m_${propName}`);
    const debugInfo = obj._debug[`_m_${propName}`];
    const exported = exportValue(value, debugInfo, instHasRawAttr, objPath.concat(propName), noLazy);
    if (instanceError !== undefined) {
        exported.instanceError = instanceError;
    }
    return exported;
}
function adjustDebug(debug) {
    if (!debug || Object.prototype.hasOwnProperty.call(debug, 'incomplete')) {
        return;
    }
    debug.incomplete = (debug.start != null && debug.end == null);
}
importScripts("../entities.js");
importScripts("../../lib/_npm/kaitai-struct/KaitaiStream.js");
KaitaiStream.depUrls = KaitaiStream.depUrls || {};
KaitaiStream.depUrls.zlib = "../../lib/_npm/pako/pako_inflate.min.js";
var apiMethods = {
    initCode: (sourceCode, mainClassName, ksyTypes) => {
        wi.ksyTypes = ksyTypes;
        eval(`${sourceCode}\nwi.MainClass = ${mainClassName}.${mainClassName};`);
    },
    setInput: (inputBuffer) => wi.inputBuffer = inputBuffer,
    reparse: (eagerMode) => {
        //var start = performance.now();
        wi.ioInput = new KaitaiStream(wi.inputBuffer, 0);
        wi.root = new wi.MainClass(wi.ioInput);
        let error;
        try {
            wi.root._read();
        }
        catch (e) {
            error = e;
        }
        if (hooks.nodeFilter)
            wi.root = hooks.nodeFilter(wi.root);
        wi.exported = exportValue(wi.root, { start: 0, end: wi.inputBuffer.byteLength, ioOffset: 0, incomplete: error !== undefined }, false, [], eagerMode);
        //console.log("parse before return", performance.now() - start, "date", Date.now());
        return {
            result: wi.exported,
            error,
        };
    },
    get: (path) => {
        let parent = wi.root;
        const parentPath = path.slice(0, -1);
        parentPath.forEach(key => parent = parent[key]);
        const propName = path[path.length - 1];
        return {
            result: fetchInstance(parent, propName, parentPath, false),
        };
    }
};
myself.onmessage = (ev) => {
    var msg = ev.data;
    //console.log("[Worker] Got msg", msg, ev);
    if (apiMethods.hasOwnProperty(msg.type)) {
        try {
            const ret = apiMethods[msg.type].apply(self, msg.args);
            if (ret) {
                const { result, error } = ret;
                msg.result = result;
                msg.error = error;
            }
        }
        catch (error) {
            console.log("[Worker] Error", error);
            msg.error = error;
        }
    }
    else {
        msg.error = "msg.type is unknown";
    }
    //console.log("[Worker] Send response", msg, ev);
    myself.postMessage(msg);
};
