System.register(["bowser"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var bowser;
    return {
        setters: [
            function (bowser_1) {
                bowser = bowser_1;
            }
        ],
        execute: function () {
            // app.unsupportedBrowser.ts changed
            if (localStorage.getItem("hideUnsupported") === "true" || bowser.check({ chrome: "53", firefox: "49" }, true))
                $("#unsupportedBrowser").hide();
            $("#unsupportedBrowser .closeBtn").on("click", () => {
                localStorage.setItem("hideUnsupported", "true");
                $("#unsupportedBrowser").hide();
            });
        }
    };
});
//# sourceMappingURL=app.unsupportedBrowser.js.map