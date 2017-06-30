define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class UIHelper {
        static findParent(base, type) {
            var res = base;
            while (res) {
                if (res instanceof type)
                    return res;
                res = res.$parent;
            }
            return null;
        }
    }
    exports.default = UIHelper;
});
//# sourceMappingURL=UIHelper.js.map