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
        async loadTemplate(url) {
            var html = await Promise.resolve($.get(url));
            new RegExp("(?:^|\n)<(.*?)( [^]*?)?>([^]*?)\n</", "gm").matches(html).forEach(tagMatch => {
                var tag = tagMatch[1], content = tagMatch[3], attrs = {};
                /\s(\w+)="(\w+)"/g.matches(tagMatch[2]).forEach(attrMatch => attrs[attrMatch[1]] = attrMatch[2]);
                if (tag === "template") {
                    var jsClassName = attrs.id || url.split("/").last().replace(".html", "");
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
        }
        async loadTemplateAndSet(url, module) {
            await this.loadTemplate(url);
            for (var componentName of Object.keys(module)) {
                if (!this.templates[componentName])
                    continue;
                //throw new Error(`Template not found for component: ${componentName}`);
                module[componentName].options.template = this.templates[componentName];
            }
        }
    }
    window["vue"] = Vue;
    exports.componentLoader = new ComponentLoader();
});
//# sourceMappingURL=ComponentLoader.js.map