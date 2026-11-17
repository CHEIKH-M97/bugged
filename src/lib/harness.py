"""
Test harness for Bugged challenges.

The same file runs in two places:
  * in the browser, inside Pyodide (src/lib/python.worker.js)
  * in CI, inside Pyodide on Node (scripts/validate-challenges.mjs)

It runs the player's code in a fresh namespace, calls the challenge's entry
function once per test and compares the return value with the expected value.
"""

import contextlib
import copy
import io
import json
import math
import traceback

FILENAME = "solution.py"
MAX_OUTPUT = 4_000
MAX_REPR = 300


def _normalize(value):
    """Turn a Python return value into something comparable with JSON data."""
    if isinstance(value, (list, tuple)):
        return [_normalize(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _normalize(item) for key, item in value.items()}
    return value


def values_equal(actual, expected):
    """Strict structural equality, with a tolerance for floats.

    bool is checked before int because True == 1 in Python, and a function
    that returns 1 instead of True is a bug worth reporting.
    """
    if isinstance(actual, bool) or isinstance(expected, bool):
        return isinstance(actual, bool) and isinstance(expected, bool) and actual == expected
    if isinstance(actual, (int, float)) and isinstance(expected, (int, float)):
        return math.isclose(actual, expected, rel_tol=1e-9, abs_tol=1e-9)
    if isinstance(actual, list) and isinstance(expected, list):
        return len(actual) == len(expected) and all(
            values_equal(a, e) for a, e in zip(actual, expected)
        )
    if isinstance(actual, dict) and isinstance(expected, dict):
        return actual.keys() == expected.keys() and all(
            values_equal(actual[key], expected[key]) for key in actual
        )
    return actual == expected


def _short_repr(value):
    try:
        text = repr(value)
    except Exception:
        text = "<unprintable value>"
    return text if len(text) <= MAX_REPR else text[: MAX_REPR - 1] + "…"


def _describe_error(exc):
    """A one-line error message plus the line number in the player's code."""
    if isinstance(exc, SyntaxError) and exc.filename == FILENAME:
        return {"message": f"{type(exc).__name__}: {exc.msg}", "line": exc.lineno}

    frames = [f for f in traceback.extract_tb(exc.__traceback__) if f.filename == FILENAME]
    message = "".join(traceback.format_exception_only(type(exc), exc)).strip()
    return {"message": message, "line": frames[-1].lineno if frames else None}


def run_tests(code, entry, tests_json):
    """Run every test and return a JSON string with the results."""
    tests = json.loads(tests_json)
    namespace = {"__name__": "__bugged__"}
    module_output = io.StringIO()

    def report(error=None, results=()):
        return json.dumps(
            {
                "error": error,
                "output": module_output.getvalue()[:MAX_OUTPUT],
                "results": list(results),
            }
        )

    try:
        compiled = compile(code, FILENAME, "exec")
        with contextlib.redirect_stdout(module_output):
            exec(compiled, namespace)
    except BaseException as exc:  # includes SystemExit from exit()
        return report(error=_describe_error(exc))

    function = namespace.get(entry)
    if not callable(function):
        return report(error={"message": f"NameError: function '{entry}' is not defined", "line": None})

    results = []
    for test in tests:
        args = copy.deepcopy(test["args"])
        output = io.StringIO()
        result = {"passed": False, "output": ""}
        try:
            with contextlib.redirect_stdout(output):
                actual = function(*args)
            result["actual"] = _short_repr(actual)
            result["passed"] = values_equal(_normalize(actual), test["expected"])
        except BaseException as exc:
            result["error"] = _describe_error(exc)
        result["output"] = output.getvalue()[:MAX_OUTPUT]
        results.append(result)

    return report(results=results)
