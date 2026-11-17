import { describe, expect, it } from "vitest";
import { callRepr, pyRepr } from "../src/lib/format";
import { shareText } from "../src/lib/share";

describe("pyRepr", () => {
    it("prints JSON values the way Python would", () => {
        expect(pyRepr(null)).toBe("None");
        expect(pyRepr(true)).toBe("True");
        expect(pyRepr(false)).toBe("False");
        expect(pyRepr(7.5)).toBe("7.5");
        expect(pyRepr("hi")).toBe("'hi'");
        expect(pyRepr([1, "a", null])).toBe("[1, 'a', None]");
        expect(pyRepr({ a: [true] })).toBe("{'a': [True]}");
    });

    it("quotes and escapes strings like Python", () => {
        expect(pyRepr("it's")).toBe('"it\'s"');
        expect(pyRepr("a\nb")).toBe("'a\\nb'");
        expect(pyRepr("both ' and \"")).toBe("'both \\' and \"'");
    });
});

describe("callRepr", () => {
    it("formats a function call", () => {
        expect(callRepr("chunk", [[1, 2, 3], 2])).toBe("chunk([1, 2, 3], 2)");
        expect(callRepr("now", [])).toBe("now()");
    });
});

describe("shareText", () => {
    it("draws one row of squares per run", () => {
        const text = shareText({
            label: "#007",
            runs: [[false, true], [true, true]],
            hintUsed: true,
            streak: 3,
            url: "https://example.com/"
        });

        expect(text).toBe(
            "Bugged #007 🐛 2 runs · 💡 hint\n🟥🟩\n🟩🟩\n🔥 3-day streak\nhttps://example.com/"
        );
    });

    it("skips the streak line below 2 days", () => {
        const text = shareText({ label: "#001", runs: [[true]], hintUsed: false, streak: 1, url: "u" });
        expect(text).toBe("Bugged #001 🐛 1 run\n🟩\nu");
    });
});
