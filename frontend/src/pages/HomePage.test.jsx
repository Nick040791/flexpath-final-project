jest.mock("../auth/AuthContext", () => ({
    useAuth: jest.fn(),
}));

jest.mock("../api/partService", () => ({
    searchParts: jest.fn(),
}));

jest.mock("../api/buildService", () => ({
    searchBuilds: jest.fn(),
}));

jest.mock("../components/SearchBar", () => ({
    __esModule: true,
    default: (props) => <search-bar {...props} />,
}));

jest.mock("../components/PartCard", () => ({
    __esModule: true,
    default: (props) => <part-card {...props} />,
}));

jest.mock("../components/BuildCard", () => ({
    __esModule: true,
    default: (props) => <build-card {...props} />,
}));

jest.mock("../components/Pagination", () => ({
    __esModule: true,
    default: (props) => <pagination {...props} />,
}));

jest.mock("react-router-dom", () => ({
    Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

const { act, create } = require("react-test-renderer");
const HomePage = require("./HomePage").default;
const { useAuth } = require("../auth/AuthContext");
const partService = require("../api/partService");
const buildService = require("../api/buildService");

function partPage(content = [], overrides = {}) {
    return {
        content,
        page: 0,
        size: 12,
        totalElements: content.length,
        totalPages: content.length ? 1 : 0,
        ...overrides,
    };
}

function buildPage(content = []) {
    return {
        content,
        page: 0,
        size: 4,
        totalElements: content.length,
        totalPages: content.length ? 1 : 0,
    };
}

describe("HomePage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("shows authentication loading and login prompt states", () => {
        useAuth.mockReturnValue({
            isAuthenticated: false,
            loading: true,
            username: null,
            isAdmin: false,
        });

        let renderer = create(<HomePage />);
        expect(
            renderer.root.findAll((node) => node.children?.includes("Loading..."))
        ).not.toHaveLength(0);

        useAuth.mockReturnValue({
            isAuthenticated: false,
            loading: false,
            username: null,
            isAdmin: false,
        });

        act(() => {
            renderer.update(<HomePage />);
        });

        expect(renderer.root.findByType("a").props.href).toBe("/login");
        expect(partService.searchParts).not.toHaveBeenCalled();
    });

    test("loads paginated parts and the public build preview", async () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false,
        });
        partService.searchParts.mockResolvedValue(
            partPage([
                { id: 1, username: "nick" },
                { id: 2, username: "other" },
            ])
        );
        buildService.searchBuilds.mockResolvedValue(
            buildPage([
                { id: 1, is_Public: true },
                { id: 3, is_Public: true },
            ])
        );

        let renderer;
        await act(async () => {
            renderer = create(<HomePage />);
        });

        expect(partService.searchParts).toHaveBeenCalledWith({
            page: 0,
            size: 12,
        });
        expect(buildService.searchBuilds).toHaveBeenCalledWith({
            visibility: "Public",
            page: 0,
            size: 4,
        });

        const partCards = renderer.root.findAllByType("part-card");
        expect(partCards).toHaveLength(2);
        expect(partCards[0].props.canManage).toBe(true);
        expect(partCards[1].props.canManage).toBe(false);
        expect(renderer.root.findAllByType("build-card")).toHaveLength(2);
    });

    test("successful search becomes the active query for pagination", async () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false,
        });
        partService.searchParts
            .mockResolvedValueOnce(partPage([]))
            .mockResolvedValueOnce(
                partPage([], { totalElements: 25, totalPages: 3 })
            )
            .mockResolvedValueOnce(
                partPage([], { page: 1, totalElements: 25, totalPages: 3 })
            );
        buildService.searchBuilds.mockResolvedValue(buildPage([]));

        let renderer;
        await act(async () => {
            renderer = create(<HomePage />);
        });

        const params = {
            search: "RTX",
            category: "GPU",
            brand: "NVIDIA",
            maxPrice: "800",
            sortBy: "price",
            direction: "ASC",
        };

        await act(async () => {
            await renderer.root.findByType("search-bar").props.onSearch(params);
        });

        expect(partService.searchParts).toHaveBeenLastCalledWith({
            ...params,
            page: 0,
            size: 12,
        });

        await act(async () => {
            await renderer.root.findByType("pagination").props.onPageChange(1);
        });

        expect(partService.searchParts).toHaveBeenLastCalledWith({
            ...params,
            page: 1,
            size: 12,
        });
    });

    test("failed part search keeps prior results and shows a visible normalized error", async () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false,
        });
        partService.searchParts
            .mockResolvedValueOnce(
                partPage([{ id: 1, name: "GPU", username: "nick" }])
            )
            .mockRejectedValueOnce(
                Object.assign(new Error("Something went wrong on the server. Please try again."), {
                    status: 500,
                })
            );
        buildService.searchBuilds.mockResolvedValue(buildPage([]));

        let renderer;
        await act(async () => {
            renderer = create(<HomePage />);
        });

        await act(async () => {
            await renderer.root.findByType("search-bar").props.onSearch({
                search: "broken query",
            });
        });

        expect(renderer.root.findAllByType("part-card")).toHaveLength(1);
        expect(
            renderer.root.findByProps({
                className: "alert alert-danger mb-0",
            }).children
        ).toEqual(["Something went wrong on the server. Please try again."]);
    });

    test("failed public build preview is not presented as an empty data set", async () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false,
        });
        partService.searchParts.mockResolvedValue(partPage([]));
        buildService.searchBuilds.mockRejectedValue(
            Object.assign(
                new Error("Unable to reach the server. Check your connection and try again."),
                { status: 0 }
            )
        );

        let renderer;
        await act(async () => {
            renderer = create(<HomePage />);
        });

        const alerts = renderer.root.findAllByProps({
            className: "alert alert-danger",
        });
        expect(alerts).toHaveLength(1);
        expect(alerts[0].children).toEqual([
            "Unable to reach the server. Check your connection and try again.",
        ]);
        expect(
            renderer.root.findAll((node) =>
                node.children?.includes("No public builds yet.")
            )
        ).toHaveLength(0);
    });
});
