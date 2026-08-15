import { createContext, useCallback, useEffect, useMemo, useState, } from 'react';
import { VALID_FILTER_TYPES } from "../utils/constants";
import PropTypes from 'prop-types';


const SearchContext = createContext(null);

//getSafeFilterType and getInitialResults stay as they were

function getSafeFilterType(value){
    if (VALID_FILTER_TYPES.has(value)) {
        return value;
    }

    return '';
};

function getInitialResults(){
    const savedResults = localStorage.getItem('searchResults');

    if (!savedResults){return [];}

    try {
        const parsedResults = JSON.parse(savedResults);
        if (Array.isArray(parsedResults)) {
            return parsedResults;
        }
        return [];
    }
    catch {
        return []
    }
};

export function SearchProvider({ children }){
    const [filterType, setFilterType] = useState('');
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState(getInitialResults);
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (results.length > 0){
            localStorage.setItem('searchResults', JSON.stringify(results));
        }
    }, [results]);

    const runSearch = useCallback(
        async (overrides = {}) => {
            const nextFilterType = getSafeFilterType(overrides.filterType ?? filterType);
            const nextKeyword = overrides.keyword ?? keyword;
            const cleanKeyword = String(nextKeyword).trim(); 

            const params = new URLSearchParams();
            params.set('filterType', nextFilterType);
            params.set('keyword', cleanKeyword);

            const url = `/api/data/search?${params.toString()}`;

            setStatus('loading');
            setErrorMsg('');

            try {
                const response = await fetch(url);
                
                if (!response.ok){
                    throw new Error(`Search failed with status: ${response.status}`);
                }
                const data = await response.json();

                const records = Array.isArray(data)
                    ? data
                    : data.results ?? [];

                 setResults(records);
                 setStatus('success');

                localStorage.setItem('searchResults', JSON.stringify(records));

                return records;
                }
                catch (error) {
                    setResults([]);
                    setStatus('error');
                    setErrorMsg(error.message || 'Search Failed.');
                    localStorage.removeItem('searchResults');

                    return [];
                }
            },
        [filterType, keyword]
    );

    const value = useMemo(
        () => ({
            filterType,
            setFilterType,

            keyword,
            setKeyword,

            results,
            setResults,

            status,
            setStatus,

            errorMsg,
            setErrorMsg,

            runSearch,
        }),
        [filterType, keyword, results, status, errorMsg, runSearch]
    );
    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
}
    //validate it
    SearchProvider.propTypes = {
        children: PropTypes.node.isRequired
    };




export default SearchContext;