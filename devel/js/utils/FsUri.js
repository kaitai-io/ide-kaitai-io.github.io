define(["require", "exports", "./TestHelper"], function (require, exports, TestHelper_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class FsUri {
        constructor(uri, providerDataLen = 0) {
            this.uri = uri;
            var uriParts = uri.split('://', 2);
            this.providerName = uriParts[0];
            var pathParts = uriParts[1].split('/');
            this.providerData = pathParts.slice(0, providerDataLen);
            this.path = '/' + pathParts.slice(providerDataLen).join('/');
            this.type = this.path.endsWith('/') ? 'directory' : 'file';
            var usableLen = this.path.length - 1 - (this.type === 'directory' ? 1 : 0);
            var split = this.path.lastIndexOf('/', usableLen);
            this.name = this.path.substring(split + 1, usableLen + 1);
            this.parentPath = this.path.substr(0, split + 1);
        }
    }
    exports.FsUri = FsUri;
    class FsUriTests {
        static run() {
            TestHelper_1.TestHelper.assertEquals(new FsUri('github://user/repo/', 2), { "uri": "github://user/repo/", "providerName": "github", "providerData": ["user", "repo"], "path": "/", "type": "directory", "name": "/", "parentPath": "/" });
            TestHelper_1.TestHelper.assertEquals(new FsUri('github://user/repo/folder/', 2), { "uri": "github://user/repo/folder/", "providerName": "github", "providerData": ["user", "repo"], "path": "/folder/", "type": "directory", "name": "folder", "parentPath": "/" });
            TestHelper_1.TestHelper.assertEquals(new FsUri('github://user/repo/folder/file', 2), { "uri": "github://user/repo/folder/file", "providerName": "github", "providerData": ["user", "repo"], "path": "/folder/file", "type": "file", "name": "file", "parentPath": "/folder/" });
        }
    }
    exports.FsUriTests = FsUriTests;
});
