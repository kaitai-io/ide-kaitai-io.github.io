define(["require", "exports", "./Common", "./FsUri", "../utils/WebHelper"], function (require, exports, Common_1, FsUri_1, WebHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class HttpFileSystem {
        constructor(fileUrls = {}) {
            this.fileUrls = fileUrls;
            this.scheme = ["http", "https"];
        }
        capabilities(uri) {
            return { write: false, delete: false };
        }
        ;
        createFolder(uri) { throw new Error("Not implemented"); }
        write(uri, data) { throw new Error("Not implemented"); }
        delete(uri) { throw new Error("Not implemented"); }
        list(uri) {
            return Promise.resolve(FsUri_1.FsUri.getChildUris(Object.keys(this.fileUrls), new FsUri_1.FsUri(uri)).map(uri => new Common_1.FsItem(uri)));
        }
        read(uri) {
            return WebHelper_1.WebHelper.request("GET", this.fileUrls[new FsUri_1.FsUri(uri).path], null, "arraybuffer");
        }
    }
    exports.HttpFileSystem = HttpFileSystem;
});
