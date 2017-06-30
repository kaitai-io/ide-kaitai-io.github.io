var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vue", "jquery"], function (require, exports, Vue, $) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ComponentLoader {
        constructor() {
            this.templates = {};
            this.templatePromises = {};
        }
        load(names) {
            return new Promise((resolve, reject) => {
                require(names.map(name => `./${name}`), (...modules) => {
                    Promise.all(names.map((name, i) => this.loadTemplateAndSet(`src/ui/${name}.html`, modules[i]))).then(() => resolve());
                });
            });
        }
        onLoad(name) {
            if (!name)
                throw Error("Invalid component name!");
            if (this.templates[name])
                return Promise.resolve(this.templates[name]);
            return new Promise((resolve, reject) => {
                this.templatePromises[name] = this.templatePromises[name] || [];
                this.templatePromises[name].push(resolve);
            });
        }
        loadTemplate(url) {
            return __awaiter(this, void 0, void 0, function* () {
                var html = yield Promise.resolve($.get(url));
                new RegExp("(?:^|\n)<(.*?)( [^]*?)?>([^]*?)\n</", "gm").matches(html).forEach(tagMatch => {
                    var tag = tagMatch[1], content = tagMatch[3], attrs = {};
                    /\s(\w+)="(\w+)"/g.matches(tagMatch[2]).forEach(attrMatch => attrs[attrMatch[1]] = attrMatch[2]);
                    if (tag === "template") {
                        var jsClassName = attrs.id || url.split('/').last().replace('.html', '');
                        var template = this.templates[jsClassName] = content.replace(/<!--nobr-->\s*/gi, "");
                        if (this.templatePromises[jsClassName]) {
                            for (var resolve of this.templatePromises[jsClassName])
                                resolve(template);
                            delete this.templatePromises[jsClassName];
                        }
                    }
                    else if (tag === "style")
                        $("<style>").text(content).appendTo($(document.body));
                });
            });
        }
        loadTemplateAndSet(url, module) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.loadTemplate(url);
                for (var componentName of Object.keys(module)) {
                    if (!this.templates[componentName])
                        continue;
                    //throw new Error(`Template not found for component: ${componentName}`);
                    module[componentName].options.template = this.templates[componentName];
                }
            });
        }
    }
    ;
    window["vue"] = Vue;
    exports.componentLoader = new ComponentLoader();
});
//# sourceMappingURL=ComponentLoader.js.map