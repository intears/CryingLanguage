import {
    AssignmentExpr,
    BinaryExpr,
    CallExpr, ComparisonExpr,
    Identifier, MemberExpr,
    ObjectLiteral,
} from "../../front/ast";
import Environment from "../environment";
import { evaluate } from "../interpreter";
import {
    BooleanVal,
    FunctionValue,
    MK_NULL,
    NativeFnValue,
    NumberVal,
    ObjectVal,
    RuntimeVal, StringVal,
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

export function eval_comparison_expr(comop: ComparisonExpr, env: Environment): RuntimeVal {
    const lhs = evaluate(comop.left, env);
    const rhs = evaluate(comop.right, env);

    // Dynamic check for type equality
    if (lhs.type !== rhs.type) {
        throw new Error(errorMessage(`Cannot compare values of different types ${lhs.type} and ${rhs.type}`));
    }

    // Perform the comparison based on the operator
    switch (comop.operator.value) {
        case "==":
            return { type: "boolean", value: isEqual(lhs, rhs) } as BooleanVal;
        case "!=":
            return { type: "boolean", value: !isEqual(lhs, rhs) } as BooleanVal;
        // Add more cases for other comparison operators like '<', '>', '<=', '>=' etc.
        default:
            throw new Error(errorMessage(`Invalid comparison operator: ${comop.operator.value}`));
    }
}

// Helper function to check equality based on data type
function isEqual(lhs: RuntimeVal, rhs: RuntimeVal): boolean {
    if (lhs.type === "number" || lhs.type === "boolean") {
        return (lhs as NumberVal).value === (rhs as NumberVal).value;
    } else if (lhs.type === "string") {
        return (lhs as StringVal).value === (rhs as StringVal).value;
    } else {
        // Handle other data types as needed (e.g., arrays, objects)
        // For complex data types, you might need a custom comparison function.
        throw new Error(errorMessage(`Unsupported data type for comparison: ${lhs.type}`));
    }
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