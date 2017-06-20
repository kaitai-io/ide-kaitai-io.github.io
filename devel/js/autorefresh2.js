System.register(["jquery"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function checkModifications() {
        $.getJSON("/onchange", () => location.reload(true))
            .fail(() => setTimeout(checkModifications, 750));
    }
    var $;
    return {
        setters: [
            function ($_1) {
                $ = $_1;
            }
        ],
        execute: function () {
            if (location.hostname === "127.0.0.1")
                checkModifications();
        }
    };
});
//# sourceMappingURL=autorefresh2.js.map