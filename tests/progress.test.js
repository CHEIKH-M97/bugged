import { describe, expect, it } from "vitest";
import {
    currentStreak,
    emptyProgress,
    recordGiveUp,
    recordHint,
    recordRun,
    recordSolve
} from "../src/lib/progress";

const solveDaily = (state, id, day) => recordSolve(state, id, { day, isDaily: true });

describe("recordRun", () => {
    it("keeps at most the last 6 runs", () => {
        let state = emptyProgress;
        for (let i = 0; i < 8; i++) state = recordRun(state, 1, [i % 2 === 0]);
        expect(state.runs[1]).toHaveLength(6);
    });

    it("doesn't mutate the previous state", () => {
        const next = recordRun(emptyProgress, 1, [true]);
        expect(emptyProgress.runs).toEqual({});
        expect(next.runs[1]).toEqual([[true]]);
    });
});

describe("streaks", () => {
    it("starts at 1 and grows on consecutive days", () => {
        let state = solveDaily(emptyProgress, 1, 10);
        expect(state.streak).toBe(1);
        state = solveDaily(state, 2, 11);
        state = solveDaily(state, 3, 12);
        expect(state.streak).toBe(3);
        expect(state.bestStreak).toBe(3);
    });

    it("resets after a missed day but keeps the best", () => {
        let state = solveDaily(emptyProgress, 1, 10);
        state = solveDaily(state, 2, 11);
        state = solveDaily(state, 3, 13);
        expect(state.streak).toBe(1);
        expect(state.bestStreak).toBe(2);
    });

    it("ignores archive solves", () => {
        const state = recordSolve(emptyProgress, 1, { day: 10, isDaily: false });
        expect(state.solved[1]).toBeDefined();
        expect(state.streak).toBe(0);
    });

    it("doesn't count a bug after giving up", () => {
        let state = recordGiveUp(emptyProgress, 1);
        state = solveDaily(state, 1, 10);
        expect(state.streak).toBe(0);
        expect(state.solved[1].gaveUp).toBe(true);
    });

    it("counts solving the same challenge only once", () => {
        const once = solveDaily(emptyProgress, 1, 10);
        expect(solveDaily(once, 1, 10)).toBe(once);
    });

    it("is still alive the day after, and gone two days later", () => {
        const state = solveDaily(emptyProgress, 1, 10);
        expect(currentStreak(state, 10)).toBe(1);
        expect(currentStreak(state, 11)).toBe(1);
        expect(currentStreak(state, 12)).toBe(0);
        expect(currentStreak(emptyProgress, 0)).toBe(0);
    });
});

describe("recordSolve", () => {
    it("remembers runs and hint use", () => {
        let state = recordRun(emptyProgress, 1, [false]);
        state = recordHint(state, 1);
        state = recordRun(state, 1, [true]);
        state = solveDaily(state, 1, 0);
        expect(state.solved[1]).toMatchObject({ runs: 2, hintUsed: true, gaveUp: false, day: 0 });
    });
});
