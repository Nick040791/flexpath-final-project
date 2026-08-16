import PropTypes from "prop-types";

// Simple confirm-delete dialog rendered with Bootstrap modal markup.
function ConfirmDeleteModal({ itemName, onConfirm, onCancel, deleting = false }) {
    return (
        <>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title h5">Confirm Delete</h2>
                            <button type="button" className="btn-close" onClick={onCancel} aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <p className="mb-0">
                                Are you sure you want to delete <strong>{itemName}</strong>? This cannot be undone.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={deleting}>
                                Cancel
                            </button>
                            <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={deleting}>
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    );
}

ConfirmDeleteModal.propTypes = {
    itemName: PropTypes.string.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    deleting: PropTypes.bool,
};

export default ConfirmDeleteModal;
