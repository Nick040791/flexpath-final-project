import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import * as partService from "../api/partService";
import PartCard from "../components/PartCard";
import PartForm from "../components/PartForm";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";

// "My Parts" - the current user's parts with create / edit / delete.
const MyPartsPage = () => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [parts, setParts] = useState([]);
    const [status, setStatus] = useState("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [partToDelete, setPartToDelete] = useState(null);

    const loadParts = useCallback(async () => {
        setStatus("loading");
        setErrorMsg("");

        try {
            const data = await partService.getMyParts();
            setParts(data);
            setStatus("success");
            return data;
        } catch (error) {
            // Preserve the last successful list. A failed refresh is not the same
            // as a successful request returning zero parts.
            setStatus("error");
            setErrorMsg(error.message || "Unable to load your parts.");
            return null;
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadParts();
        }
    }, [isAuthenticated, loadParts]);

    async function handleCreate(payload) {
        setSubmitting(true);
        setErrorMsg("");

        try {
            await partService.createPart(payload);
            setShowCreate(false);
            await loadParts();
        } catch (error) {
            // Keep the form open after a validation/server failure.
            setErrorMsg(error.message || "Unable to create the part.");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (!partToDelete) {
            return;
        }

        setSubmitting(true);
        setErrorMsg("");

        try {
            await partService.deletePart(partToDelete.id);
            setPartToDelete(null);
            await loadParts();
        } catch (error) {
            // Keep confirmation open so a failed request can be retried or cancelled.
            setErrorMsg(error.message || "Unable to delete the part.");
        } finally {
            setSubmitting(false);
        }
    }

    if (!authLoading && !isAuthenticated) {
        return (
            <section className="container py-5 text-center">
                <p className="text-muted">Please log in to manage your parts.</p>
            </section>
        );
    }

    return (
        <section className="container py-5 text-start">
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-between align-items-sm-center mb-4 border-bottom border-warning border-3 pb-3">
                <h1 className="h3 mb-0">My Parts</h1>
                <button
                    type="button"
                    className="btn btn-warning fw-bold shadow-sm"
                    onClick={() => setShowCreate((prev) => !prev)}
                >
                    {showCreate ? "Close Form" : "Add Part"}
                </button>
            </div>

            {errorMsg && (
                <div className="alert alert-danger" role="alert">
                    {errorMsg}
                </div>
            )}

            {showCreate && (
                <div className="p-4 mb-4 bg-warning-subtle rounded-4 shadow border border-warning border-2">
                    <h2 className="h5">New Part</h2>
                    <PartForm
                        onSubmit={handleCreate}
                        onCancel={() => setShowCreate(false)}
                        submitting={submitting}
                        submitLabel="Create Part"
                    />
                </div>
            )}

            {status === "loading" && parts.length === 0 && (
                <p className="text-muted">Loading your parts...</p>
            )}

            {status === "success" && parts.length === 0 && (
                <p className="text-muted">You have not added any parts yet.</p>
            )}

            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                {parts.map((part) => (
                    <PartCard
                        key={part.id}
                        part={part}
                        canManage
                        canAddToBuild
                        onDelete={setPartToDelete}
                    />
                ))}
            </div>

            {partToDelete && (
                <ConfirmDeleteModal
                    itemName={partToDelete.name}
                    onConfirm={handleDelete}
                    onCancel={() => setPartToDelete(null)}
                    deleting={submitting}
                />
            )}
        </section>
    );
};

export default MyPartsPage;
