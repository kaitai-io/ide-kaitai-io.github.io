define(["require", "exports", "./FileSystem/GithubClient", "./FileSystem/GithubFs", "./FileSystem/LocalFs", "./FileSystem/RemoteFs", "./FileSystem/FsSelector", "knockout"], function (require, exports, GithubClient_1, GithubFs_1, LocalFs_1, RemoteFs_1, FsSelector_1, ko) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var queryParams = {};
    location.search.substr(1).split('&').map(x => x.split('=')).forEach(x => queryParams[x[0]] = x[1]);
    var fs = new FsSelector_1.FsSelector();
    fs.addFs(new LocalFs_1.LocalFileSystem());
    var remoteFs = new RemoteFs_1.RemoteFileSystem();
    remoteFs.mappings["127.0.0.1:8001/default"] = { secret: queryParams.secret };
    fs.addFs(remoteFs);
    var githubClient = new GithubClient_1.GithubClient(queryParams.access_token);
    var githubFs = new GithubFs_1.GithubFileSystem(githubClient);
    fs.addFs(githubFs);
    console.log(ko);
    var viewModel = {
        treeRoot: ko.observableArray()
    };
    class TreeElement {
        constructor(name, children = []) {
            this.name = ko.observable(name);
            this.isOpen = ko.observable(false);
            this.children = ko.observableArray(children);
        }
        openCloseNode() {
            this.isOpen(!this.isOpen());
        }
    }
    var tree = [
        new TreeElement("Russia", [
            new TreeElement("Moscow")
        ]),
        new TreeElement("Germany"),
        new TreeElement("United States", [
            new TreeElement("Atlanta"),
            new TreeElement("New York", [
                new TreeElement("Harlem"),
                new TreeElement("Central Park")
            ])
        ]),
        new TreeElement("Canada", [
            new TreeElement("Toronto2")
        ])
    ];
    viewModel.treeRoot(tree);
    ko.applyBindings(viewModel);
});
//['local:///folder/', 'remote://127.0.0.1:8001/default/folder/', 'github://koczkatamas/kaitai_struct_formats/archive/']
//    .forEach(uri => fs.list(uri).then(items => console.log(items.map(item => `${item.uri.uri} (${item.uri.type})`))));
