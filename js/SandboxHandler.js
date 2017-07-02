define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class SandboxHandler {
        constructor(iframeSrc) {
            this.iframeSrc = iframeSrc;
            this.msgHandlers = {};
            this.lastMsgId = 0;
            this.iframeOrigin = new URL(iframeSrc).origin;
            this.loadedPromise = new Promise((resolve, reject) => {
                this.iframe = document.createElement("iframe");
                this.iframe.style.display = 'none';
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
                        console.log("error", response.error);
                        reject(response.error);
                    }
                    //console.info(`[performance] [${(new Date()).format("H:i:s.u")}] Got worker response: ${Date.now()}.`);
                };
                this.iframe.contentWindow.postMessage(request, this.iframeOrigin);
            });
        }
        createProxy(useWorker = true) {
            return new Proxy(this, {
                get: (target, methodName) => (...args) => this.workerCall(methodName, args, useWorker)
            });
        }
        static create(src, useWorker = true) {
            var handler = new SandboxHandler(src);
            return handler.createProxy(useWorker);
        }
    }
    exports.SandboxHandler = SandboxHandler;
});
//# sourceMappingURL=SandboxHandler.js.map