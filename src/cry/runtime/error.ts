export function errorMessage(message: string, ...Args): string {
    let finalMessage = "[ERROR] " + message;

    for (let i = 0; i < Args.length; i++) {
        finalMessage += "\n" + Args[i];
    }

    return finalMessage;
}