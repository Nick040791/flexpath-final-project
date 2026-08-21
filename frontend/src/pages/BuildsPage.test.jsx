jest.mock("../auth/AuthContext", () => ({
    useAuth: jest.fn()
}));

jest.mock("../api/buildService", () => ({
    searchBuilds: jest.fn(),
    createBuild: jest.fn(),
    deleteBuild: jest.fn()
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


const { act, create } = require("react-test-renderer");
const BuildsPage = require("./BuildsPage").default;
const { useAuth } = require("../auth/AuthContext");
const service = require("../api/buildService");


describe("BuildsPage", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });


    test("requires authentication", () => {

        useAuth.mockReturnValue({
            isAuthenticated: false,
            loading: false
        });

        const renderer = create(<BuildsPage />);

        expect(
            renderer.root.findAll(
                (node) =>
                    node.children?.includes(
                        "Please log in to browse builds."
                    )
            )
        ).not.toHaveLength(0);
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
                {
                    id: 1,
                    username: "nick"
                },
                {
                    id: 2,
                    username: "other"
                }
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


        expect(service.searchBuilds)
            .toHaveBeenCalledWith({
                page: 0,
                size: 12
            });


        const cards =
            renderer.root.findAllByType("build-card");

        expect(cards).toHaveLength(2);

        expect(
            cards[0].props.canManage
        ).toBe(true);

        expect(
            cards[1].props.canManage
        ).toBe(false);


        const pagination =
            renderer.root.findByType("pagination");

        expect(
            pagination.props.page
        ).toBe(0);

        expect(
            pagination.props.totalPages
        ).toBe(1);
    });


    test("exposes visibility filter and new search resets page to zero", async () => {

        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false
        });

        service.searchBuilds.mockResolvedValue({
            content: [],
            page: 0,
            size: 12,
            totalElements: 0,
            totalPages: 0
        });


        let renderer;

        await act(async () => {
            renderer = create(<BuildsPage />);
        });


        const searchBar =
            renderer.root.findByType("search-bar");


        expect(searchBar.props.filters).toEqual([
            {
                name: "visibility",
                label: "Visibility",
                type: "select",
                options: ["Public", "Private"]
            }
        ]);


        const params = {
            search: "gaming",
            visibility: "Public",
            sortBy: "name",
            direction: "ASC"
        };


        await act(async () => {
            await searchBar.props.onSearch(params);
        });


        expect(service.searchBuilds)
            .toHaveBeenLastCalledWith({
                search: "gaming",
                visibility: "Public",
                sortBy: "name",
                direction: "ASC",
                page: 0,
                size: 12
            });
    });


    test("Next preserves search visibility sort and direction", async () => {

        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false
        });


        service.searchBuilds
            .mockResolvedValueOnce({
                content: [],
                page: 0,
                size: 12,
                totalElements: 25,
                totalPages: 3
            })
            .mockResolvedValueOnce({
                content: [
                    {
                        id: 1,
                        username: "nick"
                    }
                ],
                page: 0,
                size: 12,
                totalElements: 25,
                totalPages: 3
            })
            .mockResolvedValueOnce({
                content: [
                    {
                        id: 2,
                        username: "nick"
                    }
                ],
                page: 1,
                size: 12,
                totalElements: 25,
                totalPages: 3
            });


        let renderer;

        await act(async () => {
            renderer = create(<BuildsPage />);
        });


        const searchBar =
            renderer.root.findByType("search-bar");


        const params = {
            search: "gaming",
            visibility: "Public",
            sortBy: "created_at",
            direction: "DESC"
        };


        await act(async () => {
            await searchBar.props.onSearch(params);
        });


        const pagination =
            renderer.root.findByType("pagination");


        await act(async () => {
            await pagination.props.onPageChange(1);
        });


        expect(service.searchBuilds)
            .toHaveBeenLastCalledWith({
                search: "gaming",
                visibility: "Public",
                sortBy: "created_at",
                direction: "DESC",
                page: 1,
                size: 12
            });
    });


    test("page navigation changes page only", async () => {

        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false
        });


        service.searchBuilds
            .mockResolvedValueOnce({
                content: [],
                page: 0,
                size: 12,
                totalElements: 24,
                totalPages: 2
            })
            .mockResolvedValueOnce({
                content: [],
                page: 1,
                size: 12,
                totalElements: 24,
                totalPages: 2
            });


        let renderer;

        await act(async () => {
            renderer = create(<BuildsPage />);
        });


        const pagination =
            renderer.root.findByType("pagination");


        await act(async () => {
            await pagination.props.onPageChange(1);
        });


        expect(service.searchBuilds)
            .toHaveBeenLastCalledWith({
                page: 1,
                size: 12
            });
    });


    test("creates and deletes builds then refreshes current page", async () => {

        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false
        });


        service.searchBuilds.mockResolvedValue({
            content: [
                {
                    id: 1,
                    name: "Build",
                    username: "nick"
                }
            ],
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


        const newButton =
            renderer.root.findByType("button");


        act(() => {
            newButton.props.onClick();
        });


        await act(async () => {
            await renderer.root
                .findByType("build-form")
                .props.onSubmit({
                    name: "New"
                });
        });


        expect(service.createBuild)
            .toHaveBeenCalledWith({
                name: "New"
            });


        act(() => {
            renderer.root
                .findByType("build-card")
                .props.onDelete({
                    id: 1,
                    name: "Build"
                });
        });


        await act(async () => {
            await renderer.root
                .findByType("delete-modal")
                .props.onConfirm();
        });


        expect(service.deleteBuild)
            .toHaveBeenCalledWith(1);


        expect(service.searchBuilds)
            .toHaveBeenCalledTimes(3);


        expect(service.searchBuilds)
            .toHaveBeenLastCalledWith({
                page: 0,
                size: 12
            });
    });
});