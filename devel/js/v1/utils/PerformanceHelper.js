define(["require", "exports", "dateformat"], function (require, exports, dateFormat) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class PerformanceHelper {
        constructor() {
            this.logPerformance = true;
        }
        measureAction(actionName, donePromiseOrAction) {
            var actionMeasurement = new PerformanceHelper.ActionMeasurement(this, actionName, performance.now());
            if (typeof donePromiseOrAction === "function") {
                try {
                    var result = donePromiseOrAction();
                    this.actionDone(actionMeasurement, false);
                    return result;
                }
                catch (e) {
                    this.actionDone(actionMeasurement, true);
                    throw e;
                }
            }
            else if (donePromiseOrAction)
                return actionMeasurement.done(donePromiseOrAction);
            else
                return actionMeasurement;
        }
        actionDone(action, failed) {
            if (!this.logPerformance)
                return;
            console.info(`[performance/${dateFormat(new Date(), "ss.l")}] ${action.name} took `
                + `${Math.round(performance.now() - action.startTime)} milliseconds${failed ? " before it failed" : ""}.`);
        }
    }
    (function (PerformanceHelper) {
        class ActionMeasurement {
            constructor(ph, name, startTime) {
                this.ph = ph;
                this.name = name;
                this.startTime = startTime;
            }
            done(promise, failed) {
                if (!promise)
                    this.ph.actionDone(this);
                else
                    return promise.then(x => { this.ph.actionDone(this, false); return x; }, x => { this.ph.actionDone(this, true); return Promise.reject(x); });
            }
        }
        PerformanceHelper.ActionMeasurement = ActionMeasurement;
    })(PerformanceHelper || (PerformanceHelper = {}));
    exports.performanceHelper = new PerformanceHelper();
});
