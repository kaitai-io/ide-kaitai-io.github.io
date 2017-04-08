define(["require", "exports", "./utils/GithubClient", "./utils/FsUri"], function (require, exports, GithubClient_1, FsUri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var queryParams = {};
    location.search.substr(1).split('&').map(x => x.split('=')).forEach(x => queryParams[x[0]] = x[1]);
    class GithubFsItem {
        constructor(fs, uri, entity) {
            this.fs = fs;
            this.entity = entity;
            this.uri = new FsUri_1.FsUri(uri, 2);
            this.repo = this.fs.client.getRepo(this.uri.providerData[1], this.uri.providerData[0]);
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
                console.log(items);
                return items.filter(item => item.type === 'file' || item.type === 'dir')
                    .map(item => new GithubFsItem(this.fs, this.uri.uri + item.name + (item.type === 'dir' ? '/' : ''), item));
            });
        }
    }
    class GithubFileSystem {
        constructor(client) {
            this.client = client;
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
    var githubClient = new GithubClient_1.GithubClient(queryParams.access_token);
    var githubFs = new GithubFileSystem(githubClient);
    //githubFs.list('github://koczkatamas/kaitai_struct_formats/archive/').then(items => console.log(items.map((x: GithubFsItem) => `${x.uri.uri}`)));
    githubFs.read('github://koczkatamas/kaitai_struct_formats/archive/zip.ksy').then(result => console.log(result));
});
//githubClient.listRepos().then(repos => console.log(repos.map(repo => repo.name)));
//githubClient.getRepo('koczkatamas/kaitai_struct_formats').getContents('/archive').then(items => console.log(items.map(f => `${f.name} (${f.type}) => ${f.path}`)));
