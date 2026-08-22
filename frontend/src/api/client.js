// Central fetch wrapper for the Spring Boot API.
// Adds the JWT from localStorage to every request and normalizes API failures
// into ApiError so pages can render consistent user-facing messages.

export const API_BASE = "http://localhost:8080";

const NETWORK_MESSAGE = "Unable to reach the server. Check your connection and try again.";
const VALIDATION_MESSAGE = "Please check the submitted values.";
const UNAUTHENTICATED_MESSAGE = "Please log in to continue.";
const FORBIDDEN_MESSAGE = "You are not authorized to do that.";
const NOT_FOUND_MESSAGE = "The requested item was not found.";
const SERVER_MESSAGE = "Something went wrong on the server. Please try again.";
const INVALID_RESPONSE_MESSAGE = "The server returned an invalid response. Please try again.";
const MAX_BACKEND_MESSAGE_LENGTH = 300;
const GENERIC_BACKEND_MESSAGES = new Set([
    "bad request",
    "unauthorized",
    "forbidden",
    "not found",
    "internal server error",
    "error",
]);

export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export function getToken() {
    return localStorage.getItem("token");
}

export function clearAuth() {
    localStorage.removeItem("token");
}

function safeMessage(value) {
    if (typeof value !== "string") {
        return "";
    }

    const message = value.trim();
    if (!message || message.length > MAX_BACKEND_MESSAGE_LENGTH) {
        return "";
    }

    if (GENERIC_BACKEND_MESSAGES.has(message.toLowerCase())) {
        return "";
    }

    // Do not surface HTML error pages or other markup directly to users.
    if (/<[^>]+>/.test(message)) {
        return "";
    }

    return message;
}

function extractBackendMessage(responseText) {
    if (!responseText?.trim()) {
        return "";
    }

    try {
        const payload = JSON.parse(responseText);

        if (typeof payload === "string") {
            return safeMessage(payload);
        }

        if (payload && typeof payload === "object") {
            for (const key of ["message", "reason", "error"]) {
                const message = safeMessage(payload[key]);
                if (message) {
                    return message;
                }
            }
        }

        return "";
    } catch {
        return safeMessage(responseText);
    }
}

function fallbackMessage(status, backendMessage = "") {
    if (status === 400) {
        return backendMessage || VALIDATION_MESSAGE;
    }
    if (status === 401) {
        return UNAUTHENTICATED_MESSAGE;
    }
    if (status === 403) {
        return FORBIDDEN_MESSAGE;
    }
    if (status === 404) {
        return NOT_FOUND_MESSAGE;
    }
    if (status >= 500) {
        return SERVER_MESSAGE;
    }

    return `Request failed with status ${status}.`;
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

    const requestBody = body !== undefined ? JSON.stringify(body) : undefined;
    let response;

    try {
        response = await fetch(`${API_BASE}${path}`, {
            method,
            headers,
            body: requestBody,
        });
    } catch {
        throw new ApiError(0, NETWORK_MESSAGE);
    }

    if (!response.ok) {
        let responseText = "";

        try {
            responseText = await response.text();
        } catch {
            // The HTTP status is still authoritative even if its body cannot be read.
        }

        if (response.status === 401) {
            clearAuth();

            if (
                typeof window !== "undefined" &&
                !window.location.pathname.startsWith("/login")
            ) {
                window.location.assign("/login");
            }
        }

        const backendMessage = extractBackendMessage(responseText);
        throw new ApiError(
            response.status,
            fallbackMessage(response.status, backendMessage)
        );
    }

    if (response.status === 204) {
        return null;
    }

    // Some successful mutation endpoints return 201 Created without a body.
    // Reading as text first keeps those responses valid while still allowing
    // guarded JSON parsing for non-empty responses.
    let responseText;

    try {
        responseText = await response.text();
    } catch {
        throw new ApiError(0, NETWORK_MESSAGE);
    }

    if (!responseText.trim()) {
        return null;
    }

    try {
        return JSON.parse(responseText);
    } catch {
        throw new ApiError(response.status, INVALID_RESPONSE_MESSAGE);
    }
}
