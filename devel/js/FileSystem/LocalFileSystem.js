define(["require", "exports", "./FsUri", "./Common", "localforage"], function (require, exports, FsUri_1, Common_1, localforage) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LocalFileSystem {
        constructor() {
            this.scheme = "local";
            this.lfCache = {};
            localforage.createInstance({ name: "kaitai_files" });
        }
        execute(uri, action) {
            var fsUri = new FsUri_1.FsUri(uri, 1);
            var name = "kaitai_files" + (fsUri.fsData[0] ? "_" + fsUri.fsData[0] : "");
            if (!this.lfCache[name])
                this.lfCache[name] = localforage.createInstance({ name: name });
            return action(this.lfCache[name], fsUri);
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
    }
    exports.LocalFileSystem = LocalFileSystem;
});
//# sourceMappingURL=LocalFileSystem.js.map