import { useState } from "react";
import PropTypes from "prop-types";
import { PART_CATEGORIES } from "../utils/constants";

const EMPTY_PART = {
    name: "",
    category: "",
    brand: "",
    model: "",
    price: "",
    description: "",
    is_Public: true,
};

// Create/edit form for a Part. `initial` is an existing Part when editing.
function PartForm({ initial, onSubmit, onCancel, submitting = false, submitLabel = "Save Part" }) {
    const [form, setForm] = useState(() => ({
        ...EMPTY_PART,
        ...initial,
        price: initial?.price ?? "",
    }));

    function handleChange(event) {
        const { name, value, type, checked } = event.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }

    function handleSubmit(event) {
        event.preventDefault();
        onSubmit({
            name: form.name,
            category: form.category,
            brand: form.brand || null,
            model: form.model || null,
            price: form.price === "" ? null : Number(form.price),
            description: form.description || null,
            is_Public: form.is_Public,
        });
    }

    return (
        <form className="row g-3" onSubmit={handleSubmit}>
            <div className="col-md-6">
                <label className="form-label" htmlFor="part-name">Name</label>
                <input
                    id="part-name"
                    name="name"
                    className="form-control"
                    value={form.name}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="col-md-6">
                <label className="form-label" htmlFor="part-category">Category</label>
                <select
                    id="part-category"
                    name="category"
                    className="form-select"
                    value={form.category}
                    onChange={handleChange}
                    required
                >
                    <option value="">Choose...</option>
                    {PART_CATEGORIES.map((category) => (
                        <option value={category} key={category}>{category}</option>
                    ))}
                </select>
            </div>
            <div className="col-md-4">
                <label className="form-label" htmlFor="part-brand">Brand</label>
                <input
                    id="part-brand"
                    name="brand"
                    className="form-control"
                    value={form.brand ?? ""}
                    onChange={handleChange}
                />
            </div>
            <div className="col-md-4">
                <label className="form-label" htmlFor="part-model">Model</label>
                <input
                    id="part-model"
                    name="model"
                    className="form-control"
                    value={form.model ?? ""}
                    onChange={handleChange}
                />
            </div>
            <div className="col-md-4">
                <label className="form-label" htmlFor="part-price">Price ($)</label>
                <input
                    id="part-price"
                    name="price"
                    className="form-control"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                />
            </div>
            <div className="col-12">
                <label className="form-label" htmlFor="part-description">Description</label>
                <textarea
                    id="part-description"
                    name="description"
                    className="form-control"
                    rows="3"
                    value={form.description ?? ""}
                    onChange={handleChange}
                ></textarea>
            </div>
            <div className="col-12 form-check ms-2">
                <input
                    id="part-is-public"
                    name="is_Public"
                    className="form-check-input"
                    type="checkbox"
                    checked={form.is_Public}
                    onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="part-is-public">
                    Public (visible to everyone)
                </label>
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

PartForm.propTypes = {
    initial: PropTypes.shape({
        name: PropTypes.string,
        category: PropTypes.string,
        brand: PropTypes.string,
        model: PropTypes.string,
        price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        description: PropTypes.string,
        is_Public: PropTypes.bool,
    }),
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    submitting: PropTypes.bool,
    submitLabel: PropTypes.string,
};

export default PartForm;
