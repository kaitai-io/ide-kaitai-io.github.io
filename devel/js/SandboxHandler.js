define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class GenericSandboxError extends Error {
        constructor(text, errorClass, value) {
            super(`${errorClass}: ${text}`);
            this.text = text;
            this.errorClass = errorClass;
            this.value = value;
        }
    }
    class ApiProxyPath {
        constructor(sandbox, useWorker, path) {
            this.sandbox = sandbox;
            this.useWorker = useWorker;
            this.path = path;
        }
        createProxy() {
            return new Proxy(ApiProxyPath.fakeBaseObj, {
                get: (target, propName) => {
                    if (propName === "then")
                        return null;
                    var path = Array.from(this.path);
                    path.push(propName);
                    return new ApiProxyPath(this.sandbox, this.useWorker, path).createProxy();
                },
                apply: (target, _this, args) => {
                    return this.sandbox.workerCall(this.path.join("."), args, this.useWorker);
                }
            });
        }
    }
    ApiProxyPath.fakeBaseObj = function () { };
    class SandboxHandler {
        constructor(iframeSrc) {
            this.iframeSrc = iframeSrc;
            this.msgHandlers = {};
            this.lastMsgId = 0;
            this.iframeOrigin = new URL(iframeSrc).origin;
            this.loadedPromise = new Promise((resolve, reject) => {
                this.iframe = document.createElement("iframe");
                this.iframe.style.display = "none";
                this.iframe.onload = () => resolve();
                this.iframe.onerror = () => reject();
                this.iframe.src = iframeSrc;
                window.addEventListener("message", e => {
                    if (e.source !== this.iframe.contentWindow)
                        return;
                    var msg = e.data;
                    if (this.msgHandlers[msg.messageId])
                        this.msgHandlers[msg.messageId](msg);
                    delete this.msgHandlers[msg.messageId];
                });
                document.body.appendChild(this.iframe);
            });
        }
        async workerCall(method, args, useWorker = true) {
            await this.loadedPromise;
            return new Promise((resolve, reject) => {
                let request = { method: method, arguments: args, messageId: `${++this.lastMsgId}`, useWorker: useWorker };
                this.msgHandlers[request.messageId] = response => {
                    if (response.success)
                        resolve(response.result);
                    else {
                        let error = response.error;
                        console.log("error", error);
                        let errorObj = JSON.parse(error.asJson);
                        if (error.class in this.errorHandlers)
                            reject(new this.errorHandlers[error.class](error.asText, errorObj));
                        else
                            reject(new GenericSandboxError(error.asText, error.class, errorObj));
                    }
                    //console.info(`[performance] [${(new Date()).format("H:i:s.u")}] Got worker response: ${Date.now()}.`);
                };
                this.iframe.contentWindow.postMessage(request, this.iframeOrigin);
            });
        }
        createProxy(useWorker = true) {
            return new ApiProxyPath(this, useWorker, []).createProxy();
        }
        static create(src, useWorker = true) {
            var handler = new SandboxHandler(src);
            return handler.createProxy(useWorker);
        }
    }
    exports.SandboxHandler = SandboxHandler;
});
//# sourceMappingURL=SandboxHandler.js.map