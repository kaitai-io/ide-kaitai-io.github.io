define(["require", "exports", "./FsUri"], function (require, exports, FsUri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class GithubFsItem {
        constructor(fs, uri, entity) {
            this.fs = fs;
            this.entity = entity;
            this.uri = new FsUri_1.FsUri(uri, 2);
            this.repo = this.fs.client.getRepo(this.uri.fsData[1], this.uri.fsData[0]);
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
                return items.filter(item => item.type === 'file' || item.type === 'dir')
                    .map(item => new GithubFsItem(this.fs, this.uri.uri + item.name + (item.type === 'dir' ? '/' : ''), item));
            });
        }
    }
    exports.GithubFsItem = GithubFsItem;
    class GithubFileSystem {
        constructor(client) {
            this.client = client;
            this.scheme = 'github';
        }
        getFsItem(uri) {
            return new GithubFsItem(this, uri);
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
    }
    exports.GithubFileSystem = GithubFileSystem;
});
//# sourceMappingURL=GithubFileSystem.js.map