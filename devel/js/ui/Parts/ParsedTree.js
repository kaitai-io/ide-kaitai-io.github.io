var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "./../Component"], function (require, exports, Vue, Component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ParsedTreeNode {
        constructor(text, children) {
            this.text = text;
            this.children = children;
        }
        get hasChildren() { return this.children.length > 0; }
        loadChildren() {
            return Promise.resolve();
        }
    }
    exports.ParsedTreeNode = ParsedTreeNode;
    let ParsedTree = class ParsedTree extends Vue {
        constructor() {
            super(...arguments);
            this.rootNode = null;
        }
    };
    ParsedTree = __decorate([
        Component_1.default
    ], ParsedTree);
    exports.ParsedTree = ParsedTree;
});
//# sourceMappingURL=ParsedTree.js.map