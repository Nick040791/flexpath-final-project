import { useContext } from "react";
import SearchContext from '../context/SearchContext';

/*
    Anyway... Now I really wanna grab all of the context from the SearchContext component, add some validation
    and just use this as a cleaner way to access the search context. It just feels a little tidier, ya know? 👌
*/

export function useSearch(){
    const context = useContext(SearchContext);
    if (!context){
        throw new Error('useSearch must be used inside of searchProvider')
    }
    return context;
};