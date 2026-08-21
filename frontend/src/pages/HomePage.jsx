import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import * as partService from "../api/partService";
import * as buildService from "../api/buildService";
import SearchBar from "../components/SearchBar";
import PartCard from "../components/PartCard";
import BuildCard from "../components/BuildCard";
import Pagination from "../components/Pagination";
import { PART_CATEGORIES, PART_SORT_OPTIONS } from "../utils/constants";

const PAGE_SIZE = 12;

const PART_FILTERS = [
    {
        name: "category",
        label: "Category",
        type: "select",
        options: PART_CATEGORIES
    },
    {
        name: "brand",
        label: "Brand",
        type: "text",
        placeholder: "e.g. AMD"
    },
    {
        name: "maxPrice",
        label: "Max Price",
        type: "number",
        placeholder: "e.g. 500"
    },
];

// Home / public feed:
// searchable, sortable, paginated Parts
// plus a preview of public Builds.
const HomePage = () => {
    const {
        isAuthenticated,
        loading: authLoading,
        username,
        isAdmin
    } = useAuth();

    const [parts, setParts] = useState([]);
    const [builds, setBuilds] = useState([]);

    const [status, setStatus] = useState("idle");
    const [errorMsg, setErrorMsg] = useState("");

    // Stores the active Part search/filter/sort values.
    const [currentQuery, setCurrentQuery] = useState({});

    // Pagination metadata returned by the backend.
    const [pagination, setPagination] = useState({
        page: 0,
        size: PAGE_SIZE,
        totalElements: 0,
        totalPages: 0
    });


    /*
     * Load one page of Parts.
     *
     * query contains:
     * search
     * category
     * brand
     * maxPrice
     * sortBy
     * direction
     *
     * targetPage controls the backend page requested.
     */
    const loadParts = useCallback(async (
        query = {},
        targetPage = 0
    ) => {
        setStatus("loading");
        setErrorMsg("");

        try {
            const data = await partService.searchParts({
                ...query,
                page: targetPage,
                size: PAGE_SIZE
            });

            setParts(data.content);

            setPagination({
                page: data.page,
                size: data.size,
                totalElements: data.totalElements,
                totalPages: data.totalPages
            });

            setStatus("success");

        } catch (error) {
            setParts([]);

            setPagination({
                page: 0,
                size: PAGE_SIZE,
                totalElements: 0,
                totalPages: 0
            });

            setStatus("error");
            setErrorMsg(error.message);
        }
    }, []);


    /*
     * Initial load.
     *
     * Parts begin on page 0.
     * Public Builds preview requests only the first 4.
     */
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        loadParts({}, 0);

        buildService.searchBuilds({
            visibility: "Public",
            page: 0,
            size: 4
        })
            .then((data) => {
                setBuilds(data.content);
            })
            .catch(() => {
                setBuilds([]);
            });

    }, [isAuthenticated, loadParts]);


    /*
     * New search/filter/sort criteria create a
     * new result set, so always return to page 0.
     */
    async function handleSearch(params = {}) {
        setCurrentQuery(params);

        await loadParts(
            params,
            0
        );
    }


    /*
     * Page navigation changes only the page.
     *
     * Active search/filter/sort values stay intact.
     */
    async function handlePageChange(nextPage) {
        await loadParts(
            currentQuery,
            nextPage
        );
    }


    return (
        <>
            <section className="container-fluid text-bg-warning py-5 text-center shadow-sm">
                <div className="container py-4">

                    <span className="badge text-bg-dark rounded-pill mb-3 px-3 py-2">
                        YOUR PC. YOUR PARTS. YOUR BUILD.
                    </span>

                    <h1 className="display-3 fw-bold mb-3">
                        PC Parts &amp; Builds
                    </h1>

                    <p className="lead mb-4">
                        Catalog your PC parts, share them publicly,
                        and assemble them into builds.
                    </p>

                </div>
            </section>


            {authLoading && (
                <section className="container py-4 text-center">
                    <p className="text-muted">
                        Loading...
                    </p>
                </section>
            )}


            {!authLoading && !isAuthenticated && (
                <section className="container py-4">

                    <div className="card text-center shadow border-warning border-2 rounded-4">

                        <div className="card-body bg-warning-subtle p-5 rounded-4">

                            <p className="card-text">
                                Log in to browse public parts and builds,
                                or add your own.
                            </p>

                            <Link
                                to="/login"
                                className="btn btn-warning fw-bold px-4 shadow-sm"
                            >
                                Login
                            </Link>

                        </div>
                    </div>

                </section>
            )}


            {isAuthenticated && (
                <>

                    {/* -------- Parts Search -------- */}

                    <section className="container py-4 text-start">

                        <h2 className="h3 fw-bold mb-3 border-start border-warning border-5 ps-3">
                            Browse Parts
                        </h2>

                        <SearchBar
                            filters={PART_FILTERS}
                            sortOptions={PART_SORT_OPTIONS}
                            onSearch={handleSearch}
                            loading={status === "loading"}
                        />


                        <div className="mt-3">

                            {status === "error" && (
                                <p className="text-danger mb-0">
                                    Error: {errorMsg}
                                </p>
                            )}

                            {status === "success" && (
                                <p className="text-muted mb-0">
                                    Showing {parts.length} of{" "}
                                    {pagination.totalElements} part(s)
                                </p>
                            )}

                        </div>

                    </section>


                    {/* -------- Parts Results -------- */}

                    <section className="container py-3">

                        {status === "success" &&
                            parts.length === 0 && (
                                <p className="text-muted">
                                    No parts match your search.
                                </p>
                            )}


                        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">

                            {parts.map((part) => (
                                <PartCard
                                    key={part.id}
                                    part={part}
                                    canManage={
                                        isAdmin ||
                                        part.username === username
                                    }
                                />
                            ))}

                        </div>


                        <div className="d-flex justify-content-center mt-4">

                            <Pagination
                                page={pagination.page}
                                totalPages={pagination.totalPages}
                                loading={status === "loading"}
                                onPageChange={handlePageChange}
                            />

                        </div>

                    </section>


                    {/* -------- Public Builds Preview -------- */}

                    <section className="container py-4 text-start">

                        <div className="d-flex flex-column flex-sm-row gap-3 justify-content-between align-items-sm-center mb-3">

                            <h2 className="h3 fw-bold mb-0 border-start border-warning border-5 ps-3">
                                Public Builds
                            </h2>

                            <Link
                                to="/builds"
                                className="btn btn-outline-warning text-dark fw-semibold"
                            >
                                View all builds
                            </Link>

                        </div>


                        {builds.length === 0 ? (
                            <p className="text-muted">
                                No public builds yet.
                            </p>
                        ) : (
                            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-3">

                                {builds.map((build) => (
                                    <BuildCard
                                        key={build.id}
                                        build={build}
                                    />
                                ))}

                            </div>
                        )}

                    </section>

                </>
            )}
        </>
    );
};

export default HomePage;