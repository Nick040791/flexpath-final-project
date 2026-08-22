jest.mock("../auth/AuthContext", () => ({
    useAuth: jest.fn(),
}));

jest.mock("../api/buildService", () => ({
    searchBuilds: jest.fn(),
    createBuild: jest.fn(),
    deleteBuild: jest.fn(),
}));

jest.mock("../components/SearchBar", () => ({
    __esModule: true,
    default: (props) => <search-bar {...props} />,
}));

jest.mock("../components/BuildCard", () => ({
    __esModule: true,
    default: (props) => <build-card {...props} />,
}));

jest.mock("../components/BuildForm", () => ({
    __esModule: true,
    default: (props) => <build-form {...props} />,
}));

jest.mock("../components/ConfirmDeleteModal", () => ({
    __esModule: true,
    default: (props) => <delete-modal {...props} />,
}));

jest.mock("../components/Pagination", () => ({
    __esModule: true,
    default: (props) => <pagination {...props} />,
}));

const { act, create } = require("react-test-renderer");
const BuildsPage = require("./BuildsPage").default;
const { useAuth } = require("../auth/AuthContext");
const service = require("../api/buildService");

function pageResult(content = [], overrides = {}) {
    return {
        content,
        page: 0,
        size: 12,
        totalElements: content.length,
        totalPages: content.length ? 1 : 0,
        ...overrides,
    };
}

describe("BuildsPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false,
        });
    });

    test("requires authentication", () => {
        useAuth.mockReturnValue({
            isAuthenticated: false,
            loading: false,
        });

        const renderer = create(<BuildsPage />);

        expect(
            renderer.root.findAll((node) =>
                node.children?.includes("Please log in to browse builds.")
            )
        ).not.toHaveLength(0);
    });

    test("loads paginated builds and applies ownership management", async () => {
        service.searchBuilds.mockResolvedValue(
            pageResult([
                { id: 1, username: "nick" },
                { id: 2, username: "other" },
            ])
        );

        let renderer;
        await act(async () => {
            renderer = create(<BuildsPage />);
        });

        expect(service.searchBuilds).toHaveBeenCalledWith({
            page: 0,
            size: 12,
        });

        const cards = renderer.root.findAllByType("build-card");
        expect(cards).toHaveLength(2);
        expect(cards[0].props.canManage).toBe(true);
        expect(cards[1].props.canManage).toBe(false);
    });

    test("new search resets to page zero and successful search becomes active query", async () => {
        service.searchBuilds
            .mockResolvedValueOnce(pageResult([]))
            .mockResolvedValueOnce(
                pageResult([{ id: 1, username: "nick" }], {
                    totalElements: 25,
                    totalPages: 3,
                })
            )
            .mockResolvedValueOnce(
                pageResult([{ id: 2, username: "nick" }], {
                    page: 1,
                    totalElements: 25,
                    totalPages: 3,
                })
            );

        let renderer;
        await act(async () => {
            renderer = create(<BuildsPage />);
        });

        const params = {
            search: "gaming",
            visibility: "Public",
            sortBy: "created_at",
            direction: "DESC",
        };

        await act(async () => {
            await renderer.root.findByType("search-bar").props.onSearch(params);
        });

        expect(service.searchBuilds).toHaveBeenLastCalledWith({
            ...params,
            page: 0,
            size: 12,
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

    test("failed reload shows the normalized error and keeps the last successful builds", async () => {
        service.searchBuilds
            .mockResolvedValueOnce(
                pageResult([{ id: 1, name: "Saved", username: "nick" }])
            )
            .mockRejectedValueOnce(
                Object.assign(new Error("Unable to reach the server. Check your connection and try again."), {
                    status: 0,
                })
            );

        let renderer;
        await act(async () => {
            renderer = create(<BuildsPage />);
        });

        await act(async () => {
            await renderer.root.findByType("search-bar").props.onSearch({
                search: "new query",
            });
        });

        expect(renderer.root.findAllByType("build-card")).toHaveLength(1);
        expect(
            renderer.root.findByProps({ className: "alert alert-danger" }).children
        ).toEqual([
            "Unable to reach the server. Check your connection and try again.",
        ]);
    });

    test("failed create keeps the form open for correction", async () => {
        service.searchBuilds.mockResolvedValue(pageResult([]));
        service.createBuild.mockRejectedValue(
            Object.assign(new Error("Please check the submitted values."), {
                status: 400,
            })
        );

        let renderer;
        await act(async () => {
            renderer = create(<BuildsPage />);
        });

        act(() => {
            renderer.root.findByType("button").props.onClick();
        });

        await act(async () => {
            await renderer.root.findByType("build-form").props.onSubmit({
                name: "",
            });
        });

        expect(renderer.root.findAllByType("build-form")).toHaveLength(1);
        expect(
            renderer.root.findByProps({ className: "alert alert-danger" }).children
        ).toEqual(["Please check the submitted values."]);
    });

    test("failed delete keeps confirmation open and shows the failure", async () => {
        service.searchBuilds.mockResolvedValue(
            pageResult([{ id: 1, name: "Build", username: "nick" }])
        );
        service.deleteBuild.mockRejectedValue(
            Object.assign(new Error("You are not authorized to do that."), {
                status: 403,
            })
        );

        let renderer;
        await act(async () => {
            renderer = create(<BuildsPage />);
        });

        act(() => {
            renderer.root.findByType("build-card").props.onDelete({
                id: 1,
                name: "Build",
            });
        });

        await act(async () => {
            await renderer.root.findByType("delete-modal").props.onConfirm();
        });

        expect(renderer.root.findAllByType("delete-modal")).toHaveLength(1);
        expect(
            renderer.root.findByProps({ className: "alert alert-danger" }).children
        ).toEqual(["You are not authorized to do that."]);
    });

    test("successful create and delete still refresh the current page", async () => {
        service.searchBuilds.mockResolvedValue(
            pageResult([{ id: 1, name: "Build", username: "nick" }])
        );
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
            await renderer.root.findByType("build-form").props.onSubmit({
                name: "New",
            });
        });

        act(() => {
            renderer.root.findByType("build-card").props.onDelete({
                id: 1,
                name: "Build",
            });
        });

        await act(async () => {
            await renderer.root.findByType("delete-modal").props.onConfirm();
        });

        expect(service.createBuild).toHaveBeenCalledWith({ name: "New" });
        expect(service.deleteBuild).toHaveBeenCalledWith(1);
        expect(service.searchBuilds).toHaveBeenCalledTimes(3);
    });
});
