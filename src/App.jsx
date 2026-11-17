import { HashRouter, Link, Navigate, Route, Routes } from "react-router";

import Archive from "./pages/Archive";
import ChallengePage from "./pages/Challenge";
import Home from "./pages/Home";
import { currentStreak, useProgress } from "./lib/progress";
import { useDay } from "./lib/useDay";

const REPO_URL = "https://github.com/CHEIKH-M97/bugged";

function Layout({ children }) {
    const progress = useProgress();
    const streak = currentStreak(progress, useDay());

    return (
        <div className="app">
            <header className="site-header">
                <Link to="/" className="logo">
                    BUGGED<span>.</span>
                </Link>

                <nav>
                    {streak > 0 && (
                        <span className="header-streak" title={`${streak}-day streak`}>
                            🔥 {streak}
                        </span>
                    )}
                    <Link to="/">Today</Link>
                    <Link to="/archive">Archive</Link>
                    <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
                </nav>
            </header>

            {children}

            <footer className="site-footer">
                <div>
                    <strong>BUGGED</strong>
                    <span>Daily debugging</span>
                </div>
                <div>
                    Open source ·{" "}
                    <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
                </div>
            </footer>
        </div>
    );
}

/*
 * HashRouter (URLs like /#/challenge/3) because the app is hosted as a static
 * site on GitHub Pages, which can't rewrite deep links to index.html.
 */
export default function App() {
    return (
        <HashRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/archive" element={<Archive />} />
                    <Route path="/challenge/:id" element={<ChallengePage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </HashRouter>
    );
}
