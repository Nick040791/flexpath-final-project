import { NavLink } from "react-router-dom";

const Navbar = () => {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
         <NavLink to="/" className="navbar-brand ms-4 nav-link">Builders Home</NavLink>
         <NavLink to="/login" className="navbar-brand ms-4 nav-link">Login</NavLink>
        </nav>
    );
};

export default Navbar;