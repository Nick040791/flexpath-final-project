import { act, create } from "react-test-renderer";
import PartForm from "./PartForm";

function renderPartForm(props = {}) {
    let renderer;
    act(() => { renderer = create(<PartForm onSubmit={jest.fn()} {...props} />); });
    return renderer;
}

function findControl(renderer, name) {
    return renderer.root.find((node) => ["input", "select", "textarea"].includes(node.type) && node.props.name === name);
}

function changeControl(renderer, name, value, options = {}) {
    const control = findControl(renderer, name);
    act(() => {
        control.props.onChange({ target: { name, type: options.type ?? control.props.type ?? "text", value, checked: options.checked } });
    });
}

function submitForm(renderer) {
    act(() => { renderer.root.findByType("form").props.onSubmit({ preventDefault: jest.fn() }); });
}

describe("PartForm", () => {
    test("renders with default empty values", () => {
        const renderer = renderPartForm();
        for (const name of ["name", "category", "brand", "model", "price", "description"]) {
            expect(findControl(renderer, name).props.value).toBe("");
        }
        expect(findControl(renderer, "is_Public").props.checked).toBe(true);
    });

    test("submits the form with correct values", () => {
        const onSubmit = jest.fn();
        const renderer = renderPartForm({ onSubmit });
        changeControl(renderer, "name", "RTX 4070 Super");
        changeControl(renderer, "category", "GPU");
        changeControl(renderer, "brand", "NVIDIA");
        changeControl(renderer, "model", "4070 Super");
        changeControl(renderer, "price", "599.99");
        changeControl(renderer, "description", "1440p GPU");
        changeControl(renderer, "is_Public", "", { type: "checkbox", checked: false });
        submitForm(renderer);
        expect(onSubmit).toHaveBeenCalledWith({ name: "RTX 4070 Super", category: "GPU", brand: "NVIDIA", model: "4070 Super", price: 599.99, description: "1440p GPU", is_Public: false });
    });

    test("submits with null for optional fields when left blank", () => {
        const onSubmit = jest.fn();
        const renderer = renderPartForm({ onSubmit });
        changeControl(renderer, "name", "RTX 4070 Super");
        changeControl(renderer, "category", "GPU");
        submitForm(renderer);
        expect(onSubmit).toHaveBeenCalledWith({ name: "RTX 4070 Super", category: "GPU", brand: null, model: null, price: null, description: null, is_Public: true });
    });

    test("populates form with initial values", () => {
        const initial = { name: "RTX 4070 Super", category: "GPU", brand: "NVIDIA", model: "4070 Super", price: 599.99, description: "1440p GPU", is_Public: false };
        const renderer = renderPartForm({ initial });
        for (const name of ["name", "category", "brand", "model", "price", "description"]) {
            expect(findControl(renderer, name).props.value).toBe(initial[name]);
        }
        expect(findControl(renderer, "is_Public").props.checked).toBe(false);
    });

    test("disables Save button and shows Saving when submitting", () => {
        const renderer = renderPartForm({ submitting: true });
        const button = renderer.root.find((node) => node.type === "button" && node.props.type === "submit");
        expect(button.props.disabled).toBe(true);
        expect(button.children).toEqual(["Saving..."]);
    });

    test("calls onCancel when Cancel button is clicked", () => {
        const onCancel = jest.fn();
        const renderer = renderPartForm({ onCancel });
        const button = renderer.root.find((node) => node.type === "button" && node.props.type === "button");
        act(() => button.props.onClick());
        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});