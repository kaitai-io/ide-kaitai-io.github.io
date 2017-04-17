define(["require", "exports", "./FileSystem/GithubClient", "./FileSystem/GithubFs", "./FileSystem/LocalFs", "./FileSystem/RemoteFs", "./FileSystem/FsSelector", "vue"], function (require, exports, GithubClient_1, GithubFs_1, LocalFs_1, RemoteFs_1, FsSelector_1, Vue) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function fsTest() {
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
        ['local:///folder/', 'remote://127.0.0.1:8001/default/folder/', 'github://koczkatamas/kaitai_struct_formats/archive/']
            .forEach(uri => fs.list(uri).then(items => console.log(items.map(item => `${item.uri.uri} (${item.uri.type})`))));
    }
    console.log(kaitaiFsFiles);
    var data = {
        name: 'My Tree39',
        open: true,
        children: [
            { name: 'hello' },
            { name: 'wat' },
            {
                name: 'child folder',
                open: false,
                children: [
                    {
                        name: 'child folder',
                        open: false,
                        children: [
                            { name: 'hello' },
                            { name: 'wat' }
                        ]
                    },
                    { name: 'hello' },
                    { name: 'wat' },
                    {
                        name: 'child folder',
                        open: false,
                        children: [
                            { name: 'hello' },
                            { name: 'wat' }
                        ]
                    }
                ]
            }
        ]
    };
    // define the item component
    Vue.component('item', {
        template: '#item-template',
        props: {
            model: Object
        },
        computed: {
            isFolder() { return this.model.children && this.model.children.length; }
        },
        methods: {
            toggle() {
                if (this.isFolder)
                    this.model.open = !this.model.open;
            },
            changeType() {
                if (!this.isFolder) {
                    Vue.set(this.model, 'children', []);
                    this.addChild();
                    this.model.open = true;
                }
            },
            addChild() {
                this.model.children.push({
                    name: 'new stuff'
                });
            }
        }
    });
    Vue.config.devtools = true;
    // boot up the demo
    var demo = new Vue({
        el: '#tree',
        data: {
            treeData: data
        }
    });
});
