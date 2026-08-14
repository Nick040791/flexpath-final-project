import { bearerToken } from "./Login";
import { useState, useEffect } from "react";

const AdminPanel = () => {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (window.username === "admin" && bearerToken) {
            setIsAdmin(true);
        }
    }, []);
    return isAdmin ? (
        <div className="admin-panel">
            <h2 className="text-2xl font-bold">Admin Panel</h2>
            <p className="mt-2 text-lg">Welcome, admin! You have access to the admin panel.</p>
        </div>
    ) : null;
}

export default AdminPanel;