var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "./FileSystem/GithubClient", "./FileSystem/GithubFileSystem", "./FileSystem/LocalFileSystem", "./FileSystem/RemoteFileSystem", "./FileSystem/StaticFileSystem", "./FileSystem/FsSelector", "vue", "./ui/Component"], function (require, exports, GithubClient_1, GithubFileSystem_1, LocalFileSystem_1, RemoteFileSystem_1, StaticFileSystem_1, FsSelector_1, Vue, Component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function fsTest() {
        var queryParams = {};
        location.search.substr(1).split('&').map(x => x.split('=')).forEach(x => queryParams[x[0]] = x[1]);
        var fs = new FsSelector_1.FsSelector();
        fs.addFs(new LocalFileSystem_1.LocalFileSystem());
        var remoteFs = new RemoteFileSystem_1.RemoteFileSystem();
        remoteFs.mappings["127.0.0.1:8001/default"] = { secret: queryParams.secret };
        fs.addFs(remoteFs);
        var githubClient = new GithubClient_1.GithubClient(queryParams.access_token);
        var githubFs = new GithubFileSystem_1.GithubFileSystem(githubClient);
        fs.addFs(githubFs);
        ['local:///folder/', 'remote://127.0.0.1:8001/default/folder/', 'github://koczkatamas/kaitai_struct_formats/archive/']
            .forEach(uri => fs.list(uri).then(items => console.log(items.map(item => `${item.uri.uri} (${item.uri.type})`))));
    }
    var staticFs = new StaticFileSystem_1.StaticFileSystem();
    kaitaiFsFiles.forEach(fn => staticFs.write("static://" + fn, new ArrayBuffer(0)));
    staticFs.list("static://formats/").then(x => console.log(x.map(y => y.uri.uri)));
    class FsTreeHandler {
    }
    class FsTreeNode {
        constructor(handler, text) {
            this.handler = handler;
            this.text = text;
            this.open = false;
            this.childrenLoading = true;
            this.children = [];
        }
        add(children) {
            this.children.push(...children);
            return this;
        }
    }
    let TreeViewItem = class TreeViewItem extends Vue {
        get isFolder() {
            return this.model.children && this.model.children.length;
        }
        toggle() {
            console.log('toggle', this.model.text, this.model.open);
            if (this.isFolder)
                this.model.open = !this.model.open;
        }
    };
    TreeViewItem = __decorate([
        Component_1.default
    ], TreeViewItem);
    let TreeView = class TreeView extends Vue {
    };
    TreeView = __decorate([
        Component_1.default
    ], TreeView);
    var fsTreeHandler = new FsTreeHandler();
    var data = new FsTreeNode(fsTreeHandler, '/').add([
        new FsTreeNode(fsTreeHandler, 'folder1').add([
            new FsTreeNode(fsTreeHandler, 'folder2').add([
                new FsTreeNode(fsTreeHandler, 'file1'),
                new FsTreeNode(fsTreeHandler, 'file2')
            ]),
            new FsTreeNode(fsTreeHandler, 'file1'),
            new FsTreeNode(fsTreeHandler, 'file2')
        ]),
        new FsTreeNode(fsTreeHandler, 'file1'),
        new FsTreeNode(fsTreeHandler, 'file2')
    ]);
    var demo = new Vue({
        el: '#tree',
        data: { treeData: data }
    });
});
//# sourceMappingURL=sandbox.js.map