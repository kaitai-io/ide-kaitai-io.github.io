var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "jquery", "../utils"], function (require, exports, $, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Repository {
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
    }
    exports.Repository = Repository;
    class GithubClient {
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
            return __awaiter(this, void 0, void 0, function* () {
                let repos = yield this.req("/user/repos");
                return repos.map(entity => Repository.fromEntity(this, entity));
            });
        }
        getRepo(name, owner) {
            return new Repository(this, name, owner || this.owner);
        }
    }
    exports.GithubClient = GithubClient;
});
//# sourceMappingURL=GithubClient.js.map