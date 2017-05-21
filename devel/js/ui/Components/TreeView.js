var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "../Component"], function (require, exports, Vue, Component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TreeView = class TreeView extends Vue {
        constructor() {
            super(...arguments);
            this.selectedItem = null;
        }
        get children() { return this.$children; }
        created() {
            this.$watch("model", () => {
                if (this.model)
                    this.model.loadChildren();
            });
        }
        openSelected() {
            if (!this.selectedItem.open)
                this.selectedItem.dblclick();
            else
                this.selectNextNode();
        }
        closeSelected() {
            if (this.selectedItem.open)
                this.selectedItem.dblclick();
            else if (this.selectedItem.parent.parent)
                this.setSelected(this.selectedItem.parent);
        }
        selectNode(node, dir) {
            if (dir === "next") {
                if (node.open && node.children && node.children.length > 0)
                    this.setSelected(node.children[0]);
                else {
                    while (node.parent) {
                        var children = node.parent.children;
                        var thisIdx = children.indexOf(node);
                        if (thisIdx + 1 < children.length) {
                            this.setSelected(children[thisIdx + 1]);
                            break;
                        }
                        else
                            node = node.parent;
                    }
                }
            }
            else if (dir === "prev") {
                if (node.parent) {
                    var children = node.parent.children;
                    var thisIdx = children.indexOf(node);
                    if (thisIdx - 1 >= 0) {
                        var selChildren = children[thisIdx - 1];
                        while (selChildren.open && selChildren.children && selChildren.children.length > 0)
                            selChildren = selChildren.children.last();
                        this.setSelected(selChildren);
                    }
                    else if (node.parent.parent)
                        this.setSelected(node.parent);
                }
            }
        }
        selectNextNode(fromNode) {
            this.selectNode(this.selectedItem, "next");
        }
        selectPrevNode() {
            this.selectNode(this.selectedItem, "prev");
        }
        scrollSelectedIntoView() {
            var target = this.selectedItem.$el.children[0];
            var rect = target.getBoundingClientRect();
            var parentRect = this.$el.getBoundingClientRect();
            if (rect.bottom > parentRect.bottom)
                target.scrollIntoView(false);
            else if (rect.top < parentRect.top)
                target.scrollIntoView();
        }
        setSelected(newSelected) {
            if (this.selectedItem)
                this.selectedItem.selected = false;
            this.selectedItem = newSelected;
            this.selectedItem.selected = true;
            this.scrollSelectedIntoView();
        }
    };
    TreeView = __decorate([
        Component_1.default
    ], TreeView);
    exports.TreeView = TreeView;
    let TreeViewItem = class TreeViewItem extends Vue {
        constructor() {
            super(...arguments);
            this.open = false;
            this.selected = false;
            this.childrenLoading = false;
        }
        get icon() {
            return this.model["icon"] ? this.model["icon"] :
                this.model.isFolder ? (this.open ? "glyphicon-folder-open" : "glyphicon-folder-close") : "glyphicon-list-alt";
        }
        ;
        get treeView() {
            var res = this;
            while (res) {
                if (res instanceof TreeView)
                    return res;
                res = res.$parent;
            }
            return null;
        }
        get children() { return this.$children; }
        get parent() { return this.$parent; }
        dblclick() {
            if (this.model.isFolder) {
                this.open = !this.open;
                if (this.open && !this.model.children) {
                    this.childrenLoading = true;
                    setTimeout(() => this.model.loadChildren().then(() => this.childrenLoading = false), 0);
                }
            }
            else {
                this.treeView.$emit("openfile", this.model);
            }
        }
        click() {
            this.treeView.setSelected(this);
        }
    };
    TreeViewItem = __decorate([
        Component_1.default
    ], TreeViewItem);
    exports.TreeViewItem = TreeViewItem;
});
//# sourceMappingURL=TreeView.js.map