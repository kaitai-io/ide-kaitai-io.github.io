define(["require", "exports", "./ExpressionLanguage/Parser", "./ExpressionLanguage/ExpressionParser"], function (require, exports, Parser_1, ExpressionParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TemplateNode {
        constructor(value, parent) {
            this.value = value;
            this.parent = parent;
            this.children = [];
        }
        repr() {
            let result = this.value ? this.value.repr() + "\n" : "";
            for (const item of this.children)
                result += item.repr().split("\n").map((x, i) => (i === 0 ? "- " : "  ") + x).join("\n") + "\n";
            result = result.substring(0, result.length - 1);
            return result;
        }
    }
    class TemplatePart {
        constructor(value, isText) {
            this.value = value;
            let match;
            if (isText) {
                this.type = "text";
                this.textValue = value;
            }
            else if (match = /for ([a-zA-Z]+) in (.*)/.exec(value)) {
                this.type = "for";
                this.for = { itemName: match[1], array: ExpressionParser_1.ExpressionParser.parse(match[2]) };
            }
            else if (match = /if (.*)/.exec(value)) {
                this.type = "if";
                this.if = { condition: ExpressionParser_1.ExpressionParser.parse(match[1]) };
            }
            else if (match = /\/(for|if)/.exec(value)) {
                this.type = "closeNode";
                this.closeNode = { tag: match[1] };
            }
            else {
                this.type = "template";
                this.template = { expr: ExpressionParser_1.ExpressionParser.parse(value) };
            }
        }
        repr() {
            return `${this.type}: "${this.value.replace(/\n/g, "\\n")}"`;
        }
    }
    class TemplateCompiler {
        static templateListToTree(parts) {
            const root = new TemplateNode(null, null);
            let current = root;
            for (let part of parts) {
                //console.log(part.type, part.for || part.if || part.template || part.closeNode);
                if (part.type === "closeNode") {
                    if (current.value.type !== part.closeNode.tag)
                        throw new Error(`Invalid close tag! Expected ${current.value.type}, got ${part.closeNode.tag}!`);
                    current = current.parent;
                }
                else {
                    const newNode = new TemplateNode(part, current);
                    current.children.push(newNode);
                    if (part.type === "for" || part.type === "if")
                        current = newNode;
                }
            }
            return root;
        }
        static compileTemplate(template) {
            const parts = template.split(/\{\{(.*?)\}\}/).map((x, i) => new TemplatePart(x, i % 2 === 0));
            const exprs = parts.map(x => x.for && x.for.array || x.if && x.if.condition || x.template && x.template.expr).filter(x => x);
            //console.log("exprs", exprs);
            //for (let part of parts)
            //    console.log(part.type, part.for || part.if || part.template || part.closeNode);
            const rootNode = this.templateListToTree(parts);
            //console.log(rootNode.repr());
            return rootNode;
        }
        static compileTemplateToJsFunction(template) {
            const templateNode = this.compileTemplate(template.template);
            const funcCode = `(function(){ return \`${this.templateNodeToJs2(templateNode)}\`; })`;
            return eval(funcCode);
        }
        static compileTemplateSchema(schema) {
            return eval(`class CompiledTemplate {
            ${Object.keys(schema.templates).map(tplName => {
                const tpl = schema.templates[tplName];
                const tplAst = this.compileTemplate(tpl.template);
                const tplJsCode = this.templateNodeToJs2(tplAst);
                return `
                    ${tplName}(${tpl.arguments.join(", ")}) {
                        return \`${tplJsCode}\`;
                    }
                `;
            }).join("\n")}
            }
            new CompiledTemplate();`);
        }
        static astToJs(ast) {
            if (ast.type === Parser_1.AstNodeType.Identifier)
                return ast.identifier;
            else if (ast.type === Parser_1.AstNodeType.OperatorList)
                return ast.operands.reduce((prev, curr) => `${prev}${curr.operator ? curr.operator.text : ""}${this.astToJs(curr.operand)}`, "");
            else if (ast.type === Parser_1.AstNodeType.Function)
                return `${this.astToJs(ast.function)}(${ast.arguments.map(arg => this.astToJs(arg)).join(", ")})`;
            else
                throw new Error(`Unhandled AST type: ${ast.type}!`);
        }
        static escapeJsString(str) {
            // TODO replace others
            const charsToQuote = ["'", "\"", "\\n", "\\r", "\\t", "\\v"];
            return charsToQuote.reduce((prev, char) => prev.replace(new RegExp(char, "g"), "\\" + char), str);
        }
        static templateNodeToJs(node, padding = "") {
            let result = padding;
            if (node.value) {
                if (node.value.type === "text")
                    result += `print('${this.escapeJsString(node.value.textValue)}');`;
                else if (node.value.type === "for")
                    result += `for (let ${node.value.for.itemName} of ${this.astToJs(node.value.for.array)})`;
                else if (node.value.type === "if")
                    result += `if (${this.astToJs(node.value.if.condition)})`;
                else if (node.value.type === "template")
                    result += `print(${this.astToJs(node.value.template.expr)});`;
                else
                    throw new Error(`Unhandled template node type: ${node.value.type}!`);
            }
            if (node.children && node.children.length > 0)
                result += ` {\n${node.children.map(x => padding + this.templateNodeToJs(x, padding + "  ")).join("")}${padding}}\n`;
            else
                result += "\n";
            return result;
        }
        static templateNodeToJs2(node, padding = "") {
            let result = padding;
            const children = node.children && node.children.length > 0 ?
                node.children.map(x => this.templateNodeToJs2(x)).join("") : "";
            if (node.value) {
                if (node.value.type === "text")
                    result += node.value.textValue;
                else if (node.value.type === "for")
                    result += `\${(${this.astToJs(node.value.for.array)}||[]).map(${node.value.for.itemName} => \`${children}\`).join("")}`;
                else if (node.value.type === "if")
                    result += `\${${this.astToJs(node.value.if.condition)} ? \`${children}\` : ""}`;
                else if (node.value.type === "template")
                    result += `\${${this.astToJs(node.value.template.expr)}}`;
                else
                    throw new Error(`Unhandled template node type: ${node.value.type}!`);
            }
            else
                result = children;
            return result;
        }
        async compile(templateSchema, compilerSchema, jsImporter, isDebug) {
            console.log("TemplateCompiler", templateSchema, compilerSchema);
            for (let tpl of Object.values(templateSchema.templates)) {
                const rootNode = TemplateCompiler.compileTemplate(tpl.template);
                //console.log(rootNode);
            }
            return {};
        }
    }
    exports.TemplateCompiler = TemplateCompiler;
});
//# sourceMappingURL=TemplateCompiler.js.map