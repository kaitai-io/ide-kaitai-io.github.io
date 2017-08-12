define(["require", "exports", "../utils"], function (require, exports, utils_1) {
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
    class EditorChangeHandler {
        constructor(editor, delay, changeCallback) {
            this.editor = editor;
            this.changeCallback = changeCallback;
            this.editDelay = new utils_1.Delayed(delay);
            if (this.editor)
                this.editor.on("change", () => this.editDelay.do(() => this.changeCallback(this.editor.getValue(), !this.internalChange)));
        }
        setContent(newContent) {
            if (!this.editor)
                return;
            if (this.editor.getValue() !== newContent) {
                this.internalChange = true;
                this.editor.setValue(newContent, -1);
                this.internalChange = false;
            }
        }
        getContent() {
            return this.editor ? this.editor.getValue() : "";
        }
    }
    exports.EditorChangeHandler = EditorChangeHandler;
});
//# sourceMappingURL=UIHelper.js.map