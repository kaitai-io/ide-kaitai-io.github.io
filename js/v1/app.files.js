define(["require", "exports", "localforage", "dateformat", "./app", "../utils", "a11y-dialog"], function (require, exports, localforage, dateFormat, app_1, utils_1, A11yDialog) {
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
        get(fn) {
            return localforage.getItem(this.fileKey(fn))
                .then(content => {
                if (content === null) {
                    throw new Error('file not found');
                }
                return content;
            });
        }
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
                return fetch(fn)
                    .then(response => {
                    if (!response.ok) {
                        let msg;
                        if (response.status === 404) {
                            msg = 'file not found';
                        }
                        else {
                            const textAppendix = response.statusText ? ` (${response.statusText})` : '';
                            msg = `server responded with HTTP status ${response.status}${textAppendix}`;
                        }
                        throw new Error(msg);
                    }
                    return response.text();
                }, err => {
                    if (err instanceof TypeError) {
                        throw new Error(`cannot reach the server (message: ${err.message}), check your internet connection`);
                    }
                    throw err;
                });
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
                dblclick_toggle: false,
                allow_reselect: true,
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
        let contextMenuTarget;
        let fileTreeContextMenuDialog;
        fileTreeCont.on("contextmenu", ".jstree-node", e => {
            contextMenuTarget = e.currentTarget;
            const contextMenuTargetNode = app_1.app.ui.fileTree.get_node(contextMenuTarget);
            const selectedNodeIds = app_1.app.ui.fileTree.get_selected();
            if (selectedNodeIds.length !== 0 && selectedNodeIds.indexOf(contextMenuTargetNode.id) === -1) {
                app_1.app.ui.fileTree.deselect_all();
            }
            var data = contextMenuTargetNode.data;
            var isFolder = data && data.type === "folder";
            var isLocal = data && data.fsType === "local";
            var isKsy = data && data.fn && data.fn.endsWith(".ksy") && !isFolder;
            function setEnabled(item, isEnabled) {
                item.toggleClass("disabled", !isEnabled);
                item.children("a")
                    // Disable the link by unsetting the `href` attribute (it will no longer
                    // be focusable using the keyboard, as if it had `tabindex="-1"`)
                    .attr("href", isEnabled ? "#" : null)
                    .attr("aria-disabled", isEnabled ? null : "true");
            }
            setEnabled(uiFiles.createFolder, isLocal && isFolder);
            setEnabled(uiFiles.createKsyFile, isLocal && isFolder);
            setEnabled(uiFiles.cloneKsyFile, isLocal && isKsy);
            setEnabled(uiFiles.deleteItem, isLocal && contextMenuTargetNode.id !== "localStorage");
            setEnabled(uiFiles.generateParser, isKsy);
            setEnabled(uiFiles.downloadItem, !uiFiles.downloadFile.hasClass("disabled") || (data && data.type === "file"));
            if (!fileTreeContextMenuDialog) {
                const modal = $("#fileTreeContextMenuModal")[0];
                fileTreeContextMenuDialog = new A11yDialog(modal);
                // Close all submenus when the context menu is closed. This is to
                // ensure that the context menu is reset and behaves as if it were
                // opened for the first time when reopened (meaning that all
                // submenus are closed).
                fileTreeContextMenuDialog.on("hide", () => {
                    uiFiles.dropdownSubmenus
                        .children(".dropdown-menu")
                        .css({ display: "none" });
                });
            }
            fileTreeContextMenuDialog.show();
            uiFiles.fileTreeContextMenu.css({ display: "block" }); // necessary for obtaining width & height
            var x = Math.min(e.pageX, $(window).width() - uiFiles.fileTreeContextMenu.width());
            var h = uiFiles.fileTreeContextMenu.height();
            var y = e.pageY > ($(window).height() - h) ? e.pageY - h : e.pageY;
            uiFiles.fileTreeContextMenu.css({ left: x, top: y });
            return false;
        });
        (function () {
            let timeout;
            let startTouchPos;
            // Inspired by https://github.com/vakata/jstree/blob/6256df013ebd98aea138402d8ac96db3efe0c0da/src/jstree.contextmenu.js#L201-L221
            //
            // TODO: investigate why this is necessary, because by default the
            //   `contextmenu` event can apparently be triggered on touch devices as
            //   well (but here it is probably prevented by one of the jsTree
            //   component's event handlers). For example, note that a long touch
            //   opens a context menu in the hex viewer, which proves that the
            //   `contextmenu` event can be triggered natively.
            fileTreeCont.on("touchstart", ".jstree-anchor", e => {
                const originalEvent = e.originalEvent;
                if (!originalEvent || !originalEvent.changedTouches || !originalEvent.changedTouches[0]) {
                    return;
                }
                clearTimeout(timeout);
                const touch = originalEvent.changedTouches[0];
                startTouchPos = { clientX: touch.clientX, clientY: touch.clientY };
                const pageX = touch.pageX;
                const pageY = touch.pageY;
                timeout = setTimeout(() => $(e.currentTarget).trigger($.Event("contextmenu", { pageX, pageY })), 750);
            });
            fileTreeCont.on("touchmove", ".jstree-anchor", e => {
                if (!startTouchPos) {
                    return;
                }
                const originalEvent = e.originalEvent;
                if (!originalEvent || !originalEvent.changedTouches || !originalEvent.changedTouches[0]) {
                    return;
                }
                const touch = originalEvent.changedTouches[0];
                if (Math.abs(touch.clientX - startTouchPos.clientX) > 10 || Math.abs(touch.clientY - startTouchPos.clientY) > 10) {
                    clearTimeout(timeout);
                }
            });
            fileTreeCont.on("touchend", ".jstree-anchor", () => {
                clearTimeout(timeout);
                timeout = null;
                startTouchPos = null;
            });
        })();
        // The `focusin` and `focusout` events provide a simple form of keyboard
        // accessibility: the submenu is displayed as long as the item to which it
        // belongs, or the submenu itself, has focus.
        uiFiles.dropdownSubmenus.on("mouseenter focusin", e => {
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
        }).on("mouseleave focusout", e => {
            var el = $(e.currentTarget);
            var menu = el.find("> .dropdown-menu");
            menu.data("hide-timeout", setTimeout(() => {
                menu.css({ display: 'none' });
            }, 300));
        });
        function ctxAction(obj, callback) {
            obj.find("a").on("click", e => {
                e.preventDefault();
                if (!obj.hasClass("disabled")) {
                    if (callback(e) === false) {
                        return;
                    }
                    fileTreeContextMenuDialog.hide();
                }
            });
        }
        ctxAction(uiFiles.createFolder, e => {
            const parentNode = app_1.app.ui.fileTree.get_node(contextMenuTarget);
            app_1.app.ui.fileTree.create_node(parentNode, {
                data: { fsType: parentNode.data.fsType, type: "folder" },
                icon: "glyphicon glyphicon-folder-open"
            }, "last", (node) => {
                app_1.app.ui.fileTree.activate_node(node, null);
                setTimeout(function () { app_1.app.ui.fileTree.edit(node); }, 0);
            });
        });
        ctxAction(uiFiles.deleteItem, () => {
            let nodesToDelete = app_1.app.ui.fileTree.get_selected();
            if (nodesToDelete.length === 0) {
                nodesToDelete = [app_1.app.ui.fileTree.get_node(contextMenuTarget).id];
            }
            app_1.app.ui.fileTree.delete_node(nodesToDelete);
        });
        ctxAction(uiFiles.openItem, () => {
            const contextMenuTargetNode = app_1.app.ui.fileTree.get_node(contextMenuTarget);
            app_1.app.ui.fileTree.deselect_all();
            app_1.app.ui.fileTree.select_node(contextMenuTargetNode);
        });
        ctxAction(uiFiles.generateParser, e => {
            var fsItem = app_1.app.ui.fileTree.get_node(contextMenuTarget).data;
            const link = $(e.target);
            const dataKslang = link.attr("data-kslang");
            const dataKsdebug = link.attr("data-ksdebug") === "true";
            const dataAcelang = link.attr("data-acelang");
            if (!dataKslang) {
                return false;
            }
            exports.fss[fsItem.fsType].get(fsItem.fn).then((content) => {
                return app_1.app.compilerService.compile(fsItem, content, dataKslang, dataKsdebug).then((compiled) => {
                    Object.keys(compiled).forEach(fileName => {
                        //var title = fsItem.fn.split("/").last() + " [" + $(e.target).text() + "]" + (compiled.length == 1 ? "" : ` ${i + 1}/${compiled.length}`);
                        //addEditorTab(title, compItem, dataAcelang);
                        app_1.app.ui.layout.addEditorTab(fileName, compiled[fileName], dataAcelang);
                    });
                });
            });
        });
        fileTreeCont.on("create_node.jstree rename_node.jstree delete_node.jstree move_node.jstree paste.jstree", saveTree);
        fileTreeCont.on("move_node.jstree", (e, data) => app_1.app.ui.fileTree.open_node(app_1.app.ui.fileTree.get_node(data.parent)));
        fileTreeCont.on("select_node.jstree", (e, selectNodeArgs) => {
            if (selectNodeArgs.selected.length === 1) {
                app_1.app.ui.fileTree.toggle_node(selectNodeArgs.node);
                const fsItem = selectNodeArgs.node.data;
                app_1.app.loadFsItem(fsItem);
            }
        });
        fileTreeCont.on("changed.jstree", (e, eventData) => {
            const selectedNodeIds = eventData.selected;
            const hasDownloadable = selectedNodeIds.some((id) => {
                const fsItem = eventData.instance.get_node(id).data;
                return fsItem && fsItem.type === "file";
            });
            uiFiles.downloadFile
                .toggleClass("disabled", !hasDownloadable)
                .attr("aria-disabled", hasDownloadable ? null : "true");
        });
        var ksyParent;
        let newKsyDialog;
        function showKsyModal(parent) {
            ksyParent = parent;
            if (!newKsyDialog) {
                // FIXME: eliminate duplication with "#welcomeModal"
                const modal = $("#newKsyModal")[0];
                newKsyDialog = new A11yDialog(modal);
                modal.addEventListener('click', () => newKsyDialog.hide());
                modal.querySelector('.dialog-content').addEventListener('click', e => e.stopPropagation());
                const overlay = document.querySelector("#newKsyModalOverlay");
                newKsyDialog
                    .on('show', () => overlay.classList.remove("hidden"))
                    .on('hide', () => overlay.classList.add("hidden"));
            }
            $("#newKsyName").val("");
            newKsyDialog.show();
        }
        ctxAction(uiFiles.createKsyFile, () => showKsyModal(contextMenuTarget));
        uiFiles.createLocalKsyFile.on("click", () => showKsyModal("localStorage"));
        function downloadFiles() {
            let targetNodes = app_1.app.ui.fileTree.get_selected();
            if (targetNodes.length === 0) {
                targetNodes = [app_1.app.ui.fileTree.get_node(contextMenuTarget).id];
            }
            targetNodes.forEach(nodeId => {
                var fsItem = app_1.app.ui.fileTree.get_node(nodeId).data;
                if (fsItem.type === "file") {
                    exports.fss[fsItem.fsType].get(fsItem.fn).then(content => utils_1.saveFile(content, fsItem.fn.split("/").last()));
                }
            });
        }
        ctxAction(uiFiles.downloadItem, () => downloadFiles());
        uiFiles.downloadFile.on("click", () => downloadFiles());
        uiFiles.uploadFile.on("click", () => utils_1.openFilesWithDialog(files => app_1.app.addNewFiles(files)));
        $("#newKsyModal form").submit(function (event) {
            event.preventDefault();
            newKsyDialog.hide();
            var ksyName = $("#newKsyName").val();
            var parentData = app_1.app.ui.fileTree.get_node(ksyParent).data;
            addKsyFile(ksyParent, (parentData.fn ? `${parentData.fn}/` : "") + `${ksyName}.ksy`, `meta:\n  id: ${ksyName}\n  file-extension: ${ksyName}\n`);
        });
        ctxAction(uiFiles.cloneKsyFile, e => {
            const contextMenuTargetNode = app_1.app.ui.fileTree.get_node(contextMenuTarget);
            var fsItem = contextMenuTargetNode.data;
            var newFn = fsItem.fn.replace(".ksy", "_" + dateFormat(new Date(), "yyyymmdd_HHMMss") + ".ksy");
            exports.fss[fsItem.fsType].get(fsItem.fn).then((content) => addKsyFile("localStorage", newFn, content));
        });
    }
    exports.initFileTree = initFileTree;
});
