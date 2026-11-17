/*
 * Runs Python in a Web Worker so that player code can never freeze the page.
 * If the code loops forever, the main thread terminates this worker
 * (see runner.js) and starts a fresh one.
 */

import harness from "./harness.py?raw";
import { PYODIDE_INDEX_URL } from "./pyodide.js";

const pyodideReady = (async () => {
    const { loadPyodide } = await import(
        /* @vite-ignore */ `${PYODIDE_INDEX_URL}pyodide.mjs`
    );

    const pyodide = await loadPyodide({ indexURL: PYODIDE_INDEX_URL });

    pyodide.runPython(harness);

    return pyodide;
})();

self.onmessage = async ({ data }) => {
    const { id, type } = data;

    try {
        const pyodide = await pyodideReady;

        if (type === "init") {
            self.postMessage({ id, ok: true });
            return;
        }

        const runTests = pyodide.globals.get("run_tests");

        try {
            const json = runTests(
                data.code,
                data.entry,
                JSON.stringify(data.tests)
            );

            self.postMessage({ id, ok: true, result: JSON.parse(json) });
        } finally {
            runTests.destroy();
        }
    } catch (error) {
        self.postMessage({
            id,
            ok: false,
            error: String(error?.message ?? error)
        });
    }
};
