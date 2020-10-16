define(["require", "exports", "localforage", "dateformat", "./app", "../utils"], function (require, exports, localforage, dateFormat, app_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /* tslint:enable */
    var fsHelper = {
        selectNode(root, fn) {
            var currNode = root;
            var fnParts = fn.split("/");
            var currPath = "";
            for (var i = 0; i < fnParts.length; i++) {
                var fnPart = fnParts[i];
                currPath += (currPath ? "/" : "") + fnPart;
                if (!("children" in currNode)) {
                    currNode.children = {};
                    currNode.type = "folder";
                }
                if (!(fnPart in currNode.children))
                    currNode.children[fnPart] = { fsType: root.fsType, type: "file", fn: currPath };
                currNode = currNode.children[fnPart];
            }
            return currNode;
        }
    };
    class LocalStorageFs {
        constructor(prefix) {
            this.prefix = prefix;
        }
        filesKey() { return `${this.prefix}_files`; }
        fileKey(fn) { return `${this.prefix}_file[${fn}]`; }
        save() { return localforage.setItem(this.filesKey(), this.root); }
        async getRootNode() {
            if (!this.root)
                this.root = await localforage.getItem(this.filesKey()) ||
                    { fsType: "local", type: "folder", children: {} };
            return this.root;
        }
        setRootNode(newRoot) {
            this.root = newRoot;
            return this.save();
        }
        get(fn) { return localforage.getItem(this.fileKey(fn)); }
        put(fn, data) {
            return this.getRootNode().then(root => {
                var node = fsHelper.selectNode(root, fn);
                return Promise.all([localforage.setItem(this.fileKey(fn), data), this.save()]).then(x => node);
            });
        }
    }
    class KaitaiFs {
        constructor(files) {
            this.files = files;
        }
        getRootNode() { return Promise.resolve(this.files); }
        get(fn) {
            if (fn.toLowerCase().endsWith(".ksy"))
                return Promise.resolve($.ajax({ url: fn }));
            else
                return utils_1.downloadFile(fn);
        }
        put(fn, data) { return Promise.reject("KaitaiFs.put is not implemented!"); }
    }
    class StaticFs {
        constructor() { this.files = {}; }
        getRootNode() { return Promise.resolve(Object.keys(this.files).map(fn => ({ fsType: "static", type: "file", fn }))); }
        get(fn) { return Promise.resolve(this.files[fn]); }
        put(fn, data) { this.files[fn] = data; return Promise.resolve(null); }
    }
    var kaitaiRoot = { fsType: "kaitai" };
    kaitaiFsFiles.forEach(fn => fsHelper.selectNode(kaitaiRoot, fn));
    var kaitaiFs = new KaitaiFs(kaitaiRoot);
    var staticFs = new StaticFs();
    var localFs = new LocalStorageFs("fs");
    /* tslint:disable */
    exports.fss = { local: localFs, kaitai: kaitaiFs, static: staticFs };
    /* tslint:enable */
    function genChildNode(obj, fn) {
        var isFolder = obj.type === "folder";
        return {
            text: fn,
            icon: "glyphicon glyphicon-" + (isFolder ? "folder-open" : fn.endsWith(".ksy") ? "list-alt" : "file"),
            children: isFolder ? genChildNodes(obj) : null,
            data: obj
        };
    }
    function genChildNodes(obj) {
        return Object.keys(obj.children || []).map(k => genChildNode(obj.children[k], k));
    }
    async function refreshFsNodes() {
        var localStorageNode = app_1.app.ui.fileTree.get_node("localStorage");
        var root = await localFs.getRootNode();
        app_1.app.ui.fileTree.delete_node(localStorageNode.children);
        if (root)
            genChildNodes(root).forEach((node) => app_1.app.ui.fileTree.create_node(localStorageNode, node));
    }
    exports.refreshFsNodes = refreshFsNodes;
    async function addKsyFile(parent, ksyFn, content) {
        let name = ksyFn.split("/").last();
        let fsItem = await exports.fss.local.put(name, content);
        app_1.app.ui.fileTree.create_node(app_1.app.ui.fileTree.get_node(parent), { text: name, data: fsItem, icon: "glyphicon glyphicon-list-alt" }, "last", (node) => app_1.app.ui.fileTree.activate_node(node, null));
        await app_1.app.loadFsItem(fsItem, true);
        return fsItem;
    }
    exports.addKsyFile = addKsyFile;
    var fileTreeCont;
    function initFileTree() {
        fileTreeCont = app_1.app.ui.fileTreeCont.find(".fileTree");
        if (!kaitaiRoot.children["formats"]) {
            console.error("'formats' node is missing from js/kaitaiFsFiles.js, are you sure 'formats' git submodule is initialized? Try run 'git submodule init; git submodule update --recursive; ./genKaitaiFsFiles.py'!");
            kaitaiRoot.children["formats"] = {};
        }
        app_1.app.ui.fileTree = fileTreeCont.jstree({
            core: {
                check_callback: function (operation, node, node_parent, node_position, more) {
                    var result = true;
                    if (operation === "move_node")
                        result = !!node.data && node.data.fsType === "local" &&
                            !!node_parent.data && node_parent.data.fsType === "local" && node_parent.data.type === "folder";
                    return result;
                },
                themes: { name: "default-dark", dots: false, icons: true, variant: "small" },
                data: [
                    {
                        text: "kaitai.io",
                        icon: "glyphicon glyphicon-cloud",
                        state: { opened: true },
                        children: [
                            {
                                text: "formats",
                                icon: "glyphicon glyphicon-book",
                                children: genChildNodes(kaitaiRoot.children["formats"]),
                                state: { opened: true }
                            },
                            {
                                text: "samples",
                                icon: "glyphicon glyphicon-cd",
                                children: genChildNodes(kaitaiRoot.children["samples"]),
                                state: { opened: true }
                            },
                        ]
                    },
                    {
                        text: "Local storage",
                        id: "localStorage",
                        icon: "glyphicon glyphicon-hdd",
                        state: { opened: true },
                        children: [],
                        data: { fsType: "local", type: "folder" }
                    }
                ],
            },
            plugins: ["wholerow", "dnd"]
        }).jstree(true);
        refreshFsNodes();
        var uiFiles = {
            fileTreeContextMenu: $("#fileTreeContextMenu"),
            dropdownSubmenus: $("#fileTreeContextMenu .dropdown-submenu"),
            openItem: $("#fileTreeContextMenu .openItem"),
            createFolder: $("#fileTreeContextMenu .createFolder"),
            createKsyFile: $("#fileTreeContextMenu .createKsyFile"),
            cloneKsyFile: $("#fileTreeContextMenu .cloneKsyFile"),
            generateParser: $("#fileTreeContextMenu .generateParser"),
            downloadItem: $("#fileTreeContextMenu .downloadItem"),
            deleteItem: $("#fileTreeContextMenu .deleteItem"),
            createLocalKsyFile: $("#createLocalKsyFile"),
            uploadFile: $("#uploadFile"),
            downloadFile: $("#downloadFile"),
        };
        function convertTreeNode(treeNode) {
            var data = treeNode.data;
            data.children = {};
            treeNode.children.forEach((child) => data.children[child.text] = convertTreeNode(child));
            return data;
        }
        function saveTree() {
            localFs.setRootNode(convertTreeNode(app_1.app.ui.fileTree.get_json()[1]));
        }
        var contextMenuTarget = null;
        function getSelectedData() {
            var selected = app_1.app.ui.fileTree.get_selected();
            return selected.length >= 1 ? app_1.app.ui.fileTree.get_node(selected[0]).data : null;
        }
        fileTreeCont.on("contextmenu", ".jstree-node", e => {
            contextMenuTarget = e.target;
            var clickNodeId = app_1.app.ui.fileTree.get_node(contextMenuTarget).id;
            var selectedNodeIds = app_1.app.ui.fileTree.get_selected();
            if ($.inArray(clickNodeId, selectedNodeIds) === -1)
                app_1.app.ui.fileTree.activate_node(contextMenuTarget, null);
            var data = getSelectedData();
            var isFolder = data && data.type === "folder";
            var isLocal = data && data.fsType === "local";
            var isKsy = data && data.fn && data.fn.endsWith(".ksy") && !isFolder;
            function setEnabled(item, isEnabled) { item.toggleClass("disabled", !isEnabled); }
            setEnabled(uiFiles.createFolder, isLocal && isFolder);
            setEnabled(uiFiles.createKsyFile, isLocal && isFolder);
            setEnabled(uiFiles.cloneKsyFile, isLocal && isKsy);
            setEnabled(uiFiles.deleteItem, isLocal);
            setEnabled(uiFiles.generateParser, isKsy);
            uiFiles.fileTreeContextMenu.css({ display: "block" }); // necessary for obtaining width & height
            var x = Math.min(e.pageX, $(window).width() - uiFiles.fileTreeContextMenu.width());
            var h = uiFiles.fileTreeContextMenu.height();
            var y = e.pageY > ($(window).height() - h) ? e.pageY - h : e.pageY;
            uiFiles.fileTreeContextMenu.css({ left: x, top: y });
            return false;
        });
        uiFiles.dropdownSubmenus.mouseenter(e => {
            var el = $(e.currentTarget);
            if (!el.hasClass("disabled")) {
                var menu = el.find("> .dropdown-menu");
                var hideTimeout = menu.data("hide-timeout");
                if (typeof hideTimeout === "number") {
                    clearTimeout(hideTimeout);
                    menu.data("hide-timeout", null);
                }
                menu.css({ display: "block" });
                var itemPos = el.offset();
                var menuW = menu.outerWidth();
                var menuH = menu.outerHeight();
                var x = itemPos.left + el.width() + menuW <= $(window).width() ? itemPos.left + el.width() : itemPos.left - menuW;
                var y = itemPos.top + menuH <= $(window).height()
                    ? itemPos.top
                    : itemPos.top >= menuH
                        ? itemPos.top + el.height() - menu.height()
                        : $(window).height() - menuH;
                x -= itemPos.left;
                y -= itemPos.top;
                menu.css({ left: x, top: y });
            }
        }).mouseleave(e => {
            var el = $(e.currentTarget);
            var menu = el.find("> .dropdown-menu");
            menu.data("hide-timeout", setTimeout(() => {
                menu.css({ display: 'none' });
            }, 300));
        });
        function ctxAction(obj, callback) {
            obj.find("a").on("click", e => {
                if (!obj.hasClass("disabled")) {
                    uiFiles.fileTreeContextMenu.hide();
                    callback(e);
                }
            });
        }
        ctxAction(uiFiles.createFolder, e => {
            var parentData = getSelectedData();
            app_1.app.ui.fileTree.create_node(app_1.app.ui.fileTree.get_node(contextMenuTarget), {
                data: { fsType: parentData.fsType, type: "folder" },
                icon: "glyphicon glyphicon-folder-open"
            }, "last", (node) => {
                app_1.app.ui.fileTree.activate_node(node, null);
                setTimeout(function () { app_1.app.ui.fileTree.edit(node); }, 0);
            });
        });
        ctxAction(uiFiles.deleteItem, () => app_1.app.ui.fileTree.delete_node(app_1.app.ui.fileTree.get_selected()));
        ctxAction(uiFiles.openItem, () => $(contextMenuTarget).trigger("dblclick"));
        ctxAction(uiFiles.generateParser, e => {
            var fsItem = getSelectedData();
            var linkData = $(e.target).data();
            //console.log(fsItem, linkData);
            exports.fss[fsItem.fsType].get(fsItem.fn).then((content) => {
                return app_1.app.compilerService.compile(fsItem, content, linkData.kslang, !!linkData.ksdebug).then((compiled) => {
                    Object.keys(compiled).forEach(fileName => {
                        //var title = fsItem.fn.split("/").last() + " [" + $(e.target).text() + "]" + (compiled.length == 1 ? "" : ` ${i + 1}/${compiled.length}`);
                        //addEditorTab(title, compItem, linkData.acelang);
                        app_1.app.ui.layout.addEditorTab(fileName, compiled[fileName], linkData.acelang);
                    });
                });
            });
        });
        fileTreeCont.on("rename_node.jstree", () => app_1.ga("filetree", "rename"));
        fileTreeCont.on("move_node.jstree", () => app_1.ga("filetree", "move"));
        fileTreeCont.on("create_node.jstree rename_node.jstree delete_node.jstree move_node.jstree paste.jstree", saveTree);
        fileTreeCont.on("move_node.jstree", (e, data) => app_1.app.ui.fileTree.open_node(app_1.app.ui.fileTree.get_node(data.parent)));
        fileTreeCont.on("select_node.jstree", (e, selectNodeArgs) => {
            var fsItem = selectNodeArgs.node.data;
            [uiFiles.downloadFile, uiFiles.downloadItem].forEach(i => i.toggleClass("disabled", !(fsItem && fsItem.type === "file")));
        });
        var lastMultiSelectReport = 0;
        fileTreeCont.on("select_node.jstree", (e, args) => {
            if (e.timeStamp - lastMultiSelectReport > 1000 && args.selected.length > 1)
                app_1.ga("filetree", "multi_select");
            lastMultiSelectReport = e.timeStamp;
        });
        var ksyParent;
        function showKsyModal(parent) {
            ksyParent = parent;
            $("#newKsyName").val("");
            $("#newKsyModal").modal();
        }
        ctxAction(uiFiles.createKsyFile, () => showKsyModal(contextMenuTarget));
        uiFiles.createLocalKsyFile.on("click", () => showKsyModal("localStorage"));
        function downloadFiles() {
            app_1.app.ui.fileTree.get_selected().forEach(nodeId => {
                var fsItem = app_1.app.ui.fileTree.get_node(nodeId).data;
                exports.fss[fsItem.fsType].get(fsItem.fn).then(content => utils_1.saveFile(content, fsItem.fn.split("/").last()));
            });
        }
        ctxAction(uiFiles.downloadItem, () => downloadFiles());
        uiFiles.downloadFile.on("click", () => downloadFiles());
        uiFiles.uploadFile.on("click", () => utils_1.openFilesWithDialog(files => app_1.app.addNewFiles(files)));
        $("#newKsyModal").on("shown.bs.modal", () => { $("#newKsyModal input").focus(); });
        $("#newKsyModal form").submit(function (event) {
            event.preventDefault();
            $("#newKsyModal").modal("hide");
            var ksyName = $("#newKsyName").val();
            var parentData = app_1.app.ui.fileTree.get_node(ksyParent).data;
            addKsyFile(ksyParent, (parentData.fn ? `${parentData.fn}/` : "") + `${ksyName}.ksy`, `meta:\n  id: ${ksyName}\n  file-extension: ${ksyName}\n`);
        });
        fileTreeCont.bind("dblclick.jstree", function (event) {
            app_1.app.loadFsItem(app_1.app.ui.fileTree.get_node(event.target).data);
        });
        ctxAction(uiFiles.cloneKsyFile, e => {
            var fsItem = getSelectedData();
            var newFn = fsItem.fn.replace(".ksy", "_" + dateFormat(new Date(), "yyyymmdd_HHMMss") + ".ksy");
            exports.fss[fsItem.fsType].get(fsItem.fn).then((content) => addKsyFile("localStorage", newFn, content));
        });
    }
    exports.initFileTree = initFileTree;
});
//# sourceMappingURL=app.files.js.map