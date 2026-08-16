import { API_BASE, ApiError, apiFetch, clearAuth, getToken } from "./client";

function response({ status = 200, ok = true, text = "" } = {}) {
    return { status, ok, text: jest.fn().mockResolvedValue(text) };
}

describe("API client", () => {
    let storage;
    let assign;

    beforeEach(() => {
        storage = new Map();
        global.localStorage = {
            getItem: jest.fn((key) => storage.get(key) ?? null),
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
        await expect(apiFetch("/api/parts", { method: "POST", body: { name: "GPU" } })).resolves.toEqual({ id: 7 });
        expect(fetch).toHaveBeenCalledWith(`${API_BASE}/api/parts`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer jwt-token" },
            body: JSON.stringify({ name: "GPU" }),
        });
    });

    test("returns null for no-content and blank successful responses", async () => {
        fetch.mockResolvedValueOnce(response({ status: 204 }));
        await expect(apiFetch("/api/parts/7", { method: "DELETE" })).resolves.toBeNull();
        fetch.mockResolvedValueOnce(response({ status: 201, text: "   " }));
        await expect(apiFetch("/api/builds/2/parts/7", { method: "POST" })).resolves.toBeNull();
    });

    test("clears auth, redirects, and throws ApiError for 401", async () => {
        storage.set("token", "expired");
        fetch.mockResolvedValue(response({ status: 401, ok: false }));
        await expect(apiFetch("/api/parts")).rejects.toEqual(
            expect.objectContaining({ status: 401, message: "Please log in to continue." })
        );
        expect(localStorage.removeItem).toHaveBeenCalledWith("token");
        expect(assign).toHaveBeenCalledWith("/login");
    });

    test("does not redirect a 401 response when already on the login page", async () => {
        window.location.pathname = "/login";
        fetch.mockResolvedValue(response({ status: 401, ok: false }));
        await expect(apiFetch("/api/auth/me")).rejects.toBeInstanceOf(ApiError);
        expect(assign).not.toHaveBeenCalled();
    });

    test.each([
        [403, "You are not authorized to do that."],
        [500, "Request failed with status 500."],
    ])("normalizes a %i error", async (status, message) => {
        fetch.mockResolvedValue(response({ status, ok: false }));
        await expect(apiFetch("/api/parts")).rejects.toEqual(
            expect.objectContaining({ status, message })
        );
    });
});