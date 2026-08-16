import { API_BASE, ApiError, apiFetch } from "./client";

// Login is handled by the JWT starter at /auth/login and returns { token, ... }.
export async function login(username, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (response.status === 401 || response.status === 403) {
        throw new ApiError(response.status, "Invalid username or password.");
    }
    if (!response.ok) {
        throw new ApiError(response.status, `Login failed with status ${response.status}.`);
    }
    const data = await response.json();
    // The fraho JWT starter wraps the token: { "accessToken": { "token": "..." }, "refreshToken": ... }
    const token = data.accessToken?.token ?? data.token;
    if (!token) {
        throw new ApiError(response.status, "Login response did not include a token.");
    }
    return token;
}

export function getProfile() {
    return apiFetch("/api/profile");
}

// Returns an array of role names, e.g. ["ADMIN"].
export function getRoles() {
    return apiFetch("/api/profile/roles");
}
