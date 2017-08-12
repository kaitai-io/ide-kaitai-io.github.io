define(["require", "exports", "./utils/IntervalHelper", "worker/WorkerShared"], function (require, exports, IntervalHelper_1, WorkerShared_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ParsedMap {
        constructor() {
            this.intervalHandler = new IntervalHelper_1.IntervalHandler();
            this.unparsed = [];
            this.byteArrays = [];
        }
        static collectAllObjects(root) {
            var objects = [];
            function process(value) {
                objects.push(value);
                if (value.type === WorkerShared_1.ObjectType.Object)
                    Object.keys(value.object.fields).forEach(fieldName => process(value.object.fields[fieldName]));
                else if (value.type === WorkerShared_1.ObjectType.Array && !value.isLazyArray)
                    value.arrayItems.forEach(arrItem => process(arrItem));
            }
            process(root);
            return objects;
        }
        recalculateUnusedParts() {
            // TODO: optimize this, not to recalculate all the parts
            let lastEnd = -1;
            const unparsed = [];
            for (var i of this.intervalHandler.sortedItems) {
                if (i.start !== lastEnd + 1)
                    unparsed.push({ start: lastEnd + 1, end: i.start - 1 });
                lastEnd = i.end;
            }
            this.unparsed = unparsed;
        }
        addObjects(objects) {
            var allObjects = [].concat.apply([], objects.map(x => ParsedMap.collectAllObjects(x)));
            const newIntervals = [];
            var lastEnd = -1;
            for (let exp of allObjects) {
                if (!(exp.type === WorkerShared_1.ObjectType.Primitive || exp.type === WorkerShared_1.ObjectType.TypedArray))
                    continue;
                var start = exp.ioOffset + exp.start;
                var end = exp.ioOffset + exp.end - 1;
                if (start <= lastEnd || start > end)
                    continue;
                lastEnd = end;
                newIntervals.push({ start: start, end: end, exp: exp });
            }
            if (this.intervalHandler.sortedItems.length + newIntervals.length > 400000) {
                console.warn("Too many items for interval tree: " + this.intervalHandler.sortedItems.length);
                return;
            }
            else
                this.intervalHandler.addSorted(newIntervals);
            this.byteArrays.push(...allObjects.filter(exp => exp.type === WorkerShared_1.ObjectType.TypedArray && exp.bytes.length > 64).
                map(exp => ({ start: exp.ioOffset + exp.start, end: exp.ioOffset + exp.end - 1 })));
            this.recalculateUnusedParts();
        }
    }
    exports.ParsedMap = ParsedMap;
});
//# sourceMappingURL=ParsedMap.js.map