define(["require", "exports", "./FsUri", "./Common", "localforage"], function (require, exports, FsUri_1, Common_1, localforage) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class BrowserFileSystem {
        constructor() {
            this.scheme = ["browser"];
            this.lfCache = {};
        }
        capabilities() { return { write: true, delete: true }; }
        prepare(uri) {
            var fsUri = new FsUri_1.FsUri(uri, 1);
            var name = "kaitai_files" + (fsUri.fsData[0] ? "_" + fsUri.fsData[0] : "");
            if (!this.lfCache[name])
                this.lfCache[name] = localforage.createInstance({ name: name });
            return { lf: this.lfCache[name], fsUri };
        }
        async createFolder(uri) {
            var { lf, fsUri } = this.prepare(uri);
            await lf.setItem(fsUri.path, null);
        }
        async read(uri) {
            var { lf, fsUri } = this.prepare(uri);
            return await lf.getItem(fsUri.path);
        }
        async write(uri, data) {
            var { lf, fsUri } = this.prepare(uri);
            await lf.setItem(fsUri.path, data);
        }
        async delete(uri) {
            var { lf, fsUri } = this.prepare(uri);
            if (fsUri.type === "directory") {
                const keys = await lf.keys();
                const itemsToDelete = keys.filter(key => key.startsWith(fsUri.path));
                for (const itemToDelete of itemsToDelete)
                    await lf.removeItem(itemToDelete);
            }
            else
                await lf.removeItem(fsUri.path);
        }
        async list(uri) {
            var { lf, fsUri } = this.prepare(uri);
            let keys = await lf.keys();
            return FsUri_1.FsUri.getChildUris(keys, fsUri).map(childUri => new Common_1.FsItem(childUri));
        }
    }
    exports.BrowserFileSystem = BrowserFileSystem;
    class BrowserLegacyFileSystem {
        constructor() {
            this.scheme = ["browser_legacy"];
        }
        capabilities() { return { write: false, delete: true }; }
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
            return FsUri_1.FsUri.getChildUris(fsKeys, new FsUri_1.FsUri(uri)).map(childUri => new Common_1.FsItem(childUri));
        }
    }
    exports.BrowserLegacyFileSystem = BrowserLegacyFileSystem;
});
