define(["require", "exports", "./FileSystem/GithubClient", "./FileSystem/GithubFileSystem", "./FileSystem/LocalFileSystem", "./FileSystem/RemoteFileSystem", "./FileSystem/StaticFileSystem", "./FileSystem/FsUri", "./FileSystem/FsSelector", "vue", "./ui/ComponentLoader"], function (require, exports, GithubClient_1, GithubFileSystem_1, LocalFileSystem_1, RemoteFileSystem_1, StaticFileSystem_1, FsUri_1, FsSelector_1, Vue, ComponentLoader_1) {
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
            this.text = uri.name;
            this.isFolder = uri.type === "directory";
        }
        loadChildren() {
            return this.fs.list(this.uri.uri).then(children => {
                this.children = children.map(fsItem => new FsTreeNode(this.fs, fsItem.uri));
            });
        }
    }
    var fsData = new FsTreeNode(fss, new FsUri_1.FsUri("static:///"));
    //var fsData = new FsTreeNode(fss, new FsUri("github://koczkatamas/kaitai_struct_formats/"));
    ComponentLoader_1.componentLoader.load(["TreeView"]).then(() => {
        var demo = new Vue({ el: "#tree", data: { treeData: fsData } });
        window["demo"] = demo;
    });
});
//var treeView = <TreeView<IFsTreeNode>>demo.$refs["treeView"];
//setTimeout(() => {
//    treeView.children[1].toggle();
//    treeView.children[6].toggle();
//}, 500);
//# sourceMappingURL=sandbox.js.map