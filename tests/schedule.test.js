import { describe, expect, it } from "vitest";
import {
    LAUNCH_DATE,
    challengeForDay,
    dateOfDay,
    dayNumber,
    isReleased,
    msUntilNextDay,
    releasedChallenges
} from "../src/lib/schedule";

const at = (iso) => new Date(iso);
const list = [{ id: 1 }, { id: 2 }, { id: 3 }];

describe("dayNumber", () => {
    it("is 0 on launch day, all day long (UTC)", () => {
        expect(dayNumber(at(`${LAUNCH_DATE}T00:00:00Z`))).toBe(0);
        expect(dayNumber(at(`${LAUNCH_DATE}T23:59:59Z`))).toBe(0);
    });

    it("counts whole UTC days since launch", () => {
        const launch = Date.parse(`${LAUNCH_DATE}T00:00:00Z`);
        expect(dayNumber(new Date(launch + 86_400_000))).toBe(1);
        expect(dayNumber(new Date(launch + 10 * 86_400_000 + 5000))).toBe(10);
    });

    it("never goes negative before launch", () => {
        expect(dayNumber(at("2000-01-01T00:00:00Z"))).toBe(0);
    });
});

describe("dateOfDay", () => {
    it("maps day numbers back to calendar dates", () => {
        expect(dateOfDay(0)).toBe(LAUNCH_DATE);
        expect(dayNumber(at(`${dateOfDay(42)}T12:00:00Z`))).toBe(42);
    });
});

describe("challengeForDay", () => {
    it("releases challenges in id order, then loops", () => {
        expect(challengeForDay(list, 0).id).toBe(1);
        expect(challengeForDay(list, 2).id).toBe(3);
        expect(challengeForDay(list, 3).id).toBe(1);
    });

    it("handles an empty list", () => {
        expect(challengeForDay([], 5)).toBeNull();
    });
});

describe("releases", () => {
    it("hides future challenges", () => {
        expect(isReleased(list, list[0], 0)).toBe(true);
        expect(isReleased(list, list[1], 0)).toBe(false);
        expect(isReleased(list, list[1], 1)).toBe(true);
    });

    it("lists released challenges newest first", () => {
        expect(releasedChallenges(list, 1).map((c) => c.id)).toEqual([2, 1]);
        expect(releasedChallenges(list, 99).map((c) => c.id)).toEqual([3, 2, 1]);
    });
});

describe("msUntilNextDay", () => {
    it("counts down to UTC midnight", () => {
        expect(msUntilNextDay(at(`${LAUNCH_DATE}T23:00:00Z`))).toBe(3_600_000);
    });
});
