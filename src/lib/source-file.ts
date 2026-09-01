import * as fs from "fs";
import * as path from "path";

/**
 * Reads files that sit next to the layer that uses them.
 */
export function sourceFileIn(dirname: string) {
    return (name: string) =>
        fs.readFileSync(path.resolve(dirname, name), "utf-8");
}
