import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";

import Difficulty from "../components/Difficulty";
import Editor from "../components/Editor";
import PageState from "../components/PageState";
import { formatId, getChallenge, challenges } from "../lib/challenges";
import { callRepr, pyRepr } from "../lib/format";
import {
    currentStreak,
    recordGiveUp,
    recordHint,
    recordRun,
    recordSolve,
    updateProgress,
    useProgress
} from "../lib/progress";
import { loadPython, runTests, RunTimeoutError } from "../lib/runner";
import { challengeForDay, dateOfDay, isReleased, releaseDay } from "../lib/schedule";
import { share, shareText } from "../lib/share";
import { useDay } from "../lib/useDay";

/** Failed runs before the "Show solution" button appears. */
const RUNS_BEFORE_GIVE_UP = 3;

const codeKey = (id) => `bugged:code:${id}`;

function readSavedCode(id) {
    try {
        return localStorage.getItem(codeKey(id));
    } catch {
        return null;
    }
}

function saveCode(id, code) {
    try {
        if (code === null) localStorage.removeItem(codeKey(id));
        else localStorage.setItem(codeKey(id), code);
    } catch {
        // Storage unavailable: the code just isn't remembered.
    }
}

export default function ChallengePage() {
    const { id } = useParams();
    const day = useDay();
    const challenge = getChallenge(id);

    if (!challenge) {
        return (
            <PageState
                icon="?"
                title="Bug not found."
                message="This challenge doesn't exist."
                error
            />
        );
    }

    if (!isReleased(challenges, challenge, day)) {
        return (
            <PageState
                icon="⏳"
                title="Not released yet."
                message={`This bug comes out on ${dateOfDay(releaseDay(challenges, challenge))}. No peeking.`}
            />
        );
    }

    // `key` resets all state when moving between challenges.
    return <Workspace key={challenge.id} challenge={challenge} day={day} />;
}

