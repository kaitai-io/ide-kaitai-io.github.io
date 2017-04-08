define(["require", "exports", "./FileSystem/GithubClient", "./FileSystem/GithubFs", "./FileSystem/LocalFs"], function (require, exports, GithubClient_1, GithubFs_1, LocalFs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var queryParams = {};
    location.search.substr(1).split('&').map(x => x.split('=')).forEach(x => queryParams[x[0]] = x[1]);
    var githubClient = new GithubClient_1.GithubClient(queryParams.access_token);
    var githubFs = new GithubFs_1.GithubFileSystem(githubClient);
    function dataToArrayBuffer(str) {
        var len = str.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = str.charCodeAt(i);
        }
        return bytes.buffer;
    }
    var localFs = new LocalFs_1.LocalFileSystem();
    //localFs.write('local:///file.txt', dataToArrayBuffer("file content"));
    //localFs.write('local:///folder/file.txt', dataToArrayBuffer("file content"));
    localFs.list('local:///folder/').then(x => console.log(x));
    localFs.read('local:///folder/file.txt').then(x => console.log(x));
});
//githubFs.list('github://koczkatamas/kaitai_struct_formats/archive/').then(items => console.log(items.map((x: GithubFsItem) => `${x.uri.uri}`)));
//githubFs.read('github://koczkatamas/kaitai_struct_formats/archive/zip.ksy').then(result => console.log(result));
//githubClient.listRepos().then(repos => console.log(repos.map(repo => repo.name)));
//githubClient.getRepo('koczkatamas/kaitai_struct_formats').getContents('/archive').then(items => console.log(items.map(f => `${f.name} (${f.type}) => ${f.path}`)));
