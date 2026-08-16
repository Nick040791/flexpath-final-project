jest.mock("../auth/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("../api/buildService", () => ({ getBuild: jest.fn(), getBuildParts: jest.fn(), updateBuild: jest.fn(), deleteBuild: jest.fn(), addPartToBuild: jest.fn(), removePartFromBuild: jest.fn() }));
jest.mock("../api/partService", () => ({ searchParts: jest.fn() }));
jest.mock("../components/BuildForm", () => ({ __esModule: true, default: (props) => <build-form {...props} /> }));
jest.mock("../components/VisibilityBadge", () => ({ __esModule: true, default: (props) => <visibility-badge {...props} /> }));
jest.mock("../components/ConfirmDeleteModal", () => ({ __esModule: true, default: (props) => <delete-modal {...props} /> }));
jest.mock("react-router-dom", () => ({ useParams: jest.fn(), useNavigate: jest.fn(), Link: ({ to, children }) => <a href={to}>{children}</a> }));

const { act, create } = require("react-test-renderer");
const Page = require("./BuildDetailPage").default;
const { useAuth } = require("../auth/AuthContext");
const buildService = require("../api/buildService");
const partService = require("../api/partService");
const router = require("react-router-dom");

describe("BuildDetailPage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        router.useParams.mockReturnValue({ id: "2" });
        router.useNavigate.mockReturnValue(jest.fn());
        useAuth.mockReturnValue({ username: "nick", isAdmin: false, isAuthenticated: true });
    });

    test("loads a managed build and adds and removes parts", async () => {
        buildService.getBuild.mockResolvedValue({ id: 2, name: "Build", username: "nick", is_Public: true });
        buildService.getBuildParts.mockResolvedValue([{ id: 1, name: "GPU", price: 500 }]);
        partService.searchParts.mockResolvedValue([{ id: 1, name: "GPU" }, { id: 3, name: "CPU", price: 200 }]);
        buildService.addPartToBuild.mockResolvedValue();
        buildService.removePartFromBuild.mockResolvedValue();
        let renderer;
        await act(async () => { renderer = create(<Page />); });
        const select = renderer.root.findByType("select");
        act(() => select.props.onChange({ target: { value: "3" } }));
        await act(async () => renderer.root.findAllByType("button").find((button) => button.children.includes("Add to Build")).props.onClick());
        expect(buildService.addPartToBuild).toHaveBeenCalledWith("2", 3, 1);
        await act(async () => renderer.root.findAllByType("button").find((button) => button.children.includes("Remove")).props.onClick());
        expect(buildService.removePartFromBuild).toHaveBeenCalledWith("2", 1);
    });

    test("displays load errors", async () => {
        buildService.getBuild.mockRejectedValue(new Error("Build missing"));
        buildService.getBuildParts.mockResolvedValue([]);
        let renderer;
        await act(async () => { renderer = create(<Page />); });
        expect(renderer.root.findByProps({ className: "alert alert-danger" }).children).toEqual(["Build missing"]);
    });
});