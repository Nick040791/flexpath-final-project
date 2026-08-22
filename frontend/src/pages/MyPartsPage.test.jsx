jest.mock("../auth/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("../api/partService", () => ({
    getMyParts: jest.fn(),
    createPart: jest.fn(),
    deletePart: jest.fn(),
}));
jest.mock("../components/PartCard", () => ({
    __esModule: true,
    default: (props) => <part-card {...props} />,
}));
jest.mock("../components/PartForm", () => ({
    __esModule: true,
    default: (props) => <part-form {...props} />,
}));
jest.mock("../components/ConfirmDeleteModal", () => ({
    __esModule: true,
    default: (props) => <delete-modal {...props} />,
}));

const { act, create } = require("react-test-renderer");
const MyPartsPage = require("./MyPartsPage").default;
const { useAuth } = require("../auth/AuthContext");
const service = require("../api/partService");

describe("MyPartsPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("requires authentication", () => {
        useAuth.mockReturnValue({ isAuthenticated: false, loading: false });
        const renderer = create(<MyPartsPage />);
        expect(
            renderer.root.findAll((node) =>
                node.children?.includes("Please log in to manage your parts.")
            )
        ).not.toHaveLength(0);
    });

    test("loads owned parts", async () => {
        useAuth.mockReturnValue({ isAuthenticated: true, loading: false });
        service.getMyParts.mockResolvedValue([{ id: 1, name: "GPU" }]);

        let renderer;
        await act(async () => {
            renderer = create(<MyPartsPage />);
        });

        expect(renderer.root.findByType("part-card").props.canManage).toBe(true);
    });

    test("failed reload keeps prior content and shows the normalized error", async () => {
        useAuth.mockReturnValue({ isAuthenticated: true, loading: false });
        service.getMyParts
            .mockResolvedValueOnce([{ id: 1, name: "GPU" }])
            .mockRejectedValueOnce(
                Object.assign(new Error("Something went wrong on the server. Please try again."), {
                    status: 500,
                })
            );
        service.createPart.mockResolvedValue({});

        let renderer;
        await act(async () => {
            renderer = create(<MyPartsPage />);
        });

        act(() => {
            renderer.root.findByType("button").props.onClick();
        });

        await act(async () => {
            await renderer.root.findByType("part-form").props.onSubmit({
                name: "CPU",
            });
        });

        expect(renderer.root.findAllByType("part-card")).toHaveLength(1);
        expect(
            renderer.root.findByProps({ className: "alert alert-danger" }).children
        ).toEqual(["Something went wrong on the server. Please try again."]);
    });

    test("failed create keeps the form open for correction", async () => {
        useAuth.mockReturnValue({ isAuthenticated: true, loading: false });
        service.getMyParts.mockResolvedValue([]);
        service.createPart.mockRejectedValue(
            Object.assign(new Error("Please check the submitted values."), {
                status: 400,
            })
        );

        let renderer;
        await act(async () => {
            renderer = create(<MyPartsPage />);
        });

        act(() => {
            renderer.root.findByType("button").props.onClick();
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
        useAuth.mockReturnValue({ isAuthenticated: true, loading: false });
        service.getMyParts.mockResolvedValue([{ id: 1, name: "GPU" }]);
        service.deletePart.mockRejectedValue(
            Object.assign(new Error("You are not authorized to do that."), {
                status: 403,
            })
        );

        let renderer;
        await act(async () => {
            renderer = create(<MyPartsPage />);
        });

        act(() => {
            renderer.root.findByType("part-card").props.onDelete({
                id: 1,
                name: "GPU",
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

    test("successful create and delete still refresh the list", async () => {
        useAuth.mockReturnValue({ isAuthenticated: true, loading: false });
        service.getMyParts.mockResolvedValue([{ id: 1, name: "GPU" }]);
        service.createPart.mockResolvedValue({});
        service.deletePart.mockResolvedValue();

        let renderer;
        await act(async () => {
            renderer = create(<MyPartsPage />);
        });

        act(() => {
            renderer.root.findByType("button").props.onClick();
        });
        await act(async () => {
            await renderer.root.findByType("part-form").props.onSubmit({ name: "CPU" });
        });

        act(() => {
            renderer.root.findByType("part-card").props.onDelete({ id: 1, name: "GPU" });
        });
        await act(async () => {
            await renderer.root.findByType("delete-modal").props.onConfirm();
        });

        expect(service.createPart).toHaveBeenCalledWith({ name: "CPU" });
        expect(service.deletePart).toHaveBeenCalledWith(1);
        expect(service.getMyParts).toHaveBeenCalledTimes(3);
    });
});
