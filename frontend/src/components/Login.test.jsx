jest.mock("../auth/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("react-router-dom", () => ({ useNavigate: jest.fn() }));

const { act, create } = require("react-test-renderer");
const Login = require("./Login").default;
const { useAuth } = require("../auth/AuthContext");
const { useNavigate } = require("react-router-dom");

function findInputs(renderer) {
    return renderer.root.findAllByType("input");
}

describe("Login", () => {
    const login = jest.fn();
    const logout = jest.fn();
    const navigate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(navigate);
        useAuth.mockReturnValue({ login, logout, isAuthenticated: false, username: null });
    });

    test("updates credentials and logs in successfully", async () => {
        login.mockResolvedValue();
        const renderer = create(<Login />);
        const [username, password] = findInputs(renderer);
        act(() => username.props.onChange({ target: { value: "nick" } }));
        act(() => password.props.onChange({ target: { value: "secret" } }));
        await act(async () => {
            await renderer.root.findByType("form").props.onSubmit({ preventDefault: jest.fn() });
        });
        expect(login).toHaveBeenCalledWith("nick", "secret");
        expect(navigate).toHaveBeenCalledWith("/");
        const button = renderer.root.findByType("button");
        expect(button.props.disabled).toBe(false);
        expect(button.children).toEqual(["Login"]);
    });

    test("displays the login error and does not navigate", async () => {
        login.mockRejectedValue(new Error("Invalid credentials"));
        const renderer = create(<Login />);
        await act(async () => {
            await renderer.root.findByType("form").props.onSubmit({ preventDefault: jest.fn() });
        });
        const alert = renderer.root.find((node) => node.props.className === "alert alert-danger");
        expect(alert.children).toEqual(["Invalid credentials"]);
        expect(navigate).not.toHaveBeenCalled();
    });

    test("uses a fallback message when login rejects without a message", async () => {
        login.mockRejectedValue({});
        const renderer = create(<Login />);
        await act(async () => {
            await renderer.root.findByType("form").props.onSubmit({ preventDefault: jest.fn() });
        });
        const alert = renderer.root.find((node) => node.props.className === "alert alert-danger");
        expect(alert.children).toEqual(["Login failed."]);
    });

    test("renders the authenticated state and logs out", () => {
        useAuth.mockReturnValue({ login, logout, isAuthenticated: true, username: "nick" });
        const renderer = create(<Login />);
        expect(renderer.root.findByType("p").children).toEqual(["Welcome, ", "nick", "!"]);
        const button = renderer.root.findByType("button");
        expect(button.children).toEqual(["Logout"]);
        act(() => button.props.onClick());
        expect(logout).toHaveBeenCalledTimes(1);
    });
});