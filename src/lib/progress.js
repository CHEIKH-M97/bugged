/*
 * Player progress, kept in localStorage (no accounts).
 *
 * The update functions are pure (state in, state out) so they are easy to
 * test. The small store at the bottom persists them and lets React
 * components subscribe.
 */

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "bugged:progress:v1";

/** Run history kept per challenge, for the share grid. */
const MAX_RUNS = 6;

export const emptyProgress = Object.freeze({
    // id -> { solvedAt, day, runs, hintUsed, gaveUp }
    solved: {},
    // id -> array of runs, each run is an array of booleans (one per test)
    runs: {},
    // id -> true
    hints: {},
    // id -> true
    gaveUp: {},
    streak: 0,
    bestStreak: 0,
    // last day number on which the daily challenge was solved on its day
    lastDailyDay: null
});

/* ----------------------------------------------------------------------
   Pure updates
---------------------------------------------------------------------- */

export function recordRun(state, id, passes) {
    const runs = [...(state.runs[id] ?? []), passes].slice(-MAX_RUNS);
    return { ...state, runs: { ...state.runs, [id]: runs } };
}

export function recordHint(state, id) {
    return { ...state, hints: { ...state.hints, [id]: true } };
}

export function recordGiveUp(state, id) {
    return { ...state, gaveUp: { ...state.gaveUp, [id]: true } };
}

/**
 * Mark a challenge as solved.
 * `isDaily` is true when it is today's challenge, solved today: only those
 * count toward the streak, and only if the player didn't give up first.
 */
export function recordSolve(state, id, { day, isDaily }) {
    if (state.solved[id]) return state;

    const next = {
        ...state,
        solved: {
            ...state.solved,
            [id]: {
                solvedAt: new Date().toISOString(),
                day,
                runs: state.runs[id]?.length ?? 0,
                hintUsed: Boolean(state.hints[id]),
                gaveUp: Boolean(state.gaveUp[id])
            }
        }
    };

    if (!isDaily || state.gaveUp[id] || state.lastDailyDay === day) {
        return next;
    }

    const streak = state.lastDailyDay === day - 1 ? state.streak + 1 : 1;

    return {
        ...next,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        lastDailyDay: day
    };
}

/** The streak still counts if the last daily solve was today or yesterday. */
export function currentStreak(state, today) {
    if (state.lastDailyDay === null) return 0;
    return today - state.lastDailyDay <= 1 ? state.streak : 0;
}

/* ----------------------------------------------------------------------
   Store
---------------------------------------------------------------------- */

function read() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? { ...emptyProgress, ...JSON.parse(raw) } : emptyProgress;
    } catch {
        return emptyProgress;
    }
}

let state = typeof localStorage === "undefined" ? emptyProgress : read();
const listeners = new Set();

export function updateProgress(update) {
    state = update(state);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Private mode or storage full: progress lives for this session only.
    }

    for (const listener of listeners) listener();
}

function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function useProgress() {
    return useSyncExternalStore(subscribe, () => state, () => emptyProgress);
}
