const { act, create } = require("react-test-renderer");
const Pagination = require("./Pagination").default;

describe("Pagination", () => {

    test("displays backend page 0 as Page 1", () => {
        const renderer = create(
            <Pagination
                page={0}
                totalPages={5}
                loading={false}
                onPageChange={jest.fn()}
            />
        );

        const pageText = renderer.root.findByType("span");

        expect(pageText.children.join(""))
            .toBe("Page 1 of 5");
    });


    test("Previous is disabled on the first page", () => {
        const renderer = create(
            <Pagination
                page={0}
                totalPages={5}
                loading={false}
                onPageChange={jest.fn()}
            />
        );

        const buttons = renderer.root.findAllByType("button");

        expect(buttons[0].props.disabled)
            .toBe(true);
    });


    test("Next is enabled when not on the last page", () => {
        const renderer = create(
            <Pagination
                page={0}
                totalPages={5}
                loading={false}
                onPageChange={jest.fn()}
            />
        );

        const buttons = renderer.root.findAllByType("button");

        expect(buttons[1].props.disabled)
            .toBe(false);
    });


    test("Next is disabled on the last page", () => {
        const renderer = create(
            <Pagination
                page={4}
                totalPages={5}
                loading={false}
                onPageChange={jest.fn()}
            />
        );

        const buttons = renderer.root.findAllByType("button");

        expect(buttons[1].props.disabled)
            .toBe(true);
    });


    test("Previous calls onPageChange with page minus one", () => {
        const onPageChange = jest.fn();

        const renderer = create(
            <Pagination
                page={2}
                totalPages={5}
                loading={false}
                onPageChange={onPageChange}
            />
        );

        const buttons = renderer.root.findAllByType("button");

        act(() => {
            buttons[0].props.onClick();
        });

        expect(onPageChange)
            .toHaveBeenCalledTimes(1);

        expect(onPageChange)
            .toHaveBeenCalledWith(1);
    });


    test("Next calls onPageChange with page plus one", () => {
        const onPageChange = jest.fn();

        const renderer = create(
            <Pagination
                page={2}
                totalPages={5}
                loading={false}
                onPageChange={onPageChange}
            />
        );

        const buttons = renderer.root.findAllByType("button");

        act(() => {
            buttons[1].props.onClick();
        });

        expect(onPageChange)
            .toHaveBeenCalledTimes(1);

        expect(onPageChange)
            .toHaveBeenCalledWith(3);
    });


    test("displays the correct human-readable page number", () => {
        const renderer = create(
            <Pagination
                page={2}
                totalPages={5}
                loading={false}
                onPageChange={jest.fn()}
            />
        );

        const pageText = renderer.root.findByType("span");

        expect(pageText.children.join(""))
            .toBe("Page 3 of 5");
    });


    test("loading disables both navigation buttons", () => {
        const renderer = create(
            <Pagination
                page={2}
                totalPages={5}
                loading={true}
                onPageChange={jest.fn()}
            />
        );

        const buttons = renderer.root.findAllByType("button");

        expect(buttons[0].props.disabled)
            .toBe(true);

        expect(buttons[1].props.disabled)
            .toBe(true);
    });


    test("single-page results disable both buttons", () => {
        const renderer = create(
            <Pagination
                page={0}
                totalPages={1}
                loading={false}
                onPageChange={jest.fn()}
            />
        );

        const buttons = renderer.root.findAllByType("button");
        const pageText = renderer.root.findByType("span");

        expect(buttons[0].props.disabled)
            .toBe(true);

        expect(buttons[1].props.disabled)
            .toBe(true);

        expect(pageText.children.join(""))
            .toBe("Page 1 of 1");
    });


    test("renders nothing when there are no pages", () => {
        const renderer = create(
            <Pagination
                page={0}
                totalPages={0}
                loading={false}
                onPageChange={jest.fn()}
            />
        );

        expect(renderer.toJSON())
            .toBeNull();
    });


    test("disabled Previous does not call onPageChange", () => {
        const onPageChange = jest.fn();

        const renderer = create(
            <Pagination
                page={0}
                totalPages={5}
                loading={false}
                onPageChange={onPageChange}
            />
        );

        const buttons = renderer.root.findAllByType("button");

        act(() => {
            buttons[0].props.onClick();
        });

        expect(onPageChange)
            .not.toHaveBeenCalled();
    });


    test("disabled Next does not call onPageChange", () => {
        const onPageChange = jest.fn();

        const renderer = create(
            <Pagination
                page={4}
                totalPages={5}
                loading={false}
                onPageChange={onPageChange}
            />
        );

        const buttons = renderer.root.findAllByType("button");

        act(() => {
            buttons[1].props.onClick();
        });

        expect(onPageChange)
            .not.toHaveBeenCalled();
    });
});