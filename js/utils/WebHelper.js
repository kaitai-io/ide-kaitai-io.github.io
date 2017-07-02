define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class WebHelper {
        static request(method, url, headers, responseType, requestData) {
            return new Promise((resolve, reject) => {
                var xhr = new XMLHttpRequest();
                xhr.open(method, url, true);
                if (responseType)
                    xhr.responseType = responseType;
                if (headers)
                    for (var hdrName in headers)
                        if (headers.hasOwnProperty(hdrName))
                            xhr.setRequestHeader(hdrName, headers[hdrName]);
                xhr.onload = e => {
                    if (200 <= xhr.status && xhr.status <= 299) {
                        var contentType = xhr.getResponseHeader("content-type");
                        if (contentType === "application/json" && !responseType)
                            resolve(JSON.parse(xhr.response));
                        else
                            resolve(xhr.response);
                    }
                    else
                        reject(xhr.response);
                };
                xhr.onerror = e => reject(e);
                xhr.send(requestData);
            });
        }
    }
    exports.WebHelper = WebHelper;
});
//# sourceMappingURL=WebHelper.js.map