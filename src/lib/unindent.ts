export function unindent(text: string | TemplateStringsArray, ...values: any[]): string {
    if (typeof text !== "string") {
        return unindent(text.reduce((result, string, i) => result + string + (values[i] ?? ''), ''));
    }
    
    if (text.startsWith("\n")) {
        text = text.slice(1);
    }
    const lines = text.trimEnd().split("\n");
    const minIndent = lines
        .filter(it => it.trim().length !== 0)
        .reduce((min, it) => Math.min(min, it.length - it.trimStart().length), Infinity);
    return lines.map(it => it.trim().length !== 0 ? it.slice(minIndent) : it).join("\n") + "\n";
}