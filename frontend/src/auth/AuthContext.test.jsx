jest.mock("../api/client", () => ({ getToken: jest.fn(), clearAuth: jest.fn() }));
jest.mock("../api/authService", () => ({ login: jest.fn(), getProfile: jest.fn(), getRoles: jest.fn() }));

const { act, create } = require("react-test-renderer");
const { AuthProvider, useAuth } = require("./AuthContext");
const { clearAuth, getToken } = require("../api/client");
const authService = require("../api/authService");

let auth;
function Consumer() {
    auth = useAuth();
    return null;
}

async function renderProvider() {
    let renderer;
    await act(async () => {
        renderer = create(<AuthProvider><Consumer /></AuthProvider>);
    });
    return renderer;
}

describe("AuthContext", () => {
    beforeEach(() => {
        auth = undefined;
        global.localStorage = { setItem: jest.fn() };
        jest.clearAllMocks();
    });

    afterEach(() => {
        delete global.localStorage;
    });

    test("finishes loading unauthenticated when no token exists", async () => {
        getToken.mockReturnValue(null);
        await renderProvider();
        expect(auth).toEqual(expect.objectContaining({ user: null, username: null, roles: [], isAdmin: false, isAuthenticated: false, loading: false }));
    });

    test.each([["ADMIN"], ["ROLE_ADMIN"]])("restores an admin session for %s", async (adminRole) => {
        getToken.mockReturnValue("token");
        authService.getProfile.mockResolvedValue({ username: "admin" });
        authService.getRoles.mockResolvedValue([adminRole]);
        await renderProvider();
        expect(auth).toEqual(expect.objectContaining({ username: "admin", roles: [adminRole], isAdmin: true, isAuthenticated: true, loading: false }));
    });

    test("clears invalid restored authentication", async () => {
        getToken.mockReturnValue("expired");
        authService.getProfile.mockRejectedValue(new Error("expired"));
        authService.getRoles.mockResolvedValue([]);
        await renderProvider();
        expect(clearAuth).toHaveBeenCalledTimes(1);
        expect(auth.user).toBeNull();
        expect(auth.loading).toBe(false);
    });

    test("logs in, stores the token, and then logs out", async () => {
        getToken.mockReturnValue(null);
        authService.login.mockResolvedValue("new-token");
        authService.getRoles.mockResolvedValue(["USER"]);
        await renderProvider();
        await act(async () => auth.login("nick", "password"));
        expect(authService.login).toHaveBeenCalledWith("nick", "password");
        expect(localStorage.setItem).toHaveBeenCalledWith("token", "new-token");
        expect(auth).toEqual(expect.objectContaining({ username: "nick", roles: ["USER"], isAuthenticated: true, isAdmin: false }));
        act(() => auth.logout());
        expect(clearAuth).toHaveBeenCalled();
        expect(auth.user).toBeNull();
    });

    test("throws when useAuth is used outside AuthProvider", () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
        try {
            expect(() => create(<Consumer />)).toThrow("useAuth must be used inside of AuthProvider");
        } finally {
            consoleError.mockRestore();
        }
    });
});