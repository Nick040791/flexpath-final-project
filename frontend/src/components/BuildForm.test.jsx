import { act, create } from "react-test-renderer";
import BuildForm from "./BuildForm";

function renderBuildForm(props = {}) {
    let renderer;
    act(() => {
        renderer = create(<BuildForm onSubmit={jest.fn()} {...props} />);
    });
    return renderer;
}

function findControl(renderer, name) {
    return renderer.root.find((node) => node.props.name === name);
}

function changeControl(control, value, options = {}) {
    act(() => {
        control.props.onChange({
            target: {
                name: control.props.name,
                type: options.type ?? "text",
                value,
                checked: options.checked,
            },
        });
    });
}

describe("BuildForm", () => {
    test("starts with default empty values", () => {
        const renderer = renderBuildForm();
        expect(findControl(renderer, "name").props.value).toBe("");
        expect(findControl(renderer, "description").props.value).toBe("");
        expect(findControl(renderer, "is_Public").props.checked).toBe(true);
    });

    test("submits the form with correct values", () => {
        const onSubmit = jest.fn();
        const renderer = renderBuildForm({ onSubmit });
        changeControl(findControl(renderer, "name"), "Budget Gaming PC");
        changeControl(findControl(renderer, "description"), "Gaming build under $1000");
        changeControl(findControl(renderer, "is_Public"), "", {
            type: "checkbox",
            checked: false,
        });
        act(() => {
            renderer.root.findByType("form").props.onSubmit({ preventDefault: jest.fn() });
        });
        expect(onSubmit).toHaveBeenCalledWith({
            name: "Budget Gaming PC",
            description: "Gaming build under $1000",
            is_Public: false,
        });
    });

    test("submits with null description when left blank", () => {
        const onSubmit = jest.fn();
        const renderer = renderBuildForm({ onSubmit });
        changeControl(findControl(renderer, "name"), "Budget Gaming PC");
        act(() => {
            renderer.root.findByType("form").props.onSubmit({ preventDefault: jest.fn() });
        });
        expect(onSubmit).toHaveBeenCalledWith({
            name: "Budget Gaming PC",
            description: null,
            is_Public: true,
        });
    });

    test("populates initial values, cancels, and shows the submitting state", () => {
        const onSubmit = jest.fn();
        const onCancel = jest.fn();
        const initial = {
            name: "Initial Name",
            description: "Initial Description",
            is_Public: true,
        };
        const renderer = renderBuildForm({ onSubmit, onCancel, initial });
        expect(findControl(renderer, "name").props.value).toBe("Initial Name");
        expect(findControl(renderer, "description").props.value).toBe("Initial Description");
        expect(findControl(renderer, "is_Public").props.checked).toBe(true);

        const cancelButton = renderer.root.find(
            (node) => node.type === "button" && node.props.type === "button"
        );
        act(() => {
            cancelButton.props.onClick();
        });
        expect(onCancel).toHaveBeenCalledTimes(1);

        act(() => {
            renderer.update(
                <BuildForm
                    onSubmit={onSubmit}
                    onCancel={onCancel}
                    initial={initial}
                    submitting={true}
                />
            );
        });
        const submitButton = renderer.root.find(
            (node) => node.type === "button" && node.props.type === "submit"
        );
        expect(submitButton.props.disabled).toBe(true);
        expect(submitButton.children).toEqual(["Saving..."]);
    });
});