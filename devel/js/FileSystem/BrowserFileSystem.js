System.register(["./FsUri", "./Common", "localforage"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var FsUri_1, Common_1, localforage, BrowserFileSystem, BrowserLegacyFileSystem;
    return {
        setters: [
            function (FsUri_1_1) {
                FsUri_1 = FsUri_1_1;
            },
            function (Common_1_1) {
                Common_1 = Common_1_1;
            },
            function (localforage_1) {
                localforage = localforage_1;
            }
        ],
        execute: function () {
            BrowserFileSystem = class BrowserFileSystem {
                constructor() {
                    this.scheme = ["browser"];
                    this.lfCache = {};
                }
                capabilities() { return { write: true, delete: true }; }
                ;
                execute(uri, action) {
                    var fsUri = new FsUri_1.FsUri(uri, 1);
                    var name = "kaitai_files" + (fsUri.fsData[0] ? "_" + fsUri.fsData[0] : "");
                    if (!this.lfCache[name])
                        this.lfCache[name] = localforage.createInstance({ name: name });
                    return action(this.lfCache[name], fsUri);
                }
                createFolder(uri) {
                    return this.execute(uri, (lf, fsUri) => lf.setItem(fsUri.path, null)).then(x => null);
                }
                read(uri) {
                    return this.execute(uri, (lf, fsUri) => lf.getItem(fsUri.path));
                }
                write(uri, data) {
                    return this.execute(uri, (lf, fsUri) => lf.setItem(fsUri.path, data)).then(x => null);
                }
                delete(uri) {
                    return this.execute(uri, (lf, fsUri) => lf.removeItem(fsUri.path));
                }
                list(uri) {
                    return this.execute(uri, (lf, fsUri) => lf.keys().then(keys => FsUri_1.FsUri.getChildUris(keys, fsUri).map(uri => new Common_1.FsItem(uri))));
                }
            };
            exports_1("BrowserFileSystem", BrowserFileSystem);
            BrowserLegacyFileSystem = class BrowserLegacyFileSystem {
                constructor() {
                    this.scheme = ["browser_legacy"];
                }
                capabilities() { return { write: false, delete: true }; }
                ;
                createFolder(uri) { throw new Error("Not implemented!"); }
                write(uri, data) { throw new Error("Not implemented!"); }
                uriKey(uri) { return `fs_file[${new FsUri_1.FsUri(uri, 0).path.substr(1)}]`; }
                read(uri) {
                    return localforage.getItem(this.uriKey(uri));
                }
                delete(uri) {
                    return localforage.removeItem(this.uriKey(uri));
                }
                list(uri) {
                    return localforage.keys().then(keys => {
                        var fsKeys = keys.filter(x => x.startsWith("fs_file[")).map(x => "/" + x.substr(8, x.length - 9));
                        return FsUri_1.FsUri.getChildUris(fsKeys, new FsUri_1.FsUri(uri)).map(uri => new Common_1.FsItem(uri));
                    });
                }
            };
            exports_1("BrowserLegacyFileSystem", BrowserLegacyFileSystem);
        }
    };
});
//# sourceMappingURL=BrowserFileSystem.js.map