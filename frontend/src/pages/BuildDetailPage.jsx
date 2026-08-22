import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import * as buildService from "../api/buildService";
import * as partService from "../api/partService";
import BuildForm from "../components/BuildForm";
import VisibilityBadge from "../components/VisibilityBadge";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { formatPrice } from "../utils/format";

const PART_PAGE_SIZE = 50;

function loadErrorTitle(error) {
    if (error?.status === 404) {
        return "Build not found";
    }
    if (error?.status === 403) {
        return "Access denied";
    }
    return "Unable to load build";
}

function isRetryable(error) {
    return error?.status === 0 || error?.status >= 500 || error?.status == null;
}

// Single build view: parts in the build, add/remove parts, edit/delete for owner or admin.
const BuildDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { username, isAdmin, isAuthenticated } = useAuth();

    const [build, setBuild] = useState(null);
    const [parts, setParts] = useState([]);
    const [availableParts, setAvailableParts] = useState([]);
    const [selectedPartId, setSelectedPartId] = useState("");

    const [status, setStatus] = useState("loading");
    const [loadError, setLoadError] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [availablePartsError, setAvailablePartsError] = useState("");
    const [availablePartsRetryKey, setAvailablePartsRetryKey] = useState(0);

    const [editing, setEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const loadBuild = useCallback(async () => {
        setStatus("loading");
        setLoadError(null);
        setErrorMsg("");

        try {
            const [buildData, partsData] = await Promise.all([
                buildService.getBuild(id),
                buildService.getBuildParts(id),
            ]);

            setBuild(buildData);
            setParts(partsData);
            setStatus("success");
        } catch (error) {
            setBuild(null);
            setParts([]);
            setStatus("error");
            setLoadError(error);
        }
    }, [id]);

    useEffect(() => {
        if (isAuthenticated) {
            loadBuild();
        }
    }, [isAuthenticated, loadBuild]);

    const canManage = Boolean(build) && (isAdmin || build.username === username);

    // Load all visible parts for the "Add a Part" picker. The backend caps the
    // page size at 50, so additional pages are requested when needed.
    useEffect(() => {
        if (!canManage) {
            setAvailableParts([]);
            setAvailablePartsError("");
            return;
        }

        let cancelled = false;

        async function loadAvailableParts() {
            setAvailablePartsError("");

            try {
                const firstPage = await partService.searchParts({
                    page: 0,
                    size: PART_PAGE_SIZE,
                });

                let allParts = firstPage.content ?? [];

                if (firstPage.totalPages > 1) {
                    const requests = [];
                    for (let page = 1; page < firstPage.totalPages; page += 1) {
                        requests.push(
                            partService.searchParts({
                                page,
                                size: PART_PAGE_SIZE,
                            })
                        );
                    }

                    const remainingPages = await Promise.all(requests);
                    allParts = [
                        ...allParts,
                        ...remainingPages.flatMap((result) => result.content ?? []),
                    ];
                }

                if (!cancelled) {
                    setAvailableParts(allParts);
                }
            } catch (error) {
                if (!cancelled) {
                    // Preserve the last successful picker data and surface the failure.
                    setAvailablePartsError(
                        error.message || "Unable to load available parts."
                    );
                }
            }
        }

        loadAvailableParts();

        return () => {
            cancelled = true;
        };
    }, [canManage, availablePartsRetryKey]);

    const totalPrice = useMemo(
        () => parts.reduce((sum, part) => sum + Number(part.price ?? 0), 0),
        [parts]
    );

    const addableParts = useMemo(
        () =>
            availableParts.filter(
                (part) => !parts.some((existingPart) => existingPart.id === part.id)
            ),
        [availableParts, parts]
    );

    async function handleUpdate(payload) {
        setSubmitting(true);
        setErrorMsg("");

        try {
            await buildService.updateBuild(id, payload);
            setEditing(false);
            await loadBuild();
        } catch (error) {
            // Keep edit mode active so validation failures can be corrected.
            setErrorMsg(error.message || "Unable to update the build.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        setSubmitting(true);
        setErrorMsg("");

        try {
            await buildService.deleteBuild(id);
            navigate("/builds");
        } catch (error) {
            // Keep confirmation open after failure so the user can retry or cancel.
            setErrorMsg(error.message || "Unable to delete the build.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleAddPart() {
        if (!selectedPartId) {
            return;
        }

        setErrorMsg("");

        try {
            await buildService.addPartToBuild(id, Number(selectedPartId), 1);
            setSelectedPartId("");
            await loadBuild();
        } catch (error) {
            setErrorMsg(error.message || "Unable to add the part to this build.");
        }
    }

    async function handleRemovePart(partId) {
        setErrorMsg("");

        try {
            await buildService.removePartFromBuild(id, partId);
            await loadBuild();
        } catch (error) {
            setErrorMsg(error.message || "Unable to remove the part from this build.");
        }
    }

    if (status === "loading") {
        return (
            <section className="container py-5">
                <p className="text-muted">Loading build...</p>
            </section>
        );
    }

    if (status === "error") {
        return (
            <section className="container py-5 text-start">
                <div className="alert alert-danger" role="alert">
                    <h1 className="h5 alert-heading">{loadErrorTitle(loadError)}</h1>
                    <p className="mb-3">
                        {loadError?.message || "Unable to load the requested build."}
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                        {isRetryable(loadError) && (
                            <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={loadBuild}
                            >
                                Try again
                            </button>
                        )}
                        <Link to="/builds" className="btn btn-outline-secondary btn-sm">
                            Back to Builds
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="container py-5 text-start">
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-between align-items-sm-start mb-4 bg-warning-subtle border border-warning border-2 rounded-4 p-4 shadow-sm">
                <div>
                    <h1 className="h3 mb-1">{build.name}</h1>
                    <p className="text-muted mb-0">by {build.username}</p>
                </div>
                <VisibilityBadge isPublic={build.is_Public} />
            </div>

            {errorMsg && (
                <div className="alert alert-danger" role="alert">
                    {errorMsg}
                </div>
            )}

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <p className="card-text mb-0">
                        {build.description || "No description."}
                    </p>
                </div>

                {canManage && (
                    <div className="card-footer d-flex gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-warning text-dark fw-semibold btn-sm"
                            onClick={() => setEditing((prev) => !prev)}
                        >
                            {editing ? "Cancel Edit" : "Edit"}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => setConfirmDelete(true)}
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {editing && canManage && (
                <div className="p-4 mb-4 bg-warning-subtle rounded-4 shadow border border-warning border-2">
                    <h2 className="h5">Edit Build</h2>
                    <BuildForm
                        initial={build}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditing(false)}
                        submitting={submitting}
                        submitLabel="Update Build"
                    />
                </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h4 mb-0">Parts in this Build</h2>
                <span className="fw-bold">Total: {formatPrice(totalPrice)}</span>
            </div>

            {parts.length === 0 ? (
                <p className="text-muted">No parts in this build yet.</p>
            ) : (
                <div className="table-responsive mb-4">
                    <table className="table table-striped table-hover align-middle border border-warning">
                        <thead className="table-warning">
                            <tr>
                                <th scope="col">Name</th>
                                <th scope="col">Category</th>
                                <th scope="col">Brand</th>
                                <th scope="col">Price</th>
                                {canManage && <th scope="col"></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {parts.map((part) => (
                                <tr key={part.id}>
                                    <td>
                                        <Link to={`/parts/${part.id}`}>{part.name}</Link>
                                    </td>
                                    <td>{part.category}</td>
                                    <td>{part.brand}</td>
                                    <td>{formatPrice(part.price)}</td>
                                    {canManage && (
                                        <td className="text-end">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleRemovePart(part.id)}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {canManage && (
                <div className="p-4 bg-warning-subtle rounded-4 shadow border border-warning border-2">
                    <h3 className="h5">Add a Part</h3>

                    {availablePartsError && (
                        <div className="alert alert-danger" role="alert">
                            <p className="mb-2">{availablePartsError}</p>
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() =>
                                    setAvailablePartsRetryKey((current) => current + 1)
                                }
                            >
                                Retry parts
                            </button>
                        </div>
                    )}

                    <div className="row g-2 align-items-end">
                        <div className="col-md-8">
                            <label className="form-label" htmlFor="add-part">
                                Part
                            </label>
                            <select
                                id="add-part"
                                className="form-select"
                                value={selectedPartId}
                                onChange={(event) => setSelectedPartId(event.target.value)}
                            >
                                <option value="">Choose a part...</option>
                                {addableParts.map((part) => (
                                    <option value={part.id} key={part.id}>
                                        {part.name} ({formatPrice(part.price)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-4">
                            <button
                                type="button"
                                className="btn btn-warning w-100 fw-bold shadow-sm"
                                onClick={handleAddPart}
                                disabled={!selectedPartId}
                            >
                                Add to Build
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDelete && (
                <ConfirmDeleteModal
                    itemName={build.name}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDelete(false)}
                    deleting={submitting}
                />
            )}
        </section>
    );
};

export default BuildDetailPage;
