import Parser from "./cry/front/parser";

const prompt=require("prompt-sync")({sigint:true});
// import {evaluate} from "./runtime/interpreter";
import {tokenize} from "./cry/front/lexer";
import * as fs from "fs";
import Environment, {createGlobalEnv} from "./cry/runtime/environment";
import {evaluate} from "./cry/runtime/interpreter";
run();

async function repl () {
    console.log("Welcome to the REPL!")
    const env = new Environment();

    let isAst = false;
    while (true) {
        const input = prompt(">> ")
        if (!input || input.includes("exit")) {
            // close program
            break;
        }


                    const parser = new Parser();
            // const ast = parser.produceAst(input);
            // // convert to json
            // const json = JSON.stringify(ast, null, 2);
            // // save to file
            // fs.writeFileSync("ast.json", json);
            // console.log(ast);

            // const result = evalProgram(ast, env);
            // console.log(result);
    }
}

function run (file = "./example.cry") {
    const sourceCode = fs.readFileSync(file, "utf-8");
    const parser = new Parser();
    const ast = parser.produceAST(sourceCode);
    const env = createGlobalEnv();
    const result = evaluate(ast, env);
}