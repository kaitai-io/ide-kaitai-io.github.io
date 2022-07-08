define(["require", "exports", "./Common", "./FsUri"], function (require, exports, Common_1, FsUri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class StaticFileSystem {
        constructor(files = {}) {
            this.files = files;
            this.scheme = ["static"];
        }
        getUri(uri) { return new FsUri_1.FsUri(uri, 0, this.scheme[0]); }
        capabilities(uri) {
            return { write: true, delete: true };
        }
        ;
        createFolder(uri) {
            this.files[this.getUri(uri).path] = null;
            return Promise.resolve();
        }
        read(uri) { return Promise.resolve(this.files[this.getUri(uri).path]); }
        write(uri, data) {
            this.files[this.getUri(uri).path] = data;
            return Promise.resolve();
        }
        delete(uri) {
            delete this.files[this.getUri(uri).path];
            return Promise.resolve();
        }
        list(uri) {
            return Promise.resolve(FsUri_1.FsUri.getChildUris(Object.keys(this.files), this.getUri(uri)).map(uri => new Common_1.FsItem(uri)));
        }
    }
    exports.StaticFileSystem = StaticFileSystem;
});
