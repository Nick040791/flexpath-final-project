jest.mock("../auth/AuthContext", () => ({
    useAuth: jest.fn()
}));

jest.mock("../api/partService", () => ({
    searchParts: jest.fn()
}));

jest.mock("../api/buildService", () => ({
    searchBuilds: jest.fn()
}));

jest.mock("../components/SearchBar", () => ({
    __esModule: true,
    default: (props) => <search-bar {...props} />
}));

jest.mock("../components/PartCard", () => ({
    __esModule: true,
    default: (props) => <part-card {...props} />
}));

jest.mock("../components/BuildCard", () => ({
    __esModule: true,
    default: (props) => <build-card {...props} />
}));

jest.mock("../components/Pagination", () => ({
    __esModule: true,
    default: (props) => <pagination {...props} />
}));

jest.mock("react-router-dom", () => ({
    Link: ({ to, children }) => (
        <a href={to}>
            {children}
        </a>
    )
}));


const { act, create } = require("react-test-renderer");
const HomePage = require("./HomePage").default;
const { useAuth } = require("../auth/AuthContext");
const partService = require("../api/partService");
const buildService = require("../api/buildService");


describe("HomePage", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });


    test("shows authentication loading and login prompt states", () => {

        useAuth.mockReturnValue({
            isAuthenticated: false,
            loading: true,
            username: null,
            isAdmin: false
        });


        let renderer =
            create(<HomePage />);


        expect(
            renderer.root.findAll(
                (node) =>
                    node.children?.includes("Loading...")
            )
        ).not.toHaveLength(0);


        useAuth.mockReturnValue({
            isAuthenticated: false,
            loading: false,
            username: null,
            isAdmin: false
        });


        act(() => {
            renderer.update(<HomePage />);
        });


        expect(
            renderer.root.findByType("a").props.href
        ).toBe("/login");


        expect(
            partService.searchParts
        ).not.toHaveBeenCalled();
    });


    test("loads paginated Parts and public Build preview", async () => {

        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false
        });


        partService.searchParts.mockResolvedValue({
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


        buildService.searchBuilds.mockResolvedValue({
            content: [
                {
                    id: 1,
                    is_Public: true
                },
                {
                    id: 3,
                    is_Public: true
                }
            ],
            page: 0,
            size: 4,
            totalElements: 2,
            totalPages: 1
        });


        let renderer;


        await act(async () => {
            renderer = create(<HomePage />);
        });


        expect(
            partService.searchParts
        ).toHaveBeenCalledWith({
            page: 0,
            size: 12
        });


        expect(
            buildService.searchBuilds
        ).toHaveBeenCalledWith({
            visibility: "Public",
            page: 0,
            size: 4
        });


        expect(
            renderer.root.findAllByType("part-card")
        ).toHaveLength(2);


        expect(
            renderer.root.findAllByType("build-card")
        ).toHaveLength(2);


        const partCards =
            renderer.root.findAllByType("part-card");


        expect(
            partCards[0].props.canManage
        ).toBe(true);


        expect(
            partCards[1].props.canManage
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


    test("new Part search resets pagination to page zero", async () => {

        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false
        });


        partService.searchParts.mockResolvedValue({
            content: [],
            page: 0,
            size: 12,
            totalElements: 0,
            totalPages: 0
        });


        buildService.searchBuilds.mockResolvedValue({
            content: [],
            page: 0,
            size: 4,
            totalElements: 0,
            totalPages: 0
        });


        let renderer;


        await act(async () => {
            renderer = create(<HomePage />);
        });


        const searchBar =
            renderer.root.findByType("search-bar");


        const params = {
            search: "GPU",
            category: "GPU",
            brand: "NVIDIA",
            maxPrice: "800",
            sortBy: "price",
            direction: "ASC"
        };


        await act(async () => {
            await searchBar.props.onSearch(params);
        });


        expect(
            partService.searchParts
        ).toHaveBeenLastCalledWith({
            search: "GPU",
            category: "GPU",
            brand: "NVIDIA",
            maxPrice: "800",
            sortBy: "price",
            direction: "ASC",
            page: 0,
            size: 12
        });
    });


    test("Next preserves all active Part filters", async () => {

        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "nick",
            isAdmin: false
        });


        partService.searchParts
            .mockResolvedValueOnce({
                content: [],
                page: 0,
                size: 12,
                totalElements: 25,
                totalPages: 3
            })
            .mockResolvedValueOnce({
                content: [],
                page: 0,
                size: 12,
                totalElements: 25,
                totalPages: 3
            })
            .mockResolvedValueOnce({
                content: [],
                page: 1,
                size: 12,
                totalElements: 25,
                totalPages: 3
            });


        buildService.searchBuilds.mockResolvedValue({
            content: [],
            page: 0,
            size: 4,
            totalElements: 0,
            totalPages: 0
        });


        let renderer;


        await act(async () => {
            renderer = create(<HomePage />);
        });


        const searchBar =
            renderer.root.findByType("search-bar");


        const params = {
            search: "RTX",
            category: "GPU",
            brand: "NVIDIA",
            maxPrice: "800",
            sortBy: "price",
            direction: "ASC"
        };


        await act(async () => {
            await searchBar.props.onSearch(params);
        });


        const pagination =
            renderer.root.findByType("pagination");


        await act(async () => {
            await pagination.props.onPageChange(1);
        });


        expect(
            partService.searchParts
        ).toHaveBeenLastCalledWith({
            search: "RTX",
            category: "GPU",
            brand: "NVIDIA",
            maxPrice: "800",
            sortBy: "price",
            direction: "ASC",
            page: 1,
            size: 12
        });
    });


    test("runs searches and displays a search error", async () => {

        useAuth.mockReturnValue({
            isAuthenticated: true,
            loading: false,
            username: "admin",
            isAdmin: true
        });


        partService.searchParts
            .mockResolvedValueOnce({
                content: [],
                page: 0,
                size: 12,
                totalElements: 0,
                totalPages: 0
            })
            .mockRejectedValueOnce(
                new Error("Search failed")
            );


        buildService.searchBuilds.mockResolvedValue({
            content: [],
            page: 0,
            size: 4,
            totalElements: 0,
            totalPages: 0
        });


        let renderer;


        await act(async () => {
            renderer = create(<HomePage />);
        });


        const searchBar =
            renderer.root.findByType("search-bar");


        await act(async () => {
            await searchBar.props.onSearch({
                search: "GPU"
            });
        });


        expect(
            partService.searchParts
        ).toHaveBeenLastCalledWith({
            search: "GPU",
            page: 0,
            size: 12
        });


        const errorNodes =
            renderer.root.findAll(
                (node) =>
                    node.children?.some(
                        (child) =>
                            typeof child === "string" &&
                            child.includes("Search failed")
                    )
            );


        expect(
            errorNodes.length
        ).toBeGreaterThan(0);
    });
});