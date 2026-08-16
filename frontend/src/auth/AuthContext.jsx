import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { getToken, clearAuth } from "../api/client";
import * as authService from "../api/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // { username, roles }
    const [loading, setLoading] = useState(true);

    // Restore the session on page load if a token is still around.
    useEffect(() => {
        async function restoreSession() {
            if (!getToken()) {
                setLoading(false);
                return;
            }
            try {
                const [profile, roles] = await Promise.all([
                    authService.getProfile(),
                    authService.getRoles(),
                ]);
                setUser({ username: profile.username, roles });
            } catch {
                clearAuth();
                setUser(null);
            } finally {
                setLoading(false);
            }
        }
        restoreSession();
    }, []);

    const login = useCallback(async (username, password) => {
        const token = await authService.login(username, password);
        localStorage.setItem("token", token);
        const roles = await authService.getRoles();
        setUser({ username, roles });
    }, []);

    const logout = useCallback(() => {
        clearAuth();
        setUser(null);
    }, []);

    const value = useMemo(() => {
        const roles = user?.roles ?? [];
        return {
            user,
            username: user?.username ?? null,
            roles,
            isAdmin: roles.includes("ADMIN") || roles.includes("ROLE_ADMIN"),
            isAuthenticated: Boolean(user),
            loading,
            login,
            logout,
        };
    }, [user, loading, login, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside of AuthProvider");
    }
    return context;
}

export default AuthContext;
