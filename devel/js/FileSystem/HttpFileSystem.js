System.register(["./Common", "./FsUri", "../utils/WebHelper"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var Common_1, FsUri_1, WebHelper_1, HttpFileSystem;
    return {
        setters: [
            function (Common_1_1) {
                Common_1 = Common_1_1;
            },
            function (FsUri_1_1) {
                FsUri_1 = FsUri_1_1;
            },
            function (WebHelper_1_1) {
                WebHelper_1 = WebHelper_1_1;
            }
        ],
        execute: function () {
            HttpFileSystem = class HttpFileSystem {
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
            };
            exports_1("HttpFileSystem", HttpFileSystem);
        }
    };
});
//# sourceMappingURL=HttpFileSystem.js.map