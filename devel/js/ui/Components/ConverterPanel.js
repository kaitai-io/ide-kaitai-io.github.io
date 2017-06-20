System.register(["vue", "bigInt", "../Component"], function (exports_1, context_1) {
    "use strict";
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __moduleName = context_1 && context_1.id;
    var Vue, bigInt, Component_1, Converter, ConverterPanelModel, ConverterPanel;
    return {
        setters: [
            function (Vue_1) {
                Vue = Vue_1;
            },
            function (bigInt_1) {
                bigInt = bigInt_1;
            },
            function (Component_1_1) {
                Component_1 = Component_1_1;
            }
        ],
        execute: function () {
            Converter = class Converter {
                static numConv(data, len, signed, bigEndian) {
                    if (len > data.length)
                        return "";
                    var arr = data.subarray(0, len);
                    var num = bigInt(0);
                    if (bigEndian)
                        for (var i = 0; i < arr.length; i++)
                            num = num.multiply(256).add(arr[i]);
                    else
                        for (var i = arr.length - 1; i >= 0; i--)
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
            };
            exports_1("Converter", Converter);
            ConverterPanelModel = class ConverterPanelModel {
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
                    [1, 2, 4, 8].forEach(len => [false, true].forEach(signed => [false, true].forEach(bigEndian => {
                        var convRes = Converter.numConv(data, len, signed, bigEndian);
                        var propName = `${signed ? "s" : "u"}${len * 8}${len === 1 ? "" : bigEndian ? "be" : "le"}`;
                        this[propName] = convRes;
                    })));
                    var u32le = Converter.numConv(data, 4, false, false);
                    var unixtsDate = new Date(parseInt(u32le) * 1000);
                    this.float = data.length >= 4 ? "" + new Float32Array(data.buffer.slice(0, 4))[0] : "";
                    this.double = data.length >= 8 ? "" + new Float64Array(data.buffer.slice(0, 8))[0] : "";
                    this.unixts = unixtsDate.format("Y-m-d H:i:s");
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
            };
            exports_1("ConverterPanelModel", ConverterPanelModel);
            ConverterPanel = class ConverterPanel extends Vue {
            };
            ConverterPanel = __decorate([
                Component_1.default
            ], ConverterPanel);
            exports_1("ConverterPanel", ConverterPanel);
        }
    };
});
//# sourceMappingURL=ConverterPanel.js.map