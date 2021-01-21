define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var OperatorType;
    (function (OperatorType) {
        OperatorType["Normal"] = "Normal";
        OperatorType["LeftParenthesis"] = "LeftParenthesis";
        OperatorType["RightParenthesis"] = "RightParenthesis";
        OperatorType["ArgumentSeparator"] = "ArgumentSeparator";
        OperatorType["NoOp"] = "NoOp";
    })(OperatorType = exports.OperatorType || (exports.OperatorType = {}));
    class OperatorData {
        constructor(text, precedence = 0, type = OperatorType.Normal, isRightAssociative = false) {
            this.text = text;
            this.precedence = precedence;
            this.type = type;
            this.isRightAssociative = isRightAssociative;
        }
        repr() { return this.text; }
    }
    OperatorData.NoOp = new OperatorData(null, 0, OperatorType.NoOp);
    exports.OperatorData = OperatorData;
    var TokenType;
    (function (TokenType) {
        TokenType["Identifier"] = "Identifier";
        TokenType["Operator"] = "Operator";
    })(TokenType = exports.TokenType || (exports.TokenType = {}));
    class Token {
        constructor(type, operator, identifier = null) {
            this.type = type;
            this.operator = operator;
            this.identifier = identifier;
        }
        repr() { return this.type === TokenType.Identifier ? this.identifier : this.operator.text; }
    }
    exports.Token = Token;
    class OperatorWithOperand {
        constructor(operator, operand) {
            this.operator = operator;
            this.operand = operand;
        }
        repr() { return `${this.operator ? this.operator.text : ""}${this.operand.repr()}`; }
    }
    var AstNodeType;
    (function (AstNodeType) {
        AstNodeType["Identifier"] = "Identifier";
        AstNodeType["OperatorList"] = "OperatorList";
        AstNodeType["Function"] = "Function";
    })(AstNodeType = exports.AstNodeType || (exports.AstNodeType = {}));
    class AstNode {
        constructor(type) {
            this.type = type;
        }
        repr() {
            return this.type === AstNodeType.Identifier ? this.identifier :
                this.type === AstNodeType.OperatorList ? `(${this.operands.map(x => x.repr()).join(", ")})` :
                    this.type === AstNodeType.Function ? `{${this.function.repr()}}(${this.arguments.map(x => x.repr()).join(", ")})` :
                        "<unknown AstNode type>";
        }
    }
    exports.AstNode = AstNode;
    var OpStackItemType;
    (function (OpStackItemType) {
        OpStackItemType["Operator"] = "Operator";
        OpStackItemType["LeftParenthesis"] = "LeftParenthesis";
        OpStackItemType["Function"] = "Function";
    })(OpStackItemType || (OpStackItemType = {}));
    class OpStackItem {
        constructor(type, operator) {
            this.type = type;
            this.operator = operator;
        }
        repr() {
            return this.type === OpStackItemType.Function ? "<func>" :
                this.type === OpStackItemType.LeftParenthesis ? "<" : this.operator.repr();
        }
    }
    class Parser {
        constructor(tokens) {
            this.tokens = tokens;
            this.nodeStack = [];
            this.opStack = [];
            this.token = null;
        }
        addNode(nodeOp) {
            var item = this.nodeStack.pop();
            var parent = this.nodeStack.pop();
            if (parent.type !== AstNodeType.OperatorList || nodeOp.operator.precedence !== parent.operands[1].operator.precedence) {
                const oldParent = parent;
                parent = new AstNode(AstNodeType.OperatorList);
                parent.operands = [new OperatorWithOperand(null, oldParent)];
            }
            parent.operands.push(new OperatorWithOperand(nodeOp.operator, item));
            this.nodeStack.push(parent);
        }
        nextOp(type) {
            var op1 = this.token.operator;
            while (this.opStack.length > 0) {
                var stackTop = this.opStack.last();
                if (stackTop.type !== OpStackItemType.Operator || stackTop.operator.type !== OperatorType.Normal)
                    break;
                var op2 = stackTop.operator;
                if ((!op1.isRightAssociative && op1.precedence <= op2.precedence) ||
                    op1.isRightAssociative && op1.precedence < op2.precedence)
                    this.addNode(this.opStack.pop());
                else
                    break;
            }
            this.opStack.push(new OpStackItem(type, op1));
        }
        parse() {
            for (let iToken = 0; iToken < this.tokens.length; iToken++) {
                this.token = this.tokens[iToken];
                if (this.token.type === TokenType.Identifier) {
                    const node = new AstNode(AstNodeType.Identifier);
                    node.identifier = this.token.identifier;
                    this.nodeStack.push(node);
                }
                else if (this.token.operator.type === OperatorType.LeftParenthesis) {
                    var isFunc = iToken > 0 && (this.tokens[iToken - 1].type === TokenType.Identifier ||
                        this.tokens[iToken - 1].operator.type === OperatorType.RightParenthesis);
                    this.nextOp(isFunc ? OpStackItemType.Function : OpStackItemType.LeftParenthesis);
                    if (isFunc) {
                        const node = new AstNode(AstNodeType.Function);
                        node.function = this.nodeStack.pop();
                        node.arguments = [];
                        this.nodeStack.push(node);
                    }
                }
                else if (this.token.operator.type === OperatorType.RightParenthesis || this.token.operator.type === OperatorType.ArgumentSeparator) {
                    // parse current expression into one node
                    let lastOp;
                    while (true) {
                        if (this.opStack.length <= 0)
                            throw new Error("Unbalanced right parentheses");
                        lastOp = this.opStack.pop();
                        if (lastOp.type !== OpStackItemType.Operator)
                            break;
                        this.addNode(lastOp);
                    }
                    // function => push argument into argument list
                    if (lastOp.type === OpStackItemType.Function) {
                        var noArgs = iToken > 0 && this.tokens[iToken - 1].type === TokenType.Operator &&
                            this.tokens[iToken - 1].operator.type === OperatorType.LeftParenthesis;
                        if (!noArgs) {
                            var arg = this.nodeStack.pop();
                            //if (arg.Type == AstNodeType.Function)
                            //    nodeStack.Push(arg);
                            //else
                            this.nodeStack.last().arguments.push(arg);
                        }
                    }
                    // if this was only a separator then push the starting operator to the start
                    if (this.token.operator.type === OperatorType.ArgumentSeparator)
                        this.opStack.push(lastOp);
                }
                else {
                    this.nextOp(OpStackItemType.Operator);
                }
                //console.log(`${this.token} | ${this.opStack.join(", ")} | ${this.nodeStack.join(", ")}`);
            }
            while (this.opStack.length > 0)
                this.addNode(this.opStack.pop());
            var result = this.nodeStack.pop();
            return result;
        }
    }
    exports.Parser = Parser;
});
