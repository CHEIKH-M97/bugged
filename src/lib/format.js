/*
 * Display helpers: show JSON test data the way Python would print it,
 * so `true` reads as `True` and `null` as `None`.
 */

export function pyRepr(value) {
    if (value === null) return "None";
    if (value === true) return "True";
    if (value === false) return "False";
    if (typeof value === "number") return String(value);
    if (typeof value === "string") return pyString(value);
    if (Array.isArray(value)) return `[${value.map(pyRepr).join(", ")}]`;

    const entries = Object.entries(value).map(
        ([key, item]) => `${pyString(key)}: ${pyRepr(item)}`
    );
    return `{${entries.join(", ")}}`;
}

function pyString(text) {
    const quote = text.includes("'") && !text.includes('"') ? '"' : "'";
    const escaped = text
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/\t/g, "\\t")
        .replaceAll(quote, `\\${quote}`);
    return `${quote}${escaped}${quote}`;
}

/** `average([1, 2, 3])` */
export function callRepr(entry, args) {
    return `${entry}(${args.map(pyRepr).join(", ")})`;
}
