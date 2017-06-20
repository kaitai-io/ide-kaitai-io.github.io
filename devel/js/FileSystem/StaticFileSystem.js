System.register(["./Common", "./FsUri"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var Common_1, FsUri_1, StaticFileSystem;
    return {
        setters: [
            function (Common_1_1) {
                Common_1 = Common_1_1;
            },
            function (FsUri_1_1) {
                FsUri_1 = FsUri_1_1;
            }
        ],
        execute: function () {
            StaticFileSystem = class StaticFileSystem {
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
            };
            exports_1("StaticFileSystem", StaticFileSystem);
        }
    };
});
//# sourceMappingURL=StaticFileSystem.js.map