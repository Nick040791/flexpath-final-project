/** Test 1: Does SearchBar initialize correctly from the props it's passed?
*    We need to verify:
*        Keyword = ""
*        Sort By = first sort option
*         Order = "ASC"
*    The Actual direction constants are:
*        ASC -> Ascending
*       DESC -> Descending
*/

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

/** Test 3: Does SearchBar call the onSearch prop when the user clicks the search button?
*    We need to verify that the onSearch function is called with the correct parameters when the user clicks the search button.
*    The expected parameters are:
*        Keyword = "RTX"
*        Category = "GPU"
*        Sort By = "price"
*        Order = "DESC"
*/

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
