jest.mock("../auth/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("../api/partService", () => ({ getMyParts: jest.fn(), createPart: jest.fn(), deletePart: jest.fn() }));
jest.mock("../components/PartCard", () => ({ __esModule: true, default: (props) => <part-card {...props} /> }));
jest.mock("../components/PartForm", () => ({ __esModule: true, default: (props) => <part-form {...props} /> }));
jest.mock("../components/ConfirmDeleteModal", () => ({ __esModule: true, default: (props) => <delete-modal {...props} /> }));

const { act, create } = require("react-test-renderer");
const MyPartsPage = require("./MyPartsPage").default;
const { useAuth } = require("../auth/AuthContext");
const service = require("../api/partService");

describe("MyPartsPage", () => {
    beforeEach(() => jest.clearAllMocks());

    test("requires authentication", () => {
        useAuth.mockReturnValue({ isAuthenticated: false, loading: false });
        const renderer = create(<MyPartsPage />);
        expect(renderer.root.findAll((node) => node.children?.includes("Please log in to manage your parts."))).not.toHaveLength(0);
    });

    test("loads, creates, and deletes owned parts", async () => {
        useAuth.mockReturnValue({ isAuthenticated: true, loading: false });
        service.getMyParts.mockResolvedValue([{ id: 1, name: "GPU" }]);
        service.createPart.mockResolvedValue({});
        service.deletePart.mockResolvedValue();
        let renderer;
        await act(async () => { renderer = create(<MyPartsPage />); });
        expect(renderer.root.findByType("part-card").props.canManage).toBe(true);
        act(() => renderer.root.findByType("button").props.onClick());
        await act(async () => renderer.root.findByType("part-form").props.onSubmit({ name: "CPU" }));
        expect(service.createPart).toHaveBeenCalledWith({ name: "CPU" });
        act(() => renderer.root.findByType("part-card").props.onDelete({ id: 1, name: "GPU" }));
        await act(async () => renderer.root.findByType("delete-modal").props.onConfirm());
        expect(service.deletePart).toHaveBeenCalledWith(1);
        expect(service.getMyParts).toHaveBeenCalledTimes(3);
    });

    test("displays load errors", async () => {
        useAuth.mockReturnValue({ isAuthenticated: true, loading: false });
        service.getMyParts.mockRejectedValue(new Error("Unable to load"));
        let renderer;
        await act(async () => { renderer = create(<MyPartsPage />); });
        expect(renderer.root.findByProps({ className: "alert alert-danger" }).children).toEqual(["Unable to load"]);
    });
});