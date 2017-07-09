var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "./../Component", "../../worker/WorkerShared"], function (require, exports, Vue, Component_1, WorkerShared_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ParsedTreeNode {
        constructor(name, value) {
            this.name = name;
            this.value = value;
        }
        get bytesPreview() {
            if (!(this.value.bytes instanceof Uint8Array))
                return "";
            var text = "[";
            for (var i = 0; i < this.value.bytes.byteLength; i++) {
                if (i === 8) {
                    text += ", ...";
                    break;
                }
                text += (i === 0 ? "" : ", ") + this.value.bytes[i];
            }
            text += "]";
            return text;
        }
        get hasChildren() { return this.value.type === WorkerShared_1.ObjectType.Object || this.value.type === WorkerShared_1.ObjectType.Array; }
        loadChildren() {
            if (this.value.type === WorkerShared_1.ObjectType.Object)
                this.children = Object.keys(this.value.object.fields).map(x => new ParsedTreeNode(x, this.value.object.fields[x]));
            else if (this.value.type === WorkerShared_1.ObjectType.Array)
                this.children = this.value.arrayItems.map((x, i) => new ParsedTreeNode(`${i}`, x));
            else
                this.children = [];
            return Promise.resolve();
        }
    }
    exports.ParsedTreeNode = ParsedTreeNode;
    class ParsedTreeRootNode {
        constructor(rootNode) {
            this.hasChildren = true;
            this.children = [rootNode];
        }
        async loadChildren() { }
    }
    exports.ParsedTreeRootNode = ParsedTreeRootNode;
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