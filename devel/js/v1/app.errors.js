define(["require", "exports", "../utils", "./app"], function (require, exports, utils_1, app_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ErrorWindowHandler {
        constructor(parentContainer) {
            this.parentContainer = parentContainer;
            this.lastErrWndSize = 100; // 34
            this.errorWnd = null;
        }
        async show(...args) {
            console.error.apply(window, args);
            var errMsg = args.filter(x => x.toString() !== {}.toString()).join(" ");
            if (!this.errorWnd) {
                var newPanel = app_1.app.ui.layout.addPanel();
                this.parentContainer.addChild({ type: "component", componentName: newPanel.componentName, title: "Errors" });
                this.errorWnd = await newPanel.donePromise;
                this.errorWnd.setSize(0, this.lastErrWndSize);
                this.errorWnd.getElement().addClass("errorWindow");
            }
            this.errorWnd.on("resize", () => this.lastErrWndSize = this.errorWnd.getElement().outerHeight());
            this.errorWnd.on("destroy", () => { app_1.ga("errorwnd", "destroy"); this.errorWnd = null; });
            this.errorWnd.on("close", () => { app_1.ga("errorwnd", "close"); this.errorWnd = null; });
            this.errorWnd.getElement().empty().append($("<div>").html(utils_1.htmlescape(errMsg).replace(/\n|\\n/g, "<br>")));
        }
        hide() {
            if (this.errorWnd) {
                try {
                    this.errorWnd.close();
                }
                catch (e) { /* nop */ }
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