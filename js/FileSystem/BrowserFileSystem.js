define(["require", "exports", "./FsUri", "./Common", "localforage"], function (require, exports, FsUri_1, Common_1, localforage) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BrowserFileSystem {
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
        async createFolder(uri) {
            await this.execute(uri, (lf, fsUri) => lf.setItem(fsUri.path, null));
        }
        read(uri) {
            return this.execute(uri, (lf, fsUri) => lf.getItem(fsUri.path));
        }
        async write(uri, data) {
            await this.execute(uri, (lf, fsUri) => lf.setItem(fsUri.path, data));
        }
        async delete(uri) {
            await this.execute(uri, (lf, fsUri) => lf.removeItem(fsUri.path));
        }
        list(uri) {
            return this.execute(uri, async (lf, fsUri) => {
                let keys = await lf.keys();
                return FsUri_1.FsUri.getChildUris(keys, fsUri).map(uri => new Common_1.FsItem(uri));
            });
        }
    }
    exports.BrowserFileSystem = BrowserFileSystem;
    class BrowserLegacyFileSystem {
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
        async list(uri) {
            let keys = await localforage.keys();
            var fsKeys = keys.filter(x => x.startsWith("fs_file[")).map(x => "/" + x.substr(8, x.length - 9));
            return FsUri_1.FsUri.getChildUris(fsKeys, new FsUri_1.FsUri(uri)).map(uri => new Common_1.FsItem(uri));
        }
    }
    exports.BrowserLegacyFileSystem = BrowserLegacyFileSystem;
});
//# sourceMappingURL=BrowserFileSystem.js.map