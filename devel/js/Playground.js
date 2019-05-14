define(["require", "exports", "yamljs", "./worker/TemplateCompiler", "./worker/ExpressionLanguage/ExpressionParser"], function (require, exports, yamljs_1, TemplateCompiler_1, ExpressionParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function cloneWithFilter(obj, filterFunc) {
        if (Array.isArray(obj))
            return obj.map(x => cloneWithFilter(x, filterFunc));
        else if (typeof obj === "object") {
            const result = {};
            for (const key of Object.keys(obj))
                if (filterFunc(key))
                    result[key] = cloneWithFilter(obj[key], filterFunc);
            return result;
        }
        else
            return obj;
    }
    async function run() {
        let testCases = ["1+2*3", "4 + obj.method(1+2*3) * 2 || eof", "1+2+3+4"];
        testCases = ["this.instances"];
        for (const exprStr of testCases) {
            const expr = ExpressionParser_1.ExpressionParser.parse(exprStr);
            const js = TemplateCompiler_1.TemplateCompiler.astToJs(expr);
            console.log(`"${exprStr}" -> ${expr.repr()}`, expr);
        }
        const ksyContent = await (await fetch("template_compiler/test.ksy")).text();
        const templateContent = await (await fetch("template_compiler/test.kcy.yaml")).text();
        const ksy = yamljs_1.YAML.parse(ksyContent, null, null, true);
        const kcy = yamljs_1.YAML.parse(templateContent);
        const compiledTemplate = TemplateCompiler_1.TemplateCompiler.compileTemplateSchema(kcy);
        console.log("compiledTemplate", compiledTemplate);
        const ksyAny = ksy;
        ksyAny.name = ksy.meta.id.ucFirst();
        const compiledCode = compiledTemplate.main(ksyAny);
        console.log("compiledCode", compiledCode);
        console.log("ksy", ksy);
        //const compilerKsy = cloneWithFilter(ksy, prop => !prop.startsWith("$"));
        //const compiler = new KaitaiStructCompiler();
        //console.log(ksy);
        //console.log(compilerKsy);
        //const compiled = await compiler.compile("javascript", compilerKsy, null, false);
        //ksy.instancesByJsName
        //console.log(compiled);
    }
    run();
});
//# sourceMappingURL=Playground.js.map