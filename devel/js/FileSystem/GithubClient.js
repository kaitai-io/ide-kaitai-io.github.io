System.register(["../utils"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var utils_1, Repository, GithubClient;
    return {
        setters: [
            function (utils_1_1) {
                utils_1 = utils_1_1;
            }
        ],
        execute: function () {
            Repository = class Repository {
                constructor(client, name, owner) {
                    this.client = client;
                    this.name = name;
                    this.owner = owner;
                    var nameParts = name.split("/");
                    if (nameParts.length === 2) {
                        this.owner = nameParts[0];
                        this.name = nameParts[1];
                    }
                }
                static fromEntity(client, entity) {
                    var repo = new Repository(client, entity.full_name);
                    repo.entity = entity;
                    return repo;
                }
                getContents(path = "/") {
                    return this.client.req(`/repos/${this.owner}/${this.name}/contents${path}`);
                }
                downloadFile(path) {
                    return utils_1.downloadFile(`https://raw.githubusercontent.com/koczkatamas/kaitai_struct_formats/master${path}`);
                }
            };
            exports_1("Repository", Repository);
            GithubClient = class GithubClient {
                constructor(accessToken, owner) {
                    this.accessToken = accessToken;
                    this.owner = owner;
                }
                req(path) {
                    return new Promise((resolve, reject) => $.getJSON(`https://api.github.com${path}?access_token=${this.accessToken}`)
                        .then(json => resolve(json), xhr => {
                        var errorMessage = xhr.responseJSON && xhr.responseJSON.message;
                        console.log('github reject', errorMessage, xhr);
                        reject(errorMessage || xhr.statusText);
                    }));
                }
                listRepos() {
                    return this.req("/user/repos").then(repos => repos.map(entity => Repository.fromEntity(this, entity)));
                }
                getRepo(name, owner) {
                    return new Repository(this, name, owner || this.owner);
                }
            };
            exports_1("GithubClient", GithubClient);
        }
    };
});
//# sourceMappingURL=GithubClient.js.map