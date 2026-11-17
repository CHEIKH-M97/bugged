#!/usr/bin/env node
/*
 * Validates every challenge in /challenges with the same Pyodide build and
 * the same harness the browser uses:
 *
 *   - the JSON has every required field, with the right types
 *   - ids are unique and run 1..N with no gaps (they set the release order)
 *   - the buggy code loads, and fails at least one test
 *   - the reference solution passes every test
 *
 * Usage: npm run validate
 */

import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadPyodide } from "pyodide";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const challengesDir = path.join(root, "challenges");

const REQUIRED = {
    id: "number",
    title: "string",
    difficulty: "number",
    language: "string",
    topics: "object",
    description: "string",
    entry: "string",
    code: "string",
    solution: "string",
    hint: "string",
    explanation: "string",
    tests: "object"
};

const MIN_TESTS = 3;

function checkShape(challenge, file) {
    const errors = [];

    for (const [field, type] of Object.entries(REQUIRED)) {
        if (typeof challenge[field] !== type) {
            errors.push(`"${field}" should be a ${type}`);
        }
    }

    if (!Number.isInteger(challenge.difficulty) || challenge.difficulty < 1 || challenge.difficulty > 5) {
        errors.push(`"difficulty" should be an integer from 1 to 5`);
    }

    if (challenge.language !== "python") {
        errors.push(`"language" must be "python" (the only runner so far)`);
    }

    if (!Array.isArray(challenge.topics) || challenge.topics.length === 0) {
        errors.push(`"topics" should be a non-empty array`);
    }

    if (!Array.isArray(challenge.tests) || challenge.tests.length < MIN_TESTS) {
        errors.push(`needs at least ${MIN_TESTS} tests`);
    } else {
        challenge.tests.forEach((test, index) => {
            if (!Array.isArray(test.args)) errors.push(`test ${index + 1}: "args" should be an array`);
            if (!("expected" in test)) errors.push(`test ${index + 1}: missing "expected"`);
        });
    }

    if (challenge.code === challenge.solution) {
        errors.push(`"code" and "solution" are identical`);
    }

    if (!new RegExp(`def\\s+${challenge.entry}\\s*\\(`).test(challenge.code)) {
        errors.push(`"code" doesn't define ${challenge.entry}()`);
    }

    return errors.map((message) => `${file}: ${message}`);
}

async function main() {
    const files = (await readdir(challengesDir)).filter((f) => f.endsWith(".json")).sort();
    const challenges = [];
    const errors = [];

    for (const file of files) {
        try {
            const challenge = JSON.parse(await readFile(path.join(challengesDir, file), "utf8"));
            challenges.push({ file, challenge });
            errors.push(...checkShape(challenge, file));
        } catch (error) {
            errors.push(`${file}: invalid JSON (${error.message})`);
        }
    }

    const ids = challenges.map(({ challenge }) => challenge.id).sort((a, b) => a - b);
    ids.forEach((id, index) => {
        if (id !== index + 1) errors.push(`ids must be 1..${ids.length} with no gaps or duplicates (found ${ids.join(", ")})`);
    });

    if (errors.length) return report(errors, challenges.length);

    const pyodide = await loadPyodide();
    pyodide.runPython(await readFile(path.join(root, "src/lib/harness.py"), "utf8"));
    const runTests = pyodide.globals.get("run_tests");

    const run = (code, challenge) =>
        JSON.parse(runTests(code, challenge.entry, JSON.stringify(challenge.tests)));

    for (const { file, challenge } of challenges) {
        const buggy = run(challenge.code, challenge);

        if (buggy.error) {
            errors.push(`${file}: the buggy code doesn't even load: ${buggy.error.message}`);
        } else if (buggy.results.every((test) => test.passed)) {
            errors.push(`${file}: the buggy code passes every test, so the tests don't catch the bug`);
        }

        const fixed = run(challenge.solution, challenge);

        if (fixed.error) {
            errors.push(`${file}: the solution doesn't load: ${fixed.error.message}`);
        } else {
            fixed.results.forEach((test, index) => {
                if (!test.passed) {
                    const why = test.error ? test.error.message : `got ${test.actual}`;
                    errors.push(`${file}: the solution fails test ${index + 1} (${why})`);
                }
            });
        }

        if (!buggy.error && !fixed.error) {
            const failing = buggy.results.filter((test) => !test.passed).length;
            console.log(`  ✓ ${file}  (bug caught by ${failing}/${challenge.tests.length} tests)`);
        }
    }

    runTests.destroy();
    report(errors, challenges.length);
}

function report(errors, count) {
    if (errors.length) {
        console.error(`\n✗ ${errors.length} problem(s):\n`);
        for (const error of errors) console.error(`  - ${error}`);
        process.exit(1);
    }
    console.log(`\n✓ ${count} challenges are valid.`);
}

main();
