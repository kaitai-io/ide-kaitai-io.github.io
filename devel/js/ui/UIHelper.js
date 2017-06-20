System.register([], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var UIHelper;
    return {
        setters: [],
        execute: function () {
            UIHelper = class UIHelper {
                static findParent(base, type) {
                    var res = base;
                    while (res) {
                        if (res instanceof type)
                            return res;
                        res = res.$parent;
                    }
                    return null;
                }
            };
            exports_1("default", UIHelper);
        }
    };
});
//# sourceMappingURL=UIHelper.js.map