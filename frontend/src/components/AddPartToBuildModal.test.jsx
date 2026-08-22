import { act, create } from "react-test-renderer";
import AddPartToBuildModal from "./AddPartToBuildModal";
import BuildForm from "./BuildForm";
import * as buildService from "../api/buildService";

jest.mock("../api/buildService", () => ({
    getMyBuilds: jest.fn(),
    createBuild: jest.fn(),
    addPartToBuild: jest.fn(),
}));

const part = {
    id: 7,
    name: "RTX 4070 Super",
};

async function flush() {
    await Promise.resolve();
    await Promise.resolve();
}

describe("AddPartToBuildModal", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("loads the logged-in user's builds and adds the part to an existing build", async () => {
        buildService.getMyBuilds.mockResolvedValue([
            { id: 11, name: "Gaming Rig" },
            { id: 12, name: "Workstation" },
        ]);
        buildService.addPartToBuild.mockResolvedValue(null);

        let renderer;

        await act(async () => {
            renderer = create(
                <AddPartToBuildModal part={part} onClose={jest.fn()} />
            );
            await flush();
        });

        const select = renderer.root.findByType("select");
        expect(select.props.value).toBe("11");

        act(() => {
            select.props.onChange({ target: { value: "12" } });
        });

        const forms = renderer.root.findAllByType("form");
        const addForm = forms.find((form) =>
            form.findAllByType("select").length > 0
        );

        await act(async () => {
            await addForm.props.onSubmit({ preventDefault: jest.fn() });
            await flush();
        });

        expect(buildService.addPartToBuild).toHaveBeenCalledWith(12, 7, 1);

        const success = renderer.root.find(
            (node) =>
                node.props?.role === "status" &&
                node.children.join("").includes("Workstation")
        );
        expect(success.children.join("")).toContain("RTX 4070 Super");
    });

    test("creates a build and immediately adds the selected part", async () => {
        buildService.getMyBuilds.mockResolvedValue([]);
        buildService.createBuild.mockResolvedValue({
            id: 25,
            name: "Fresh Build",
            description: null,
            is_Public: true,
        });
        buildService.addPartToBuild.mockResolvedValue(null);

        let renderer;

        await act(async () => {
            renderer = create(
                <AddPartToBuildModal part={part} onClose={jest.fn()} />
            );
            await flush();
        });

        const buildForm = renderer.root.findByType(BuildForm);

        await act(async () => {
            await buildForm.props.onSubmit({
                name: "Fresh Build",
                description: null,
                is_Public: true,
            });
            await flush();
        });

        expect(buildService.createBuild).toHaveBeenCalledWith({
            name: "Fresh Build",
            description: null,
            is_Public: true,
        });
        expect(buildService.addPartToBuild).toHaveBeenCalledWith(25, 7, 1);

        const success = renderer.root.find(
            (node) =>
                node.props?.role === "status" &&
                node.children.join("").includes("Fresh Build")
        );
        expect(success.children.join("")).toContain("created");
    });
});
