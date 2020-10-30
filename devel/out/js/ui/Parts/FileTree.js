var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "./../../FileSystem/GithubClient", "./../../FileSystem/GithubFileSystem", "./../../FileSystem/BrowserFileSystem", "./../../FileSystem/RemoteFileSystem", "./../../FileSystem/StaticFileSystem", "../../FileSystem/HttpFileSystem", "./../../FileSystem/FsUri", "./../../FileSystem/FsSelector", "vue", "./../Component", "../../utils/FileUtils", "../../utils/Conversion", "../Components/ContextMenu", "../Components/InputModal", "../Components/TreeView"], function (require, exports, GithubClient_1, GithubFileSystem_1, BrowserFileSystem_1, RemoteFileSystem_1, StaticFileSystem_1, HttpFileSystem_1, FsUri_1, FsSelector_1, Vue, Component_1, FileUtils_1, Conversion_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
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
    //console.log(httpFs.fileUrls);
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
            if (this.isKsy)
                this.icon = "glyphicon-list-alt";
        }
        get isKsy() { return this.uri.path.endsWith(".ksy"); }
        get capabilities() { return this.fs.capabilities(this.uri.uri); }
        get canWrite() { return this.capabilities.write; }
        get canDelete() { return this.uri.path !== "/" && this.capabilities.delete; }
        get hasChildren() { return this.isFolder; }
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
        get hasChildren() { return true; }
    }
    function addRootNode(text, icon, uri) {
        var node = new FsTreeNode(null, new FsUri_1.FsUri(uri), exports.fss);
        node.text = text;
        node.icon = icon;
        return node;
    }
    var browserStorage = addRootNode("browser", "glyphicon-cloud", "browser:///");
    var nodeKaitaiIo = addRootNode("kaitai.io", "glyphicon-cloud", "https:///");
    var fsData = new FsRootNode([
        nodeKaitaiIo,
        addRootNode("kaitai-io/formats", "fa fa-github", "github://kaitai-io/kaitai_struct_formats/"),
        browserStorage,
        addRootNode("browser (legacy)", "glyphicon-cloud", "browser_legacy:///"),
    ]);
    nodeKaitaiIo.loadChildren().then(() => {
        nodeKaitaiIo.children[0].icon = "glyphicon-book";
        nodeKaitaiIo.children[1].icon = "glyphicon-cd";
        //console.log('set icons!', nodeKaitaiIo, nodeKaitaiIo.children[0].icon);
    });
    //setTimeout(() => fsData.children.push(addRootNode("browser", "glyphicon-cloud", "browser:///")), 5000);
    let FileTree = class FileTree extends Vue {
        //setTimeout(() => fsData.children.push(addRootNode("browser", "glyphicon-cloud", "browser:///")), 5000);
        constructor() {
            super(...arguments);
            this.fsTree = null;
            this.selectedFsItem = null;
            this.defaultStorage = null;
        }
        get ctxMenu() { return this.$refs["ctxMenu"]; }
        get fsTreeView() { return this.$refs["fsTree"]; }
        get createKsyModal() { return this.$refs["createKsyModal"]; }
        get createFolderModal() { return this.$refs["createFolderModal"]; }
        get selectedUri() { return this.selectedFsItem.uri.uri; }
        get canCreateFile() { return this.selectedFsItem && this.selectedFsItem.canWrite && this.selectedFsItem.isFolder; }
        get canDownloadFile() { return this.selectedFsItem && !this.selectedFsItem.isFolder; }
        init() {
            this.fsTree = fsData;
            this.defaultStorage = browserStorage;
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
        fsItemSelected(item) {
            this.selectedFsItem = item;
            //console.log("fsItemSelected", arguments);
        }
        async generateParser(lang, aceLangOrDebug) {
            var aceLang = typeof aceLangOrDebug === "string" ? aceLangOrDebug : lang;
            var debug = typeof aceLangOrDebug === "boolean" ? aceLangOrDebug : false;
            let ksyContent = Conversion_1.Conversion.utf8BytesToStr(await exports.fss.read(this.selectedUri));
            this.$emit("generate-parser", lang, aceLang, debug, ksyContent);
        }
        showContextMenu(event) {
            this.ctxMenu.open(event, this.selectedFsItem);
        }
        async createFolder(name) {
            var newUri = this.selectedFsItem.uri.addPath(`${name}/`).uri;
            await this.selectedFsItem.fs.createFolder(newUri);
            await this.selectedFsItem.loadChildren();
        }
        async uploadFiles(files) {
            let dest = this.selectedFsItem || this.defaultStorage;
            if (!dest.isFolder)
                dest = dest.parent;
            const resultUris = [];
            for (const fileName of Object.keys(files)) {
                const newProposedUri = dest.uri.addPath(fileName).uri;
                const newFinalUri = await this.writeFile(newProposedUri, files[fileName]);
                resultUris.push(newFinalUri);
            }
            await dest.loadChildren();
            if (resultUris.length === 1) {
                await this.selectItem(resultUris[0]);
                await this.openFile();
            }
            return resultUris;
        }
        async findNextAvailableName(uri) {
            const uriObj = new FsUri_1.FsUri(uri);
            const parentNames = (await exports.fss.list(uriObj.parentUri.uri)).map(x => x.uri.name);
            for (var iTry = 1; iTry < 50; iTry++) {
                const newName = iTry === 1 ? uriObj.name : `${uriObj.nameWoExtension} (${iTry}).${uriObj.extension}`;
                if (!parentNames.some(x => x === newName))
                    return uriObj.parentUri.addPath(newName).uri;
            }
            throw new Error(`Something went wrong. Could not find any available filename for uri "${uri}"!`);
        }
        async writeFile(uri, content, renameOnConflict = true) {
            const isReadOnly = !exports.fss.capabilities(uri).write;
            if (isReadOnly)
                uri = this.defaultStorage.uri.changePath(new FsUri_1.FsUri(uri).path).uri;
            if (renameOnConflict)
                uri = await this.findNextAvailableName(uri);
            await exports.fss.write(uri, content);
            await this.selectItem(uri);
            return uri;
        }
        async getNodeForUri(uri, loadChildrenIfNeeded = true) {
            return await this.fsTreeView.searchNode(item => {
                return uri === item.uri.uri ? "match" :
                    uri.startsWith(item.uri.uri) ? "children" : "nomatch";
            });
        }
        async selectItem(uri) {
            const itemNode = await this.getNodeForUri(uri);
            this.fsTreeView.setSelected(itemNode);
        }
        async createKsyFile(name) {
            if (name.endsWith(".kcy")) {
                await this.uploadFiles({ [name]: Conversion_1.Conversion.strToUtf8Bytes("") });
            }
            else {
                var content = `meta:\n  id: ${name}\n  file-extension: ${name}\n`;
                await this.uploadFiles({ [`${name}.ksy`]: Conversion_1.Conversion.strToUtf8Bytes(content) });
            }
        }
        async cloneFile() {
            var newUri = this.selectedFsItem.uri.uri.replace(/\.(\w+)$/, `_${new Date().format("yyyymmdd_HHMMss")}.$1`);
            console.log("cloneKsyFile", newUri);
            let content = await this.selectedFsItem.fs.read(this.selectedFsItem.uri.uri);
            await this.selectedFsItem.fs.write(newUri, content);
            await this.selectedFsItem.parent.loadChildren();
        }
        async downloadFile() {
            let data = await this.selectedFsItem.fs.read(this.selectedFsItem.uri.uri);
            await FileUtils_1.FileUtils.saveFile(this.selectedFsItem.uri.name, data);
        }
        async uploadFile() {
            const files = await FileUtils_1.FileUtils.openFilesWithDialog();
            await this.uploadFiles(files);
        }
        async deleteFile() {
            await this.selectedFsItem.fs.delete(this.selectedFsItem.uri.uri);
            await this.selectedFsItem.parent.loadChildren();
        }
        mounted() {
            var scrollbar = Scrollbar.init(this.fsTreeView.$el);
            this.fsTreeView.getParentBoundingRect = () => scrollbar.bounding;
            this.fsTreeView.scrollIntoView = (el, alignToTop) => {
                scrollbar.update();
                scrollbar.scrollIntoView(el, { alignToTop: alignToTop, onlyScrollIfNeeded: true });
            };
            console.log("FileTree mounted", this.fsTreeView);
            //this.createFolderModal.show();
        }
    };
    FileTree = __decorate([
        Component_1.default
    ], FileTree);
    exports.FileTree = FileTree;
});
//# sourceMappingURL=FileTree.js.map