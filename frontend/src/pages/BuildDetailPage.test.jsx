jest.mock("../auth/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("../api/buildService", () => ({
    getBuild: jest.fn(),
    getBuildParts: jest.fn(),
    updateBuild: jest.fn(),
    deleteBuild: jest.fn(),
    addPartToBuild: jest.fn(),
    removePartFromBuild: jest.fn(),
}));
jest.mock("../api/partService", () => ({ searchParts: jest.fn() }));
jest.mock("../components/BuildForm", () => ({
    __esModule: true,
    default: (props) => <build-form {...props} />,
}));
jest.mock("../components/VisibilityBadge", () => ({
    __esModule: true,
    default: (props) => <visibility-badge {...props} />,
}));
jest.mock("../components/ConfirmDeleteModal", () => ({
    __esModule: true,
    default: (props) => <delete-modal {...props} />,
}));
jest.mock("react-router-dom", () => ({
    useParams: jest.fn(),
    useNavigate: jest.fn(),
    Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

const { act, create } = require("react-test-renderer");
const Page = require("./BuildDetailPage").default;
const { useAuth } = require("../auth/AuthContext");
const buildService = require("../api/buildService");
const partService = require("../api/partService");
const router = require("react-router-dom");

function partPage(content = [], overrides = {}) {
    return {
        content,
        page: 0,
        size: 50,
        totalElements: content.length,
        totalPages: content.length ? 1 : 0,
        ...overrides,
    };
}

describe("BuildDetailPage", () => {
    const navigate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        router.useParams.mockReturnValue({ id: "2" });
        router.useNavigate.mockReturnValue(navigate);
        useAuth.mockReturnValue({
            username: "nick",
            isAdmin: false,
            isAuthenticated: true,
        });
        partService.searchParts.mockResolvedValue(partPage([]));
    });

    test("loads a managed build and adds and removes parts", async () => {
        buildService.getBuild.mockResolvedValue({
            id: 2,
            name: "Build",
            username: "nick",
            is_Public: true,
        });
        buildService.getBuildParts.mockResolvedValue([
            { id: 1, name: "GPU", price: 500 },
        ]);
        partService.searchParts.mockResolvedValue(
            partPage([
                { id: 1, name: "GPU", price: 500 },
                { id: 3, name: "CPU", price: 200 },
            ])
        );
        buildService.addPartToBuild.mockResolvedValue();
        buildService.removePartFromBuild.mockResolvedValue();

        let renderer;
        await act(async () => {
            renderer = create(<Page />);
        });

        const select = renderer.root.findByType("select");
        act(() => {
            select.props.onChange({ target: { value: "3" } });
        });

        await act(async () => {
            await renderer.root
                .findAllByType("button")
                .find((button) => button.children.includes("Add to Build"))
                .props.onClick();
        });
        expect(buildService.addPartToBuild).toHaveBeenCalledWith("2", 3, 1);

        await act(async () => {
            await renderer.root
                .findAllByType("button")
                .find((button) => button.children.includes("Remove"))
                .props.onClick();
        });
        expect(buildService.removePartFromBuild).toHaveBeenCalledWith("2", 1);
    });

    test("404 renders an explicit not-found state and back link", async () => {
        buildService.getBuild.mockRejectedValue(
            Object.assign(new Error("The requested item was not found."), {
                status: 404,
            })
        );
        buildService.getBuildParts.mockResolvedValue([]);

        let renderer;
        await act(async () => {
            renderer = create(<Page />);
        });

        expect(
            renderer.root.findAll((node) => node.children?.includes("Build not found"))
        ).not.toHaveLength(0);
        expect(
            renderer.root.findAll((node) =>
                node.children?.includes("The requested item was not found.")
            )
        ).not.toHaveLength(0);
        expect(renderer.root.findByType("a").props.href).toBe("/builds");
        expect(
            renderer.root.findAllByType("button").filter((button) =>
                button.children.includes("Try again")
            )
        ).toHaveLength(0);
    });

    test("403 renders an unauthorized state without retry", async () => {
        buildService.getBuild.mockRejectedValue(
            Object.assign(new Error("You are not authorized to do that."), {
                status: 403,
            })
        );
        buildService.getBuildParts.mockResolvedValue([]);

        let renderer;
        await act(async () => {
            renderer = create(<Page />);
        });

        expect(
            renderer.root.findAll((node) => node.children?.includes("Access denied"))
        ).not.toHaveLength(0);
        expect(
            renderer.root.findAllByType("button").filter((button) =>
                button.children.includes("Try again")
            )
        ).toHaveLength(0);
    });

    test("server/network failure offers retry and uses the normalized message", async () => {
        buildService.getBuild
            .mockRejectedValueOnce(
                Object.assign(new Error("Something went wrong on the server. Please try again."), {
                    status: 500,
                })
            )
            .mockResolvedValueOnce({
                id: 2,
                name: "Recovered Build",
                username: "nick",
                is_Public: true,
            });
        buildService.getBuildParts.mockResolvedValue([]);

        let renderer;
        await act(async () => {
            renderer = create(<Page />);
        });

        const retry = renderer.root
            .findAllByType("button")
            .find((button) => button.children.includes("Try again"));
        expect(retry).toBeDefined();

        await act(async () => {
            await retry.props.onClick();
        });

        expect(buildService.getBuild).toHaveBeenCalledTimes(2);
        expect(
            renderer.root.findAll((node) =>
                node.children?.includes("Recovered Build")
            )
        ).not.toHaveLength(0);
    });

    test("failed update leaves the edit form available for correction", async () => {
        buildService.getBuild.mockResolvedValue({
            id: 2,
            name: "Build",
            username: "nick",
            is_Public: true,
        });
        buildService.getBuildParts.mockResolvedValue([]);
        buildService.updateBuild.mockRejectedValue(
            Object.assign(new Error("Please check the submitted values."), {
                status: 400,
            })
        );

        let renderer;
        await act(async () => {
            renderer = create(<Page />);
        });

        act(() => {
            renderer.root
                .findAllByType("button")
                .find((button) => button.children.includes("Edit"))
                .props.onClick();
        });

        await act(async () => {
            await renderer.root.findByType("build-form").props.onSubmit({ name: "" });
        });

        expect(renderer.root.findAllByType("build-form")).toHaveLength(1);
        expect(
            renderer.root.findByProps({ className: "alert alert-danger" }).children
        ).toEqual(["Please check the submitted values."]);
    });

    test("failed delete keeps confirmation open", async () => {
        buildService.getBuild.mockResolvedValue({
            id: 2,
            name: "Build",
            username: "nick",
            is_Public: true,
        });
        buildService.getBuildParts.mockResolvedValue([]);
        buildService.deleteBuild.mockRejectedValue(
            Object.assign(new Error("Something went wrong on the server. Please try again."), {
                status: 500,
            })
        );

        let renderer;
        await act(async () => {
            renderer = create(<Page />);
        });

        act(() => {
            renderer.root
                .findAllByType("button")
                .find((button) => button.children.includes("Delete"))
                .props.onClick();
        });

        await act(async () => {
            await renderer.root.findByType("delete-modal").props.onConfirm();
        });

        expect(renderer.root.findAllByType("delete-modal")).toHaveLength(1);
        expect(navigate).not.toHaveBeenCalled();
    });

    test("available-parts API failure is visible and retryable", async () => {
        buildService.getBuild.mockResolvedValue({
            id: 2,
            name: "Build",
            username: "nick",
            is_Public: true,
        });
        buildService.getBuildParts.mockResolvedValue([]);
        partService.searchParts
            .mockRejectedValueOnce(
                Object.assign(
                    new Error("Unable to reach the server. Check your connection and try again."),
                    { status: 0 }
                )
            )
            .mockResolvedValueOnce(
                partPage([{ id: 3, name: "CPU", price: 200 }])
            );

        let renderer;
        await act(async () => {
            renderer = create(<Page />);
        });

        expect(
            renderer.root.findAll((node) =>
                node.children?.includes(
                    "Unable to reach the server. Check your connection and try again."
                )
            )
        ).not.toHaveLength(0);

        const retryParts = renderer.root
            .findAllByType("button")
            .find((button) => button.children.includes("Retry parts"));
        expect(retryParts).toBeDefined();

        await act(async () => {
            retryParts.props.onClick();
            await Promise.resolve();
        });

        expect(partService.searchParts).toHaveBeenCalledTimes(2);
        expect(renderer.root.findByType("select").findAllByType("option")).toHaveLength(2);
    });
});
