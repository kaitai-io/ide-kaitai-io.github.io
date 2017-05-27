define(["require", "exports", "jquery"], function (require, exports, $) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function checkModifications() {
        $.getJSON("/onchange", () => location.reload(true))
            .fail(() => setTimeout(checkModifications, 750));
    }
    if (location.hostname === "127.0.0.1")
        checkModifications();
});
//# sourceMappingURL=autorefresh2.js.map