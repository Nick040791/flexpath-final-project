import PropTypes from "prop-types";

function VisibilityBadge({ isPublic }) {
    return isPublic ? (
        <span className="badge text-bg-success">Public</span>
    ) : (
        <span className="badge text-bg-secondary">Private</span>
    );
}

VisibilityBadge.propTypes = {
    isPublic: PropTypes.bool,
};

export default VisibilityBadge;
