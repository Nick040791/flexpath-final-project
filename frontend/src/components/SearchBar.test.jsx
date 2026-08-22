import { act, create } from "react-test-renderer";
import SearchBar from "./SearchBar";

const filters = [
    {
        name: "category",
        label: "Category",
        type: "select",
        options: ["CPU", "GPU"],
    },
    {
        name: "hasParts",
        label: "Contents",
        type: "select",
        options: [
            { value: "true", label: "With parts" },
            { value: "false", label: "Empty" },
        ],
    },
];

const sortOptions = [
    { value: "name", label: "Name" },
    { value: "price", label: "Price" },
];

function renderSearchBar(props = {}) {
    let renderer;
    act(() => {
        renderer = create(
            <SearchBar
                filters={filters}
                sortOptions={sortOptions}
                onSearch={jest.fn()}
                loading={false}
                {...props}
            />
        );
    });
    return renderer;
}

function findControl(renderer, name) {
    return renderer.root.find(
        (node) => ["input", "select"].includes(node.type) && node.props.name === name
    );
}

function changeControl(renderer, name, value) {
    act(() => findControl(renderer, name).props.onChange({ target: { name, value } }));
}

function submitForm(renderer) {
    act(() => renderer.root.findByType("form").props.onSubmit({ preventDefault: jest.fn() }));
}

describe("SearchBar", () => {
    test("initializes with correct default values", () => {
        const renderer = renderSearchBar();
        expect(findControl(renderer, "search").props.value).toBe("");
        expect(findControl(renderer, "category").props.value).toBe("");
        expect(findControl(renderer, "hasParts").props.value).toBe("");
        expect(findControl(renderer, "sortBy").props.value).toBe("name");
        expect(findControl(renderer, "direction").props.value).toBe("ASC");
    });

    test("restores initial values into keyword filter and sort controls", () => {
        const renderer = renderSearchBar({
            initialValues: {
                search: "RTX",
                category: "GPU",
                hasParts: "true",
                sortBy: "price",
                direction: "DESC",
            },
        });

        expect(findControl(renderer, "search").props.value).toBe("RTX");
        expect(findControl(renderer, "category").props.value).toBe("GPU");
        expect(findControl(renderer, "hasParts").props.value).toBe("true");
        expect(findControl(renderer, "sortBy").props.value).toBe("price");
        expect(findControl(renderer, "direction").props.value).toBe("DESC");
    });

    test("calls onSearch with one complete query object", () => {
        const onSearch = jest.fn();
        const renderer = renderSearchBar({ onSearch });

        changeControl(renderer, "search", "RTX");
        changeControl(renderer, "category", "GPU");
        changeControl(renderer, "hasParts", "true");
        changeControl(renderer, "sortBy", "price");
        changeControl(renderer, "direction", "DESC");
        submitForm(renderer);

        expect(onSearch).toHaveBeenCalledWith({
            search: "RTX",
            category: "GPU",
            hasParts: "true",
            sortBy: "price",
            direction: "DESC",
        });
    });

    test("reset restores defaults and calls the optional reset action", () => {
        const onReset = jest.fn();
        const renderer = renderSearchBar({ onReset });

        changeControl(renderer, "search", "RTX");
        changeControl(renderer, "category", "GPU");
        changeControl(renderer, "direction", "DESC");

        const resetButton = renderer.root
            .findAllByType("button")
            .find((button) => button.children.includes("Reset"));

        act(() => resetButton.props.onClick());

        expect(findControl(renderer, "search").props.value).toBe("");
        expect(findControl(renderer, "category").props.value).toBe("");
        expect(findControl(renderer, "hasParts").props.value).toBe("");
        expect(findControl(renderer, "sortBy").props.value).toBe("name");
        expect(findControl(renderer, "direction").props.value).toBe("ASC");
        expect(onReset).toHaveBeenCalledTimes(1);
    });

    test("displays loading state correctly", () => {
        const renderer = renderSearchBar();
        let button = renderer.root.findByType("button");
        expect(button.props.disabled).toBe(false);
        expect(button.children).toEqual(["Search"]);

        act(() => {
            renderer.update(
                <SearchBar
                    filters={filters}
                    sortOptions={sortOptions}
                    onSearch={jest.fn()}
                    loading
                />
            );
        });

        button = renderer.root.findByType("button");
        expect(button.props.disabled).toBe(true);
        expect(button.children).toEqual(["Searching..."]);
    });
});
