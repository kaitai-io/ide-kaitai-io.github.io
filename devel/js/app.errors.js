var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "./utils", "./app"], function (require, exports, utils_1, app_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ErrorWindowHandler {
        constructor(parentContainer) {
            this.parentContainer = parentContainer;
            this.lastErrWndSize = 100; // 34
            this.errorWnd = null;
        }
        show(...args) {
            return __awaiter(this, void 0, void 0, function* () {
                console.error.apply(window, args);
                var errMsg = args.filter(x => x.toString() !== {}.toString()).join(" ");
                if (!this.errorWnd) {
                    var newPanel = app_1.app.ui.layout.addPanel();
                    this.parentContainer.addChild({ type: "component", componentName: newPanel.componentName, title: "Errors" });
                    this.errorWnd = yield newPanel.donePromise;
                    this.errorWnd.setSize(0, this.lastErrWndSize);
                    this.errorWnd.getElement().addClass('errorWindow');
                }
                this.errorWnd.on("resize", () => this.lastErrWndSize = this.errorWnd.getElement().outerHeight());
                this.errorWnd.on("destroy", () => { app_1.ga("errorwnd", "destroy"); this.errorWnd = null; });
                this.errorWnd.on("close", () => { app_1.ga("errorwnd", "close"); this.errorWnd = null; });
                this.errorWnd.getElement().empty().append($("<div>").html(utils_1.htmlescape(errMsg).replace(/\n|\\n/g, "<br>")));
            });
        }
        hide() {
            if (this.errorWnd) {
                try {
                    this.errorWnd.close();
                }
                catch (e) { }
                this.errorWnd = null;
            }
        }
        handle(error) {
            if (error)
                this.show("Parse error" + (error.name ? ` (${error.name})` : "") + `: ${error.message}\nCall stack: ${error.stack}`, error);
            else
                this.hide();
        }
    }
    exports.ErrorWindowHandler = ErrorWindowHandler;
});
//# sourceMappingURL=app.errors.js.map