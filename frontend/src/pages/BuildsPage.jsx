import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import * as buildService from "../api/buildService";
import SearchBar from "../components/SearchBar";
import BuildCard from "../components/BuildCard";
import BuildForm from "../components/BuildForm";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import Pagination from "../components/Pagination";
import Breadcrumbs from "../components/Breadcrumbs";
import {
    BUILD_CONTENT_OPTIONS,
    BUILD_SORT_OPTIONS,
    PART_CATEGORIES,
} from "../utils/constants";
import {
    clearBuildPreferences,
    readBuildPreferences,
    writeBuildPreferences,
} from "../utils/searchPreferences";

const PAGE_SIZE = 12;

const BUILD_FILTERS = [
    {
        name: "visibility",
        label: "Visibility",
        type: "select",
        options: ["Public", "Private"],
    },
    {
        name: "owner",
        label: "Creator",
        type: "text",
        placeholder: "Username",
    },
    {
        name: "partCategory",
        label: "Part Category",
        type: "select",
        options: PART_CATEGORIES,
    },
    {
        name: "partSearch",
        label: "Contains Part",
        type: "text",
        placeholder: "Name, brand, or model",
    },
    {
        name: "hasParts",
        label: "Contents",
        type: "select",
        options: BUILD_CONTENT_OPTIONS,
    },
];

