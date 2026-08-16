import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import VisibilityBadge from "./VisibilityBadge";
import { formatDate, formatPrice } from "../utils/format";

function PartCard({ part, canManage = false, onDelete }) {
    return (
        <div className="col">
            <div className="card h-100 shadow border-warning border-2 rounded-4 overflow-hidden">
                <div className="card-body bg-warning-subtle p-4">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <h2 className="h5 card-title mb-0">
                            <Link className="link-dark link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover fw-bold" to={`/parts/${part.id}`}>{part.name}</Link>
                        </h2>
                        <VisibilityBadge isPublic={part.is_Public} />
                    </div>
                    <h3 className="h6 card-subtitle mb-2 text-muted">
                        {[part.category, part.brand, part.model].filter(Boolean).join(" · ")}
                    </h3>
                    <p className="card-text">{part.description}</p>
                </div>
                <div className="card-footer bg-white d-flex flex-column flex-sm-row gap-2 justify-content-between align-items-sm-center">
                    <span className="badge text-bg-warning fs-6">{formatPrice(part.price)}</span>
                    <small className="text-muted">
                        by {part.username} · {formatDate(part.created_at)}
                    </small>
                    {canManage && onDelete && (
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => onDelete(part)}
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

PartCard.propTypes = {
    part: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string,
        category: PropTypes.string,
        brand: PropTypes.string,
        model: PropTypes.string,
        price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        description: PropTypes.string,
        is_Public: PropTypes.bool,
        username: PropTypes.string,
        created_at: PropTypes.string,
    }).isRequired,
    canManage: PropTypes.bool,
    onDelete: PropTypes.func,
};

export default PartCard;
