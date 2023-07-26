import {
    MK_BOOL,
    MK_NATIVE_FN,
    MK_NULL,
    MK_NUMBER,
    RuntimeVal, StringVal,
} from "./values";
import {errorMessage} from "./error";

export function createGlobalEnv() {
    const env = new Environment();
    // Create Default Global Enviornment
    env.declareVar("true", MK_BOOL(true), true);
    env.declareVar("false", MK_BOOL(false), true);
    env.declareVar("null", MK_NULL(), true);

    // Define a native builtin method
    env.declareVar(
        "print",
        MK_NATIVE_FN((args, scope) => {
            const argList = args.map((arg) => {
                // see if arg has .value
                if (arg.hasOwnProperty("value")) {
                    return (arg as unknown as {value: string}).value;
                } else {
                    return arg;
                }
            });
            console.log(...argList);
            return MK_NULL();
        }),
        true
    );

    function timeFunction(_args: RuntimeVal[], _env: Environment) {
        return MK_NUMBER(Date.now());
    }
    env.declareVar("time", MK_NATIVE_FN(timeFunction), true);

    return env;
}

export default class Environment {
    private parent?: Environment;
    private variables: Map<string, RuntimeVal>;
    private constants: Set<string>;

    constructor(parentENV?: Environment) {
        const global = parentENV ? true : false;
        this.parent = parentENV;
        this.variables = new Map();
        this.constants = new Set();
    }

    public declareVar(
        varname: string,
        value: RuntimeVal,
        constant: boolean
    ): RuntimeVal {
        if (this.variables.has(varname)) {
            throw new Error(errorMessage(`Cannot declare variable ${varname}. As it already is defined.`));
        }

        this.variables.set(varname, value);
        if (constant) {
            this.constants.add(varname);
        }
        return value;
    }

    public assignVar(varname: string, value: RuntimeVal): RuntimeVal {
        const env = this.resolve(varname);

        // Cannot assign to constant
        if (env.constants.has(varname)) {
            throw new Error(errorMessage(`Cannot reasign to variable ${varname} as it was declared constant.`));
        }

        env.variables.set(varname, value);
        return value;
    }

    public lookupVar(varname: string): RuntimeVal {
        const env = this.resolve(varname);
        return env.variables.get(varname) as RuntimeVal;
    }

    public resolve(varname: string): Environment {
        if (this.variables.has(varname)) {
            return this;
        }

        if (this.parent == undefined) {
            throw new Error(errorMessage(`Variable ${varname} is not defined.`));
        }

        return this.parent.resolve(varname);
    }
}