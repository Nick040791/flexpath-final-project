import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const Navbar = () => {
    const { isAuthenticated, isAdmin, username, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top border-bottom border-warning border-4 shadow">
            <div className="container py-2">
                <NavLink to="/" className="navbar-brand fw-bold text-warning fs-4">Builder&#39;s Box</NavLink>
                <button className="navbar-toggler border-warning" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavigation" aria-controls="mainNavigation" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="mainNavigation">
                <div className="navbar-nav me-auto gap-lg-1">
                    <NavLink to="/" className="nav-link">Parts</NavLink>
                    <NavLink to="/builds" className="nav-link">Builds</NavLink>
                    {isAuthenticated && (
                        <NavLink to="/parts/mine" className="nav-link">My Parts</NavLink>
                    )}
                    {isAdmin && (
                        <NavLink to="/admin" className="nav-link">Admin</NavLink>
                    )}
                </div>
                <div className="navbar-nav ms-auto align-items-lg-center gap-2 mt-3 mt-lg-0">
                    {isAuthenticated ? (
                        <>
                            <span className="navbar-text text-light fw-semibold me-lg-2">
                                {username}
                                {isAdmin && <span className="badge text-bg-warning ms-2">Admin</span>}
                            </span>
                            <button type="button" className="btn btn-warning btn-sm fw-semibold" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <NavLink to="/login" className="btn btn-warning btn-sm fw-semibold">Login</NavLink>
                    )}
                </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
