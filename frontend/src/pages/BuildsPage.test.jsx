jest.mock("../auth/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("../api/buildService", () => ({ searchBuilds: jest.fn(), createBuild: jest.fn(), deleteBuild: jest.fn() }));
jest.mock("../components/SearchBar", () => ({ __esModule: true, default: (props) => <search-bar {...props} /> }));
jest.mock("../components/BuildCard", () => ({ __esModule: true, default: (props) => <build-card {...props} /> }));
jest.mock("../components/BuildForm", () => ({ __esModule: true, default: (props) => <build-form {...props} /> }));
jest.mock("../components/ConfirmDeleteModal", () => ({ __esModule: true, default: (props) => <delete-modal {...props} /> }));

const { act, create } = require("react-test-renderer");
const BuildsPage = require("./BuildsPage").default;
const { useAuth } = require("../auth/AuthContext");
const service = require("../api/buildService");

describe("BuildsPage", () => {
    beforeEach(() => jest.clearAllMocks());

    test("requires authentication", () => {
        useAuth.mockReturnValue({ isAuthenticated: false, loading: false });
        const renderer = create(<BuildsPage />);
        expect(renderer.root.findAll((node) => node.children?.includes("Please log in to browse builds."))).not.toHaveLength(0);
    });

    test("loads builds and applies ownership management", async () => {
        useAuth.mockReturnValue({ isAuthenticated: true, loading: false, username: "nick", isAdmin: false });
        service.searchBuilds.mockResolvedValue([{ id: 1, username: "nick" }, { id: 2, username: "other" }]);
        let renderer;
        await act(async () => { renderer = create(<BuildsPage />); });
        const cards = renderer.root.findAllByType("build-card");
        expect(cards).toHaveLength(2);
        expect(cards[0].props.canManage).toBe(true);
        expect(cards[1].props.canManage).toBe(false);
    });

    test("creates and deletes builds then refreshes", async () => {
        useAuth.mockReturnValue({ isAuthenticated: true, loading: false, username: "nick", isAdmin: false });
        service.searchBuilds.mockResolvedValue([{ id: 1, name: "Build", username: "nick" }]);
        service.createBuild.mockResolvedValue({});
        service.deleteBuild.mockResolvedValue();
        let renderer;
        await act(async () => { renderer = create(<BuildsPage />); });
        const newButton = renderer.root.findByType("button");
        act(() => newButton.props.onClick());
        await act(async () => renderer.root.findByType("build-form").props.onSubmit({ name: "New" }));
        expect(service.createBuild).toHaveBeenCalledWith({ name: "New" });
        act(() => renderer.root.findByType("build-card").props.onDelete({ id: 1, name: "Build" }));
        await act(async () => renderer.root.findByType("delete-modal").props.onConfirm());
        expect(service.deleteBuild).toHaveBeenCalledWith(1);
        expect(service.searchBuilds).toHaveBeenCalledTimes(3);
    });
});