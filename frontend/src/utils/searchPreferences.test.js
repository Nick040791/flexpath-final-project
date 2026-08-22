import {
    clearBuildPreferences,
    readBuildPreferences,
    writeBuildPreferences,
} from "./searchPreferences";

function makeStorage() {
    const data = new Map();

    return {
        getItem: jest.fn((key) => data.has(key) ? data.get(key) : null),
        setItem: jest.fn((key, value) => data.set(key, value)),
        removeItem: jest.fn((key) => data.delete(key)),
        data,
    };
}

describe("Build search preferences", () => {
    let originalWindow;
    let storage;

    beforeEach(() => {
        originalWindow = global.window;
        storage = makeStorage();
        global.window = { localStorage: storage };
    });

    afterEach(() => {
        global.window = originalWindow;
    });

    test("stores supported query fields per username without page or size", () => {
        writeBuildPreferences("alice", {
            search: "AI",
            visibility: "Public",
            owner: "admin",
            partCategory: "GPU",
            partSearch: "RTX",
            hasParts: "true",
            sortBy: "created_at",
            direction: "DESC",
            page: 4,
            size: 50,
            unsupported: "ignore-me",
        });

        const restored = readBuildPreferences("alice");

        expect(restored).toEqual({
            search: "AI",
            visibility: "Public",
            owner: "admin",
            partCategory: "GPU",
            partSearch: "RTX",
            hasParts: "true",
            sortBy: "created_at",
            direction: "DESC",
        });
        expect(restored.page).toBeUndefined();
        expect(restored.size).toBeUndefined();
    });

    test("different users use different storage keys", () => {
        writeBuildPreferences("alice", { search: "alice search" });
        writeBuildPreferences("bob", { search: "bob search" });

        expect(readBuildPreferences("alice").search).toBe("alice search");
        expect(readBuildPreferences("bob").search).toBe("bob search");
    });

    test("stale enum values are rejected safely", () => {
        storage.data.set(
            "pc-parts-builds.preferences.alice",
            JSON.stringify({
                partCategory: "NOT_A_CATEGORY",
                sortBy: "DROP TABLE builds",
                direction: "SIDEWAYS",
                visibility: "Hidden",
                hasParts: "maybe",
                search: "valid text",
            })
        );

        expect(readBuildPreferences("alice")).toEqual({ search: "valid text" });
    });

    test("corrupt JSON falls back to an empty query", () => {
        storage.data.set("pc-parts-builds.preferences.alice", "{not-json");
        expect(readBuildPreferences("alice")).toEqual({});
    });

    test("clear removes only the selected user's preference", () => {
        writeBuildPreferences("alice", { search: "one" });
        writeBuildPreferences("bob", { search: "two" });

        clearBuildPreferences("alice");

        expect(readBuildPreferences("alice")).toEqual({});
        expect(readBuildPreferences("bob")).toEqual({ search: "two" });
    });
});
