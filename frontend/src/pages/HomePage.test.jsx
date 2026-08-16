jest.mock("../auth/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("../api/partService", () => ({ searchParts: jest.fn() }));
jest.mock("../api/buildService", () => ({ searchBuilds: jest.fn() }));
jest.mock("../components/SearchBar", () => ({ __esModule: true, default: (props) => <search-bar {...props} /> }));
jest.mock("../components/PartCard", () => ({ __esModule: true, default: (props) => <part-card {...props} /> }));
jest.mock("../components/BuildCard", () => ({ __esModule: true, default: (props) => <build-card {...props} /> }));
jest.mock("react-router-dom", () => ({ Link: ({ to, children }) => <a href={to}>{children}</a> }));

const { act, create } = require("react-test-renderer");
const HomePage = require("./HomePage").default;
const { useAuth } = require("../auth/AuthContext");
const partService = require("../api/partService");
const buildService = require("../api/buildService");

describe("HomePage", () => {
    beforeEach(() => jest.clearAllMocks());

    test("shows authentication loading and login prompt states", () => {
        useAuth.mockReturnValue({ isAuthenticated: false, loading: true, username: null, isAdmin: false });
        let renderer = create(<HomePage />);
        expect(renderer.root.findAll((node) => node.children?.includes("Loading..."))).not.toHaveLength(0);
        useAuth.mockReturnValue({ isAuthenticated: false, loading: false, username: null, isAdmin: false });
        act(() => renderer.update(<HomePage />));
        expect(renderer.root.findByType("a").props.href).toBe("/login");
        expect(partService.searchParts).not.toHaveBeenCalled();
    });

    test("loads authenticated content and filters public build previews", async () => {
        useAuth.mockReturnValue({ isAuthenticated: true, loading: false, username: "nick", isAdmin: false });
        const parts = [{ id: 1, username: "nick" }, { id: 2, username: "other" }];
        partService.searchParts.mockResolvedValue(parts);
        buildService.searchBuilds.mockResolvedValue([
            { id: 1, is_Public: true }, { id: 2, is_Public: false }, { id: 3, is_Public: true },
        ]);
        let renderer;
        await act(async () => { renderer = create(<HomePage />); });
        expect(renderer.root.findAllByType("part-card")).toHaveLength(2);
        expect(renderer.root.findAllByType("build-card")).toHaveLength(2);
        const partCards = renderer.root.findAllByType("part-card");
        expect(partCards[0].props.canManage).toBe(true);
        expect(partCards[1].props.canManage).toBe(false);
    });

    test("runs searches and displays a search error", async () => {
        useAuth.mockReturnValue({ isAuthenticated: true, loading: false, username: "admin", isAdmin: true });
        partService.searchParts.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error("Search failed"));
        buildService.searchBuilds.mockResolvedValue([]);
        let renderer;
        await act(async () => { renderer = create(<HomePage />); });
        const searchBar = renderer.root.findByType("search-bar");
        await act(async () => searchBar.props.onSearch({ search: "GPU" }));
        expect(partService.searchParts).toHaveBeenLastCalledWith({ search: "GPU" });
        expect(renderer.root.findAll((node) => node.children?.includes("Search failed"))).not.toHaveLength(0);
    });
});