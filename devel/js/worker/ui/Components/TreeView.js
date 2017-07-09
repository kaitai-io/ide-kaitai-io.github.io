var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "../Component", "../UIHelper"], function (require, exports, Vue, Component_1, UIHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Vue.config.keyCodes["pageup"] = 33;
    Vue.config.keyCodes["pagedown"] = 34;
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
                this.selectNode("next");
            this.scrollSelectedIntoView();
        }
        closeSelected() {
            if (this.selectedItem.open)
                this.selectedItem.dblclick();
            else if (this.selectedItem.parent.parent)
                this.setSelected(this.selectedItem.parent);
            this.scrollSelectedIntoView();
        }
        selectRelativeNode(node, dir) {
            if (dir === "next") {
                if (node.open && node.children && node.children.length > 0)
                    this.setSelected(node.children[0]);
                else {
                    while (node.parent) {
                        let children = node.parent.children;
                        let thisIdx = children.indexOf(node);
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
                    let children = node.parent.children;
                    let thisIdx = children.indexOf(node);
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
        selectNode(dir, pageJump = false) {
            console.log("selectNode", dir, pageJump);
            for (var i = 0; i < (pageJump ? 25 : 1); i++)
                this.selectRelativeNode(this.selectedItem, dir);
        }
        scrollIntoView(target, alignToTop) {
            target.scrollIntoView(false);
        }
        getParentBoundingRect() {
            return this.$el.getBoundingClientRect();
        }
        scrollSelectedIntoView() {
            var target = this.selectedItem.$el.children[0];
            var rect = target.getBoundingClientRect();
            var parentRect = this.getParentBoundingRect();
            if (rect.bottom > parentRect.bottom)
                this.scrollIntoView(target, false);
            else if (rect.top < parentRect.top)
                this.scrollIntoView(target, true);
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
            this.loadingError = null;
        }
        get treeView() { return UIHelper_1.default.findParent(this, TreeView); }
        get children() { return this.$children; }
        get parent() { return this.$parent; }
        dblclick() {
            if (this.model.hasChildren) {
                this.open = !this.open;
                if (this.open && !this.model.children) {
                    this.childrenLoading = true;
                    this.loadingError = null;
                    setTimeout(() => this.model.loadChildren().catch(x => {
                        console.error(x);
                        this.loadingError = `${x}`;
                    }).then(() => this.childrenLoading = false), 0);
                }
            }
            else {
                this.treeView.$emit("item-dblclick", this.model);
            }
        }
        click() {
            this.treeView.setSelected(this);
        }
        contextmenu(event) {
            this.click();
            this.treeView.$emit("item-contextmenu", event, this.model);
        }
    };
    TreeViewItem = __decorate([
        Component_1.default
    ], TreeViewItem);
    exports.TreeViewItem = TreeViewItem;
});
//# sourceMappingURL=TreeView.js.map