jest.mock("react-router-dom", () => ({
    Link: ({ to, children }) => <a href={to}>{children}</a>,
}));

const { create } = require("react-test-renderer");
const Breadcrumbs = require("./Breadcrumbs").default;

describe("Breadcrumbs", () => {
    test("renders ancestor links and a non-linked active current item", () => {
        const renderer = create(
            <Breadcrumbs
                items={[
                    { label: "Home", to: "/" },
                    { label: "Builds", to: "/builds" },
                    { label: "Gaming Build" },
                ]}
            />
        );

        const nav = renderer.root.findByType("nav");
        expect(nav.props["aria-label"]).toBe("breadcrumb");

        const links = renderer.root.findAllByType("a");
        expect(links).toHaveLength(2);
        expect(links[0].props.href).toBe("/");
        expect(links[0].children).toEqual(["Home"]);
        expect(links[1].props.href).toBe("/builds");
        expect(links[1].children).toEqual(["Builds"]);

        const items = renderer.root.findAllByType("li");
        const current = items[items.length - 1];
        expect(current.props.className).toContain("active");
        expect(current.props["aria-current"]).toBe("page");
        expect(current.children).toEqual(["Gaming Build"]);
    });
});
