var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "./FileSystem/GithubClient", "./FileSystem/GithubFileSystem", "./FileSystem/LocalFileSystem", "./FileSystem/RemoteFileSystem", "./FileSystem/StaticFileSystem", "./FileSystem/FsUri", "./FileSystem/FsSelector", "vue", "./ui/Component"], function (require, exports, GithubClient_1, GithubFileSystem_1, LocalFileSystem_1, RemoteFileSystem_1, StaticFileSystem_1, FsUri_1, FsSelector_1, Vue, Component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var queryParams = {};
    location.search.substr(1).split('&').map(x => x.split('=')).forEach(x => queryParams[x[0]] = x[1]);
    var fss = new FsSelector_1.FsSelector();
    fss.addFs(new LocalFileSystem_1.LocalFileSystem());
    var remoteFs = new RemoteFileSystem_1.RemoteFileSystem();
    remoteFs.mappings["127.0.0.1:8001/default"] = { secret: queryParams.secret };
    fss.addFs(remoteFs);
    var githubClient = new GithubClient_1.GithubClient(queryParams.access_token);
    var githubFs = new GithubFileSystem_1.GithubFileSystem(githubClient);
    fss.addFs(githubFs);
    var staticFs = new StaticFileSystem_1.StaticFileSystem();
    kaitaiFsFiles.forEach(fn => staticFs.write("static://" + fn, new ArrayBuffer(0)));
    fss.addFs(staticFs);
    let TreeView = class TreeView extends Vue {
        constructor() {
            super(...arguments);
            this.selectedItem = null;
        }
        get children() { return this.$children; }
        created() {
            this.model.loadChildren();
        }
        openSelected() {
            if (!this.selectedItem.open)
                this.selectedItem.toggle();
            else
                this.selectNextNode();
        }
        closeSelected() {
            if (this.selectedItem.open)
                this.selectedItem.toggle();
            else if (this.selectedItem.parent.parent)
                this.setSelected(this.selectedItem.parent);
        }
        selectNode(node, dir) {
            if (dir === "next") {
                if (node.children && node.children.length > 0)
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
                        while (selChildren.children && selChildren.children.length > 0)
                            selChildren = selChildren.children.last();
                        this.setSelected(selChildren);
                    }
                    else if (node.parent.parent) {
                        this.setSelected(node.parent);
                    }
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
            var target = this.selectedItem.$el;
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
    let TreeViewItem = class TreeViewItem extends Vue {
        constructor() {
            super(...arguments);
            this.open = false;
            this.selected = false;
            this.childrenLoading = false;
        }
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
        toggle() {
            if (this.model.isFolder) {
                this.open = !this.open;
                if (this.open && !this.model.children) {
                    this.childrenLoading = true;
                    setTimeout(() => this.model.loadChildren().then(() => this.childrenLoading = false), 0);
                }
            }
            this.treeView.setSelected(this);
        }
    };
    TreeViewItem = __decorate([
        Component_1.default
    ], TreeViewItem);
    class FsTreeNode {
        constructor(fs, uri) {
            this.fs = fs;
            this.uri = uri;
            this.children = null;
            this.text = uri.name;
            this.isFolder = uri.type === 'directory';
        }
        loadChildren() {
            return this.fs.list(this.uri.uri).then(children => {
                this.children = children.map(fsItem => new FsTreeNode(this.fs, fsItem.uri));
            });
        }
    }
    var fsData = new FsTreeNode(fss, new FsUri_1.FsUri('static:///'));
    //var fsData = new FsTreeNode(fss, new FsUri('github://koczkatamas/kaitai_struct_formats/'));
    var demo = new Vue({
        el: '#tree',
        data: { treeData: fsData }
    });
    window['demo'] = demo;
    var treeView = demo.$refs['treeView'];
    setTimeout(() => {
        treeView.children[1].toggle();
        treeView.children[6].toggle();
    }, 500);
});
//# sourceMappingURL=sandbox.js.map