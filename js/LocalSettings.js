define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function CreateScopedLocalStorage(prefix, defaults) {
        return new Proxy(defaults, {
            get: function (target, propName, receiver) {
                let key = `${prefix}.${propName}`;
                return key in localStorage ? JSON.parse(localStorage[key]) : target[propName];
            },
            set: function (target, propName, value, receiver) {
                localStorage[`${prefix}.${propName}`] = JSON.stringify(value, null, 4);
                return true;
            }
        });
    }
    exports.localSettings = CreateScopedLocalStorage("settings", {
        showAboutOnStart: true,
        latestKsyUri: "https:///formats/archive/zip.ksy",
        latestKcyUri: null,
        latestInputUri: "https:///samples/sample1.zip",
        latestSelection: { start: -1, end: -1 },
        latestPath: ""
    });
});
