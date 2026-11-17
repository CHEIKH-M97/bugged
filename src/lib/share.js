/*
 * Wordle-style share text. One line per run, one square per test:
 *
 *   Bugged #012 🐛 3 runs
 *   🟥🟩🟩
 *   🟥🟥🟩
 *   🟩🟩🟩
 *   🔥 4-day streak
 */

export function shareText({ label, runs, hintUsed, streak, url }) {
    const lines = [`Bugged ${label} 🐛 ${runs.length} run${runs.length === 1 ? "" : "s"}${hintUsed ? " · 💡 hint" : ""}`];

    for (const run of runs) {
        lines.push(run.map((passed) => (passed ? "🟩" : "🟥")).join(""));
    }

    if (streak > 1) lines.push(`🔥 ${streak}-day streak`);

    lines.push(url);

    return lines.join("\n");
}

/** Uses the native share sheet on phones, the clipboard elsewhere. */
export async function share(text) {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        try {
            await navigator.share({ text });
            return "shared";
        } catch {
            // Cancelled: fall back to copying.
        }
    }

    await navigator.clipboard.writeText(text);
    return "copied";
}
