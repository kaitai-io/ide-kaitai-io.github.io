define(["require", "exports", "./FsUri", "localforage"], function (require, exports, FsUri_1, localforage) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LocalFsItem {
        constructor(uri) {
            this.uri = uri;
        }
    }
    class LocalFileSystem {
        constructor() {
            this.scheme = 'local';
            this.lfCache = {};
            localforage.createInstance({ name: "kaitai_files" });
        }
        execute(uri, action) {
            var fsUri = new FsUri_1.FsUri(uri, 1);
            var name = "kaitai_files" + (fsUri.fsData[0] ? '_' + fsUri.fsData[0] : '');
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
            return this.execute(uri, (lf, fsUri) => {
                return lf.keys().then(keys => {
                    var itemNames = {};
                    keys.filter(x => x.startsWith(fsUri.path)).forEach(key => {
                        var keyParts = key.substr(fsUri.path.length).split('/');
                        var name = keyParts[0] + (keyParts.length === 1 ? '' : '/');
                        itemNames[name] = true;
                    });
                    return Object.keys(itemNames).map(name => new LocalFsItem(new FsUri_1.FsUri(fsUri.uri + name, 1)));
                });
            });
        }
    }
    exports.LocalFileSystem = LocalFileSystem;
});
