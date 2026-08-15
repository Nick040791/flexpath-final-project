import PartCards from '../components/PartCards';
import SearchMenu from '../components/SearchMenu';
import SearchResultsTable from '../components/SearchResultsTable';

const SearchPage = () => { return (
    <>
        <SearchMenu />
        <PartCards />
        <SearchResultsTable />
    </>
);
};

export default SearchPage;