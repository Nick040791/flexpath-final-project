import PropTypes from "prop-types";
import { Link } from "react-router-dom";

function Breadcrumbs({ items }) {
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-3">
                {items.map((item, index) => {
                    const isCurrent = index === items.length - 1;

                    return (
                        <li
                            className={`breadcrumb-item${isCurrent ? " active" : ""}`}
                            aria-current={isCurrent ? "page" : undefined}
                            key={`${item.to || "current"}-${item.label}-${index}`}
                        >
                            {!isCurrent && item.to ? (
                                <Link to={item.to}>{item.label}</Link>
                            ) : (
                                item.label
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

Breadcrumbs.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        to: PropTypes.string,
    })).isRequired,
};

export default Breadcrumbs;
