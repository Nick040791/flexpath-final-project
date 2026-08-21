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

// GET /api/builds
// params:
// search, visibility, sortBy, direction, page, size
//
// returns:
// {
//   content: [...],
//   page: 0,
//   size: 12,
//   totalElements: 0,
//   totalPages: 0
// }
export function searchBuilds(params = {}) {
    return apiFetch(`/api/builds${toQuery(params)}`);
}

// GET /api/builds/mine
export function getMyBuilds() {
    return apiFetch("/api/builds/mine");
}

// GET /api/builds/{id}
export function getBuild(id) {
    return apiFetch(`/api/builds/${id}`);
}

// POST /api/builds
// build payload:
// { name, description, is_Public }
export function createBuild(build) {
    return apiFetch("/api/builds", {
        method: "POST",
        body: build
    });
}

// PUT /api/builds/{id}
export function updateBuild(id, build) {
    return apiFetch(`/api/builds/${id}`, {
        method: "PUT",
        body: build
    });
}

// DELETE /api/builds/{id}
export function deleteBuild(id) {
    return apiFetch(`/api/builds/${id}`, {
        method: "DELETE"
    });
}

// ----- Parts inside a build -----

// GET /api/builds/{buildId}/parts
export function getBuildParts(buildId) {
    return apiFetch(`/api/builds/${buildId}/parts`);
}

// POST /api/builds/{buildId}/parts/{partId}?quantity=1
export function addPartToBuild(buildId, partId, quantity = 1) {
    return apiFetch(
        `/api/builds/${buildId}/parts/${partId}?quantity=${quantity}`,
        {
            method: "POST"
        }
    );
}

// DELETE /api/builds/{buildId}/parts/{partId}
export function removePartFromBuild(buildId, partId) {
    return apiFetch(
        `/api/builds/${buildId}/parts/${partId}`,
        {
            method: "DELETE"
        }
    );
}