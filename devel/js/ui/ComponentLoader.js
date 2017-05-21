define(["require", "exports", "vue"], function (require, exports, Vue) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ComponentLoader {
        load(names) {
            return new Promise((resolve, reject) => {
                require(names.map(name => `./Components/${name}`), (...modules) => {
                    Promise.all(names.map((name, i) => this.loadTemplate(name, modules[i]))).then(() => resolve());
                });
            });
        }
        loadTemplate(name, module) {
            return Promise.resolve($.get(`src/ui/Components/${name}.html`)).then(html => {
                new RegExp("(?:^|\n)<(.*?)( [^]*?)?>([^]*?)\n</", "gm").matches(html).forEach(tagMatch => {
                    var tag = tagMatch[1], content = tagMatch[3], attrs = {};
                    /\s(\w+)="(\w+)"/g.matches(tagMatch[2]).forEach(attrMatch => attrs[attrMatch[1]] = attrMatch[2]);
                    if (tag === "template") {
                        var jsClassName = attrs.id || name;
                        if (!(jsClassName in module))
                            throw new Error(`Implementation (JavaScript class) not found for component: ${jsClassName}`);
                        module[jsClassName].options.template = content.replace(/<!--nobr-->\s*/gi, "");
                    }
                    else if (tag === "style")
                        $("<style>").text(content).appendTo($(document.body));
                });
            });
        }
    }
    ;
    window["vue"] = Vue;
    exports.componentLoader = new ComponentLoader();
});
//# sourceMappingURL=ComponentLoader.js.map