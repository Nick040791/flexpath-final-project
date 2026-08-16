import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import * as partService from "../api/partService";
import PartForm from "../components/PartForm";
import VisibilityBadge from "../components/VisibilityBadge";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import { formatDate, formatPrice } from "../utils/format";

// Single part view. Edit/delete controls appear for the owner or an admin.
const PartDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { username, isAdmin, isAuthenticated } = useAuth();

    const [part, setPart] = useState(null);
    const [status, setStatus] = useState("loading");
    const [errorMsg, setErrorMsg] = useState("");
    const [editing, setEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const loadPart = useCallback(async () => {
        setStatus("loading");
        setErrorMsg("");
        try {
            const data = await partService.getPart(id);
            setPart(data);
            setStatus("success");
        } catch (error) {
            setPart(null);
            setStatus("error");
            setErrorMsg(error.message);
        }
    }, [id]);

    useEffect(() => {
        if (isAuthenticated) {
            loadPart();
        }
    }, [isAuthenticated, loadPart]);

    const canManage = Boolean(part) && (isAdmin || part.username === username);

    async function handleUpdate(payload) {
        setSubmitting(true);
        setErrorMsg("");
        try {
            await partService.updatePart(id, payload);
            setEditing(false);
            await loadPart();
        } catch (error) {
            setErrorMsg(error.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        setSubmitting(true);
        try {
            await partService.deletePart(id);
            navigate("/parts/mine");
        } catch (error) {
            setErrorMsg(error.message);
            setConfirmDelete(false);
            setSubmitting(false);
        }
    }

    if (status === "loading") {
        return <section className="container py-5"><p className="text-muted">Loading part...</p></section>;
    }

    if (status === "error") {
        return (
            <section className="container py-5">
                <div className="alert alert-danger">{errorMsg}</div>
            </section>
        );
    }

    return (
        <section className="container py-5 text-start">
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-between align-items-sm-start mb-4 bg-warning-subtle border border-warning border-2 rounded-4 p-4 shadow-sm">
                <div>
                    <h1 className="h3 mb-1">{part.name}</h1>
                    <p className="text-muted mb-0">
                        {[part.category, part.brand, part.model].filter(Boolean).join(" · ")}
                    </p>
                </div>
                <VisibilityBadge isPublic={part.is_Public} />
            </div>

            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <p className="card-text">{part.description || "No description."}</p>
                    <dl className="row mb-0">
                        <dt className="col-sm-3">Price</dt>
                        <dd className="col-sm-9">{formatPrice(part.price)}</dd>
                        <dt className="col-sm-3">Owner</dt>
                        <dd className="col-sm-9">{part.username}</dd>
                        <dt className="col-sm-3">Added</dt>
                        <dd className="col-sm-9">{formatDate(part.created_at)}</dd>
                    </dl>
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
                <div className="p-4 bg-warning-subtle rounded-4 shadow border border-warning border-2">
                    <h2 className="h5">Edit Part</h2>
                    <PartForm
                        initial={part}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditing(false)}
                        submitting={submitting}
                        submitLabel="Update Part"
                    />
                </div>
            )}

            {confirmDelete && (
                <ConfirmDeleteModal
                    itemName={part.name}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDelete(false)}
                    deleting={submitting}
                />
            )}
        </section>
    );
};

export default PartDetailPage;
