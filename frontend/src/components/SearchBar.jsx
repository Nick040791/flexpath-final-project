import { useState } from "react";
import PropTypes from "prop-types";
import { DIRECTION_OPTIONS } from "../utils/constants";

/*
    Reusable search bar for Parts and Builds.
    - keyword: LIKE search on the backend ("search" param)
    - filters: extra query params, e.g. [{ name: "category", label: "Category", type: "select", options: [...] }]
    - sortOptions: [{ value, label }] — must be whitelisted on the backend
    Calls onSearch({ search, ...filters, sortBy, direction }) on submit.
*/
function SearchBar({ filters = [], sortOptions, onSearch, loading = false }) {
    const [values, setValues] = useState(() => {
        const initial = { search: "", sortBy: sortOptions[0].value, direction: "ASC" };
        filters.forEach((filter) => {
            initial[filter.name] = "";
        });
        return initial;
    });

    function handleChange(event) {
        setValues((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        onSearch(values);
    }

    return (
        <div className="p-3 p-md-4 bg-warning-subtle rounded-4 shadow border border-warning border-2">
            <form className="row g-3 align-items-end" onSubmit={handleSubmit}>
                <div className="col-md-4">
                    <label className="form-label fw-semibold" htmlFor="search">Keyword</label>
                    <input
                        id="search"
                        name="search"
                        className="form-control"
                        type="search"
                        value={values.search}
                        onChange={handleChange}
                        placeholder="Search by name or description"
                    />
                </div>

                {filters.map((filter) => (
                    <div className="col-md-2" key={filter.name}>
                        <label className="form-label" htmlFor={filter.name}>{filter.label}</label>
                        {filter.type === "select" ? (
                            <select
                                id={filter.name}
                                name={filter.name}
                                className="form-select"
                                value={values[filter.name]}
                                onChange={handleChange}
                            >
                                <option value="">All</option>
                                {filter.options.map((option) => (
                                    <option value={option} key={option}>{option}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                id={filter.name}
                                name={filter.name}
                                className="form-control"
                                type={filter.type || "text"}
                                min={filter.type === "number" ? "0" : undefined}
                                value={values[filter.name]}
                                onChange={handleChange}
                                placeholder={filter.placeholder || ""}
                            />
                        )}
                    </div>
                ))}

                <div className="col-md-2">
                    <label className="form-label" htmlFor="sortBy">Sort By</label>
                    <select
                        id="sortBy"
                        name="sortBy"
                        className="form-select"
                        value={values.sortBy}
                        onChange={handleChange}
                    >
                        {sortOptions.map((option) => (
                            <option value={option.value} key={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                <div className="col-md-2">
                    <label className="form-label" htmlFor="direction">Order</label>
                    <select
                        id="direction"
                        name="direction"
                        className="form-select"
                        value={values.direction}
                        onChange={handleChange}
                    >
                        {DIRECTION_OPTIONS.map((option) => (
                            <option value={option.value} key={option.value}>{option.label}</option>
                        ))}
                    </select>
                </div>

                <div className="col-md-12 col-lg-2">
                    <button className="btn btn-warning w-100 fw-bold shadow-sm" type="submit" disabled={loading}>
                        {loading ? "Searching..." : "Search"}
                    </button>
                </div>
            </form>
        </div>
    );
}

SearchBar.propTypes = {
    filters: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        type: PropTypes.string,
        options: PropTypes.arrayOf(PropTypes.string),
        placeholder: PropTypes.string,
    })),
    sortOptions: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
    })).isRequired,
    onSearch: PropTypes.func.isRequired,
    loading: PropTypes.bool,
};

export default SearchBar;
