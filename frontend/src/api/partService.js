import { apiFetch } from "./client";

// Builds a query string while skipping empty values.
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

// GET /api/parts
// params:
// search, category, brand, maxPrice, sortBy, direction, page, size
//
// returns:
// {
//   content: [...],
//   page: 0,
//   size: 12,
//   totalElements: 0,
//   totalPages: 0
// }
export function searchParts(params = {}) {
    return apiFetch(`/api/parts${toQuery(params)}`);
}

// GET /api/parts/mine
export function getMyParts() {
    return apiFetch("/api/parts/mine");
}

// GET /api/parts/{id}
export function getPart(id) {
    return apiFetch(`/api/parts/${id}`);
}

// POST /api/parts
// part payload:
// { name, category, brand, model, price, description, is_Public }
export function createPart(part) {
    return apiFetch("/api/parts", {
        method: "POST",
        body: part
    });
}

// PUT /api/parts/{id}
export function updatePart(id, part) {
    return apiFetch(`/api/parts/${id}`, {
        method: "PUT",
        body: part
    });
}

// DELETE /api/parts/{id}
export function deletePart(id) {
    return apiFetch(`/api/parts/${id}`, {
        method: "DELETE"
    });
}