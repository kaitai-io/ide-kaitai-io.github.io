System.register(["./FsUri"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var FsUri_1, GithubFsItem, GithubFileSystem;
    return {
        setters: [
            function (FsUri_1_1) {
                FsUri_1 = FsUri_1_1;
            }
        ],
        execute: function () {
            GithubFsItem = class GithubFsItem {
                constructor(fs, uri, entity) {
                    this.fs = fs;
                    this.entity = entity;
                    this.uri = new FsUri_1.FsUri(uri, 2);
                    this.repo = this.fs.client.getRepo(this.uri.fsData[1], this.uri.fsData[0]);
                }
                createFolder() {
                    throw new Error("Not implemented");
                }
                read() {
                    return this.repo.downloadFile(this.uri.path);
                }
                write(newContent) {
                    throw new Error("Not implemented");
                }
                delete() {
                    throw new Error("Not implemented");
                }
                list() {
                    return this.repo.getContents(this.uri.path).then(items => {
                        return items.filter(item => item.type === "file" || item.type === "dir")
                            .map(item => new GithubFsItem(this.fs, this.uri.uri + item.name + (item.type === "dir" ? "/" : ""), item));
                    });
                }
            };
            exports_1("GithubFsItem", GithubFsItem);
            GithubFileSystem = class GithubFileSystem {
                constructor(client) {
                    this.client = client;
                    this.scheme = ["github"];
                }
                getFsItem(uri) {
                    return new GithubFsItem(this, uri);
                }
                capabilities(uri) {
                    return { write: true, delete: true };
                }
                ;
                createFolder(uri) {
                    return this.getFsItem(uri).createFolder();
                }
                read(uri) {
                    return this.getFsItem(uri).read();
                }
                write(uri, data) {
                    return this.getFsItem(uri).write(data);
                }
                delete(uri) {
                    return this.getFsItem(uri).delete();
                }
                list(uri) {
                    return this.getFsItem(uri).list();
                }
            };
            exports_1("GithubFileSystem", GithubFileSystem);
        }
    };
});
//# sourceMappingURL=GithubFileSystem.js.map