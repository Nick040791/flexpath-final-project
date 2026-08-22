import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import * as buildService from "../api/buildService";
import BuildForm from "./BuildForm";

function AddPartToBuildModal({ part, onClose }) {
    const [builds, setBuilds] = useState([]);
    const [selectedBuildId, setSelectedBuildId] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [mode, setMode] = useState("existing");
    const [loadingBuilds, setLoadingBuilds] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        let active = true;

        async function loadBuilds() {
            setLoadingBuilds(true);
            setErrorMsg("");

            try {
                const data = await buildService.getMyBuilds();

                if (!active) {
                    return;
                }

                const myBuilds = Array.isArray(data) ? data : [];
                setBuilds(myBuilds);

                if (myBuilds.length > 0) {
                    setSelectedBuildId(String(myBuilds[0].id));
                } else {
                    setMode("create");
                }
            } catch (error) {
                if (active) {
                    setErrorMsg(error.message || "Unable to load your builds.");
                }
            } finally {
                if (active) {
                    setLoadingBuilds(false);
                }
            }
        }

        loadBuilds();

        return () => {
            active = false;
        };
    }, []);

    function normalizedQuantity() {
        const parsed = Number(quantity);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    }

    async function handleAddToExisting(event) {
        event.preventDefault();

        const amount = normalizedQuantity();

        if (!selectedBuildId) {
            setErrorMsg("Choose a build first.");
            return;
        }

        if (amount === null) {
            setErrorMsg("Quantity must be a whole number greater than zero.");
            return;
        }

        setSubmitting(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            await buildService.addPartToBuild(
                Number(selectedBuildId),
                part.id,
                amount
            );

            const build = builds.find(
                (item) => String(item.id) === String(selectedBuildId)
            );

            setSuccessMsg(
                `${part.name || "Part"} added to ${build?.name || "your build"}.`
            );
        } catch (error) {
            setErrorMsg(error.message || "Unable to add the part to this build.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleCreateAndAdd(payload) {
        const amount = normalizedQuantity();

        if (amount === null) {
            setErrorMsg("Quantity must be a whole number greater than zero.");
            return;
        }

        setSubmitting(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const created = await buildService.createBuild(payload);

            if (!created || !created.id) {
                throw new Error(
                    "The build was created, but the server did not return its ID."
                );
            }

            await buildService.addPartToBuild(
                created.id,
                part.id,
                amount
            );

            setBuilds((prev) => [...prev, created]);
            setSelectedBuildId(String(created.id));
            setMode("existing");
            setSuccessMsg(
                `${created.name || "New build"} created and ${part.name || "the part"} added.`
            );
        } catch (error) {
            setErrorMsg(error.message || "Unable to create the build and add the part.");
        } finally {
            setSubmitting(false);
        }
    }

    function handleBackdropClick(event) {
        if (event.target === event.currentTarget && !submitting) {
            onClose();
        }
    }

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.55)", zIndex: 1055 }}
            role="presentation"
            onClick={handleBackdropClick}
        >
            <div
                className="card shadow-lg border-warning border-2 rounded-4 w-100"
                style={{ maxWidth: "640px", maxHeight: "90vh", overflowY: "auto" }}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`add-part-to-build-title-${part.id}`}
            >
                <div className="card-header bg-warning-subtle d-flex justify-content-between align-items-start gap-3">
                    <div>
                        <h2
                            id={`add-part-to-build-title-${part.id}`}
                            className="h5 mb-1 fw-bold"
                        >
                            Add to Build
                        </h2>
                        <p className="mb-0 text-muted">
                            {part.name || "Selected part"}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn-close"
                        aria-label="Close"
                        onClick={onClose}
                        disabled={submitting}
                    />
                </div>

                <div className="card-body p-4">
                    {errorMsg && (
                        <div className="alert alert-danger" role="alert">
                            {errorMsg}
                        </div>
                    )}

                    {successMsg && (
                        <div className="alert alert-success" role="status">
                            {successMsg}
                        </div>
                    )}

                    <div className="mb-4">
                        <label
                            className="form-label fw-semibold"
                            htmlFor={`part-quantity-${part.id}`}
                        >
                            Quantity
                        </label>
                        <input
                            id={`part-quantity-${part.id}`}
                            className="form-control"
                            type="number"
                            min="1"
                            step="1"
                            value={quantity}
                            onChange={(event) => setQuantity(event.target.value)}
                            disabled={submitting}
                        />
                    </div>

                    <div className="d-flex flex-wrap gap-2 mb-4">
                        <button
                            type="button"
                            className={
                                mode === "existing"
                                    ? "btn btn-warning fw-semibold"
                                    : "btn btn-outline-warning text-dark fw-semibold"
                            }
                            onClick={() => {
                                setMode("existing");
                                setErrorMsg("");
                                setSuccessMsg("");
                            }}
                            disabled={loadingBuilds || builds.length === 0 || submitting}
                        >
                            Existing Build
                        </button>
                        <button
                            type="button"
                            className={
                                mode === "create"
                                    ? "btn btn-warning fw-semibold"
                                    : "btn btn-outline-warning text-dark fw-semibold"
                            }
                            onClick={() => {
                                setMode("create");
                                setErrorMsg("");
                                setSuccessMsg("");
                            }}
                            disabled={submitting}
                        >
                            Create New Build
                        </button>
                    </div>

                    {mode === "existing" && (
                        <>
                            {loadingBuilds ? (
                                <p className="text-muted mb-0">Loading your builds...</p>
                            ) : builds.length === 0 ? (
                                <div className="alert alert-info mb-0">
                                    You do not have any builds yet. Create one to add this part.
                                </div>
                            ) : (
                                <form onSubmit={handleAddToExisting}>
                                    <div className="mb-3">
                                        <label
                                            className="form-label fw-semibold"
                                            htmlFor={`build-select-${part.id}`}
                                        >
                                            Build
                                        </label>
                                        <select
                                            id={`build-select-${part.id}`}
                                            className="form-select"
                                            value={selectedBuildId}
                                            onChange={(event) =>
                                                setSelectedBuildId(event.target.value)
                                            }
                                            disabled={submitting}
                                        >
                                            {builds.map((build) => (
                                                <option key={build.id} value={build.id}>
                                                    {build.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-warning fw-bold"
                                        disabled={submitting}
                                    >
                                        {submitting ? "Adding..." : "Add to Build"}
                                    </button>
                                </form>
                            )}
                        </>
                    )}

                    {mode === "create" && (
                        <div>
                            <h3 className="h6 fw-bold mb-3">Create a new build</h3>
                            <BuildForm
                                onSubmit={handleCreateAndAdd}
                                onCancel={
                                    builds.length > 0
                                        ? () => setMode("existing")
                                        : onClose
                                }
                                submitting={submitting}
                                submitLabel="Create Build & Add Part"
                            />
                        </div>
                    )}
                </div>

                <div className="card-footer bg-white text-end">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

AddPartToBuildModal.propTypes = {
    part: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string,
    }).isRequired,
    onClose: PropTypes.func.isRequired,
};

export default AddPartToBuildModal;
