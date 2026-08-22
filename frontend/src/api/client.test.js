import { API_BASE, ApiError, apiFetch, clearAuth, getToken } from "./client";

function response({ status = 200, ok = true, text = "" } = {}) {
    return {
        status,
        ok,
        text: jest.fn().mockResolvedValue(text),
    };
}

describe("API client", () => {
    let storage;
    let assign;

    beforeEach(() => {
        storage = new Map();
        global.localStorage = {
            getItem: jest.fn((key) => storage.get(key) ?? null),
            setItem: jest.fn((key, value) => storage.set(key, value)),
            removeItem: jest.fn((key) => storage.delete(key)),
        };
        assign = jest.fn();
        global.window = { location: { pathname: "/parts", assign } };
        global.fetch = jest.fn();
    });

    afterEach(() => {
        delete global.localStorage;
        delete global.window;
        delete global.fetch;
    });

    test("reads and clears the stored token", () => {
        storage.set("token", "jwt-token");
        expect(getToken()).toBe("jwt-token");
        clearAuth();
        expect(localStorage.removeItem).toHaveBeenCalledWith("token");
        expect(getToken()).toBeNull();
    });

    test("adds authentication and serializes a JSON request body", async () => {
        storage.set("token", "jwt-token");
        fetch.mockResolvedValue(response({ text: '{"id":7}' }));

        await expect(
            apiFetch("/api/parts", {
                method: "POST",
                body: { name: "GPU" },
            })
        ).resolves.toEqual({ id: 7 });

        expect(fetch).toHaveBeenCalledWith(`${API_BASE}/api/parts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer jwt-token",
            },
            body: JSON.stringify({ name: "GPU" }),
        });
    });

    test("returns null for 204 and blank successful responses", async () => {
        fetch.mockResolvedValueOnce(response({ status: 204 }));
        await expect(
            apiFetch("/api/parts/7", { method: "DELETE" })
        ).resolves.toBeNull();

        fetch.mockResolvedValueOnce(
            response({ status: 201, text: "   " })
        );
        await expect(
            apiFetch("/api/builds/2/parts/7", { method: "POST" })
        ).resolves.toBeNull();
    });

    test("uses a safe backend validation reason for 400", async () => {
        fetch.mockResolvedValue(
            response({
                status: 400,
                ok: false,
                text: JSON.stringify({ reason: "Price must be zero or greater." }),
            })
        );

        await expect(apiFetch("/api/parts")).rejects.toEqual(
            expect.objectContaining({
                status: 400,
                message: "Price must be zero or greater.",
            })
        );
    });

    test("falls back to a validation message when 400 has no usable reason", async () => {
        fetch.mockResolvedValue(
            response({
                status: 400,
                ok: false,
                text: JSON.stringify({ timestamp: "now" }),
            })
        );

        await expect(apiFetch("/api/parts")).rejects.toEqual(
            expect.objectContaining({
                status: 400,
                message: "Please check the submitted values.",
            })
        );
    });

    test("clears auth, redirects, and throws ApiError for 401", async () => {
        storage.set("token", "expired");
        fetch.mockResolvedValue(response({ status: 401, ok: false }));

        await expect(apiFetch("/api/parts")).rejects.toEqual(
            expect.objectContaining({
                status: 401,
                message: "Please log in to continue.",
            })
        );

        expect(localStorage.removeItem).toHaveBeenCalledWith("token");
        expect(assign).toHaveBeenCalledWith("/login");
    });

    test("does not redirect a 401 when already on the login page", async () => {
        window.location.pathname = "/login";
        fetch.mockResolvedValue(response({ status: 401, ok: false }));

        await expect(apiFetch("/api/auth/me")).rejects.toBeInstanceOf(ApiError);
        expect(assign).not.toHaveBeenCalled();
    });

    test("403 stays on the current page and is normalized", async () => {
        fetch.mockResolvedValue(response({ status: 403, ok: false }));

        await expect(apiFetch("/api/parts")).rejects.toEqual(
            expect.objectContaining({
                status: 403,
                message: "You are not authorized to do that.",
            })
        );

        expect(assign).not.toHaveBeenCalled();
    });

    test("404 becomes a not-found ApiError", async () => {
        fetch.mockResolvedValue(response({ status: 404, ok: false }));

        await expect(apiFetch("/api/parts/999")).rejects.toEqual(
            expect.objectContaining({
                status: 404,
                message: "The requested item was not found.",
            })
        );
    });

    test("500+ becomes a non-technical server ApiError", async () => {
        fetch.mockResolvedValue(
            response({
                status: 500,
                ok: false,
                text: JSON.stringify({ message: "SQLException: secret details" }),
            })
        );

        await expect(apiFetch("/api/parts")).rejects.toEqual(
            expect.objectContaining({
                status: 500,
                message: "Something went wrong on the server. Please try again.",
            })
        );
    });

    test("rejected fetch becomes network ApiError status 0", async () => {
        fetch.mockRejectedValue(new TypeError("Failed to fetch"));

        await expect(apiFetch("/api/parts")).rejects.toEqual(
            expect.objectContaining({
                status: 0,
                message: "Unable to reach the server. Check your connection and try again.",
            })
        );
    });

    test("malformed successful JSON becomes ApiError instead of SyntaxError", async () => {
        fetch.mockResolvedValue(response({ status: 200, text: "{not-json" }));

        await expect(apiFetch("/api/parts/7")).rejects.toEqual(
            expect.objectContaining({
                status: 200,
                message: "The server returned an invalid response. Please try again.",
            })
        );
    });
});
