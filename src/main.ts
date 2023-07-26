import Parser from "./cry/front/parser";

const prompt=require("prompt-sync")({sigint:true});
// import {evaluate} from "./runtime/interpreter";
import {tokenize} from "./cry/front/lexer";
import * as fs from "fs";
import Environment, {createGlobalEnv} from "./cry/runtime/environment";
import {evaluate} from "./cry/runtime/interpreter";

const args = process.argv;

// The first two elements of process.argv are the path to Node.js and the path to your script.
// The actual command-line arguments start from index 2.
const actualArgs = args.slice(2);

if (actualArgs.length === 0) {
    repl();
} else {
    const file = actualArgs[0];
    run(file);
}


// run();
//
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
            const ast = parser.produceAST(input);
            const env = createGlobalEnv();
            const result = evaluate(ast, env);
            console.log(result);
    }
}

function run (file) {
    // check if file exists
    if (!fs.existsSync(file)) {
        console.error(`Error: File ${file} does not exist.`);
        return;
    }

    const sourceCode = fs.readFileSync(file, "utf-8");
    const parser = new Parser();
    const ast = parser.produceAST(sourceCode);
    const env = createGlobalEnv();
    const result = evaluate(ast, env);
}