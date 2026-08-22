import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../auth/AuthContext";

function AdminRoute({ children }) {
    const { loading, isAuthenticated, isAdmin } = useAuth();

    if (loading) {
        return (
            <section className="container py-5 text-center">
                <p className="text-muted mb-0">Checking admin access...</p>
            </section>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return (
            <section className="container py-5">
                <div className="alert alert-danger" role="alert">
                    <h1 className="h4 alert-heading">Admin access required</h1>
                    <p className="mb-0">You are not authorized to view the admin area.</p>
                </div>
            </section>
        );
    }

    return children;
}

AdminRoute.propTypes = {
    children: PropTypes.node.isRequired,
};

export default AdminRoute;
