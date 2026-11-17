import { useState } from "react";
import { Link } from "react-router";

import Difficulty from "../components/Difficulty";
import { challenges, formatId } from "../lib/challenges";
import { useProgress } from "../lib/progress";
import { dateOfDay, releaseDay, releasedChallenges } from "../lib/schedule";
import { useDay } from "../lib/useDay";

const FILTERS = ["all", 1, 2, 3, 4, 5];

export default function Archive() {
    const day = useDay();
    const progress = useProgress();
    const [filter, setFilter] = useState("all");

    const released = releasedChallenges(challenges, day);
    const visible = filter === "all"
        ? released
        : released.filter((challenge) => challenge.difficulty === filter);

    return (
        <main className="archive-page">
            <section className="archive-heading">
                <span className="eyebrow">THE COLLECTION</span>
                <h1>Archive</h1>
                <p>
                    Every bug released so far. {Object.keys(progress.solved).length} of{" "}
                    {released.length} fixed.
                </p>
            </section>

            <div className="archive-filters" role="group" aria-label="Filter by difficulty">
                {FILTERS.map((value) => (
                    <button
                        key={value}
                        className={filter === value ? "filter active" : "filter"}
                        aria-pressed={filter === value}
                        onClick={() => setFilter(value)}
                    >
                        {value === "all" ? "All" : "★".repeat(value)}
                    </button>
                ))}
            </div>

            <div className="archive-list">
                {visible.length === 0 ? (
                    <div className="empty-state">No challenges at this difficulty yet.</div>
                ) : (
                    visible.map((challenge) => (
                        <Link key={challenge.id} to={`/challenge/${challenge.id}`} className="archive-card">
                            <div className="archive-card-number">{formatId(challenge.id)}</div>

                            <div className="archive-card-content">
                                <div className="archive-card-top">
                                    <h2>{challenge.title}</h2>
                                    <Difficulty level={challenge.difficulty} />
                                </div>

                                <p>{challenge.description}</p>

                                <div className="archive-card-bottom">
                                    <span>{dateOfDay(releaseDay(challenges, challenge))}</span>
                                    {progress.solved[challenge.id] ? (
                                        <span className="badge success">✓ Solved</span>
                                    ) : (
                                        <span className="solve-link">Solve →</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </main>
    );
}
