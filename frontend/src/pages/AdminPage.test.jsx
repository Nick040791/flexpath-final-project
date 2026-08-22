jest.mock("../auth/AuthContext", () => ({
    useAuth: jest.fn()
}));

jest.mock("../api/adminService", () => ({
    getUsers: jest.fn(),
    getUserRoles: jest.fn()
}));

jest.mock("../api/partService", () => ({
    searchParts: jest.fn(),
    deletePart: jest.fn()
}));

jest.mock("../api/buildService", () => ({
    searchBuilds: jest.fn(),
    deleteBuild: jest.fn()
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

jest.mock("../components/ConfirmDeleteModal", () => ({
    __esModule: true,
    default: (props) => <delete-modal {...props} />
}));

jest.mock("../components/Pagination", () => ({
    __esModule: true,
    default: (props) => <pagination {...props} />
}));

const { act, create } = require("react-test-renderer");
const { MemoryRouter } = require("react-router-dom");
const AdminPage = require("./AdminPage").default;
const AdminRoute = require("../components/AdminRoute").default;
const { useAuth } = require("../auth/AuthContext");
const adminService = require("../api/adminService");
const partService = require("../api/partService");
const buildService = require("../api/buildService");

function page(content = [], page = 0, totalElements = content.length, totalPages = content.length ? 1 : 0) {
    return {
        content,
        page,
        size: 12,
        totalElements,
        totalPages,
    };
}

function hasText(renderer, text) {
    return renderer.root.findAll(
        (node) => node.children?.includes(text)
    ).length > 0;
}

describe("AdminPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        useAuth.mockReturnValue({
            loading: false,
            isAuthenticated: true,
            isAdmin: true,
        });

        adminService.getUsers.mockResolvedValue([]);
        adminService.getUserRoles.mockResolvedValue([]);
        partService.searchParts.mockResolvedValue(page());
        partService.deletePart.mockResolvedValue();
        buildService.searchBuilds.mockResolvedValue(page());
        buildService.deleteBuild.mockResolvedValue();
    });

    test("renders the admin console for an admin", async () => {
        let renderer;

        await act(async () => {
            renderer = create(
                <MemoryRouter>
                    <AdminRoute>
                        <AdminPage />
                    </AdminRoute>
                </MemoryRouter>
            );
        });

        expect(hasText(renderer, "Admin Console")).toBe(true);
        expect(adminService.getUsers).toHaveBeenCalledTimes(1);
    });

    test("blocks a normal authenticated user", () => {
        useAuth.mockReturnValue({
            loading: false,
            isAuthenticated: true,
            isAdmin: false,
        });

        const renderer = create(
            <MemoryRouter>
                <AdminRoute>
                    <AdminPage />
                </AdminRoute>
            </MemoryRouter>
        );

        expect(
            hasText(renderer, "You are not authorized to view the admin area.")
        ).toBe(true);
        expect(adminService.getUsers).not.toHaveBeenCalled();
    });

    test("lists usernames without rendering password data and loads roles on demand", async () => {
        adminService.getUsers.mockResolvedValue([
            { username: "admin", password: "hash-that-must-not-render" },
            { username: "user", password: "another-hash" },
        ]);
        adminService.getUserRoles.mockResolvedValue(["ADMIN"]);

        let renderer;

        await act(async () => {
            renderer = create(
                <MemoryRouter>
                    <AdminPage />
                </MemoryRouter>
            );
        });

        const output = JSON.stringify(renderer.toJSON());
        expect(output).toContain("admin");
        expect(output).toContain("user");
        expect(output).not.toContain("hash-that-must-not-render");
        expect(output).not.toContain("another-hash");

        const showRoleButtons = renderer.root.findAllByType("button").filter(
            (button) => button.children?.includes("Show roles")
        );

        await act(async () => {
            await showRoleButtons[0].props.onClick();
        });

        expect(adminService.getUserRoles).toHaveBeenCalledWith("admin");
        expect(JSON.stringify(renderer.toJSON())).toContain("ADMIN");
    });

    test("deletes a part and reloads with the active search state", async () => {
        const part = {
            id: 7,
            name: "Private GPU",
            username: "other",
            is_Public: false,
        };

        partService.searchParts.mockResolvedValue(page([part]));

        let renderer;

        await act(async () => {
            renderer = create(
                <MemoryRouter>
                    <AdminPage />
                </MemoryRouter>
            );
        });

        await act(async () => {
            renderer.root.findByProps({ "data-admin-tab": "parts" }).props.onClick();
        });

        const searchParams = {
            search: "gpu",
            category: "GPU",
            brand: "NVIDIA",
            maxPrice: "1000",
            sortBy: "created_at",
            direction: "DESC",
        };

        await act(async () => {
            await renderer.root.findByType("search-bar").props.onSearch(searchParams);
        });

        act(() => {
            renderer.root.findByType("part-card").props.onDelete(part);
        });

        await act(async () => {
            await renderer.root.findByType("delete-modal").props.onConfirm();
        });

        expect(partService.deletePart).toHaveBeenCalledWith(7);
        expect(partService.searchParts).toHaveBeenLastCalledWith({
            ...searchParams,
            page: 0,
            size: 12,
        });
        expect(JSON.stringify(renderer.toJSON())).toContain("Deleted part");
    });

    test("deletes a build through the existing build service", async () => {
        const build = {
            id: 9,
            name: "Private Build",
            username: "other",
            is_Public: false,
        };

        buildService.searchBuilds.mockResolvedValue(page([build]));

        let renderer;

        await act(async () => {
            renderer = create(
                <MemoryRouter>
                    <AdminPage />
                </MemoryRouter>
            );
        });

        await act(async () => {
            renderer.root.findByProps({ "data-admin-tab": "builds" }).props.onClick();
        });

        act(() => {
            renderer.root.findByType("build-card").props.onDelete(build);
        });

        await act(async () => {
            await renderer.root.findByType("delete-modal").props.onConfirm();
        });

        expect(buildService.deleteBuild).toHaveBeenCalledWith(9);
        expect(buildService.searchBuilds).toHaveBeenLastCalledWith({
            page: 0,
            size: 12,
        });
        expect(JSON.stringify(renderer.toJSON())).toContain("Deleted build");
    });

    test("reloads the new last page after deletion makes the current page invalid", async () => {
        const build = {
            id: 15,
            name: "Last Build",
            username: "other",
            is_Public: false,
        };

        buildService.searchBuilds
            .mockResolvedValueOnce(page([], 0, 13, 2))
            .mockResolvedValueOnce(page([build], 1, 13, 2))
            .mockResolvedValueOnce(page([], 1, 12, 1))
            .mockResolvedValueOnce(page([], 0, 12, 1));

        let renderer;

        await act(async () => {
            renderer = create(
                <MemoryRouter>
                    <AdminPage />
                </MemoryRouter>
            );
        });

        await act(async () => {
            renderer.root.findByProps({ "data-admin-tab": "builds" }).props.onClick();
        });

        await act(async () => {
            await renderer.root.findByType("pagination").props.onPageChange(1);
        });

        act(() => {
            renderer.root.findByType("build-card").props.onDelete(build);
        });

        await act(async () => {
            await renderer.root.findByType("delete-modal").props.onConfirm();
        });

        expect(buildService.searchBuilds).toHaveBeenLastCalledWith({
            page: 0,
            size: 12,
        });
    });
});
