/*
 * Runs the real harness in Pyodide (the same engine as the browser).
 */
import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { loadPyodide } from "pyodide";

let pyodide;

beforeAll(async () => {
    pyodide = await loadPyodide();
    pyodide.runPython(await readFile(new URL("../src/lib/harness.py", import.meta.url), "utf8"));
}, 60_000);

function run(code, entry, tests) {
    const runTests = pyodide.globals.get("run_tests");
    try {
        return JSON.parse(runTests(code, entry, JSON.stringify(tests)));
    } finally {
        runTests.destroy();
    }
}

function equal(actual, expected) {
    const fn = pyodide.globals.get("values_equal");
    try {
        return fn(pyodide.toPy(actual), pyodide.toPy(expected));
    } finally {
        fn.destroy();
    }
}

describe("run_tests", () => {
    const add = "def add(a, b):\n    return a + b\n";

    it("passes and fails tests by return value", () => {
        const report = run(add, "add", [
            { args: [1, 2], expected: 3 },
            { args: [1, 2], expected: 4 }
        ]);
        expect(report.error).toBeNull();
        expect(report.results.map((r) => r.passed)).toEqual([true, false]);
        expect(report.results[1].actual).toBe("3");
    });

    it("reports syntax errors with a line number", () => {
        const report = run("def add(a, b):\nreturn a + b\n", "add", [{ args: [1, 2], expected: 3 }]);
        expect(report.error.message).toMatch(/IndentationError/);
        expect(report.error.line).toBe(2);
        expect(report.results).toEqual([]);
    });

    it("reports a missing entry function", () => {
        const report = run("def other():\n    pass\n", "add", [{ args: [], expected: 0 }]);
        expect(report.error.message).toMatch(/'add' is not defined/);
    });

    it("reports runtime errors per test, with the line in the player's code", () => {
        const code = "def first(items):\n    return items[0]\n";
        const report = run(code, "first", [
            { args: [[5]], expected: 5 },
            { args: [[]], expected: null }
        ]);
        expect(report.results[0].passed).toBe(true);
        expect(report.results[1].error).toEqual({ message: "IndexError: list index out of range", line: 2 });
    });

    it("captures print output per test", () => {
        const code = "def shout(x):\n    print('got', x)\n    return x\n";
        const report = run(code, "shout", [{ args: [1], expected: 1 }]);
        expect(report.results[0].output).toBe("got 1\n");
    });

    it("survives exit() in player code", () => {
        const report = run("exit()\n", "f", [{ args: [], expected: 0 }]);
        expect(report.error.message).toMatch(/SystemExit/);
    });

    it("gives every test a fresh copy of its arguments", () => {
        const code = "def pop(items):\n    items.pop()\n    return len(items)\n";
        const tests = [{ args: [[1, 2]], expected: 1 }];
        expect(run(code, "pop", [...tests, ...tests]).results.map((r) => r.passed)).toEqual([true, true]);
    });

    it("keeps module state between tests in one run, but not between runs", () => {
        const code = "calls = []\ndef f():\n    calls.append(1)\n    return len(calls)\n";
        const tests = [{ args: [], expected: 1 }, { args: [], expected: 2 }];
        expect(run(code, "f", tests).results.every((r) => r.passed)).toBe(true);
        expect(run(code, "f", tests).results.every((r) => r.passed)).toBe(true);
    });
});

describe("values_equal", () => {
    it("tolerates float rounding", () => {
        expect(equal(0.1 + 0.2, 0.3)).toBe(true);
        expect(equal(20.0, 20)).toBe(true);
    });

    it("does not treat 1 as True", () => {
        expect(equal(1, true)).toBe(false);
        expect(equal(true, true)).toBe(true);
    });

    it("compares nested lists and dicts structurally", () => {
        expect(equal([1, [2, 3]], [1, [2, 3]])).toBe(true);
        expect(equal([1, 2], [1, 2, 3])).toBe(false);
        expect(equal({ a: 1 }, { a: 1.0 })).toBe(true);
        expect(equal({ a: 1 }, { b: 1 })).toBe(false);
    });

    it("treats tuples as lists", () => {
        const report = run("def pair():\n    return (1, 2)\n", "pair", [{ args: [], expected: [1, 2] }]);
        expect(report.results[0].passed).toBe(true);
    });

    it("matches int dict keys against JSON string keys", () => {
        const report = run("def f():\n    return {1: 'a'}\n", "f", [{ args: [], expected: { 1: "a" } }]);
        expect(report.results[0].passed).toBe(true);
    });
});
