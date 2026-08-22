import { BUILD_SORT_OPTIONS, PART_CATEGORIES } from "./constants";

const BUILD_PREFERENCES_PREFIX = "pc-parts-builds.preferences.";
const VALID_VISIBILITY = new Set(["Public", "Private"]);
const VALID_DIRECTIONS = new Set(["ASC", "DESC"]);
const VALID_HAS_PARTS = new Set(["true", "false"]);
const VALID_BUILD_SORTS = new Set(BUILD_SORT_OPTIONS.map((option) => option.value));

function getStorage() {
    try {
        if (typeof window === "undefined" || !window.localStorage) {
            return null;
        }
        return window.localStorage;
    } catch {
        return null;
    }
}

function preferenceKey(username) {
    return `${BUILD_PREFERENCES_PREFIX}${username}`;
}

function sanitizeBuildPreferences(query) {
    if (!query || typeof query !== "object" || Array.isArray(query)) {
        return {};
    }

    const result = {};

    if (typeof query.search === "string") {
        result.search = query.search;
    }

    if (VALID_VISIBILITY.has(query.visibility)) {
        result.visibility = query.visibility;
    }

    if (typeof query.owner === "string") {
        result.owner = query.owner;
    }

    if (PART_CATEGORIES.includes(query.partCategory)) {
        result.partCategory = query.partCategory;
    }

    if (typeof query.partSearch === "string") {
        result.partSearch = query.partSearch;
    }

    const hasParts = typeof query.hasParts === "boolean"
        ? String(query.hasParts)
        : query.hasParts;

    if (VALID_HAS_PARTS.has(hasParts)) {
        result.hasParts = hasParts;
    }

    if (VALID_BUILD_SORTS.has(query.sortBy)) {
        result.sortBy = query.sortBy;
    }

    if (VALID_DIRECTIONS.has(query.direction)) {
        result.direction = query.direction;
    }

    return result;
}

export function readBuildPreferences(username) {
    if (!username) {
        return {};
    }

    const storage = getStorage();
    if (!storage) {
        return {};
    }

    try {
        const raw = storage.getItem(preferenceKey(username));
        if (!raw) {
            return {};
        }

        return sanitizeBuildPreferences(JSON.parse(raw));
    } catch {
        return {};
    }
}

export function writeBuildPreferences(username, query) {
    if (!username) {
        return;
    }

    const storage = getStorage();
    if (!storage) {
        return;
    }

    try {
        storage.setItem(
            preferenceKey(username),
            JSON.stringify(sanitizeBuildPreferences(query))
        );
    } catch {
        // Storage can be unavailable or blocked. Search should still work normally.
    }
}

export function clearBuildPreferences(username) {
    if (!username) {
        return;
    }

    const storage = getStorage();
    if (!storage) {
        return;
    }

    try {
        storage.removeItem(preferenceKey(username));
    } catch {
        // Reset the UI even if browser storage is unavailable.
    }
}
