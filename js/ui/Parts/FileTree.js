var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "./../../FileSystem/GithubClient", "./../../FileSystem/GithubFileSystem", "./../../FileSystem/BrowserFileSystem", "./../../FileSystem/RemoteFileSystem", "./../../FileSystem/StaticFileSystem", "../../FileSystem/HttpFileSystem", "./../../FileSystem/FsUri", "./../../FileSystem/FsSelector", "vue", "./../Component", "../../utils", "../Components/ContextMenu", "../Components/InputModal", "../Components/TreeView"], function (require, exports, GithubClient_1, GithubFileSystem_1, BrowserFileSystem_1, RemoteFileSystem_1, StaticFileSystem_1, HttpFileSystem_1, FsUri_1, FsSelector_1, Vue, Component_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    for (var i = 0; i < 200; i++)
        kaitaiFsFiles.push(`formats/archive/test_${i}.ksy`);
    var queryParams = {};
    location.search.substr(1).split("&").map(x => x.split("=")).forEach(x => queryParams[x[0]] = x[1]);
    exports.fss = new FsSelector_1.FsSelector();
    exports.fss.addFs(new BrowserFileSystem_1.BrowserFileSystem());
    exports.fss.addFs(new BrowserFileSystem_1.BrowserLegacyFileSystem());
    var remoteFs = new RemoteFileSystem_1.RemoteFileSystem();
    remoteFs.mappings["127.0.0.1:8001/default"] = { secret: queryParams.secret };
    exports.fss.addFs(remoteFs);
    var githubClient = new GithubClient_1.GithubClient(queryParams.access_token);
    var githubFs = new GithubFileSystem_1.GithubFileSystem(githubClient);
    exports.fss.addFs(githubFs);
    var staticFs = new StaticFileSystem_1.StaticFileSystem();
    kaitaiFsFiles.forEach(fn => staticFs.write("static://" + fn, new ArrayBuffer(0)));
    exports.fss.addFs(staticFs);
    function getRelativeUrl(url) {
        var a = document.createElement("a");
        a.href = url;
        return a.href;
    }
    var httpFs = new HttpFileSystem_1.HttpFileSystem(kaitaiFsFiles.reduce((obj, fn) => { obj[`/${fn}`] = getRelativeUrl(fn); return obj; }, {}));
    console.log(httpFs.fileUrls);
    exports.fss.addFs(httpFs);
    class FsTreeNode {
        constructor(parent, uri, fs = null) {
            this.parent = parent;
            this.uri = uri;
            this.fs = fs;
            this.children = null;
            this.icon = null;
            this.fs = this.fs || parent.fs;
            this.text = uri.name;
            this.isFolder = uri.type === "directory";
        }
        get isKsy() { return this.uri.path.endsWith(".ksy"); }
        get capabilities() { return this.fs.capabilities(this.uri.uri); }
        get canWrite() { return this.capabilities.write; }
        get canDelete() { return this.uri.path !== "/" && this.capabilities.delete; }
        async loadChildren() {
            let children = await this.fs.list(this.uri.uri);
            var childCache = (this.children || []).toDict(x => x.uri.name);
            this.children = children
                .filter(x => x.uri.uri !== this.uri.uri)
                .map(fsItem => new FsTreeNode(this, fsItem.uri))
                .sortBy(x => x.isFolder ? 0 : 1).thenBy(x => x.uri.path).sort();
            for (var item of this.children) {
                var old = childCache[item.uri.name];
                if (old)
                    item.children = item.children || old.children;
            }
        }
    }
    exports.FsTreeNode = FsTreeNode;
    class FsRootNode {
        constructor(children = []) {
            this.children = children;
            this.canWrite = false;
            this.canDelete = false;
            this.text = "/";
            this.isFolder = true;
        }
        loadChildren() { return Promise.resolve(); }
    }
    function addRootNode(text, icon, uri) {
        var node = new FsTreeNode(null, new FsUri_1.FsUri(uri), exports.fss);
        node.text = text;
        node.icon = icon;
        return node;
    }
    var fsData = new FsRootNode([
        addRootNode("kaitai.io", "glyphicon-cloud", "https:///formats/"),
        addRootNode("kaitai-io/formats", "fa fa-github", "github://kaitai-io/kaitai_struct_formats/"),
        addRootNode("browser", "glyphicon-cloud", "browser:///"),
        addRootNode("browser (legacy)", "glyphicon-cloud", "browser_legacy:///"),
    ]);
    //setTimeout(() => fsData.children.push(addRootNode("browser", "glyphicon-cloud", "browser:///")), 5000);
    let FileTree = class FileTree extends Vue {
        //setTimeout(() => fsData.children.push(addRootNode("browser", "glyphicon-cloud", "browser:///")), 5000);
        constructor() {
            super(...arguments);
            this.fsTree = null;
        }
        get ctxMenu() { return this.$refs["ctxMenu"]; }
        get fsTreeView() { return this.$refs["fsTree"]; }
        get createKsyModal() { return this.$refs["createKsyModal"]; }
        get createFolderModal() { return this.$refs["createFolderModal"]; }
        get selectedFsItem() { return this.fsTreeView.selectedItem.model; }
        get selectedUri() { return this.selectedFsItem.uri.uri; }
        init() {
            this.fsTree = fsData;
            console.log(fsData.children);
            setTimeout(() => {
                this.fsTreeView.children[0].dblclick();
            }, 500);
        }
        openNode() {
            this.fsTreeView.selectedItem.dblclick();
        }
        async openFile() {
            this.$emit("open-file", this.selectedFsItem);
        }
        async generateParser(lang, aceLangOrDebug) {
            var aceLang = typeof aceLangOrDebug === "string" ? aceLangOrDebug : lang;
            var debug = typeof aceLangOrDebug === "boolean" ? aceLangOrDebug : false;
            let data = await exports.fss.read(this.selectedUri);
            this.$emit("generate-parser", lang, aceLang, debug, data);
        }
        showContextMenu(event) {
            this.contextMenuNode = this.selectedFsItem;
            this.ctxMenu.open(event, this.contextMenuNode);
        }
        async createFolder(name) {
            var newUri = this.contextMenuNode.uri.addPath(`${name}/`).uri;
            await this.contextMenuNode.fs.createFolder(newUri);
            await this.contextMenuNode.loadChildren();
        }
        async createKsyFile(name) {
            var newUri = this.contextMenuNode.uri.addPath(`${name}.ksy`).uri;
            var content = `meta:\n  id: ${name}\n  file-extension: ${name}\n`;
            await this.contextMenuNode.fs.write(newUri, utils_1.Convert.utf8StrToBytes(content).buffer);
            await this.contextMenuNode.loadChildren();
        }
        async cloneFile() {
            var newUri = this.contextMenuNode.uri.uri.replace(/\.(\w+)$/, `_${new Date().format("Ymd_His")}.$1`);
            console.log('cloneKsyFile', newUri);
            let content = await this.contextMenuNode.fs.read(this.contextMenuNode.uri.uri);
            await this.contextMenuNode.fs.write(newUri, content);
            await this.contextMenuNode.parent.loadChildren();
        }
        async downloadFile() {
            let data = await this.contextMenuNode.fs.read(this.contextMenuNode.uri.uri);
            await utils_1.saveFile(data, this.contextMenuNode.uri.name);
        }
        async deleteFile() {
            await this.contextMenuNode.fs.delete(this.contextMenuNode.uri.uri);
            await this.contextMenuNode.parent.loadChildren();
        }
        mounted() {
            var scrollbar = Scrollbar.init(this.$el);
            this.fsTreeView.getParentBoundingRect = () => scrollbar.bounding;
            this.fsTreeView.scrollIntoView = (el, alignToTop) => scrollbar.scrollIntoView(el, { alignToTop: alignToTop, onlyScrollIfNeeded: true });
            document.body.appendChild(this.ctxMenu.$el);
            console.log('FileTree mounted', this.fsTreeView);
            //this.createFolderModal.show();
        }
    };
    FileTree = __decorate([
        Component_1.default
    ], FileTree);
    exports.FileTree = FileTree;
});
//# sourceMappingURL=FileTree.js.map