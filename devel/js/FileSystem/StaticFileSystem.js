define(["require", "exports", "./Common", "./FsUri"], function (require, exports, Common_1, FsUri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class StaticFileSystem {
        constructor(files = {}) {
            this.files = files;
            this.scheme = 'static';
        }
        getPath(uri) { return new FsUri_1.FsUri(uri, 0).path; }
        read(uri) { return Promise.resolve(this.files[this.getPath(uri)]); }
        write(uri, data) {
            this.files[this.getPath(uri)] = data;
            return Promise.resolve();
        }
        delete(uri) {
            delete this.files[this.getPath(uri)];
            return Promise.resolve();
        }
        list(uri) {
            return Promise.resolve(FsUri_1.FsUri.getChildUris(Object.keys(this.files), new FsUri_1.FsUri(uri)).map(uri => new Common_1.FsItem(uri)));
        }
    }
    exports.StaticFileSystem = StaticFileSystem;
});
//# sourceMappingURL=StaticFileSystem.js.map