import pkg from "../../package.json";

// One source of truth: the browser loads the same Pyodide version from the
// CDN that CI uses from npm to validate the challenges.
export const PYODIDE_VERSION = pkg.devDependencies.pyodide;

export const PYODIDE_INDEX_URL =
    `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
