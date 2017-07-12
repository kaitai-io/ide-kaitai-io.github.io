define(["require", "exports", "./utils/IntervalHelper", "worker/WorkerShared"], function (require, exports, IntervalHelper_1, WorkerShared_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ParsedMap {
        constructor(root) {
            this.root = root;
            this.intervalHandler = new IntervalHelper_1.IntervalHandler();
            this.intervals = [];
            this.fillIntervals(root);
        }
        static collectAllObjects(root) {
            var objects = [];
            function process(value) {
                objects.push(value);
                if (value.type === WorkerShared_1.ObjectType.Object)
                    Object.keys(value.object.fields).forEach(fieldName => process(value.object.fields[fieldName]));
                else if (value.type === WorkerShared_1.ObjectType.Array)
                    value.arrayItems.forEach(arrItem => process(arrItem));
            }
            process(root);
            return objects;
        }
        fillIntervals(value) {
            var isInstance = false; // TODO
            var objects = ParsedMap.collectAllObjects(value);
            var lastEnd = -1;
            for (let exp of objects) {
                if (!(exp.type === WorkerShared_1.ObjectType.Primitive || exp.type === WorkerShared_1.ObjectType.TypedArray))
                    continue;
                var start = exp.ioOffset + exp.start;
                var end = exp.ioOffset + exp.end - 1;
                if (start <= lastEnd || start > end)
                    continue;
                lastEnd = end;
                this.intervals.push({ start: start, end: end, exp: exp });
            }
            if (!isInstance) {
                var unparsed = [];
                lastEnd = -1;
                for (var i of this.intervals) {
                    if (i.start !== lastEnd + 1)
                        unparsed.push({ start: lastEnd + 1, end: i.start - 1 });
                    lastEnd = i.end;
                }
                this.unparsed = unparsed;
                this.byteArrays = objects.filter(exp => exp.type === WorkerShared_1.ObjectType.TypedArray && exp.bytes.length > 64).
                    map(exp => ({ start: exp.ioOffset + exp.start, end: exp.ioOffset + exp.end - 1 }));
            }
            if (this.intervals.length > 400000)
                console.warn("Too many items for interval tree: " + this.intervals.length);
            else
                this.intervalHandler.addSorted(this.intervals);
        }
    }
    exports.ParsedMap = ParsedMap;
});
//# sourceMappingURL=ParsedMap.js.map