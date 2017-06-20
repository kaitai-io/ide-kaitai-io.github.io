System.register([], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function workerCall(request) {
        return new Promise((resolve, reject) => {
            request.msgId = ++lastMsgId;
            msgHandlers[request.msgId] = response => {
                if (response.error) {
                    console.log("error", response.error);
                    reject(response.error);
                }
                else
                    resolve(response.result);
                //console.info(`[performance] [${(new Date()).format("H:i:s.u")}] Got worker response: ${Date.now()}.`);
            };
            worker.postMessage(request);
        });
    }
    var worker, msgHandlers, lastMsgId, workerMethods;
    return {
        setters: [],
        execute: function () {
            worker = new Worker("js/kaitaiWorker.js");
            msgHandlers = {};
            worker.onmessage = (ev) => {
                var msg = ev.data;
                if (msgHandlers[msg.msgId])
                    msgHandlers[msg.msgId](msg);
                delete msgHandlers[msg.msgId];
            };
            lastMsgId = 0;
            exports_1("workerMethods", workerMethods = {
                initCode: (sourceCode, mainClassName, ksyTypes) => {
                    return workerCall({ type: "initCode", args: [sourceCode, mainClassName, ksyTypes] });
                },
                setInput: (inputBuffer) => {
                    return workerCall({ type: "setInput", args: [inputBuffer] });
                },
                reparse: (eagerMode) => {
                    return workerCall({ type: "reparse", args: [eagerMode] });
                },
                get: (path) => {
                    return workerCall({ type: "get", args: [path] });
                }
            });
        }
    };
});
//# sourceMappingURL=app.worker.js.map