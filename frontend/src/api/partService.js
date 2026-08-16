import { apiFetch } from "./client";

// Builds a query string, skipping empty values.
function toQuery(params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, value);
        }
    });
    const str = query.toString();
    return str ? `?${str}` : "";
}

// GET /api/parts — params: search (LIKE), category, brand, maxPrice, sortBy, direction
export function searchParts(params = {}) {
    return apiFetch(`/api/parts${toQuery(params)}`);
}

export function getMyParts() {
    return apiFetch("/api/parts/mine");
}

export function getPart(id) {
    return apiFetch(`/api/parts/${id}`);
}

// part payload: { name, category, brand, model, price, description, is_Public }
export function createPart(part) {
    return apiFetch("/api/parts", { method: "POST", body: part });
}

export function updatePart(id, part) {
    return apiFetch(`/api/parts/${id}`, { method: "PUT", body: part });
}

export function deletePart(id) {
    return apiFetch(`/api/parts/${id}`, { method: "DELETE" });
}
