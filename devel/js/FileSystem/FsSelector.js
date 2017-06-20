System.register([], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var FsSelector;
    return {
        setters: [],
        execute: function () {
            FsSelector = class FsSelector {
                constructor() {
                    this.scheme = [];
                    this.filesystems = {};
                }
                addFs(fs) {
                    for (var scheme of fs.scheme)
                        this.filesystems[scheme] = fs;
                }
                getFs(uri) {
                    var scheme = uri.split("://")[0];
                    var fs = this.filesystems[scheme];
                    if (!fs)
                        throw `FileSystem not found for uri: ${uri}`;
                    return fs;
                }
                capabilities(uri) {
                    return this.getFs(uri).capabilities(uri);
                }
                ;
                createFolder(uri) {
                    return this.getFs(uri).createFolder(uri);
                }
                read(uri) {
                    return this.getFs(uri).read(uri);
                }
                write(uri, data) {
                    return this.getFs(uri).write(uri, data);
                }
                delete(uri) {
                    return this.getFs(uri).delete(uri);
                }
                list(uri) {
                    return this.getFs(uri).list(uri);
                }
            };
            exports_1("FsSelector", FsSelector);
        }
    };
});
//# sourceMappingURL=FsSelector.js.map