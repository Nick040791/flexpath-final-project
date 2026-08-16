import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import VisibilityBadge from "./VisibilityBadge";
import { formatDate } from "../utils/format";

function BuildCard({ build, canManage = false, onDelete }) {
    return (
        <div className="col">
            <div className="card h-100 shadow border-warning border-2 rounded-4 overflow-hidden">
                <div className="card-body bg-warning-subtle p-4">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <h2 className="h5 card-title mb-0">
                            <Link className="link-dark link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover fw-bold" to={`/builds/${build.id}`}>{build.name}</Link>
                        </h2>
                        <VisibilityBadge isPublic={build.is_Public} />
                    </div>
                    <p className="card-text">{build.description}</p>
                </div>
                <div className="card-footer bg-white d-flex flex-column flex-sm-row gap-2 justify-content-between align-items-sm-center">
                    <small className="text-muted">
                        by {build.username} · {formatDate(build.created_at)}
                    </small>
                    {canManage && onDelete && (
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => onDelete(build)}
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

BuildCard.propTypes = {
    build: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string,
        description: PropTypes.string,
        is_Public: PropTypes.bool,
        username: PropTypes.string,
        created_at: PropTypes.string,
    }).isRequired,
    canManage: PropTypes.bool,
    onDelete: PropTypes.func,
};

export default BuildCard;