// Builds list — own + public builds, with search, filters, sort, persistence, and pagination.
const BuildsPage = () => {
    const {
        isAuthenticated,
        loading: authLoading,
        username,
        isAdmin
    } = useAuth();

    const [builds, setBuilds] = useState([]);

    const [status, setStatus] = useState("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [buildToDelete, setBuildToDelete] = useState(null);

    // Stores the active search/filter/sort values.
    // Page navigation reuses this exact query.
    const [currentQuery, setCurrentQuery] = useState({});

    // Pagination metadata returned by the backend.
    const [pagination, setPagination] = useState({
        page: 0,
        size: PAGE_SIZE,
        totalElements: 0,
        totalPages: 0,
    });


    /*
     * Loads one page of Builds.
     *
     * query contains the active:
     * search
     * visibility
     * owner
     * partCategory
     * partSearch
     * hasParts
     * sortBy
     * direction
     *
     * targetPage controls which backend page is requested.
     */
    const loadBuilds = useCallback(async (
        query = {},
        targetPage = 0
    ) => {
        setStatus("loading");
        setErrorMsg("");

        try {
            const data = await buildService.searchBuilds({
                ...query,
                page: targetPage,
                size: PAGE_SIZE,
            });

            /*
             * If a delete removed the last item from the
             * current page, the current page can become invalid.
             * Reload the new last page when that happens.
             */
            if (
                data.totalPages > 0 &&
                targetPage >= data.totalPages
            ) {
                const lastPage = data.totalPages - 1;

                const lastPageData =
                    await buildService.searchBuilds({
                        ...query,
                        page: lastPage,
                        size: PAGE_SIZE,
                    });

                setBuilds(lastPageData.content);

                setPagination({
                    page: lastPageData.page,
                    size: lastPageData.size,
                    totalElements: lastPageData.totalElements,
                    totalPages: lastPageData.totalPages,
                });

                setStatus("success");

                return lastPageData;
            }

            setBuilds(data.content);

            setPagination({
                page: data.page,
                size: data.size,
                totalElements: data.totalElements,
                totalPages: data.totalPages,
            });

            setStatus("success");

            return data;

        } catch (error) {
            setBuilds([]);

            setPagination({
                page: 0,
                size: PAGE_SIZE,
                totalElements: 0,
                totalPages: 0,
            });

            setStatus("error");
            setErrorMsg(error.message);

            return null;
        }
    }, []);


    /*
     * Restore this authenticated user's saved Build query.
     * Page and size are intentionally not persisted, so every
     * restored result set starts on backend page 0.
     */
    useEffect(() => {
        if (authLoading || !isAuthenticated || !username) {
            return;
        }

        const restoredQuery = readBuildPreferences(username);

        setCurrentQuery(restoredQuery);
        loadBuilds(restoredQuery, 0);
    }, [authLoading, isAuthenticated, username, loadBuilds]);


    /*
     * A new search/filter/sort creates a new result set.
     * Persist the submitted query and reset pagination to page 0.
     */
    async function handleSearch(params = {}) {
        setCurrentQuery(params);

        if (username) {
            writeBuildPreferences(username, params);
        }

        await loadBuilds(
            params,
            0
        );
    }


    /*
     * Reset is the escape hatch for persistent filters.
     * SearchBar resets its controls; this clears persisted state
     * and reloads the backend defaults on page 0.
     */
    async function handleReset() {
        if (username) {
            clearBuildPreferences(username);
        }

        setCurrentQuery({});

        await loadBuilds({}, 0);
    }


    /*
     * Page navigation changes only the page.
     * The active search/filter/sort values are preserved.
     */
    async function handlePageChange(nextPage) {
        await loadBuilds(
            currentQuery,
            nextPage
        );
    }


    async function handleCreate(payload) {
        setSubmitting(true);
        setErrorMsg("");

        try {
            await buildService.createBuild(payload);

            setShowCreate(false);

            // Refresh the current result set/page.
            await loadBuilds(
                currentQuery,
                pagination.page
            );

        } catch (error) {
            setErrorMsg(error.message);

        } finally {
            setSubmitting(false);
        }
    }


    async function handleDelete() {
        setSubmitting(true);
        setErrorMsg("");

        try {
            await buildService.deleteBuild(
                buildToDelete.id
            );

            setBuildToDelete(null);

            await loadBuilds(
                currentQuery,
                pagination.page
            );

        } catch (error) {
            setErrorMsg(error.message);
            setBuildToDelete(null);

        } finally {
            setSubmitting(false);
        }
    }


    if (!authLoading && !isAuthenticated) {
        return (
            <section className="container py-5 text-center">
                <p className="text-muted">
                    Please log in to browse builds.
                </p>
            </section>
        );
    }


    return (
        <section className="container py-5 text-start">

            <Breadcrumbs
                items={[
                    { label: "Home", to: "/" },
                    { label: "Builds" },
                ]}
            />

            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-between align-items-sm-center mb-4 border-bottom border-warning border-3 pb-3">

                <h1 className="h3 mb-0">
                    Builds
                </h1>

                {isAuthenticated && (
                    <button
                        type="button"
                        className="btn btn-warning fw-bold shadow-sm"
                        onClick={() =>
                            setShowCreate((prev) => !prev)
                        }
                    >
                        {showCreate
                            ? "Close Form"
                            : "New Build"}
                    </button>
                )}

            </div>


            {errorMsg && (
                <div className="alert alert-danger">
                    {errorMsg}
                </div>
            )}


            {showCreate && (
                <div className="p-4 mb-4 bg-warning-subtle rounded-4 shadow border border-warning border-2">

                    <h2 className="h5">
                        New Build
                    </h2>

                    <BuildForm
                        onSubmit={handleCreate}
                        onCancel={() =>
                            setShowCreate(false)
                        }
                        submitting={submitting}
                        submitLabel="Create Build"
                    />

                </div>
            )}


            <SearchBar
                filters={BUILD_FILTERS}
                sortOptions={BUILD_SORT_OPTIONS}
                initialValues={currentQuery}
                onSearch={handleSearch}
                onReset={handleReset}
                loading={status === "loading"}
            />


            <div className="mt-3">

                {status === "success" && (
                    <p className="text-muted mb-0">
                        Showing {builds.length} of{" "}
                        {pagination.totalElements} build(s)
                    </p>
                )}

            </div>


            {status === "success" &&
                builds.length === 0 && (
                    <p className="text-muted mt-3">
                        No builds match your search.
                    </p>
                )}


            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3 mt-1">

                {builds.map((build) => (
                    <BuildCard
                        key={build.id}
                        build={build}
                        canManage={
                            isAdmin ||
                            build.username === username
                        }
                        onDelete={setBuildToDelete}
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


            {buildToDelete && (
                <ConfirmDeleteModal
                    itemName={buildToDelete.name}
                    onConfirm={handleDelete}
                    onCancel={() =>
                        setBuildToDelete(null)
                    }
                    deleting={submitting}
                />
            )}

        </section>
    );
};

export default BuildsPage;
