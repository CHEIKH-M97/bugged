import { Link } from "react-router";

import Difficulty from "../components/Difficulty";
import { challenges, formatId } from "../lib/challenges";
import { currentStreak, useProgress } from "../lib/progress";
import { challengeForDay, dateOfDay } from "../lib/schedule";
import { useCountdown, useDay } from "../lib/useDay";

export default function Home() {
    const day = useDay();
    const countdown = useCountdown();
    const progress = useProgress();

    const today = challengeForDay(challenges, day);
    const solvedToday = today && progress.solved[today.id];
    const solvedCount = Object.keys(progress.solved).length;

    return (
        <main className="home-page">
            <section className="hero">
                <div className="hero-badge">
                    <span>●</span>
                    DAILY DEBUGGING
                </div>

                <h1>
                    Find the bug.
                    <br />
                    Fix it<span>.</span>
                </h1>

                <p className="hero-description">
                    One broken Python function a day. Read it, find what's
                    wrong, make the tests pass. Runs right in your browser.
                </p>

                <div className="hero-actions">
                    {today && (
                        <Link to={`/challenge/${today.id}`} className="primary-button">
                            {solvedToday ? "Review today's bug" : "Start today's bug"}
                            <span>→</span>
                        </Link>
                    )}
                    <Link to="/archive" className="secondary-button">
                        Browse archive
                    </Link>
                </div>
            </section>

            <section className="today-preview">
                <div className="today-label">
                    <span>TODAY'S BUG</span>
                    <span className="challenge-date">{dateOfDay(day)} · next in {countdown}</span>
                </div>

                {today ? (
                    <Link to={`/challenge/${today.id}`} className="today-card">
                        <div className="today-card-label">
                            CHALLENGE {formatId(today.id)}
                            {solvedToday && <span className="badge success">Solved</span>}
                        </div>

                        <div className="today-card-main">
                            <div>
                                <div className="today-card-meta">
                                    <span className="eyebrow">{today.language}</span>
                                    <Difficulty level={today.difficulty} />
                                </div>
                                <h2>{today.title}</h2>
                                <p>{today.description}</p>
                            </div>
                            <div className="today-arrow">→</div>
                        </div>
                    </Link>
                ) : (
                    <div className="today-card">
                        <span className="eyebrow">NOTHING HERE</span>
                        <h2>No bugs yet.</h2>
                    </div>
                )}

                <dl className="stats">
                    <div>
                        <dt>Streak</dt>
                        <dd>🔥 {currentStreak(progress, day)}</dd>
                    </div>
                    <div>
                        <dt>Best</dt>
                        <dd>{progress.bestStreak}</dd>
                    </div>
                    <div>
                        <dt>Solved</dt>
                        <dd>{solvedCount}</dd>
                    </div>
                </dl>
            </section>

            <section className="philosophy">
                <div className="section-heading">
                    <span className="eyebrow">THE IDEA</span>
                    <h2>Simple by design.</h2>
                </div>

                <div className="philosophy-grid">
                    <article>
                        <div className="philosophy-number">01</div>
                        <h3>Real debugging</h3>
                        <p>
                            You don't write code from scratch. You start with
                            code that looks right and figure out why it isn't.
                        </p>
                    </article>

                    <article>
                        <div className="philosophy-number">02</div>
                        <h3>One bug a day</h3>
                        <p>
                            Small enough to fit in a coffee break. Every bug
                            comes with a hint and an explanation of what went wrong.
                        </p>
                    </article>

                    <article>
                        <div className="philosophy-number">03</div>
                        <h3>No sign-up</h3>
                        <p>
                            Python runs in your browser with WebAssembly. Your
                            streak is saved on your device. Nothing to install.
                        </p>
                    </article>
                </div>
            </section>
        </main>
    );
}
