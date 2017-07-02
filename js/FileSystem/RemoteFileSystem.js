define(["require", "exports", "./FsUri", "./Common", "../utils/WebHelper"], function (require, exports, FsUri_1, Common_1, WebHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RemoteFileSystem {
        constructor() {
            this.scheme = ["remote"];
            this.mappings = {};
        }
        getFsUri(uri) { return new FsUri_1.FsUri(uri, 2); }
        request(method, url, headers, responseType, requestData) {
            return WebHelper_1.WebHelper.request(method, url, headers, responseType, requestData);
        }
        execute(method, uri, binaryResponse = false, postData = null) {
            var fsUri = this.getFsUri(uri);
            var host = fsUri.fsData[0];
            if (host.indexOf(":") === -1)
                host += "8001";
            var mapping = fsUri.fsData[1] || "default";
            var mappingConfig = this.mappings[`${host}/${mapping}`];
            var url = `http://${host}/files/${mapping}${fsUri.path}`;
            return this.request(method, url, { "Authorization": "MappingSecret " + mappingConfig.secret }, binaryResponse ? "arraybuffer" : null, postData);
        }
        capabilities(uri) {
            return { write: true, delete: true };
        }
        ;
        async createFolder(uri) {
            await this.execute("PUT", uri);
        }
        async read(uri) {
            return await this.execute("GET", uri, true);
        }
        async write(uri, data) {
            await this.execute("PUT", uri, false, data);
        }
        async delete(uri) {
            await this.execute("DELETE", uri);
        }
        async list(uri) {
            let response = await this.execute("GET", uri);
            return response.files.map(item => new Common_1.FsItem(this.getFsUri(uri + item.fn + (item.isDir ? "/" : ""))));
        }
    }
    exports.RemoteFileSystem = RemoteFileSystem;
});
//# sourceMappingURL=RemoteFileSystem.js.map