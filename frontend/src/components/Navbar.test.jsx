jest.mock("../auth/AuthContext", () => ({
    useAuth: jest.fn()
}));

const { create } = require("react-test-renderer");
const { MemoryRouter } = require("react-router-dom");
const Navbar = require("./Navbar").default;
const { useAuth } = require("../auth/AuthContext");

function renderNavbar(auth) {
    useAuth.mockReturnValue({
        logout: jest.fn(),
        ...auth,
    });

    return create(
        <MemoryRouter>
            <Navbar />
        </MemoryRouter>
    );
}

describe("Navbar admin navigation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("shows the Admin link for an admin", () => {
        const renderer = renderNavbar({
            isAuthenticated: true,
            isAdmin: true,
            username: "admin",
        });

        const adminLinks = renderer.root.findAll(
            (node) => node.props?.to === "/admin"
        );

        expect(adminLinks).not.toHaveLength(0);
    });

    test("does not show the Admin link for a normal user", () => {
        const renderer = renderNavbar({
            isAuthenticated: true,
            isAdmin: false,
            username: "user",
        });

        const adminLinks = renderer.root.findAll(
            (node) => node.props?.to === "/admin"
        );

        expect(adminLinks).toHaveLength(0);
    });
});
