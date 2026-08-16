import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import * as buildService from "../api/buildService";
import SearchBar from "../components/SearchBar";
import BuildCard from "../components/BuildCard";
import BuildForm from "../components/BuildForm";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { BUILD_SORT_OPTIONS } from "../utils/constants";

const BUILD_FILTERS = [
    {
        name: "visibility",
        label: "Visibility",
        type: "select",
        options: ["Public", "Private"],
    },
];

// Builds list — own + public builds (the backend filters visibility), with search & sort.
const BuildsPage = () => {
    const { isAuthenticated, loading: authLoading, username, isAdmin } = useAuth();
    const [builds, setBuilds] = useState([]);
    const [status, setStatus] = useState("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [buildToDelete, setBuildToDelete] = useState(null);

    const loadBuilds = useCallback(async (params = {}) => {
        setStatus("loading");
        setErrorMsg("");
        try {
            const data = await buildService.searchBuilds(params);
            setBuilds(data);
            setStatus("success");
        } catch (error) {
            setBuilds([]);
            setStatus("error");
            setErrorMsg(error.message);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadBuilds();
        }
    }, [isAuthenticated, loadBuilds]);

    async function handleCreate(payload) {
        setSubmitting(true);
        setErrorMsg("");
        try {
            await buildService.createBuild(payload);
            setShowCreate(false);
            await loadBuilds();
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        setSubmitting(true);
        try {
            await buildService.deleteBuild(buildToDelete.id);
            setBuildToDelete(null);
            await loadBuilds();
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

            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

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
                onSearch={loadBuilds}
                loading={status === "loading"}
            />

            <div className="mt-3">
                {status === "success" && <p className="text-muted mb-0">Showing {builds.length} build(s)</p>}
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
