import { act, create } from "react-test-renderer";
import { MemoryRouter } from "react-router-dom";
import PartCard from "./PartCard";
import VisibilityBadge from "./VisibilityBadge";

const part = {
    id: 7,
    name: "RTX 4070 Super",
    category: "GPU",
    brand: "NVIDIA",
    model: "4070 Super",
    price: 599.99,
    description: "A 1440p graphics card",
    is_Public: false,
    username: "builder1",
    created_at: "2026-08-16T12:00:00Z",
};

function renderCard(props = {}) {
    return create(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <PartCard part={part} {...props} />
        </MemoryRouter>
    );
}

describe("PartCard", () => {
    test("renders details, formatted price, link, and visibility", () => {
        const renderer = renderCard();
        const link = renderer.root.findByType("a");
        const subtitle = renderer.root.findByType("h3");
        const badge = renderer.root.findByType(VisibilityBadge);
        const price = renderer.root.find(
            (node) =>
                node.type === "span" &&
                node.props.className.includes("text-bg-warning")
        );

        expect(link.props.href).toBe("/parts/7");
        expect(link.children).toEqual(["RTX 4070 Super"]);
        expect(subtitle.children).toEqual(["GPU · NVIDIA · 4070 Super"]);
        expect(price.children).toEqual(["$599.99"]);
        expect(badge.props.isPublic).toBe(false);
    });

    test("does not render action buttons when actions are unavailable", () => {
        const renderer = renderCard({
            canManage: false,
            canAddToBuild: false,
            onDelete: jest.fn(),
        });

        expect(renderer.root.findAllByType("button")).toHaveLength(0);
    });

    test("renders Delete for managers and passes the part to onDelete", () => {
        const onDelete = jest.fn();
        const renderer = renderCard({
            canManage: true,
            canAddToBuild: false,
            onDelete,
        });

        const button = renderer.root.findByType("button");
        expect(button.children).toEqual(["Delete"]);

        act(() => button.props.onClick());

        expect(onDelete).toHaveBeenCalledWith(part);
    });

    test("renders Add to Build for authenticated card contexts", () => {
        const renderer = renderCard({
            canAddToBuild: true,
        });

        const button = renderer.root.findByType("button");
        expect(button.children).toEqual(["Add to Build"]);
    });
});
