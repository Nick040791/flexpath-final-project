jest.mock("../auth/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("../api/partService", () => ({ getPart: jest.fn(), updatePart: jest.fn(), deletePart: jest.fn() }));
jest.mock("../components/PartForm", () => ({ __esModule: true, default: (props) => <part-form {...props} /> }));
jest.mock("../components/VisibilityBadge", () => ({ __esModule: true, default: (props) => <visibility-badge {...props} /> }));
jest.mock("../components/ConfirmDeleteModal", () => ({ __esModule: true, default: (props) => <delete-modal {...props} /> }));
jest.mock("react-router-dom", () => ({ useParams: jest.fn(), useNavigate: jest.fn() }));

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
        useAuth.mockReturnValue({ username: "nick", isAdmin: false, isAuthenticated: true });
    });

    test("loads a manageable part and supports update and delete", async () => {
        const part = { id: 7, name: "GPU", username: "nick", is_Public: true, price: 599.99 };
        service.getPart.mockResolvedValue(part);
        service.updatePart.mockResolvedValue({});
        service.deletePart.mockResolvedValue();
        let renderer;
        await act(async () => { renderer = create(<Page />); });
        const buttons = renderer.root.findAllByType("button");
        act(() => buttons.find((button) => button.children.includes("Edit")).props.onClick());
        await act(async () => renderer.root.findByType("part-form").props.onSubmit({ name: "Updated" }));
        expect(service.updatePart).toHaveBeenCalledWith("7", { name: "Updated" });
        act(() => renderer.root.findAllByType("button").find((button) => button.children.includes("Delete")).props.onClick());
        await act(async () => renderer.root.findByType("delete-modal").props.onConfirm());
        expect(service.deletePart).toHaveBeenCalledWith("7");
        expect(navigate).toHaveBeenCalledWith("/parts/mine");
    });

    test("displays load errors", async () => {
        service.getPart.mockRejectedValue(new Error("Part missing"));
        let renderer;
        await act(async () => { renderer = create(<Page />); });
        expect(renderer.root.findByProps({ className: "alert alert-danger" }).children).toEqual(["Part missing"]);
    });
});