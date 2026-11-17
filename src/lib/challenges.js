/*
 * Challenges live as JSON files in /challenges and are bundled at build time.
 * The file name sets nothing; the "id" field sets the release order.
 */

const modules = import.meta.glob("/challenges/*.json", {
    eager: true,
    import: "default"
});

export const challenges = Object.values(modules).sort((a, b) => a.id - b.id);

export function getChallenge(id) {
    return challenges.find((challenge) => String(challenge.id) === String(id)) ?? null;
}

export function formatId(id) {
    return `#${String(id).padStart(3, "0")}`;
}
