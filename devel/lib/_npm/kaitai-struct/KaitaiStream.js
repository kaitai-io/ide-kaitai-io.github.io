(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.KaitaiStream = factory());
})(this, (function () { 'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    // -*- mode: js; js-indent-level: 2; -*-
    /**
     * KaitaiStream is an implementation of Kaitai Struct API for JavaScript.
     * Based on DataStream - https://github.com/kig/DataStream.js .
     */
    var KaitaiStream = /** @class */ (function () {
        /**
         * @param arrayBuffer ArrayBuffer to read from.
         * @param byteOffset Offset from arrayBuffer beginning for the KaitaiStream.
         */
        function KaitaiStream(arrayBuffer, byteOffset) {
            /**
             * Virtual byte length of the KaitaiStream backing buffer.
             * Updated to be max of original buffer size and last written size.
             * If dynamicSize is false is set to buffer size.
             */
            this._byteLength = 0;
            this._byteOffset = 0;
            this.bits = 0;
            this.bitsLeft = 0;
            this._byteOffset = byteOffset || 0;
            if (arrayBuffer instanceof ArrayBuffer) {
                this.buffer = arrayBuffer;
            }
            else if (typeof arrayBuffer == "object") {
                this.dataView = arrayBuffer;
                if (byteOffset) {
                    this._byteOffset += byteOffset;
                }
            }
            else {
                this.buffer = new ArrayBuffer(arrayBuffer || 1);
            }
            this.pos = 0;
            this.alignToByte();
        }
        Object.defineProperty(KaitaiStream.prototype, "buffer", {
            /**
             * Gets the backing ArrayBuffer of the KaitaiStream object.
             *
             * @returns The backing ArrayBuffer.
             */
            get: function () {
                this._trimAlloc();
                return this._buffer;
            },
            /**
             * Sets the backing ArrayBuffer of the KaitaiStream object and updates the
             * DataView to point to the new buffer.
             */
            set: function (v) {
                this._buffer = v;
                this._dataView = new DataView(this._buffer, this._byteOffset);
                this._byteLength = this._buffer.byteLength;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(KaitaiStream.prototype, "byteOffset", {
            /**
             * Gets the byteOffset of the KaitaiStream object.
             *
             * @returns The byteOffset.
             */
            get: function () {
                return this._byteOffset;
            },
            /**
             * Sets the byteOffset of the KaitaiStream object and updates the DataView to
             * point to the new byteOffset.
             */
            set: function (v) {
                this._byteOffset = v;
                this._dataView = new DataView(this._buffer, this._byteOffset);
                this._byteLength = this._buffer.byteLength;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(KaitaiStream.prototype, "dataView", {
            /**
             * Gets the backing DataView of the KaitaiStream object.
             *
             * @returns The backing DataView.
             */
            get: function () {
                return this._dataView;
            },
            /**
             * Sets the backing DataView of the KaitaiStream object and updates the buffer
             * and byteOffset to point to the DataView values.
             */
            set: function (v) {
                this._byteOffset = v.byteOffset;
                this._buffer = v.buffer;
                this._dataView = new DataView(this._buffer, this._byteOffset);
                this._byteLength = this._byteOffset + v.byteLength;
            },
            enumerable: false,
            configurable: true
        });
        /**
         * Internal function to trim the KaitaiStream buffer when required.
         * Used for stripping out the extra bytes from the backing buffer when
         * the virtual byteLength is smaller than the buffer byteLength (happens after
         * growing the buffer with writes and not filling the extra space completely).
         */
        KaitaiStream.prototype._trimAlloc = function () {
            if (this._byteLength === this._buffer.byteLength) {
                return;
            }
            var buf = new ArrayBuffer(this._byteLength);
            var dst = new Uint8Array(buf);
            var src = new Uint8Array(this._buffer, 0, dst.length);
            dst.set(src);
            this.buffer = buf;
        };
        // ========================================================================
        // Stream positioning
        // ========================================================================
        /**
         * Returns true if the KaitaiStream seek pointer is at the end of buffer and
         * there's no more data to read.
         *
         * @returns True if the seek pointer is at the end of the buffer.
         */
        KaitaiStream.prototype.isEof = function () {
            return this.pos >= this.size && this.bitsLeft === 0;
        };
        /**
         * Sets the KaitaiStream read/write position to given position.
         * Clamps between 0 and KaitaiStream length.
         *
         * @param pos Position to seek to.
         */
        KaitaiStream.prototype.seek = function (pos) {
            var npos = Math.max(0, Math.min(this.size, pos));
            this.pos = (isNaN(npos) || !isFinite(npos)) ? 0 : npos;
        };
        Object.defineProperty(KaitaiStream.prototype, "size", {
            /**
             * Returns the byte length of the KaitaiStream object.
             *
             * @returns The byte length.
             */
            get: function () {
                return this._byteLength - this._byteOffset;
            },
            enumerable: false,
            configurable: true
        });
        // ========================================================================
        // Integer numbers
        // ========================================================================
        // ------------------------------------------------------------------------
        // Signed
        // ------------------------------------------------------------------------
        /**
         * Reads an 8-bit signed int from the stream.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readS1 = function () {
            this.ensureBytesLeft(1);
            var v = this._dataView.getInt8(this.pos);
            this.pos += 1;
            return v;
        };
        // ........................................................................
        // Big-endian
        // ........................................................................
        /**
         * Reads a 16-bit big-endian signed int from the stream.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readS2be = function () {
            this.ensureBytesLeft(2);
            var v = this._dataView.getInt16(this.pos);
            this.pos += 2;
            return v;
        };
        /**
         * Reads a 32-bit big-endian signed int from the stream.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readS4be = function () {
            this.ensureBytesLeft(4);
            var v = this._dataView.getInt32(this.pos);
            this.pos += 4;
            return v;
        };
        /**
         * Reads a 64-bit big-endian unsigned int from the stream. Note that
         * JavaScript does not support 64-bit integers natively, so it will
         * automatically upgrade internal representation to use IEEE 754
         * double precision float.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readS8be = function () {
            this.ensureBytesLeft(8);
            var v1 = this.readU4be();
            var v2 = this.readU4be();
            if ((v1 & 0x80000000) !== 0) {
                // negative number
                return -(0x100000000 * (v1 ^ 0xffffffff) + (v2 ^ 0xffffffff)) - 1;
            }
            else {
                return 0x100000000 * v1 + v2;
            }
        };
        // ........................................................................
        // Little-endian
        // ........................................................................
        /**
         * Reads a 16-bit little-endian signed int from the stream.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readS2le = function () {
            this.ensureBytesLeft(2);
            var v = this._dataView.getInt16(this.pos, true);
            this.pos += 2;
            return v;
        };
        /**
         * Reads a 32-bit little-endian signed int from the stream.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readS4le = function () {
            this.ensureBytesLeft(4);
            var v = this._dataView.getInt32(this.pos, true);
            this.pos += 4;
            return v;
        };
        /**
         * Reads a 64-bit little-endian unsigned int from the stream. Note that
         * JavaScript does not support 64-bit integers natively, so it will
         * automatically upgrade internal representation to use IEEE 754
         * double precision float.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readS8le = function () {
            this.ensureBytesLeft(8);
            var v1 = this.readU4le();
            var v2 = this.readU4le();
            if ((v2 & 0x80000000) !== 0) {
                // negative number
                return -(0x100000000 * (v2 ^ 0xffffffff) + (v1 ^ 0xffffffff)) - 1;
            }
            else {
                return 0x100000000 * v2 + v1;
            }
        };
        // ------------------------------------------------------------------------
        // Unsigned
        // ------------------------------------------------------------------------
        /**
         * Reads an 8-bit unsigned int from the stream.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readU1 = function () {
            this.ensureBytesLeft(1);
            var v = this._dataView.getUint8(this.pos);
            this.pos += 1;
            return v;
        };
        // ........................................................................
        // Big-endian
        // ........................................................................
        /**
         * Reads a 16-bit big-endian unsigned int from the stream.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readU2be = function () {
            this.ensureBytesLeft(2);
            var v = this._dataView.getUint16(this.pos);
            this.pos += 2;
            return v;
        };
        /**
         * Reads a 32-bit big-endian unsigned int from the stream.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readU4be = function () {
            this.ensureBytesLeft(4);
            var v = this._dataView.getUint32(this.pos);
            this.pos += 4;
            return v;
        };
        /**
         * Reads a 64-bit big-endian unsigned int from the stream. Note that
         * JavaScript does not support 64-bit integers natively, so it will
         * automatically upgrade internal representation to use IEEE 754
         * double precision float.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readU8be = function () {
            this.ensureBytesLeft(8);
            var v1 = this.readU4be();
            var v2 = this.readU4be();
            return 0x100000000 * v1 + v2;
        };
        // ........................................................................
        // Little-endian
        // ........................................................................
        /**
         * Reads a 16-bit little-endian unsigned int from the stream.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readU2le = function () {
            this.ensureBytesLeft(2);
            var v = this._dataView.getUint16(this.pos, true);
            this.pos += 2;
            return v;
        };
        /**
         * Reads a 32-bit little-endian unsigned int from the stream.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readU4le = function () {
            this.ensureBytesLeft(4);
            var v = this._dataView.getUint32(this.pos, true);
            this.pos += 4;
            return v;
        };
        /**
         * Reads a 64-bit little-endian unsigned int from the stream. Note that
         * JavaScript does not support 64-bit integers natively, so it will
         * automatically upgrade internal representation to use IEEE 754
         * double precision float.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readU8le = function () {
            this.ensureBytesLeft(8);
            var v1 = this.readU4le();
            var v2 = this.readU4le();
            return 0x100000000 * v2 + v1;
        };
        // ========================================================================
        // Floating point numbers
        // ========================================================================
        // ------------------------------------------------------------------------
        // Big endian
        // ------------------------------------------------------------------------
        /**
         * Reads a 32-bit big-endian float from the stream.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readF4be = function () {
            this.ensureBytesLeft(4);
            var v = this._dataView.getFloat32(this.pos);
            this.pos += 4;
            return v;
        };
        /**
         * Reads a 64-bit big-endian float from the stream.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readF8be = function () {
            this.ensureBytesLeft(8);
            var v = this._dataView.getFloat64(this.pos);
            this.pos += 8;
            return v;
        };
        // ------------------------------------------------------------------------
        // Little endian
        // ------------------------------------------------------------------------
        /**
         * Reads a 32-bit little-endian float from the stream.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readF4le = function () {
            this.ensureBytesLeft(4);
            var v = this._dataView.getFloat32(this.pos, true);
            this.pos += 4;
            return v;
        };
        /**
         * Reads a 64-bit little-endian float from the stream.
         *
         * @returns The read number.
         */
        KaitaiStream.prototype.readF8le = function () {
            this.ensureBytesLeft(8);
            var v = this._dataView.getFloat64(this.pos, true);
            this.pos += 8;
            return v;
        };
        // ------------------------------------------------------------------------
        // Unaligned bit values
        // ------------------------------------------------------------------------
        /**
         * Aligns the stream position to the next byte boundary.
         */
        KaitaiStream.prototype.alignToByte = function () {
            this.bitsLeft = 0;
            this.bits = 0;
        };
        /**
         * @param n The number of bits to read.
         * @returns The read bits.
         * @throws {RangeError}
         */
        KaitaiStream.prototype.readBitsIntBe = function (n) {
            // JS only supports bit operations on 32 bits
            if (n > 32) {
                throw new RangeError("readBitsIntBe: the maximum supported bit length is 32 (tried to read " + n + " bits)");
            }
            var res = 0;
            var bitsNeeded = n - this.bitsLeft;
            this.bitsLeft = -bitsNeeded & 7; // `-bitsNeeded mod 8`
            if (bitsNeeded > 0) {
                // 1 bit  => 1 byte
                // 8 bits => 1 byte
                // 9 bits => 2 bytes
                var bytesNeeded = ((bitsNeeded - 1) >> 3) + 1; // `ceil(bitsNeeded / 8)` (NB: `x >> 3` is `floor(x / 8)`)
                var buf = this.readBytes(bytesNeeded);
                for (var i = 0; i < bytesNeeded; i++) {
                    res = res << 8 | buf[i];
                }
                var newBits = res;
                res = res >>> this.bitsLeft | this.bits << bitsNeeded; // `x << 32` is defined as `x << 0` in JS, but only `0 << 32`
                // can occur here (`n = 32` and `bitsLeft = 0`, this implies
                // `bits = 0` unless changed externally)
                this.bits = newBits; // will be masked at the end of the function
            }
            else {
                res = this.bits >>> -bitsNeeded; // shift unneeded bits out
            }
            var mask = (1 << this.bitsLeft) - 1; // `bitsLeft` is in range 0..7, so `(1 << 32)` does not have to be considered
            this.bits &= mask;
            // always return an unsigned 32-bit integer
            return res >>> 0;
        };
        /**
         * Unused since Kaitai Struct Compiler v0.9+ - compatibility with older versions.
         *
         * @deprecated Use {@link readBitsIntBe} instead.
         * @param n The number of bits to read.
         * @returns The read bits.
         */
        KaitaiStream.prototype.readBitsInt = function (n) {
            return this.readBitsIntBe(n);
        };
        /**
         * @param n The number of bits to read.
         * @returns The read bits.
         * @throws {RangeError}
         */
        KaitaiStream.prototype.readBitsIntLe = function (n) {
            // JS only supports bit operations on 32 bits
            if (n > 32) {
                throw new RangeError("readBitsIntLe: the maximum supported bit length is 32 (tried to read " + n + " bits)");
            }
            var res = 0;
            var bitsNeeded = n - this.bitsLeft;
            if (bitsNeeded > 0) {
                // 1 bit  => 1 byte
                // 8 bits => 1 byte
                // 9 bits => 2 bytes
                var bytesNeeded = ((bitsNeeded - 1) >> 3) + 1; // `ceil(bitsNeeded / 8)` (NB: `x >> 3` is `floor(x / 8)`)
                var buf = this.readBytes(bytesNeeded);
                for (var i = 0; i < bytesNeeded; i++) {
                    res |= buf[i] << (i * 8);
                }
                // NB: in JavaScript, bit shift operators always shift by modulo 32 of the right-hand operand (see
                // https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#sec-numeric-types-number-unsignedRightShift),
                // so `res >>> 32` is equivalent to `res >>> 0` (but we don't want that)
                var newBits = bitsNeeded < 32 ? res >>> bitsNeeded : 0;
                res = res << this.bitsLeft | this.bits;
                this.bits = newBits;
            }
            else {
                res = this.bits;
                this.bits >>>= n;
            }
            this.bitsLeft = -bitsNeeded & 7; // `-bitsNeeded mod 8`
            // always return an unsigned 32-bit integer
            if (n < 32) {
                var mask = (1 << n) - 1;
                res &= mask; // this produces a signed 32-bit int, but the sign bit is cleared
            }
            else {
                res >>>= 0;
            }
            return res;
        };
        // ========================================================================
        // Byte arrays
        // ========================================================================
        /**
         * @param len The number of bytes to read.
         * @returns The read bytes.
         */
        KaitaiStream.prototype.readBytes = function (len) {
            return this.mapUint8Array(len);
        };
        /**
         * @returns The read bytes.
         */
        KaitaiStream.prototype.readBytesFull = function () {
            return this.mapUint8Array(this.size - this.pos);
        };
        /**
         * Reads bytes until the terminator byte is found.
         *
         * @param terminator The terminator byte.
         * @param include True if the terminator should be included with the returned bytes.
         * @param consume True if the terminator should be consumed from the input stream.
         * @param eosError True to throw an error if the end of stream is reached.
         * @returns The read bytes.
         * @throws {string}
         */
        KaitaiStream.prototype.readBytesTerm = function (terminator, include, consume, eosError) {
            var blen = this.size - this.pos;
            var u8 = new Uint8Array(this._buffer, this._byteOffset + this.pos);
            var i;
            for (i = 0; i < blen && u8[i] !== terminator; i++)
                ; // find first zero byte
            if (i === blen) {
                // we've read all the buffer and haven't found the terminator
                if (eosError) {
                    throw new Error("End of stream reached, but no terminator " + terminator + " found");
                }
                else {
                    return this.mapUint8Array(i);
                }
            }
            else {
                var arr = void 0;
                if (include) {
                    arr = this.mapUint8Array(i + 1);
                }
                else {
                    arr = this.mapUint8Array(i);
                }
                if (consume) {
                    this.pos += 1;
                }
                return arr;
            }
        };
        /**
         * Reads bytes until the terminator byte sequence is found.
         *
         * @param terminator The terminator byte sequence.
         * @param include True if the terminator should be included with the returned bytes.
         * @param consume True if the terminator should be consumed from the input stream.
         * @param eosError True to throw an error if the end of stream is reached.
         * @returns The read bytes.
         * @throws {string}
         */
        KaitaiStream.prototype.readBytesTermMulti = function (terminator, include, consume, eosError) {
            var unitSize = terminator.length;
            var data = new Uint8Array(this._buffer, this._byteOffset + this.pos, this.size - this.pos);
            var res = KaitaiStream.bytesTerminateMulti(data, terminator, true);
            this.pos += res.length;
            var termFound = res.length !== 0 &&
                res.length % unitSize === 0 &&
                KaitaiStream.byteArrayCompare(new Uint8Array(res.buffer, res.length - unitSize), terminator) === 0;
            if (termFound) {
                if (!include) {
                    res = new Uint8Array(res.buffer, res.byteOffset, res.length - unitSize);
                }
                if (!consume) {
                    this.pos -= unitSize;
                }
            }
            else if (eosError) {
                throw new Error("End of stream reached, but no terminator " + terminator + " found");
            }
            return res;
        };
        /**
         * Unused since Kaitai Struct Compiler v0.9+ - compatibility with older versions.
         *
         * @param expected The expected bytes.
         * @returns The read bytes.
         * @throws {KaitaiStream.UnexpectedDataError}
         */
        KaitaiStream.prototype.ensureFixedContents = function (expected) {
            var actual = this.readBytes(expected.length);
            if (actual.length !== expected.length) {
                throw new KaitaiStream.UnexpectedDataError(expected, actual);
            }
            var actLen = actual.length;
            for (var i = 0; i < actLen; i++) {
                if (actual[i] !== expected[i]) {
                    throw new KaitaiStream.UnexpectedDataError(expected, actual);
                }
            }
            return actual;
        };
        /**
         * @param data The data.
         * @param padByte The byte to strip.
         * @returns The stripped data.
         */
        KaitaiStream.bytesStripRight = function (data, padByte) {
            var newLen = data.length;
            while (data[newLen - 1] === padByte) {
                newLen--;
            }
            return data.slice(0, newLen);
        };
        /**
         * @param data The data.
         * @param term The terminator.
         * @param include True if the returned bytes should include the terminator.
         * @returns The terminated bytes.
         */
        KaitaiStream.bytesTerminate = function (data, term, include) {
            var newLen = 0;
            var maxLen = data.length;
            while (newLen < maxLen && data[newLen] !== term) {
                newLen++;
            }
            if (include && newLen < maxLen)
                newLen++;
            return data.slice(0, newLen);
        };
        /**
         * @param data The data.
         * @param term The terminator.
         * @param include True if the returned bytes should include the terminator.
         * @returns The terminated bytes.
         */
        KaitaiStream.bytesTerminateMulti = function (data, term, include) {
            var unitSize = term.length;
            if (unitSize === 0) {
                return new Uint8Array();
            }
            var len = data.length;
            var iTerm = 0;
            for (var iData = 0; iData < len;) {
                if (data[iData] !== term[iTerm]) {
                    iData += unitSize - iTerm;
                    iTerm = 0;
                    continue;
                }
                iData++;
                iTerm++;
                if (iTerm === unitSize) {
                    return data.slice(0, iData - (include ? 0 : unitSize));
                }
            }
            return data.slice();
        };
        /**
         * @param arr The bytes.
         * @param encoding The character encoding.
         * @returns The decoded string.
         */
        KaitaiStream.bytesToStr = function (arr, encoding) {
            if (encoding == null || encoding.toLowerCase() === "ascii") {
                return KaitaiStream.createStringFromArray(arr);
            }
            else {
                if (typeof TextDecoder === 'function') {
                    // we're in a browser that supports TextDecoder, or in Node.js 11 or later
                    return (new TextDecoder(encoding)).decode(arr);
                }
                else {
                    // probably we're in Node.js < 11
                    // check if it's supported natively by Node.js Buffer
                    // see https://nodejs.org/docs/latest-v10.x/api/buffer.html#buffer_buffers_and_character_encodings
                    switch (encoding.toLowerCase()) {
                        case 'utf8':
                        case 'utf-8':
                        case 'ucs2':
                        case 'ucs-2':
                        case 'utf16le':
                        case 'utf-16le':
                            return Buffer.from(arr).toString(encoding);
                        default:
                            // unsupported encoding, we'll have to resort to iconv-lite
                            if (typeof KaitaiStream.iconvlite === 'undefined')
                                KaitaiStream.iconvlite = require('iconv-lite');
                            return KaitaiStream.iconvlite.decode(arr, encoding);
                    }
                }
            }
        };
        // ========================================================================
        // Byte array processing
        // ========================================================================
        /**
         * @param data The input bytes.
         * @param key The key byte.
         * @returns The Xor'd bytes.
         */
        KaitaiStream.processXorOne = function (data, key) {
            var r = new Uint8Array(data.length);
            var dl = data.length;
            for (var i = 0; i < dl; i++)
                r[i] = data[i] ^ key;
            return r;
        };
        /**
         * @param data The input bytes.
         * @param key The key bytes.
         * @returns The Xor'd bytes.
         */
        KaitaiStream.processXorMany = function (data, key) {
            var dl = data.length;
            var r = new Uint8Array(dl);
            var kl = key.length;
            var ki = 0;
            for (var i = 0; i < dl; i++) {
                r[i] = data[i] ^ key[ki];
                ki++;
                if (ki >= kl)
                    ki = 0;
            }
            return r;
        };
        /**
         * @param data The input bytes.
         * @param amount The shift amount in bits.
         * @param groupSize The number of bytes in each group.
         * @returns The rotated bytes.
         * @throws {string}
         */
        KaitaiStream.processRotateLeft = function (data, amount, groupSize) {
            if (groupSize !== 1)
                throw new RangeError("unable to rotate group of " + groupSize + " bytes yet");
            var mask = groupSize * 8 - 1;
            var antiAmount = -amount & mask;
            var r = new Uint8Array(data.length);
            for (var i = 0; i < data.length; i++)
                r[i] = (data[i] << amount) & 0xff | (data[i] >> antiAmount);
            return r;
        };
        /**
         * @param buf The input bytes.
         * @returns The uncompressed bytes.
         */
        KaitaiStream.processZlib = function (buf) {
            if (typeof require !== 'undefined') {
                // require is available - we're running under node
                if (typeof KaitaiStream.zlib === 'undefined')
                    KaitaiStream.zlib = require('zlib');
                // use node's zlib module API
                var r = KaitaiStream.zlib.inflateSync(Buffer.from(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
                return new Uint8Array(r.buffer, r.byteOffset, r.length);
            }
            else {
                // no require() - assume we're running as a web worker in browser.
                // user should have configured KaitaiStream.depUrls.zlib, if not
                // we'll throw.
                if (typeof KaitaiStream.zlib === 'undefined'
                    && typeof KaitaiStream.depUrls.zlib !== 'undefined') {
                    importScripts(KaitaiStream.depUrls.zlib);
                    KaitaiStream.zlib = pako;
                }
                // use pako API
                return KaitaiStream.zlib.inflate(buf);
            }
        };
        // ========================================================================
        // Misc runtime operations
        // ========================================================================
        /**
         * @param a The dividend.
         * @param b The divisor.
         * @returns The result of `a` mod `b`.
         * @throws {string}
         */
        KaitaiStream.mod = function (a, b) {
            if (b <= 0)
                throw new RangeError("mod divisor <= 0");
            var r = a % b;
            if (r < 0)
                r += b;
            return r;
        };
        /**
         * Gets the smallest value in an array.
         *
         * @param arr The input array.
         * @returns The smallest value.
         */
        KaitaiStream.arrayMin = function (arr) {
            var min = arr[0];
            var x;
            for (var i = 1, n = arr.length; i < n; ++i) {
                x = arr[i];
                if (x < min)
                    min = x;
            }
            return min;
        };
        /**
         * Gets the largest value in an array.
         *
         * @param arr The input array.
         * @returns The largest value.
         */
        KaitaiStream.arrayMax = function (arr) {
            var max = arr[0];
            var x;
            for (var i = 1, n = arr.length; i < n; ++i) {
                x = arr[i];
                if (x > max)
                    max = x;
            }
            return max;
        };
        /**
         * Compares two arrays of bytes from left to right.
         *
         * @param a The first array.
         * @param b The second array.
         * @returns `0` if the arrays are the equal, a positive number if `a` is greater than `b`, or a negative number if `a` is less than `b`.
         */
        KaitaiStream.byteArrayCompare = function (a, b) {
            if (a === b)
                return 0;
            var al = a.length;
            var bl = b.length;
            var minLen = al < bl ? al : bl;
            for (var i = 0; i < minLen; i++) {
                var cmp = a[i] - b[i];
                if (cmp !== 0)
                    return cmp;
            }
            // Reached the end of at least one of the arrays
            if (al === bl) {
                return 0;
            }
            else {
                return al - bl;
            }
        };
        /**
         * Ensures that we have at least `length` bytes left in the stream.
         * If not, throws an EOFError.
         *
         * @param length Number of bytes to require.
         * @throws {KaitaiStream.EOFError}
         */
        KaitaiStream.prototype.ensureBytesLeft = function (length) {
            if (this.pos + length > this.size) {
                throw new KaitaiStream.EOFError(length, this.size - this.pos);
            }
        };
        /**
         * Maps a Uint8Array into the KaitaiStream buffer.
         * Nice for quickly reading in data.
         *
         * @param length Number of elements to map.
         * @returns A Uint8Array to the KaitaiStream backing buffer.
         */
        KaitaiStream.prototype.mapUint8Array = function (length) {
            length |= 0;
            this.ensureBytesLeft(length);
            var arr = new Uint8Array(this._buffer, this.byteOffset + this.pos, length);
            this.pos += length;
            return arr;
        };
        /**
         * Creates an array from an array of character codes.
         * Uses String.fromCharCode in chunks for memory efficiency and then concatenates
         * the resulting string chunks.
         *
         * @param array Array of character codes.
         * @returns String created from the character codes.
         */
        KaitaiStream.createStringFromArray = function (array) {
            var chunk_size = 0x8000;
            var chunks = [];
            for (var i = 0; i < array.length; i += chunk_size) {
                var chunk = array.subarray(i, i + chunk_size);
                chunks.push(String.fromCharCode.apply(null, chunk));
            }
            return chunks.join("");
        };
        /**
         * Dependency configuration data. Holds urls for (optional) dynamic loading
         * of code dependencies from a remote server. For use by (static) processing functions.
         *
         * Caller should the supported keys to the asset urls as needed.
         * NOTE: `depUrls` is a static property of KaitaiStream (the factory), like the various
         * processing functions. It is NOT part of the prototype of instances.
         */
        KaitaiStream.depUrls = {
            // processZlib uses this and expected a link to a copy of pako.
            // specifically the pako_inflate.min.js script at:
            // https://raw.githubusercontent.com/nodeca/pako/master/dist/pako_inflate.min.js
            zlib: undefined
        };
        /**
         * Native endianness. Either KaitaiStream.BIG_ENDIAN or KaitaiStream.LITTLE_ENDIAN
         * depending on the platform endianness.
         */
        KaitaiStream.endianness = new Int8Array(new Int16Array([1]).buffer)[0] > 0;
        // ========================================================================
        // Internal implementation details
        // ========================================================================
        KaitaiStream.EOFError = /** @class */ (function (_super) {
            __extends(EOFError, _super);
            /**
             * @param bytesReq The number of bytes requested.
             * @param bytesAvail The number of bytes available.
             */
            function EOFError(bytesReq, bytesAvail) {
                var _this = _super.call(this, "requested " + bytesReq + " bytes, but only " + bytesAvail + " bytes available") || this;
                _this.name = "EOFError";
                // Workaround https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
                Object.setPrototypeOf(_this, KaitaiStream.EOFError.prototype);
                _this.bytesReq = bytesReq;
                _this.bytesAvail = bytesAvail;
                return _this;
            }
            return EOFError;
        }(Error));
        /**
         * Unused since Kaitai Struct Compiler v0.9+ - compatibility with older versions.
         */
        KaitaiStream.UnexpectedDataError = /** @class */ (function (_super) {
            __extends(UnexpectedDataError, _super);
            /**
             * @param expected The expected value.
             * @param actual The actual value.
             */
            function UnexpectedDataError(expected, actual) {
                var _this = _super.call(this, "expected [" + expected + "], but got [" + actual + "]") || this;
                _this.name = "UnexpectedDataError";
                // Workaround https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
                Object.setPrototypeOf(_this, KaitaiStream.UnexpectedDataError.prototype);
                _this.expected = expected;
                _this.actual = actual;
                return _this;
            }
            return UnexpectedDataError;
        }(Error));
        KaitaiStream.UndecidedEndiannessError = /** @class */ (function (_super) {
            __extends(UndecidedEndiannessError, _super);
            function UndecidedEndiannessError() {
                var _this = _super.call(this) || this;
                _this.name = "UndecidedEndiannessError";
                // Workaround https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
                Object.setPrototypeOf(_this, KaitaiStream.UndecidedEndiannessError.prototype);
                return _this;
            }
            return UndecidedEndiannessError;
        }(Error));
        KaitaiStream.ValidationNotEqualError = /** @class */ (function (_super) {
            __extends(ValidationNotEqualError, _super);
            /**
             * @param expected The expected value.
             * @param actual The actual value.
             */
            function ValidationNotEqualError(expected, actual) {
                var _this = _super.call(this, "not equal, expected [" + expected + "], but got [" + actual + "]") || this;
                _this.name = "ValidationNotEqualError";
                // Workaround https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
                Object.setPrototypeOf(_this, KaitaiStream.ValidationNotEqualError.prototype);
                _this.expected = expected;
                _this.actual = actual;
                return _this;
            }
            return ValidationNotEqualError;
        }(Error));
        KaitaiStream.ValidationLessThanError = /** @class */ (function (_super) {
            __extends(ValidationLessThanError, _super);
            /**
             * @param min The minimum allowed value.
             * @param actual The actual value.
             */
            function ValidationLessThanError(min, actual) {
                var _this = _super.call(this, "not in range, min [" + min + "], but got [" + actual + "]") || this;
                _this.name = "ValidationLessThanError";
                // Workaround https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
                Object.setPrototypeOf(_this, KaitaiStream.ValidationLessThanError.prototype);
                _this.min = min;
                _this.actual = actual;
                return _this;
            }
            return ValidationLessThanError;
        }(Error));
        KaitaiStream.ValidationGreaterThanError = /** @class */ (function (_super) {
            __extends(ValidationGreaterThanError, _super);
            /**
             * @param max The maximum allowed value.
             * @param actual The actual value.
             */
            function ValidationGreaterThanError(max, actual) {
                var _this = _super.call(this, "not in range, max [" + max + "], but got [" + actual + "]") || this;
                _this.name = "ValidationGreaterThanError";
                // Workaround https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
                Object.setPrototypeOf(_this, KaitaiStream.ValidationGreaterThanError.prototype);
                _this.max = max;
                _this.actual = actual;
                return _this;
            }
            return ValidationGreaterThanError;
        }(Error));
        KaitaiStream.ValidationNotAnyOfError = /** @class */ (function (_super) {
            __extends(ValidationNotAnyOfError, _super);
            /**
             * @param actual The actual value.
             */
            function ValidationNotAnyOfError(actual) {
                var _this = _super.call(this, "not any of the list, got [" + actual + "]") || this;
                _this.name = "ValidationNotAnyOfError";
                // Workaround https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
                Object.setPrototypeOf(_this, KaitaiStream.ValidationNotAnyOfError.prototype);
                _this.actual = actual;
                return _this;
            }
            return ValidationNotAnyOfError;
        }(Error));
        KaitaiStream.ValidationNotInEnumError = /** @class */ (function (_super) {
            __extends(ValidationNotInEnumError, _super);
            /**
             * @param actual The actual value.
             */
            function ValidationNotInEnumError(actual) {
                var _this = _super.call(this, "not in the enum, got [" + actual + "]") || this;
                _this.name = "ValidationNotInEnumError";
                // Workaround https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
                Object.setPrototypeOf(_this, KaitaiStream.ValidationNotInEnumError.prototype);
                _this.actual = actual;
                return _this;
            }
            return ValidationNotInEnumError;
        }(Error));
        KaitaiStream.ValidationExprError = /** @class */ (function (_super) {
            __extends(ValidationExprError, _super);
            /**
             * @param actual The actual value.
             */
            function ValidationExprError(actual) {
                var _this = _super.call(this, "not matching the expression, got [" + actual + "]") || this;
                _this.name = "ValidationExprError";
                // Workaround https://www.typescriptlang.org/docs/handbook/2/classes.html#inheriting-built-in-types
                Object.setPrototypeOf(_this, KaitaiStream.ValidationExprError.prototype);
                _this.actual = actual;
                return _this;
            }
            return ValidationExprError;
        }(Error));
        return KaitaiStream;
    }());

    return KaitaiStream;

}));
