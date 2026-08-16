import { apiFetch } from "./client";

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

// GET /api/builds — params: search (LIKE on name/description), sortBy (name|created_at), direction
export function searchBuilds(params = {}) {
    return apiFetch(`/api/builds${toQuery(params)}`);
}

export function getMyBuilds() {
    return apiFetch("/api/builds/mine");
}

export function getBuild(id) {
    return apiFetch(`/api/builds/${id}`);
}

// build payload: { name, description, is_Public }
export function createBuild(build) {
    return apiFetch("/api/builds", { method: "POST", body: build });
}

export function updateBuild(id, build) {
    return apiFetch(`/api/builds/${id}`, { method: "PUT", body: build });
}

export function deleteBuild(id) {
    return apiFetch(`/api/builds/${id}`, { method: "DELETE" });
}

// ----- parts inside a build -----

export function getBuildParts(buildId) {
    return apiFetch(`/api/builds/${buildId}/parts`);
}

export function addPartToBuild(buildId, partId, quantity = 1) {
    return apiFetch(`/api/builds/${buildId}/parts/${partId}?quantity=${quantity}`, { method: "POST" });
}

export function removePartFromBuild(buildId, partId) {
    return apiFetch(`/api/builds/${buildId}/parts/${partId}`, { method: "DELETE" });
}
