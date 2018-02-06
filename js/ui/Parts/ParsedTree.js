var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "./../Component", "../../worker/WorkerShared"], function (require, exports, Vue, Component_1, WorkerShared_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LazyArrayNode {
        constructor(arrayNode, from, to) {
            this.arrayNode = arrayNode;
            this.from = from;
            this.to = to;
            this.nodeType = "LazyArray";
        }
        get hasChildren() { return true; }
        static async generateChildren(arrayNode, from, to) {
            const oneLevelMax = 100;
            const length = to - from;
            let step = 1;
            while (step * oneLevelMax < length)
                step *= oneLevelMax;
            if (step === 1) {
                return await arrayNode.fetchLazyArray(from, to);
            }
            else {
                let children = [];
                for (let currFrom = from; currFrom < to; currFrom += step)
                    children.push(new LazyArrayNode(arrayNode, currFrom, Math.min(currFrom + step - 1, to)));
                return children;
            }
        }
        async loadChildren() {
            this.children = await LazyArrayNode.generateChildren(this.arrayNode, this.from, this.to);
        }
    }
    exports.LazyArrayNode = LazyArrayNode;
    class ParsedTreeNode {
        constructor(root, name, value, instance) {
            this.root = root;
            this.name = name;
            this.value = value;
            this.instance = instance;
            this.name = this.name || instance && instance.path.last();
        }
        get isUnloadedInstance() { return this.instance && !this.value; }
        get exceptionText() {
            return typeof this.value.exception === "string" ? this.value.exception :
                this.value.exception.message ? this.value.exception.message : JSON.stringify(this.value.exception);
        }
        get hasChildren() { return this.isUnloadedInstance || this.value.type === WorkerShared_1.ObjectType.Object || this.value.type === WorkerShared_1.ObjectType.Array; }
        get bytesPreview() {
            return `[${this.value.bytes.slice(0, 8).join(", ")}${(this.value.bytes.length > 8 ? ", ..." : "")}]`;
        }
        get hexStrValue() {
            return (this.value.primitiveValue < 0 ? "-" : "") + "0x" +
                this.value.primitiveValue.toString(16);
        }
        async fetchLazyArray(from, to) {
            const array = await this.root.loadLazyArray(this.value.path, from, to);
            return array.map((x, i) => new ParsedTreeNode(this.root, `${from + i}`, x));
        }
        async loadChildren() {
            if (this.children)
                return;
            if (this.isUnloadedInstance) {
                console.log("Load instance", this);
                this.value = await this.root.loadInstance(this.instance.path);
                await this.loadChildren();
            }
            else if (this.value.type === WorkerShared_1.ObjectType.Object) {
                this.children = Object.keys(this.value.object.fields).map(x => new ParsedTreeNode(this.root, x, this.value.object.fields[x]))
                    .concat(Object.keys(this.value.object.instances).map(x => new ParsedTreeNode(this.root, x, null, this.value.object.instances[x])));
            }
            else if (this.value.type === WorkerShared_1.ObjectType.Array) {
                if (this.value.isLazyArray) {
                    this.children = await LazyArrayNode.generateChildren(this, 0, this.value.arrayLength - 1);
                }
                else
                    this.children = this.value.arrayItems.map((x, i) => new ParsedTreeNode(this.root, `${i}`, x));
            }
            else {
                this.children = [];
            }
        }
    }
    exports.ParsedTreeNode = ParsedTreeNode;
    class ParsedTreeRootNode {
        constructor(rootNode) {
            this.hasChildren = true;
            rootNode.root = this;
            this.children = [rootNode];
        }
        async loadChildren() { }
        async loadInstance(path) { return null; }
        async loadLazyArray(arrayPath, from, to) { return null; }
    }
    exports.ParsedTreeRootNode = ParsedTreeRootNode;
    let ParsedTree = class ParsedTree extends Vue {
        constructor() {
            super(...arguments);
            this.rootNode = null;
        }
        get treeView() { return this.$refs["treeView"]; }
        async open(path) {
            return this.treeView.searchNode((item) => {
                const arrayNode = item;
                const exportedNode = item;
                if (arrayNode.arrayNode) {
                    const arrayPath = arrayNode.arrayNode.value.path.join("/");
                    if (path.startsWith(arrayPath + "/")) {
                        const arrayIdx = parseInt(path.substr(arrayPath.length + 1).split("/")[0]);
                        return arrayNode.from <= arrayIdx && arrayIdx <= arrayNode.to ? "children" : "nomatch";
                    }
                }
                else {
                    const itemPath = exportedNode.value.path.join("/");
                    return itemPath === path ? "match" : itemPath === "" || path.startsWith(itemPath + "/") ? "children" : "nomatch";
                }
            });
        }
    };
    ParsedTree = __decorate([
        Component_1.default
    ], ParsedTree);
    exports.ParsedTree = ParsedTree;
});
//# sourceMappingURL=ParsedTree.js.map