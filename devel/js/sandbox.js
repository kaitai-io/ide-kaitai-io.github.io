define(["require", "exports", "./FileSystem/GithubClient", "./FileSystem/GithubFs", "./FileSystem/LocalFs", "./FileSystem/RemoteFs", "./FileSystem/FsSelector"], function (require, exports, GithubClient_1, GithubFs_1, LocalFs_1, RemoteFs_1, FsSelector_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var queryParams = {};
    location.search.substr(1).split('&').map(x => x.split('=')).forEach(x => queryParams[x[0]] = x[1]);
    function dataToArrayBuffer(str) {
        var len = str.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = str.charCodeAt(i);
        }
        return bytes.buffer;
    }
    var fs = new FsSelector_1.FsSelector();
    fs.addFs(new LocalFs_1.LocalFileSystem());
    var remoteFs = new RemoteFs_1.RemoteFileSystem();
    remoteFs.mappings["127.0.0.1:8001/default"] = { secret: queryParams.secret };
    fs.addFs(remoteFs);
    var githubClient = new GithubClient_1.GithubClient(queryParams.access_token);
    var githubFs = new GithubFs_1.GithubFileSystem(githubClient);
    fs.addFs(githubFs);
    ['local:///folder/', 'remote://127.0.0.1:8001/default/folder/', 'github://koczkatamas/kaitai_struct_formats/archive/']
        .forEach(uri => fs.list(uri).then(items => console.log(items.map(item => `${item.uri.uri} (${item.uri.type})`))));
});
