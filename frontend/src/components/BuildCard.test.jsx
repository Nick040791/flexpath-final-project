import { act, create } from "react-test-renderer";
import { MemoryRouter } from "react-router-dom";
import BuildCard from "./BuildCard";
import VisibilityBadge from "./VisibilityBadge";

const build = {
    id: 42,
    name: "Budget Gaming PC",
    description: "A balanced 1440p build",
    is_Public: true,
    username: "builder1",
    created_at: "2026-08-16T12:00:00Z",
};

function renderCard(props = {}) {
    return create(
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <BuildCard build={build} {...props} />
        </MemoryRouter>
    );
}

describe("BuildCard", () => {
    test("renders build details, link, and visibility", () => {
        const renderer = renderCard();
        const link = renderer.root.findByType("a");
        const badge = renderer.root.findByType(VisibilityBadge);
        const paragraphs = renderer.root.findAllByType("p");
        expect(link.props.href).toBe("/builds/42");
        expect(link.children).toEqual(["Budget Gaming PC"]);
        expect(paragraphs[0].children).toEqual(["A balanced 1440p build"]);
        expect(badge.props.isPublic).toBe(true);
    });

    test("does not render Delete when management is unavailable", () => {
        const renderer = renderCard({ canManage: false, onDelete: jest.fn() });
        expect(renderer.root.findAllByType("button")).toHaveLength(0);
    });

    test("renders Delete for managers and passes the build to onDelete", () => {
        const onDelete = jest.fn();
        const renderer = renderCard({ canManage: true, onDelete });
        const button = renderer.root.findByType("button");
        expect(button.children).toEqual(["Delete"]);
        act(() => button.props.onClick());
        expect(onDelete).toHaveBeenCalledWith(build);
    });
});