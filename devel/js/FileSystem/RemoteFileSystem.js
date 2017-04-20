define(["require", "exports", "./FsUri", "./Common"], function (require, exports, FsUri_1, Common_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class RemoteFileSystem {
        constructor() {
            this.scheme = "remote";
            this.mappings = {};
        }
        getFsUri(uri) { return new FsUri_1.FsUri(uri, 2); }
        request(method, url, headers, responseType, requestData) {
            return new Promise((resolve, reject) => {
                var xhr = new XMLHttpRequest();
                xhr.open(method, url, true);
                if (responseType)
                    xhr.responseType = responseType;
                if (headers)
                    for (var hdrName in headers)
                        xhr.setRequestHeader(hdrName, headers[hdrName]);
                xhr.onload = e => {
                    if (200 <= xhr.status && xhr.status <= 299) {
                        var contentType = xhr.getResponseHeader("content-type");
                        if (contentType === "application/json" && !responseType)
                            resolve(JSON.parse(xhr.response));
                        else
                            resolve(xhr.response);
                    }
                    else
                        reject(xhr.response);
                };
                xhr.onerror = e => reject(e);
                xhr.send(requestData);
            });
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
        read(uri) {
            return this.execute("GET", uri, true);
        }
        write(uri, data) {
            return this.execute("PUT", uri, false, data).then(x => null);
        }
        delete(uri) {
            return this.execute("DELETE", uri).then(x => null);
        }
        list(uri) {
            return this.execute("GET", uri).then(response => {
                return response.files.map(item => new Common_1.FsItem(this.getFsUri(uri + item.fn + (item.isDir ? "/" : ""))));
            });
        }
    }
    exports.RemoteFileSystem = RemoteFileSystem;
});
//# sourceMappingURL=RemoteFileSystem.js.map