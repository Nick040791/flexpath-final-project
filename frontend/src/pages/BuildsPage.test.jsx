jest.mock("../auth/AuthContext", () => ({
    useAuth: jest.fn()
}));

jest.mock("../api/buildService", () => ({
    searchBuilds: jest.fn(),
    createBuild: jest.fn(),
    deleteBuild: jest.fn()
}));

jest.mock("../utils/searchPreferences", () => ({
    readBuildPreferences: jest.fn(),
    writeBuildPreferences: jest.fn(),
    clearBuildPreferences: jest.fn(),
}));

jest.mock("../components/SearchBar", () => ({
    __esModule: true,
    default: (props) => <search-bar {...props} />
}));

jest.mock("../components/BuildCard", () => ({
    __esModule: true,
    default: (props) => <build-card {...props} />
}));

jest.mock("../components/BuildForm", () => ({
    __esModule: true,
    default: (props) => <build-form {...props} />
}));

jest.mock("../components/ConfirmDeleteModal", () => ({
    __esModule: true,
    default: (props) => <delete-modal {...props} />
}));

jest.mock("../components/Pagination", () => ({
    __esModule: true,
    default: (props) => <pagination {...props} />
}));

jest.mock("../components/Breadcrumbs", () => ({
    __esModule: true,
    default: (props) => <breadcrumbs {...props} />
}));

const { act, create } = require("react-test-renderer");
const BuildsPage = require("./BuildsPage").default;
const { useAuth } = require("../auth/AuthContext");
const service = require("../api/buildService");
const preferences = require("../utils/searchPreferences");

const emptyPage = {
    content: [],
    page: 0,
    size: 12,
    totalElements: 0,
    totalPages: 0,
};

describe("BuildsPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        preferences.readBuildPreferences.mockReturnValue({});
    });

    test("requires authentication", () => {
        useAuth.mockReturnValue({
            isAuthenticated: false,
            loading: false
        });

        const renderer = create(<BuildsPage />);

        expect(
            renderer.root.findAll(
                (node) => node.children?.includes("Please log in to browse builds.")
            )
        ).not.toHaveLength(0);
    });

    test("restores saved preferences after authentication and starts on page zero", async () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false
        });

        const restored = {
            search: "AI",
            visibility: "Public",
            owner: "admin",
            partCategory: "GPU",
            partSearch: "RTX",
            hasParts: "true",
            sortBy: "created_at",
            direction: "DESC",
        };

        preferences.readBuildPreferences.mockReturnValue(restored);
        service.searchBuilds.mockResolvedValue(emptyPage);

        let renderer;
        await act(async () => {
            renderer = create(<BuildsPage />);
        });

        expect(preferences.readBuildPreferences).toHaveBeenCalledWith("nick");
        expect(service.searchBuilds).toHaveBeenCalledWith({
            ...restored,
            page: 0,
            size: 12,
        });

        const searchBar = renderer.root.findByType("search-bar");
        expect(searchBar.props.initialValues).toEqual(restored);
    });

    test("exposes all Build filters and persists submitted searches", async () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false
        });
        service.searchBuilds.mockResolvedValue(emptyPage);

        let renderer;
        await act(async () => {
            renderer = create(<BuildsPage />);
        });

        const searchBar = renderer.root.findByType("search-bar");
        expect(searchBar.props.filters.map((filter) => filter.name)).toEqual([
            "visibility",
            "owner",
            "partCategory",
            "partSearch",
            "hasParts",
        ]);

        const params = {
            search: "gaming",
            visibility: "Public",
            owner: "alice",
            partCategory: "GPU",
            partSearch: "RTX",
            hasParts: "true",
            sortBy: "created_at",
            direction: "DESC",
        };

        await act(async () => {
            await searchBar.props.onSearch(params);
        });

        expect(preferences.writeBuildPreferences).toHaveBeenCalledWith("nick", params);
        expect(service.searchBuilds).toHaveBeenLastCalledWith({
            ...params,
            page: 0,
            size: 12,
        });
    });

    test("page changes preserve every active filter", async () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false
        });

        service.searchBuilds
            .mockResolvedValueOnce({ ...emptyPage, totalElements: 25, totalPages: 3 })
            .mockResolvedValueOnce({ ...emptyPage, totalElements: 25, totalPages: 3 })
            .mockResolvedValueOnce({ ...emptyPage, page: 1, totalElements: 25, totalPages: 3 });

        let renderer;
        await act(async () => {
            renderer = create(<BuildsPage />);
        });

        const params = {
            search: "gaming",
            visibility: "Public",
            owner: "alice",
            partCategory: "GPU",
            partSearch: "RTX",
            hasParts: "true",
            sortBy: "created_at",
            direction: "DESC",
        };

        await act(async () => {
            await renderer.root.findByType("search-bar").props.onSearch(params);
        });

        await act(async () => {
            await renderer.root.findByType("pagination").props.onPageChange(1);
        });

        expect(service.searchBuilds).toHaveBeenLastCalledWith({
            ...params,
            page: 1,
            size: 12,
        });
    });

    test("reset clears the user preference and reloads defaults on page zero", async () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false
        });
        service.searchBuilds.mockResolvedValue(emptyPage);

        let renderer;
        await act(async () => {
            renderer = create(<BuildsPage />);
        });

        await act(async () => {
            await renderer.root.findByType("search-bar").props.onReset();
        });

        expect(preferences.clearBuildPreferences).toHaveBeenCalledWith("nick");
        expect(service.searchBuilds).toHaveBeenLastCalledWith({
            page: 0,
            size: 12,
        });
    });

    test("loads paginated builds and applies ownership management", async () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false
        });

        service.searchBuilds.mockResolvedValue({
            content: [
                { id: 1, username: "nick" },
                { id: 2, username: "other" }
            ],
            page: 0,
            size: 12,
            totalElements: 2,
            totalPages: 1
        });

        let renderer;
        await act(async () => {
            renderer = create(<BuildsPage />);
        });

        const cards = renderer.root.findAllByType("build-card");
        expect(cards).toHaveLength(2);
        expect(cards[0].props.canManage).toBe(true);
        expect(cards[1].props.canManage).toBe(false);
    });

    test("creates and deletes builds then refreshes current page", async () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false
        });

        service.searchBuilds.mockResolvedValue({
            content: [{ id: 1, name: "Build", username: "nick" }],
            page: 0,
            size: 12,
            totalElements: 1,
            totalPages: 1
        });
        service.createBuild.mockResolvedValue({});
        service.deleteBuild.mockResolvedValue();

        let renderer;
        await act(async () => {
            renderer = create(<BuildsPage />);
        });

        act(() => {
            renderer.root.findByType("button").props.onClick();
        });

        await act(async () => {
            await renderer.root.findByType("build-form").props.onSubmit({ name: "New" });
        });
        expect(service.createBuild).toHaveBeenCalledWith({ name: "New" });

        act(() => {
            renderer.root.findByType("build-card").props.onDelete({ id: 1, name: "Build" });
        });

        await act(async () => {
            await renderer.root.findByType("delete-modal").props.onConfirm();
        });
        expect(service.deleteBuild).toHaveBeenCalledWith(1);
    });
});
