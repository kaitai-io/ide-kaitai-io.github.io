define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class UnknownTokenException extends Error {
        constructor(offset, dataEnv) {
            super(`Unknown token found${offset ? ` at position ${offset}` : ''}${dataEnv ? `: ${dataEnv}...` : ""}`);
            this.offset = offset;
            this.dataEnv = dataEnv;
        }
    }
    var TokenType;
    (function (TokenType) {
        TokenType["EndToken"] = "EndToken";
        TokenType["Whitespace"] = "Whitespace";
        TokenType["Identifier"] = "Identifier";
        TokenType["Operator"] = "Operator";
    })(TokenType || (TokenType = {}));
    class Token {
        constructor(value, isOperator) {
            this.value = value;
            this.isOperator = isOperator;
        }
    }
    class Tokenizer {
        constructor(text, operators) {
            this.text = text;
            this.operators = operators;
            this.offset = 0;
        }
        getType() {
            if (this.offset >= this.text.length)
                return TokenType.EndToken;
            var c = this.text[this.offset];
            return c == ' ' || c == '\n' || c == '\t' || c == '\r' ? TokenType.Whitespace :
                ('A' <= c && c <= 'Z') || ('a' <= c && c <= 'z') || ('0' <= c && c <= '9') || c == '_' ? TokenType.Identifier :
                    TokenType.Operator;
        }
        tokenize() {
            const result = [];
            while (this.offset < this.text.length) {
                const charType = this.getType();
                if (charType == TokenType.Whitespace)
                    while (this.getType() == TokenType.Whitespace)
                        this.offset++;
                else if (charType == TokenType.Identifier) {
                    const startOffset = this.offset;
                    while (this.getType() == TokenType.Identifier)
                        this.offset++;
                    const identifier = this.text.substring(startOffset, this.offset);
                    result.push(new Token(identifier, false));
                }
                else {
                    const op = this.operators.find(op => this.text.startsWith(op, this.offset));
                    if (!op)
                        throw new UnknownTokenException(this.offset, this.text.substr(this.offset, 5));
                    this.offset += op.length;
                    result.push(new Token(op, true));
                }
            }
            return result;
        }
        static tokenize(text, operators) {
            return new Tokenizer(text, operators).tokenize();
        }
    }
    exports.Tokenizer = Tokenizer;
});
//# sourceMappingURL=Tokenizer.js.map