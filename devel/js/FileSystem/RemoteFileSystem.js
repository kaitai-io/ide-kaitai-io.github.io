var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
        createFolder(uri) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.execute("PUT", uri);
            });
        }
        read(uri) {
            return __awaiter(this, void 0, void 0, function* () {
                return yield this.execute("GET", uri, true);
            });
        }
        write(uri, data) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.execute("PUT", uri, false, data);
            });
        }
        delete(uri) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.execute("DELETE", uri);
            });
        }
        list(uri) {
            return __awaiter(this, void 0, void 0, function* () {
                let response = yield this.execute("GET", uri);
                return response.files.map(item => new Common_1.FsItem(this.getFsUri(uri + item.fn + (item.isDir ? "/" : ""))));
            });
        }
    }
    exports.RemoteFileSystem = RemoteFileSystem;
});
//# sourceMappingURL=RemoteFileSystem.js.map