import { useState } from "react";
import { useSearch } from '../hooks/useSearch'
import { FILTER_TYPE_OPTIONS } from "../utils/constants";

/*
    Okay, so the SearchMenu component handles the search menu on the search page.
    I'm trying to grab the search state and helper functions from the search context.
    This is the main search state that the rest of the app will use.
    The 'local state' below the function is just for what the user sees before they hit submit and stuff.
*/


function SearchMenu(){

    const { filterType, setFilterType, keyword, setKeyword, results, status, errorMsg, runSearch, } = useSearch();
    const[localFilterType, setLocalFilterType] = useState(filterType);
    const[localKeyword, setLocalKeyword] = useState(keyword);

    function handleSubmit(event){   // you're a nested function
        event.preventDefault();     // when we hit the search button, don't do what you normally do
        setFilterType(localFilterType);     // instead set the SearchMenu filter type using the local one we just got
        setKeyword(localKeyword);   // also do it again but keyword (͡° ͜ʖ ͡°)

        runSearch({
            filterType: localFilterType,
            keyword: localKeyword,
        });
    }



    return (
        <section className="container py-4 text-start">
            <div className="p-4 bg-light rounded-3 shadow-sm border">
            <form className="row g-3 align-items-end" onSubmit={handleSubmit}>

                <div className="col-md-3">
                    <label className="form-label" htmlFor="filterType">Filter Type</label>
                    <select id="filterType" value={localFilterType} className="form-select" onChange={(event) => setLocalFilterType(event.target.value)}>
                        {FILTER_TYPE_OPTIONS.map((option) => (<option value ={option.value} key={option.value || 'all'}>
                                {option.label}
                            </option>) )}
                    </select>
                </div>

                <div className="col-md-6">
                    <label className="form-label" htmlFor="keyword">
                        Keyword
                    </label>
                    <input id="keyword" className="form-control" type="search" value={localKeyword} onChange={(event) => setLocalKeyword(event.target.value)} placeholder="Enter search keyword" />
                </div>

                <div className="col-md-3">
                    <button className="btn btn-primary w-100" type="submit" disabled={status === 'loading'}>
                        {status === 'loading' ? 'Searching...' : 'Search'}
                    </button>
                </div>

            </form>
            </div>

            <div className="mt-3">
                {status === 'loading' && (<p className="text-muted mb-0">Loading...</p>)}
                {status === 'error' && (<p className="text-danger mb-0">Error: {errorMsg}</p>)}
                {status === 'success' && results.length > 0 && (
                    <p className="text-muted mb-0">Displaying {results.length} Records</p>
                )}
            </div>
        </section>
    );
};

export default SearchMenu;