// Central fetch wrapper for the Spring Boot API.
// Adds the JWT from localStorage to every request and normalizes 401/403 handling.

export const API_BASE = "http://localhost:8080";

export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export function getToken() {
    return localStorage.getItem("token");
}

export function clearAuth() {
    localStorage.removeItem("token");
}

export async function apiFetch(path, { method = "GET", body } = {}) {
    const headers = {};
    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }
    const token = getToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
        clearAuth();
        if (!window.location.pathname.startsWith("/login")) {
            window.location.assign("/login");
        }
        throw new ApiError(401, "Please log in to continue.");
    }
    if (response.status === 403) {
        throw new ApiError(403, "You are not authorized to do that.");
    }
    if (!response.ok) {
        throw new ApiError(response.status, `Request failed with status ${response.status}.`);
    }
    if (response.status === 204) {
        return null;
    }

    // Some successful mutation endpoints (for example, adding a part to a
    // build) return 201 Created without a response body. Reading the body as
    // text first lets those responses resolve normally instead of throwing
    // "Unexpected end of JSON input".
    const responseText = await response.text();
    if (!responseText.trim()) {
        return null;
    }

    return JSON.parse(responseText);
}
