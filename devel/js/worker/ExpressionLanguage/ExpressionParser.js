define(["require", "exports", "./Tokenizer", "./Parser"], function (require, exports, Tokenizer_1, Parser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const operators = [
        new Parser_1.OperatorData("<<", 5),
        new Parser_1.OperatorData(">>", 5),
        new Parser_1.OperatorData("++"),
        new Parser_1.OperatorData("--"),
        new Parser_1.OperatorData("==", -3),
        new Parser_1.OperatorData("<"),
        new Parser_1.OperatorData(">"),
        new Parser_1.OperatorData("=", -4, Parser_1.OperatorType.Normal, true),
        new Parser_1.OperatorData("(", 4, Parser_1.OperatorType.LeftParenthesis),
        new Parser_1.OperatorData(")", 0, Parser_1.OperatorType.RightParenthesis),
        new Parser_1.OperatorData("["),
        new Parser_1.OperatorData("]"),
        new Parser_1.OperatorData("{", 0, Parser_1.OperatorType.LeftParenthesis),
        new Parser_1.OperatorData("}", 0, Parser_1.OperatorType.RightParenthesis),
        new Parser_1.OperatorData(";", -5),
        new Parser_1.OperatorData("+", 1),
        new Parser_1.OperatorData("-", 1),
        new Parser_1.OperatorData("*", 2),
        new Parser_1.OperatorData("/", 2),
        new Parser_1.OperatorData("&", 4),
        new Parser_1.OperatorData("%", 3),
        new Parser_1.OperatorData("||", 0),
        new Parser_1.OperatorData("|", 3),
        new Parser_1.OperatorData("^", 0, Parser_1.OperatorType.Normal, true),
        new Parser_1.OperatorData(",", 0, Parser_1.OperatorType.ArgumentSeparator),
        new Parser_1.OperatorData(".", 10),
    ];
    const operatorDict = operators.toDict(x => x.text);
    class ExpressionParser {
        static exprToAst(code) {
            var parsedTokens = Tokenizer_1.Tokenizer.tokenize(code, operators.map(x => x.text));
            var tokens = [];
            for (let ptoken of parsedTokens) {
                if (ptoken.value === "[") {
                    tokens.push(new Parser_1.Token(Parser_1.TokenType.Operator, new Parser_1.OperatorData(".")));
                    tokens.push(new Parser_1.Token(Parser_1.TokenType.Identifier, null, "index"));
                    tokens.push(new Parser_1.Token(Parser_1.TokenType.Operator, new Parser_1.OperatorData(null, null, Parser_1.OperatorType.LeftParenthesis)));
                }
                else if (ptoken.value === "]") {
                    tokens.push(new Parser_1.Token(Parser_1.TokenType.Operator, new Parser_1.OperatorData(null, null, Parser_1.OperatorType.RightParenthesis)));
                }
                else {
                    var token;
                    if (ptoken.isOperator)
                        token = new Parser_1.Token(Parser_1.TokenType.Operator, operatorDict[ptoken.value]);
                    else
                        token = new Parser_1.Token(Parser_1.TokenType.Identifier, null, ptoken.value);
                    tokens.push(token);
                }
            }
            //console.log("tokens:\n" + tokens.map(x => " - " + x.repr()).join("\n"));
            var ast = new Parser_1.Parser(tokens).parse();
            return ast;
        }
        static parse(expr) {
            const ast = this.exprToAst(expr);
            //console.log("ast", ast);
            return ast;
        }
    }
    exports.ExpressionParser = ExpressionParser;
});
