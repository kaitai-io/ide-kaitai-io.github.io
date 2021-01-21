var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "vue", "big-integer", "../Component", "dateformat"], function (require, exports, Vue, bigInt, Component_1, dateFormat) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Converter {
        static numConv(data, len, signed, bigEndian) {
            if (len > data.length)
                return "";
            var arr = data.slice(0, len);
            if (!bigEndian)
                arr = arr.reverse();
            var num = bigInt(0);
            for (var i = 0; i < arr.length; i++)
                num = num.multiply(256).add(arr[i]);
            if (signed) {
                var maxVal = bigInt(256).pow(len);
                if (num.greaterOrEquals(maxVal.divide(2)))
                    num = maxVal.minus(num).negate();
            }
            //console.log("numConv", arr, len, signed ? "signed" : "unsigned", bigEndian ? "big-endian" : "little-endian", num, typeof num);
            return num.toString();
        }
        static strDecode(data, enc) {
            var str = new TextDecoder(enc).decode(data);
            for (var i = 0; i < str.length; i++)
                if (str[i] === "\0")
                    return str.substring(0, i);
            return str + "...";
        }
    }
    exports.Converter = Converter;
    class ConverterPanelModel {
        constructor() {
            this.i8 = "";
            this.i16le = "";
            this.i32le = "";
            this.i64le = "";
            this.i16be = "";
            this.i32be = "";
            this.i64be = "";
            this.float = "";
            this.double = "";
            this.unixts = "";
            this.ascii = "";
            this.utf8 = "";
            this.utf16le = "";
            this.utf16be = "";
        }
        update(dataProvider, offset) {
            if (!dataProvider || offset === -1) {
                Object.keys(this).forEach(x => this[x] = "");
                return;
            }
            var data = dataProvider.get(offset, Math.min(dataProvider.length - offset, 64)).slice(0);
            for (const len of [1, 2, 4, 8])
                for (const signed of [false, true])
                    for (const bigEndian of [false, true]) {
                        var convRes = Converter.numConv(data, len, signed, bigEndian);
                        var propName = `${signed ? "s" : "u"}${len * 8}${len === 1 ? "" : bigEndian ? "be" : "le"}`;
                        this[propName] = convRes;
                    }
            this.float = data.length >= 4 ? "" + new Float32Array(data.buffer.slice(0, 4))[0] : "";
            this.double = data.length >= 8 ? "" + new Float64Array(data.buffer.slice(0, 8))[0] : "";
            var u32le = Converter.numConv(data, 4, false, false);
            this.unixts = u32le ? dateFormat(new Date(parseInt(u32le) * 1000), "yyyy-mm-dd HH:MM:ss") : "";
            try {
                this.ascii = Converter.strDecode(data, "ascii");
                this.utf8 = Converter.strDecode(data, "utf-8");
                this.utf16le = Converter.strDecode(data, "utf-16le");
                this.utf16be = Converter.strDecode(data, "utf-16be");
            }
            catch (e) {
                console.log("refreshConverterPanel str", e);
            }
        }
    }
    exports.ConverterPanelModel = ConverterPanelModel;
    let ConverterPanel = class ConverterPanel extends Vue {
        constructor() {
            super();
            this.model = this.model || new ConverterPanelModel();
        }
    };
    ConverterPanel = __decorate([
        Component_1.default
    ], ConverterPanel);
    exports.ConverterPanel = ConverterPanel;
});
