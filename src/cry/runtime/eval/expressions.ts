import {
    AssignmentExpr,
    BinaryExpr,
    CallExpr,
    Identifier, MemberExpr,
    ObjectLiteral,
} from "../../front/ast";
import Environment from "../environment";
import { evaluate } from "../interpreter";
import {
    FunctionValue,
    MK_NULL,
    NativeFnValue,
    NumberVal,
    ObjectVal,
    RuntimeVal,
} from "../values";
import {errorMessage} from "../error";

function eval_numeric_binary_expr(
    lhs: NumberVal,
    rhs: NumberVal,
    operator: string
): NumberVal {
    let result: number;
    if (operator == "+") {
        result = lhs.value + rhs.value;
    } else if (operator == "-") {
        result = lhs.value - rhs.value;
    } else if (operator == "*") {
        result = lhs.value * rhs.value;
    } else if (operator == "/") {
        // TODO: Division by zero checks
        result = lhs.value / rhs.value;
    } else {
        result = lhs.value % rhs.value;
    }

    return { value: result, type: "number" };
}

/**
 * Evaulates expressions following the binary operation type.
 */
export function eval_binary_expr(
    binop: BinaryExpr,
    env: Environment
): RuntimeVal {
    const lhs = evaluate(binop.left, env);
    const rhs = evaluate(binop.right, env);

    // Only currently support numeric operations
    if (lhs.type == "number" && rhs.type == "number") {
        return eval_numeric_binary_expr(
            lhs as NumberVal,
            rhs as NumberVal,
            binop.operator
        );
    }

    // One or both are NULL
    return MK_NULL();
}

export function eval_identifier(
    ident: Identifier,
    env: Environment
): RuntimeVal {
    const val = env.lookupVar(ident.symbol);
    return val;
}

export function eval_member_expr(
    member: MemberExpr,
    env: Environment
): RuntimeVal {
    // get the value of the object parameter
    const object = evaluate(member.object, env);

    if (object.type !== "object") {
        throw new Error(errorMessage(`Cannot access property of non-object type ${object.type}`));
    }

    const property = (object as ObjectVal).properties.get((member.property as Identifier).symbol.toString());

    if (property == undefined) {
        throw new Error(errorMessage(`Property ${(member.property as Identifier).symbol} does not exist on object ${object}`));
    }

    return property;
}

export function eval_assignment(
    node: AssignmentExpr,
    env: Environment
): RuntimeVal {
    if (node.assigne.kind !== "Identifier") {
        throw new Error(errorMessage(`Invalid LHS inaide assignment expr ${JSON.stringify(node.assigne)}`));
    }

    const varname = (node.assigne as Identifier).symbol;
    return env.assignVar(varname, evaluate(node.value, env));
}

export function eval_object_expr(
    obj: ObjectLiteral,
    env: Environment
): RuntimeVal {
    const object = { type: "object", properties: new Map() } as ObjectVal;
    for (const { key, value } of obj.properties) {
        const runtimeVal =
            value == undefined ? env.lookupVar(key) : evaluate(value, env);

        object.properties.set(key, runtimeVal);
    }

    return object;
}

export function eval_call_expr(expr: CallExpr, env: Environment): RuntimeVal {
    const args = expr.args.map((arg) => evaluate(arg, env));
    const fn = evaluate(expr.caller, env);

    if (fn.type == "native-fn") {
        const result = (fn as NativeFnValue).call(args, env);
        return result;
    }

    if (fn.type == "function") {
        const func = fn as FunctionValue;
        const scope = new Environment(func.declarationEnv);

        // Create the variables for the parameters list
        for (let i = 0; i < func.parameters.length; i++) {
            // TODO Check the bounds here.
            // verify arity of function
            const varname = func.parameters[i];
            scope.declareVar(varname, args[i], false);
        }

        let result: RuntimeVal = MK_NULL();
        // Evaluate the function body line by line
        for (const stmt of func.body) {
            result = evaluate(stmt, scope);
        }

        return result;
    }

    throw new Error(errorMessage("Cannot call value that is not a function", JSON.stringify(fn)));
}