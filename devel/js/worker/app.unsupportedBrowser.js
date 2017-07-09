define(["require", "exports", "bowser"], function (require, exports, bowser) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // app.unsupportedBrowser.ts changed
    if (localStorage.getItem("hideUnsupported") === "true" || bowser.check({ chrome: "55", firefox: "52", safari: "10.1" }, true))
        $("#unsupportedBrowser").hide();
    $("#unsupportedBrowser .closeBtn").on("click", () => {
        localStorage.setItem("hideUnsupported", "true");
        $("#unsupportedBrowser").hide();
    });
});
//# sourceMappingURL=app.unsupportedBrowser.js.map