function Workspace({ challenge, day }) {
    const progress = useProgress();
    const { id } = challenge;

    const [code, setCode] = useState(() => readSavedCode(id) ?? challenge.code);
    const [python, setPython] = useState("loading");
    const [running, setRunning] = useState(false);
    const [report, setReport] = useState(null);
    const [runError, setRunError] = useState(null);
    const [showHint, setShowHint] = useState(Boolean(progress.hints[id]));
    const [shareStatus, setShareStatus] = useState(null);

    const solved = progress.solved[id];
    const gaveUp = Boolean(progress.gaveUp[id]);
    const runs = progress.runs[id] ?? [];
    const isToday = challengeForDay(challenges, day)?.id === id;

    useEffect(() => {
        let cancelled = false;
        loadPython().then(
            () => !cancelled && setPython("ready"),
            () => !cancelled && setPython("error")
        );
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        saveCode(id, code === challenge.code ? null : code);
    }, [id, code, challenge.code]);

    async function run(source = code) {
        if (running) return;

        setRunning(true);
        setRunError(null);

        try {
            const result = await runTests({ code: source, entry: challenge.entry, tests: challenge.tests });
            setReport(result);
            setPython("ready");

            const passes = result.error
                ? challenge.tests.map(() => false)
                : result.results.map((test) => test.passed);

            if (!progress.solved[id]) {
                updateProgress((state) => {
                    let next = recordRun(state, id, passes);
                    if (passes.every(Boolean)) {
                        next = recordSolve(next, id, { day, isDaily: isToday });
                    }
                    return next;
                });
            }
        } catch (error) {
            setReport(null);
            if (error instanceof RunTimeoutError) {
                setRunError(error.message);
            } else {
                setPython("error");
                setRunError("Python couldn't start. Check your connection and reload the page.");
            }
        } finally {
            setRunning(false);
        }
    }

    // Ctrl/Cmd + Enter outside the editor (inside it, Editor handles it).
    // A ref keeps the listener stable while `run` changes every render.
    const runRef = useRef(run);
    runRef.current = run;

    useEffect(() => {
        function onKeyDown(event) {
            if (event.target.closest?.(".code-editor")) return;
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
                event.preventDefault();
                runRef.current();
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    function reset() {
        if (window.confirm("Reset the editor to the original buggy code?")) {
            setCode(challenge.code);
            setReport(null);
            setRunError(null);
        }
    }

    function revealHint() {
        setShowHint(true);
        updateProgress((state) => recordHint(state, id));
    }

    function giveUp() {
        if (window.confirm("Show the solution? This bug won't count toward your streak.")) {
            updateProgress((state) => recordGiveUp(state, id));
        }
    }

    async function shareResult() {
        const text = shareText({
            label: formatId(id),
            runs: progress.runs[id] ?? [],
            hintUsed: Boolean(progress.hints[id]),
            streak: currentStreak(progress, day),
            url: `${window.location.origin}${window.location.pathname}`
        });

        try {
            const outcome = await share(text);
            setShareStatus(outcome === "copied" ? "Copied to clipboard" : "Shared");
        } catch {
            setShareStatus("Couldn't copy. Your browser blocked the clipboard.");
        }
    }

    const failedRuns = runs.filter((passes) => !passes.every(Boolean)).length;
    const canGiveUp = !solved && !gaveUp && failedRuns >= RUNS_BEFORE_GIVE_UP;

    return (
        <main className="challenge-page">
            <div className="challenge-topbar">
                <Link to="/archive" className="back-link">← Archive</Link>
                <span className="challenge-number">{formatId(id)}</span>
            </div>

            <section className="challenge-heading">
                <span className="eyebrow">
                    {isToday ? "TODAY'S BUG" : "FROM THE ARCHIVE"}
                    {solved && <span className="badge success">Solved</span>}
                </span>

                <h1>{challenge.title}</h1>

                <div className="challenge-meta">
                    <Difficulty level={challenge.difficulty} />
                    <span className="meta-divider">/</span>
                    <span>{challenge.language}</span>
                    {challenge.topics?.map((topic) => (
                        <span key={topic} className="topic">{topic}</span>
                    ))}
                </div>

                <p className="challenge-description">{challenge.description}</p>
            </section>

            <section className="editor-section">
                <div className="editor-heading">
                    <div>
                        <span className="section-kicker">FIX THIS FUNCTION</span>
                        <h2><code>{challenge.entry}</code></h2>
                    </div>

                    <div className="editor-actions">
                        <button className="secondary-button" onClick={reset} disabled={running}>
                            Reset
                        </button>

                        {!showHint && (
                            <button className="secondary-button" onClick={revealHint}>
                                Hint
                            </button>
                        )}

                        <button
                            className="run-button"
                            onClick={() => run()}
                            disabled={running || python === "error"}
                        >
                            {running ? (
                                <><span className="button-spinner" /> Running</>
                            ) : python === "loading" ? (
                                <><span className="button-spinner" /> Loading Python</>
                            ) : (
                                <>Run tests <span className="shortcut">Ctrl + Enter</span></>
                            )}
                        </button>
                    </div>
                </div>

                {showHint && (
                    <div className="hint">
                        <strong>💡 Hint</strong>
                        <p>{challenge.hint}</p>
                    </div>
                )}

                <Editor value={code} onChange={setCode} onRun={run} language={challenge.language} />
            </section>

            {runError && (
                <div className="submission-error" role="alert">
                    <div className="state-icon error">!</div>
                    <div>
                        <strong>Run failed</strong>
                        <div>{runError}</div>
                    </div>
                </div>
            )}

            {report?.error && (
                <div className="submission-error" role="alert">
                    <div className="state-icon error">!</div>
                    <div>
                        <strong>
                            Your code didn't load
                            {report.error.line && ` (line ${report.error.line})`}
                        </strong>
                        <pre>{report.error.message}</pre>
                    </div>
                </div>
            )}

            <TestList challenge={challenge} report={report} />

            {canGiveUp && (
                <div className="give-up">
                    <span>Stuck? It happens to everyone.</span>
                    <button className="secondary-button" onClick={giveUp}>Show solution</button>
                </div>
            )}

            {(solved || gaveUp) && (
                <section className={`result-summary ${solved && !solved.gaveUp ? "success" : "failure"}`}>
                    <div className="result-icon">{solved ? "✓" : "?"}</div>

                    <div className="result-summary-content">
                        <span className="result-kicker">{solved ? "SOLVED" : "SOLUTION"}</span>

                        <h3>
                            {solved
                                ? `Fixed in ${solved.runs} run${solved.runs === 1 ? "" : "s"}.`
                                : "Here's what was wrong."}
                        </h3>

                        <p className="explanation">{challenge.explanation}</p>

                        <details className="solution" open={gaveUp && !solved}>
                            <summary>Reference solution</summary>
                            <pre><code>{challenge.solution}</code></pre>
                        </details>

                        {solved && !solved.gaveUp && (
                            <div className="share-row">
                                <button className="primary-button" onClick={shareResult}>
                                    Share result
                                </button>
                                {shareStatus && <span className="share-status" role="status">{shareStatus}</span>}
                            </div>
                        )}
                    </div>
                </section>
            )}
        </main>
    );
}

function TestList({ challenge, report }) {
    const results = report && !report.error ? report.results : null;
    const passed = results?.filter((test) => test.passed).length ?? 0;

    return (
        <section className="results-section" aria-live="polite">
            <div className="results-heading">
                <div>
                    <span className="eyebrow">TESTS</span>
                    <h2>
                        {!results
                            ? "Make these pass."
                            : passed === results.length
                                ? "All tests passed."
                                : "Not quite. Keep digging."}
                    </h2>
                </div>

                {results && (
                    <div className="results-count">
                        <strong>{passed}</strong>
                        <span>/</span>
                        <span>{results.length}</span>
                    </div>
                )}
            </div>

            <ol className="test-results">
                {challenge.tests.map((test, index) => {
                    const result = results?.[index];
                    const state = !result ? "pending" : result.passed ? "passed" : "failed";

                    return (
                        <li key={index} className={`test-result ${state}`}>
                            <div className="test-status" aria-hidden="true">
                                {state === "pending" ? index + 1 : state === "passed" ? "✓" : "×"}
                            </div>

                            <div className="test-info">
                                <code className="test-call">
                                    {callRepr(challenge.entry, test.args)}
                                    <span className="arrow"> → </span>
                                    {pyRepr(test.expected)}
                                </code>

                                {result && !result.passed && (
                                    <span className="test-detail">
                                        {result.error
                                            ? `${result.error.message}${result.error.line ? ` (line ${result.error.line})` : ""}`
                                            : `Got ${result.actual}`}
                                    </span>
                                )}

                                {result?.output && (
                                    <pre className="test-output" aria-label="Printed output">{result.output}</pre>
                                )}
                            </div>

                            <div className="test-result-state">
                                {state === "pending" ? "" : state === "passed" ? "PASS" : "FAIL"}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
