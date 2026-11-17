/*
 * The daily schedule.
 *
 * Day 0 is LAUNCH_DATE (UTC). Challenge N (sorted by id) is released on day
 * N - 1, so everyone in the world gets the same bug on the same day. Once
 * every challenge has been released, the list starts again from the top.
 */

export const LAUNCH_DATE = "2026-11-17";

const DAY_MS = 24 * 60 * 60 * 1000;

const LAUNCH_MS = Date.parse(`${LAUNCH_DATE}T00:00:00Z`);

/** Days since launch (UTC), never negative. */
export function dayNumber(now = new Date()) {
    return Math.max(0, Math.floor((now.getTime() - LAUNCH_MS) / DAY_MS));
}

/** The calendar date (YYYY-MM-DD, UTC) of a given day number. */
export function dateOfDay(day) {
    return new Date(LAUNCH_MS + day * DAY_MS).toISOString().slice(0, 10);
}

/** The challenge released on `day`. */
export function challengeForDay(challenges, day) {
    if (challenges.length === 0) return null;
    return challenges[day % challenges.length];
}

/** Index of a challenge in the release order. */
function releaseIndex(challenges, challenge) {
    return challenges.findIndex((c) => c.id === challenge.id);
}

/** The first day a challenge was (or will be) released. */
export function releaseDay(challenges, challenge) {
    return releaseIndex(challenges, challenge);
}

/** True when the challenge has been released on or before `day`. */
export function isReleased(challenges, challenge, day) {
    const index = releaseIndex(challenges, challenge);
    return index !== -1 && index <= day;
}

/** Released challenges, newest first. Future challenges stay hidden. */
export function releasedChallenges(challenges, day) {
    return challenges
        .filter((challenge) => isReleased(challenges, challenge, day))
        .reverse();
}

/** Milliseconds until the next UTC midnight. */
export function msUntilNextDay(now = new Date()) {
    const day = dayNumber(now);
    return LAUNCH_MS + (day + 1) * DAY_MS - now.getTime();
}
