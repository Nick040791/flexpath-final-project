import { apiFetch } from "./client";

// GET /api/users
// The backend User model also contains a password field. Admin UI callers only
// receive usernames from this service so password hashes are never passed into
// admin page rendering state.
export async function getUsers() {
    const users = await apiFetch("/api/users");

    if (!Array.isArray(users)) {
        return [];
    }

    return users
        .filter((user) => user && typeof user.username === "string")
        .map((user) => ({ username: user.username }));
}

// GET /api/users/{username}/roles
// Roles are loaded only when an admin expands a user row.
export function getUserRoles(username) {
    return apiFetch(`/api/users/${encodeURIComponent(username)}/roles`);
}
