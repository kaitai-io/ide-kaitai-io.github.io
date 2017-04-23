var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "./FileSystem/GithubClient", "./FileSystem/GithubFileSystem", "./FileSystem/LocalFileSystem", "./FileSystem/RemoteFileSystem", "./FileSystem/StaticFileSystem", "./FileSystem/FsUri", "./FileSystem/FsSelector", "vue", "./ui/ComponentLoader", "./ui/Component"], function (require, exports, GithubClient_1, GithubFileSystem_1, LocalFileSystem_1, RemoteFileSystem_1, StaticFileSystem_1, FsUri_1, FsSelector_1, Vue, ComponentLoader_1, Component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var queryParams = {};
    location.search.substr(1).split("&").map(x => x.split("=")).forEach(x => queryParams[x[0]] = x[1]);
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
    //["local:///folder/", "remote://127.0.0.1:8001/default/folder/", "github://koczkatamas/kaitai_struct_formats/archive/"]
    //    .forEach(uri => fs.list(uri).then(items => console.log(items.map(item => `${item.uri.uri} (${item.uri.type})`))));
    class FsTreeNode {
        constructor(fs, uri) {
            this.fs = fs;
            this.uri = uri;
            this.children = null;
            this.icon = null;
            this.text = uri.name;
            this.isFolder = uri.type === "directory";
        }
        loadChildren() {
            return this.fs.list(this.uri.uri).then(children => {
                this.children = children.map(fsItem => new FsTreeNode(this.fs, fsItem.uri));
            });
        }
    }
    class FsRootNode {
        constructor(children = []) {
            this.children = children;
            this.text = "/";
            this.isFolder = true;
        }
        loadChildren() { return Promise.resolve(); }
    }
    function addRootNode(text, icon, uri) {
        var node = new FsTreeNode(fss, new FsUri_1.FsUri(uri));
        node.text = text;
        node.icon = icon;
        return node;
    }
    var fsData = new FsRootNode([
        addRootNode("kaitai.io", "glyphicon-cloud", "static:///"),
        addRootNode("koczkatamas/formats", "fa fa-github", "github://koczkatamas/kaitai_struct_formats/"),
        addRootNode("browser", "glyphicon-cloud", "local:///"),
    ]);
    //var fsData = new FsTreeNode(fss, new FsUri("github://koczkatamas/kaitai_struct_formats/"));
    let App = class App extends Vue {
        //var fsData = new FsTreeNode(fss, new FsUri("github://koczkatamas/kaitai_struct_formats/"));
        constructor() {
            super(...arguments);
            this.fsTree = null;
            this.selectedUri = null;
        }
        openFile(file) {
            this.selectedUri = file.uri.uri;
            console.log('openFile', file);
        }
    };
    App = __decorate([
        Component_1.default
    ], App);
    ComponentLoader_1.componentLoader.load(["TreeView"]).then(() => {
        var app = new App({ el: "#app" });
        app.fsTree = fsData;
        console.log(fsData.children);
        window["app"] = app;
        var treeView = app.$refs["treeView"];
        setTimeout(() => {
            treeView.children[0].dblclick();
            //treeView.children[0].children[3].dblclick();
            //treeView.children[6].dblclick();
        }, 500);
    });
});
//# sourceMappingURL=sandbox.js.map