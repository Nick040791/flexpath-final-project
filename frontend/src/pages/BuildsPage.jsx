import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import * as buildService from "../api/buildService";
import SearchBar from "../components/SearchBar";
import BuildCard from "../components/BuildCard";
import BuildForm from "../components/BuildForm";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import Pagination from "../components/Pagination";
import { BUILD_SORT_OPTIONS } from "../utils/constants";

const PAGE_SIZE = 12;

const BUILD_FILTERS = [
    {
        name: "visibility",
        label: "Visibility",
        type: "select",
        options: ["Public", "Private"],
    },
];

// Builds list - own + public builds, with search, visibility, sort, and pagination.
const BuildsPage = () => {
    const {
        isAuthenticated,
        loading: authLoading,
        username,
        isAdmin,
    } = useAuth();

    const [builds, setBuilds] = useState([]);
    const [status, setStatus] = useState("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [buildToDelete, setBuildToDelete] = useState(null);
    const [currentQuery, setCurrentQuery] = useState({});
    const [pagination, setPagination] = useState({
        page: 0,
        size: PAGE_SIZE,
        totalElements: 0,
        totalPages: 0,
    });

    const loadBuilds = useCallback(async (query = {}, targetPage = 0) => {
        setStatus("loading");
        setErrorMsg("");

        try {
            const data = await buildService.searchBuilds({
                ...query,
                page: targetPage,
                size: PAGE_SIZE,
            });

            // A delete can make the current page invalid. If that happens,
            // load the new final page rather than presenting an empty page.
            if (data.totalPages > 0 && targetPage >= data.totalPages) {
                const lastPage = data.totalPages - 1;
                const lastPageData = await buildService.searchBuilds({
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
            // Keep the last successful result set and pagination metadata.
            // A failed reload/search is different from a successful empty result.
            setStatus("error");
            setErrorMsg(error.message || "Unable to load builds.");
            return null;
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadBuilds({}, 0);
        }
    }, [isAuthenticated, loadBuilds]);

    async function handleSearch(params = {}) {
        const data = await loadBuilds(params, 0);
        if (data) {
            setCurrentQuery(params);
        }
    }

    async function handlePageChange(nextPage) {
        await loadBuilds(currentQuery, nextPage);
    }

    async function handleCreate(payload) {
        setSubmitting(true);
        setErrorMsg("");

        try {
            await buildService.createBuild(payload);
            setShowCreate(false);
            await loadBuilds(currentQuery, pagination.page);
        } catch (error) {
            // Keep the form open so the user can correct and resubmit it.
            setErrorMsg(error.message || "Unable to create the build.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!buildToDelete) {
            return;
        }

        setSubmitting(true);
        setErrorMsg("");

        try {
            await buildService.deleteBuild(buildToDelete.id);
            setBuildToDelete(null);
            await loadBuilds(currentQuery, pagination.page);
        } catch (error) {
            // Keep confirmation available after a failed delete so the user can retry or cancel.
            setErrorMsg(error.message || "Unable to delete the build.");
        } finally {
            setSubmitting(false);
        }
    }

    if (!authLoading && !isAuthenticated) {
        return (
            <section className="container py-5 text-center">
                <p className="text-muted">Please log in to browse builds.</p>
            </section>
        );
    }

    return (
        <section className="container py-5 text-start">
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-between align-items-sm-center mb-4 border-bottom border-warning border-3 pb-3">
                <h1 className="h3 mb-0">Builds</h1>

                {isAuthenticated && (
                    <button
                        type="button"
                        className="btn btn-warning fw-bold shadow-sm"
                        onClick={() => setShowCreate((prev) => !prev)}
                    >
                        {showCreate ? "Close Form" : "New Build"}
                    </button>
                )}
            </div>

            {errorMsg && (
                <div className="alert alert-danger" role="alert">
                    {errorMsg}
                </div>
            )}

            {showCreate && (
                <div className="p-4 mb-4 bg-warning-subtle rounded-4 shadow border border-warning border-2">
                    <h2 className="h5">New Build</h2>
                    <BuildForm
                        onSubmit={handleCreate}
                        onCancel={() => setShowCreate(false)}
                        submitting={submitting}
                        submitLabel="Create Build"
                    />
                </div>
            )}

            <SearchBar
                filters={BUILD_FILTERS}
                sortOptions={BUILD_SORT_OPTIONS}
                onSearch={handleSearch}
                loading={status === "loading"}
            />

            <div className="mt-3">
                {status === "success" && (
                    <p className="text-muted mb-0">
                        Showing {builds.length} of {pagination.totalElements} build(s)
                    </p>
                )}
            </div>

            {status === "success" && builds.length === 0 && (
                <p className="text-muted mt-3">No builds match your search.</p>
            )}

            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3 mt-1">
                {builds.map((build) => (
                    <BuildCard
                        key={build.id}
                        build={build}
                        canManage={isAdmin || build.username === username}
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
                    onCancel={() => setBuildToDelete(null)}
                    deleting={submitting}
                />
            )}
        </section>
    );
};

export default BuildsPage;
