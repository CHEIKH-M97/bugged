/*
 * Main-thread side of the Python runner.
 *
 * - One worker is created lazily and reused between runs.
 * - Loading Python is not part of the time limit; running the tests is.
 * - On timeout the worker is terminated (the only way to stop an infinite
 *   loop) and a new one is started for the next run.
 */

export const RUN_TIMEOUT_MS = 5000;

export class RunTimeoutError extends Error {
    constructor() {
        super(`Your code took longer than ${RUN_TIMEOUT_MS / 1000} seconds. Is there an infinite loop?`);
        this.name = "RunTimeoutError";
    }
}

let worker = null;
let ready = null;
let nextId = 0;
const pending = new Map();

function send(message) {
    const id = nextId++;

    return {
        id,
        promise: new Promise((resolve, reject) => {
            pending.set(id, { resolve, reject });
            worker.postMessage({ ...message, id });
        })
    };
}

function startWorker() {
    worker = new Worker(
        new URL("./python.worker.js", import.meta.url),
        { type: "module" }
    );

    worker.onmessage = ({ data }) => {
        const request = pending.get(data.id);
        if (!request) return;

        pending.delete(data.id);

        if (data.ok) request.resolve(data.result);
        else request.reject(new Error(data.error));
    };

    worker.onerror = (event) => {
        failAll(new Error(event.message || "The Python runner crashed."));
        stopWorker();
    };

    ready = send({ type: "init" }).promise;
    ready.catch(() => stopWorker());
}

function stopWorker() {
    worker?.terminate();
    worker = null;
    ready = null;
}

function failAll(error) {
    for (const { reject } of pending.values()) reject(error);
    pending.clear();
}

/** Start downloading Python in the background. Resolves when it is ready. */
export function loadPython() {
    if (!worker) startWorker();
    return ready;
}

/**
 * Run a challenge's tests against `code`.
 * Resolves with { error, output, results } (see harness.py).
 */
export async function runTests({ code, entry, tests }) {
    await loadPython();

    const { id, promise } = send({
        type: "run",
        code,
        entry,
        tests: tests.map(({ args, expected }) => ({ args, expected }))
    });

    let timer;

    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
            pending.delete(id);
            failAll(new RunTimeoutError());
            stopWorker();
            reject(new RunTimeoutError());
        }, RUN_TIMEOUT_MS);
    });

    try {
        return await Promise.race([promise, timeout]);
    } finally {
        clearTimeout(timer);
    }
}
