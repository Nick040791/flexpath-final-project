import { act, create } from "react-test-renderer";
import SearchBar from "./SearchBar";

const filters = [{ name: "category", label: "Category", type: "select", options: ["CPU", "GPU"] }];
const sortOptions = [{ value: "name", label: "Name" }, { value: "price", label: "Price" }];

function renderSearchBar(props = {}) {
    let renderer;
    act(() => {
        renderer = create(<SearchBar filters={filters} sortOptions={sortOptions} onSearch={jest.fn()} loading={false} {...props} />);
    });
    return renderer;
}

function findControl(renderer, name) {
    return renderer.root.find((node) => ["input", "select"].includes(node.type) && node.props.name === name);
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
        expect(findControl(renderer, "sortBy").props.value).toBe("name");
        expect(findControl(renderer, "direction").props.value).toBe("ASC");
    });

    test("calls onSearch with correct parameters when the form is submitted", () => {
        const onSearch = jest.fn();
        const renderer = renderSearchBar({ onSearch });
        changeControl(renderer, "search", "RTX");
        changeControl(renderer, "category", "GPU");
        changeControl(renderer, "sortBy", "price");
        changeControl(renderer, "direction", "DESC");
        submitForm(renderer);
        expect(onSearch).toHaveBeenCalledWith({ search: "RTX", category: "GPU", sortBy: "price", direction: "DESC" });
    });

    test("submits current values when the search action submits the form", () => {
        const onSearch = jest.fn();
        const renderer = renderSearchBar({ onSearch });
        changeControl(renderer, "search", "RTX");
        changeControl(renderer, "category", "GPU");
        submitForm(renderer);
        expect(onSearch).toHaveBeenCalledWith({ search: "RTX", category: "GPU", sortBy: "name", direction: "ASC" });
    });

    test("displays loading state correctly", () => {
        const renderer = renderSearchBar();
        let button = renderer.root.findByType("button");
        expect(button.props.disabled).toBe(false);
        expect(button.children).toEqual(["Search"]);
        act(() => {
            renderer.update(<SearchBar filters={filters} sortOptions={sortOptions} onSearch={jest.fn()} loading={true} />);
        });
        button = renderer.root.findByType("button");
        expect(button.props.disabled).toBe(true);
        expect(button.children).toEqual(["Searching..."]);
    });
});