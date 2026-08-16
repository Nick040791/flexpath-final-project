import { act, create } from "react-test-renderer";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

function renderModal(props = {}) {
    return create(
        <ConfirmDeleteModal
            itemName="Gaming Build"
            onConfirm={jest.fn()}
            onCancel={jest.fn()}
            {...props}
        />
    );
}

function findButton(renderer, className) {
    return renderer.root.find(
        (node) => node.type === "button" && node.props.className.includes(className)
    );
}

describe("ConfirmDeleteModal", () => {
    test("displays the item name", () => {
        const strong = renderModal().root.findByType("strong");
        expect(strong.children).toEqual(["Gaming Build"]);
    });

    test("calls onConfirm when Delete is clicked", () => {
        const onConfirm = jest.fn();
        const renderer = renderModal({ onConfirm });
        act(() => findButton(renderer, "btn-danger").props.onClick());
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    test("calls onCancel from both Cancel and Close", () => {
        const onCancel = jest.fn();
        const renderer = renderModal({ onCancel });
        act(() => findButton(renderer, "btn-secondary").props.onClick());
        act(() => findButton(renderer, "btn-close").props.onClick());
        expect(onCancel).toHaveBeenCalledTimes(2);
    });

    test("disables actions and displays Deleting while deleting", () => {
        const renderer = renderModal({ deleting: true });
        const cancelButton = findButton(renderer, "btn-secondary");
        const deleteButton = findButton(renderer, "btn-danger");
        expect(cancelButton.props.disabled).toBe(true);
        expect(deleteButton.props.disabled).toBe(true);
        expect(deleteButton.children).toEqual(["Deleting..."]);
    });
});