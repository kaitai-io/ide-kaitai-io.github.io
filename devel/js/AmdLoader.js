"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class AmdModule {
    constructor(url) {
        this.url = url;
        this.loaded = false;
        this.loadPromise = null;
        this.loadPromiseResolve = null;
    }
}
window["module"] = { exports: null };
class AmdLoader {
    constructor() {
        this.modules = {};
        this.paths = {};
        this.moduleLoadedHook = null;
        this.beforeLoadHook = null;
    }
    loadWithScriptTag(src) {
        return new Promise((resolve, reject) => {
            let scriptEl = document.createElement("script");
            scriptEl.onload = e => resolve(scriptEl);
            scriptEl.onerror = e => reject(e);
            scriptEl.src = src;
            document.head.appendChild(scriptEl);
        });
    }
    getLoadedModule(name) {
        return __awaiter(this, void 0, void 0, function* () {
            let isRelative = name.startsWith('./') || name.startsWith('../');
            let url = isRelative ? new URL(`${name}.js`, document.currentScript["src"] || window.location).href :
                name in this.paths ? new URL(`${this.paths[name]}.js`, window.location.href).href :
                    new URL(`js/${name}.js`, window.location.href).href;
            var module = this.modules[url] || (this.modules[url] = new AmdModule(url));
            if (!module.loadPromise) {
                //console.log('getDep', url);
                // console.log('baseURI', document.currentScript.baseURI, 'src',document.currentScript.src);
                var loadPromiseReject;
                module.loadPromise = new Promise((resolve, reject) => {
                    module.loadPromiseResolve = resolve;
                    loadPromiseReject = reject;
                });
                if (this.beforeLoadHook)
                    yield this.beforeLoadHook(module);
                this.loadWithScriptTag(url).then(x => this.onScriptLoaded(module), loadPromiseReject);
            }
            return module.loadPromise;
        });
    }
    onModuleLoaded(moduleDesc, value) {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log('onModuleLoaded', moduleDesc.url);
            moduleDesc.exports = value;
            if (this.moduleLoadedHook)
                yield this.moduleLoadedHook(moduleDesc);
            moduleDesc.loadPromiseResolve(moduleDesc);
            moduleDesc.loaded = true;
        });
    }
    onScriptLoaded(module) {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log('script loaded', module.url);
            //if (!module.exports)
            //    module.exports = window["module"].exports;
            //if (!module.loaded){
            //    module.loadPromiseResolve(module);
            //    module.loaded = true;
            //}
            // let self = this;
            // let moduleObj = { 
            //     set exports(value: any){
            //         console.log('exports set triggered', module.url);
            //         self.onModuleLoaded(module, value);
            //     }
            // };
            // window["module"] = moduleObj;
            // if(!module.loaded){
            //     module.loadPromiseResolve(module);
            //     module.loaded = true;
            // }
        });
    }
    define(deps, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            let currScript = document.currentScript;
            //console.log('define', currScript, deps, callback);
            let exports = {};
            let depRes = yield Promise.all(deps.map(dep => dep === "exports" ? exports :
                dep === "require" ? {} :
                    this.getLoadedModule(dep).then(x => x.exports)));
            //console.log('define depRes', currScript && currScript.src, depRes);
            if (currScript && currScript["src"]) {
                let moduleDesc = this.modules[currScript["src"]];
                let callbackResult = callback(...depRes);
                this.onModuleLoaded(moduleDesc, callbackResult || exports);
            }
        });
    }
}
let loader = new AmdLoader;
function require(name) { loader.getLoadedModule(name); }
function define() {
    let args = Array.from(arguments);
    let callback = args.filter(x => typeof x === "function")[0];
    let deps = args.filter(x => Array.isArray(x))[0] || [];
    loader.define(deps, callback);
}
define["amd"] = true;
//# sourceMappingURL=AmdLoader.js.map