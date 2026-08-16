import { useState } from "react";
import PropTypes from "prop-types";

// Create/edit form for a Build. `initial` is an existing Build when editing.
function BuildForm({ initial, onSubmit, onCancel, submitting = false, submitLabel = "Save Build" }) {
    const [form, setForm] = useState(() => ({
        name: initial?.name ?? "",
        description: initial?.description ?? "",
        is_Public: initial?.is_Public ?? true,
    }));

    function handleChange(event) {
        const { name, value, type, checked } = event.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        onSubmit({
            name: form.name,
            description: form.description || null,
            is_Public: form.is_Public,
        });
    }

    return (
        <form className="row g-3" onSubmit={handleSubmit}>
            <div className="col-md-6">
                <label className="form-label" htmlFor="build-name">Name</label>
                <input
                    id="build-name"
                    name="name"
                    className="form-control"
                    value={form.name}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="col-md-6 d-flex align-items-end">
                <div className="form-check mb-2">
                    <input
                        id="build-is-public"
                        name="is_Public"
                        className="form-check-input"
                        type="checkbox"
                        checked={form.is_Public}
                        onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="build-is-public">
                        Public (visible to everyone)
                    </label>
                </div>
            </div>
            <div className="col-12">
                <label className="form-label" htmlFor="build-description">Description</label>
                <textarea
                    id="build-description"
                    name="description"
                    className="form-control"
                    rows="3"
                    value={form.description ?? ""}
                    onChange={handleChange}
                ></textarea>
            </div>
            <div className="col-12 d-flex gap-2">
                <button type="submit" className="btn btn-warning fw-semibold" disabled={submitting}>
                    {submitting ? "Saving..." : submitLabel}
                </button>
                {onCancel && (
                    <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

BuildForm.propTypes = {
    initial: PropTypes.shape({
        name: PropTypes.string,
        description: PropTypes.string,
        is_Public: PropTypes.bool,
    }),
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    submitting: PropTypes.bool,
    submitLabel: PropTypes.string,
};

export default BuildForm;
