import { NavLink } from "react-router-dom";
import Login, { isLoggedIn } from "./Login"; // Import the isLoggedIn variable from Login.jsx

const Navbar = () => {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
         <NavLink to="/" className="navbar-brand ms-4 nav-link">Builders Home</NavLink>
         <NavLink to={isLoggedIn ? "/mybuilds" : "/login"} className="navbar-brand ms-4 nav-link">
            {isLoggedIn ? "Mybuilds" : "Login"}
         </NavLink>
         <NavLink to="/search" className="navbar-brand ms-4 nav-link">Search</NavLink>
        </nav>
    );
};

export default Navbar;


