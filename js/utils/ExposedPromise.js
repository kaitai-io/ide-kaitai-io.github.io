define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExposedPromise extends Promise {
        constructor(executor) {
            super((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
                executor(resolve, reject);
            });
        }
    }
    exports.ExposedPromise = ExposedPromise;
});
