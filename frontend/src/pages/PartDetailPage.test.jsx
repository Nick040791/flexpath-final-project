jest.mock("../auth/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("../api/partService", () => ({
    getPart: jest.fn(),
    updatePart: jest.fn(),
    deletePart: jest.fn(),
}));
jest.mock("../components/PartForm", () => ({
    __esModule: true,
    default: (props) => <part-form {...props} />,
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
const Page = require("./PartDetailPage").default;
const { useAuth } = require("../auth/AuthContext");
const service = require("../api/partService");
const router = require("react-router-dom");

describe("PartDetailPage", () => {
    const navigate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        router.useParams.mockReturnValue({ id: "7" });
        router.useNavigate.mockReturnValue(navigate);
        useAuth.mockReturnValue({
            username: "nick",
            isAdmin: false,
            isAuthenticated: true,
        });
    });

    test("loads a manageable part and supports successful update and delete", async () => {
        const part = {
            id: 7,
            name: "GPU",
            username: "nick",
            is_Public: true,
            price: 599.99,
        };
        service.getPart.mockResolvedValue(part);
        service.updatePart.mockResolvedValue({});
        service.deletePart.mockResolvedValue();

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
            await renderer.root.findByType("part-form").props.onSubmit({
                name: "Updated",
            });
        });
        expect(service.updatePart).toHaveBeenCalledWith("7", { name: "Updated" });

        act(() => {
            renderer.root
                .findAllByType("button")
                .find((button) => button.children.includes("Delete"))
                .props.onClick();
        });

        await act(async () => {
            await renderer.root.findByType("delete-modal").props.onConfirm();
        });

        expect(service.deletePart).toHaveBeenCalledWith("7");
        expect(navigate).toHaveBeenCalledWith("/parts/mine");
    });

    test("404 renders an explicit not-found state and back link", async () => {
        service.getPart.mockRejectedValue(
            Object.assign(new Error("The requested item was not found."), {
                status: 404,
            })
        );

        let renderer;
        await act(async () => {
            renderer = create(<Page />);
        });

        expect(
            renderer.root.findAll((node) => node.children?.includes("Part not found"))
        ).not.toHaveLength(0);
        expect(
            renderer.root.findAll((node) =>
                node.children?.includes("The requested item was not found.")
            )
        ).not.toHaveLength(0);
        expect(renderer.root.findByType("a").props.href).toBe("/");
        expect(
            renderer.root.findAllByType("button").filter((button) =>
                button.children.includes("Try again")
            )
        ).toHaveLength(0);
    });

    test("403 renders an unauthorized state without retry", async () => {
        service.getPart.mockRejectedValue(
            Object.assign(new Error("You are not authorized to do that."), {
                status: 403,
            })
        );

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

    test("network/server load failure offers retry and uses the normalized message", async () => {
        service.getPart
            .mockRejectedValueOnce(
                Object.assign(
                    new Error("Unable to reach the server. Check your connection and try again."),
                    { status: 0 }
                )
            )
            .mockResolvedValueOnce({
                id: 7,
                name: "GPU",
                username: "nick",
                is_Public: true,
            });

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

        expect(service.getPart).toHaveBeenCalledTimes(2);
        expect(
            renderer.root.findAll((node) => node.children?.includes("GPU"))
        ).not.toHaveLength(0);
    });

    test("failed update leaves the edit form available for correction", async () => {
        service.getPart.mockResolvedValue({
            id: 7,
            name: "GPU",
            username: "nick",
            is_Public: true,
        });
        service.updatePart.mockRejectedValue(
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
            await renderer.root.findByType("part-form").props.onSubmit({ name: "" });
        });

        expect(renderer.root.findAllByType("part-form")).toHaveLength(1);
        expect(
            renderer.root.findByProps({ className: "alert alert-danger" }).children
        ).toEqual(["Please check the submitted values."]);
    });

    test("failed delete keeps confirmation open", async () => {
        service.getPart.mockResolvedValue({
            id: 7,
            name: "GPU",
            username: "nick",
            is_Public: true,
        });
        service.deletePart.mockRejectedValue(
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
});
