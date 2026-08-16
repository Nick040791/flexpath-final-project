/** Test 1: Does SearchBar initialize correctly from the props it's passed?
*    We need to verify:
*        Keyword = ""
*        Sort By = first sort option
*         Order = "ASC"
*    The Actual direction constants are:
*        ASC -> Ascending
*       DESC -> Descending
*/
describe("SearchBar Initialization", () => {
    test("initializes with correct default values", () => {
        const filters = [
            {
                name: "category",
                label: "Category",
                type: "select",
                options: ["CPU", "GPU"]
            }
        ];

        const sortOptions = [
            { value: "name", label: "Name" },
            { value: "price", label: "Price" }
        ];

        render(<SearchBar filters={filters} sortOptions={sortOptions} onSearch={jest.fn()} loading={false} />);

        expect(screen.getByLabelText(/Keyword/i).value).toBe("");
        expect(screen.getByLabelText(/Sort By/i).value).toBe(sortOptions[0].value);
        expect(screen.getByLabelText(/Order/i).value).toBe("ASC");
    });
});

/** Test 2: Does SearchBar receive the correct props when the user changes search controls?
*    const filters = [
*    {
*        name: "category",
*        label: "Category",
*        type: "select",
*        options: ["CPU", "GPU"]
*    }
*];

*const sortOptions = [
*    { value: "name", label: "Name" },
*    { value: "price", label: "Price" }
*];
*--------->
*--------->
*then lets simulate the user selecting:
*    Keyword = "test"
*    Category = "GPU"
*    Sort By = "Price"
*    Order = "DESC"
*    --> Submit the form

*    onSearch should be recieving the following parameters:
*    {
*    search: "RTX",
*    category: "GPU",
*    sortBy: "price",
*    direction: "DESC"
*    }
*/
describe("SearchBar User Interaction", () => {
    test("calls onSearch with correct parameters when user submits the form", () => {
        const filters = [
            {
                name: "category",
                label: "Category",
                type: "select",
                options: ["CPU", "GPU"]
            }
        ];

        const sortOptions = [
            { value: "name", label: "Name" },
            { value: "price", label: "Price" }
        ];

        const onSearchMock = jest.fn();
        render(<SearchBar filters={filters} sortOptions={sortOptions} onSearch={onSearchMock} loading={false} />);

        fireEvent.change(screen.getByLabelText(/Keyword/i), { target: { value: "RTX" } });
        fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: "GPU" } });
        fireEvent.change(screen.getByLabelText(/Sort By/i), { target: { value: "price" } });
        fireEvent.change(screen.getByLabelText(/Order/i), { target: { value: "DESC" } });

        fireEvent.click(screen.getByText(/Search/i));

        expect(onSearchMock).toHaveBeenCalledWith({
            search: "RTX",
            category: "GPU",
            sortBy: "price",
            direction: "DESC"
        });
    });
});

/** Test 3: Does SearchBar call the onSearch prop when the user clicks the search button?
*    We need to verify that the onSearch function is called with the correct parameters when the user clicks the search button.
*    The expected parameters are:
*        Keyword = "RTX"
*        Category = "GPU"
*        Sort By = "price"
*        Order = "DESC"
*/
describe("SearchBar Search Button Click", () => {
    test("calls onSearch with correct parameters when search button is clicked", () => {
        const filters = [
            {
                name: "category",
                label: "Category",
                type: "select",
                options: ["CPU", "GPU"]
            }
        ];

        const sortOptions = [
            { value: "name", label: "Name" },
            { value: "price", label: "Price" }
        ];

        const onSearchMock = jest.fn();
        render(<SearchBar filters={filters} sortOptions={sortOptions} onSearch={onSearchMock} loading={false} />);

        fireEvent.change(screen.getByLabelText(/Keyword/i), { target: { value: "RTX" } });
        fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: "GPU" } });
        fireEvent.change(screen.getByLabelText(/Sort By/i), { target: { value: "price" } });
        fireEvent.change(screen.getByLabelText(/Order/i), { target: { value: "DESC" } });

        fireEvent.click(screen.getByText(/Search/i));

        expect(onSearchMock).toHaveBeenCalledWith({
            search: "RTX",
            category: "GPU",
            sortBy: "price",
            direction: "DESC"
        });
    });
});

/** Test 4: Does SearchBar loading state display correctly?
*  We need to verify that when the loading prop is true, the search button is disabled and a loading spinner is displayed.
*   so test:
*       loading=false
*       → enabled button
*       → "Search"
*
*       loading=true
*       → disabled button
*       → "Searching..."
*/
describe("SearchBar Loading State", () => {
    test("displays loading state correctly", () => {
        const filters = [
            {
                name: "category",
                label: "Category",
                type: "select",
                options: ["CPU", "GPU"]
            }
        ];

        const sortOptions = [
            { value: "name", label: "Name" },
            { value: "price", label: "Price" }
        ];

        const onSearchMock = jest.fn();
        const { rerender } = render(<SearchBar filters={filters} sortOptions={sortOptions} onSearch={onSearchMock} loading={false} />);

        // Verify initial state (loading=false)
        expect(screen.getByText(/Search/i)).toBeEnabled();
        expect(screen.queryByText(/Searching.../i)).not.toBeInTheDocument();

        // Rerender with loading=true
        rerender(<SearchBar filters={filters} sortOptions={sortOptions} onSearch={onSearchMock} loading={true} />);

        // Verify loading state (loading=true)
        expect(screen.getByText(/Searching.../i)).toBeDisabled();
        expect(screen.queryByText(/Search/i)).not.toBeInTheDocument();
    });
});
