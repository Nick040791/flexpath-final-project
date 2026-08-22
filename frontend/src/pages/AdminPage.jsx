import { useCallback, useEffect, useState } from "react";
import * as adminService from "../api/adminService";
import * as partService from "../api/partService";
import * as buildService from "../api/buildService";
import SearchBar from "../components/SearchBar";
import PartCard from "../components/PartCard";
import BuildCard from "../components/BuildCard";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import Pagination from "../components/Pagination";
import {
    BUILD_SORT_OPTIONS,
    PART_CATEGORIES,
    PART_SORT_OPTIONS,
} from "../utils/constants";

const PAGE_SIZE = 12;

const PART_FILTERS = [
    {
        name: "category",
        label: "Category",
        type: "select",
        options: PART_CATEGORIES,
    },
    {
        name: "brand",
        label: "Brand",
        type: "text",
        placeholder: "e.g. AMD",
    },
    {
        name: "maxPrice",
        label: "Max Price",
        type: "number",
        placeholder: "e.g. 500",
    },
];

const BUILD_FILTERS = [
    {
        name: "visibility",
        label: "Visibility",
        type: "select",
        options: ["Public", "Private"],
    },
];

function emptyPagination() {
    return {
        page: 0,
        size: PAGE_SIZE,
        totalElements: 0,
        totalPages: 0,
    };
}

function paginationFrom(data) {
    return {
        page: data.page,
        size: data.size,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
    };
}

function errorMessage(error, fallback) {
    return error?.message || fallback;
}

function AdminPage() {
    const [activeTab, setActiveTab] = useState("users");

    const [users, setUsers] = useState([]);
    const [usersStatus, setUsersStatus] = useState("idle");
    const [usersError, setUsersError] = useState("");
    const [expandedUser, setExpandedUser] = useState(null);
    const [roleStates, setRoleStates] = useState({});

    const [parts, setParts] = useState([]);
    const [partsStatus, setPartsStatus] = useState("idle");
    const [partsError, setPartsError] = useState("");
    const [partsNotice, setPartsNotice] = useState("");
    const [partQuery, setPartQuery] = useState({});
    const [partPagination, setPartPagination] = useState(emptyPagination);
    const [partToDelete, setPartToDelete] = useState(null);
    const [partDeleting, setPartDeleting] = useState(false);

    const [builds, setBuilds] = useState([]);
    const [buildsStatus, setBuildsStatus] = useState("idle");
    const [buildsError, setBuildsError] = useState("");
    const [buildsNotice, setBuildsNotice] = useState("");
    const [buildQuery, setBuildQuery] = useState({});
    const [buildPagination, setBuildPagination] = useState(emptyPagination);
    const [buildToDelete, setBuildToDelete] = useState(null);
    const [buildDeleting, setBuildDeleting] = useState(false);

    const loadUsers = useCallback(async () => {
        setUsersStatus("loading");
        setUsersError("");

        try {
            const data = await adminService.getUsers();
            setUsers(Array.isArray(data) ? data : []);
            setUsersStatus("success");
            return data;
        } catch (error) {
            setUsers([]);
            setUsersStatus("error");
            setUsersError(errorMessage(error, "Unable to load users."));
            return null;
        }
    }, []);

    const loadParts = useCallback(async (query = {}, targetPage = 0) => {
        setPartsStatus("loading");
        setPartsError("");

        try {
            let data = await partService.searchParts({
                ...query,
                page: targetPage,
                size: PAGE_SIZE,
            });

            // If deleting the last row makes the requested page invalid,
            // immediately reload the new final page using the same search state.
            if (data.totalPages > 0 && targetPage >= data.totalPages) {
                const lastPage = data.totalPages - 1;
                data = await partService.searchParts({
                    ...query,
                    page: lastPage,
                    size: PAGE_SIZE,
                });
            }

            setParts(Array.isArray(data.content) ? data.content : []);
            setPartPagination(paginationFrom(data));
            setPartsStatus("success");
            return data;
        } catch (error) {
            setParts([]);
            setPartPagination(emptyPagination());
            setPartsStatus("error");
            setPartsError(errorMessage(error, "Unable to load parts."));
            return null;
        }
    }, []);

    const loadBuilds = useCallback(async (query = {}, targetPage = 0) => {
        setBuildsStatus("loading");
        setBuildsError("");

        try {
            let data = await buildService.searchBuilds({
                ...query,
                page: targetPage,
                size: PAGE_SIZE,
            });

            // Match BuildsPage behavior when a delete removes the last item on
            // the current page and reduces totalPages.
            if (data.totalPages > 0 && targetPage >= data.totalPages) {
                const lastPage = data.totalPages - 1;
                data = await buildService.searchBuilds({
                    ...query,
                    page: lastPage,
                    size: PAGE_SIZE,
                });
            }

            setBuilds(Array.isArray(data.content) ? data.content : []);
            setBuildPagination(paginationFrom(data));
            setBuildsStatus("success");
            return data;
        } catch (error) {
            setBuilds([]);
            setBuildPagination(emptyPagination());
            setBuildsStatus("error");
            setBuildsError(errorMessage(error, "Unable to load builds."));
            return null;
        }
    }, []);

    // Load each section only when the admin visits it for the first time.
    useEffect(() => {
        if (activeTab === "users" && usersStatus === "idle") {
            loadUsers();
        }
        if (activeTab === "parts" && partsStatus === "idle") {
            loadParts({}, 0);
        }
        if (activeTab === "builds" && buildsStatus === "idle") {
            loadBuilds({}, 0);
        }
    }, [
        activeTab,
        usersStatus,
        partsStatus,
        buildsStatus,
        loadUsers,
        loadParts,
        loadBuilds,
    ]);

    async function toggleUserRoles(username) {
        if (expandedUser === username) {
            setExpandedUser(null);
            return;
        }

        setExpandedUser(username);

        if (roleStates[username]?.status === "success") {
            return;
        }

        setRoleStates((previous) => ({
            ...previous,
            [username]: {
                status: "loading",
                roles: [],
                error: "",
            },
        }));

        try {
            const roles = await adminService.getUserRoles(username);
            setRoleStates((previous) => ({
                ...previous,
                [username]: {
                    status: "success",
                    roles: Array.isArray(roles) ? roles : [],
                    error: "",
                },
            }));
        } catch (error) {
            setRoleStates((previous) => ({
                ...previous,
                [username]: {
                    status: "error",
                    roles: [],
                    error: errorMessage(error, "Unable to load roles."),
                },
            }));
        }
    }

    async function handlePartSearch(params = {}) {
        setPartQuery(params);
        setPartsNotice("");
        await loadParts(params, 0);
    }

    async function handlePartPageChange(nextPage) {
        setPartsNotice("");
        await loadParts(partQuery, nextPage);
    }

    async function handlePartDelete() {
        if (!partToDelete) {
            return;
        }

        const deletedName = partToDelete.name;
        setPartDeleting(true);
        setPartsError("");
        setPartsNotice("");

        try {
            await partService.deletePart(partToDelete.id);
            setPartToDelete(null);

            const reloaded = await loadParts(partQuery, partPagination.page);
            if (reloaded) {
                setPartsNotice(`Deleted part "${deletedName}".`);
            }
        } catch (error) {
            setPartToDelete(null);
            setPartsError(errorMessage(error, "Unable to delete part."));
        } finally {
            setPartDeleting(false);
        }
    }

    async function handleBuildSearch(params = {}) {
        setBuildQuery(params);
        setBuildsNotice("");
        await loadBuilds(params, 0);
    }

    async function handleBuildPageChange(nextPage) {
        setBuildsNotice("");
        await loadBuilds(buildQuery, nextPage);
    }

    async function handleBuildDelete() {
        if (!buildToDelete) {
            return;
        }

        const deletedName = buildToDelete.name;
        setBuildDeleting(true);
        setBuildsError("");
        setBuildsNotice("");

        try {
            await buildService.deleteBuild(buildToDelete.id);
            setBuildToDelete(null);

            const reloaded = await loadBuilds(buildQuery, buildPagination.page);
            if (reloaded) {
                setBuildsNotice(`Deleted build "${deletedName}".`);
            }
        } catch (error) {
            setBuildToDelete(null);
            setBuildsError(errorMessage(error, "Unable to delete build."));
        } finally {
            setBuildDeleting(false);
        }
    }

    return (
        <section className="container py-5 text-start">
            <div className="mb-4 border-bottom border-warning border-3 pb-3">
                <span className="badge text-bg-warning mb-2">ADMIN</span>
                <h1 className="h2 mb-2">Admin Console</h1>
                <p className="text-muted mb-0">
                    Inspect users and moderate parts or builds. Backend authorization remains the security boundary.
                </p>
            </div>

            <ul className="nav nav-tabs mb-4" role="tablist" aria-label="Admin sections">
                <li className="nav-item" role="presentation">
                    <button
                        type="button"
                        className={`nav-link ${activeTab === "users" ? "active" : ""}`}
                        onClick={() => setActiveTab("users")}
                        aria-selected={activeTab === "users"}
                        data-admin-tab="users"
                    >
                        Users
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        type="button"
                        className={`nav-link ${activeTab === "parts" ? "active" : ""}`}
                        onClick={() => setActiveTab("parts")}
                        aria-selected={activeTab === "parts"}
                        data-admin-tab="parts"
                    >
                        Parts
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        type="button"
                        className={`nav-link ${activeTab === "builds" ? "active" : ""}`}
                        onClick={() => setActiveTab("builds")}
                        aria-selected={activeTab === "builds"}
                        data-admin-tab="builds"
                    >
                        Builds
                    </button>
                </li>
            </ul>

            {activeTab === "users" && (
                <div>
                    <div className="d-flex flex-column flex-sm-row gap-2 justify-content-between align-items-sm-center mb-3">
                        <div>
                            <h2 className="h4 mb-1">Users</h2>
                            <p className="text-muted mb-0">Usernames only. Password data is never rendered.</p>
                        </div>
                        <button
                            type="button"
                            className="btn btn-outline-dark btn-sm"
                            onClick={loadUsers}
                            disabled={usersStatus === "loading"}
                        >
                            {usersStatus === "loading" ? "Refreshing..." : "Refresh users"}
                        </button>
                    </div>

                    {usersError && (
                        <div className="alert alert-danger" role="alert">{usersError}</div>
                    )}

                    {usersStatus === "loading" && users.length === 0 && (
                        <p className="text-muted">Loading users...</p>
                    )}

                    {usersStatus === "success" && users.length === 0 && (
                        <p className="text-muted">No users found.</p>
                    )}

                    {users.length > 0 && (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover align-middle border">
                                <thead className="table-dark">
                                    <tr>
                                        <th scope="col">Username</th>
                                        <th scope="col" className="text-end">Roles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => {
                                        const roleState = roleStates[user.username];
                                        const isExpanded = expandedUser === user.username;

                                        return (
                                            <tr key={user.username}>
                                                <td className="fw-semibold">{user.username}</td>
                                                <td className="text-end">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-warning text-dark"
                                                        onClick={() => toggleUserRoles(user.username)}
                                                    >
                                                        {isExpanded ? "Hide roles" : "Show roles"}
                                                    </button>

                                                    {isExpanded && (
                                                        <div className="mt-2 text-end" aria-live="polite">
                                                            {roleState?.status === "loading" && (
                                                                <small className="text-muted">Loading roles...</small>
                                                            )}
                                                            {roleState?.status === "error" && (
                                                                <small className="text-danger">{roleState.error}</small>
                                                            )}
                                                            {roleState?.status === "success" && (
                                                                roleState.roles.length > 0 ? (
                                                                    <div className="d-flex flex-wrap gap-1 justify-content-end">
                                                                        {roleState.roles.map((role) => (
                                                                            <span className="badge text-bg-warning" key={role}>{role}</span>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <small className="text-muted">No roles assigned.</small>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "parts" && (
                <div>
                    <div className="mb-3">
                        <h2 className="h4 mb-1">Part Moderation</h2>
                        <p className="text-muted mb-0">Admin searches include public and private parts.</p>
                    </div>

                    {partsError && (
                        <div className="alert alert-danger" role="alert">{partsError}</div>
                    )}
                    {partsNotice && (
                        <div className="alert alert-success" role="status">{partsNotice}</div>
                    )}

                    <SearchBar
                        filters={PART_FILTERS}
                        sortOptions={PART_SORT_OPTIONS}
                        onSearch={handlePartSearch}
                        loading={partsStatus === "loading"}
                    />

                    {partsStatus === "success" && (
                        <p className="text-muted mt-3 mb-0">
                            Showing {parts.length} of {partPagination.totalElements} part(s)
                        </p>
                    )}

                    {partsStatus === "success" && parts.length === 0 && (
                        <p className="text-muted mt-3">No parts match your search.</p>
                    )}

                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3 mt-1">
                        {parts.map((part) => (
                            <PartCard
                                key={part.id}
                                part={part}
                                canManage
                                onDelete={setPartToDelete}
                            />
                        ))}
                    </div>

                    <div className="d-flex justify-content-center mt-4">
                        <Pagination
                            page={partPagination.page}
                            totalPages={partPagination.totalPages}
                            loading={partsStatus === "loading"}
                            onPageChange={handlePartPageChange}
                        />
                    </div>
                </div>
            )}

            {activeTab === "builds" && (
                <div>
                    <div className="mb-3">
                        <h2 className="h4 mb-1">Build Moderation</h2>
                        <p className="text-muted mb-0">Admin searches include public and private builds.</p>
                    </div>

                    {buildsError && (
                        <div className="alert alert-danger" role="alert">{buildsError}</div>
                    )}
                    {buildsNotice && (
                        <div className="alert alert-success" role="status">{buildsNotice}</div>
                    )}

                    <SearchBar
                        filters={BUILD_FILTERS}
                        sortOptions={BUILD_SORT_OPTIONS}
                        onSearch={handleBuildSearch}
                        loading={buildsStatus === "loading"}
                    />

                    {buildsStatus === "success" && (
                        <p className="text-muted mt-3 mb-0">
                            Showing {builds.length} of {buildPagination.totalElements} build(s)
                        </p>
                    )}

                    {buildsStatus === "success" && builds.length === 0 && (
                        <p className="text-muted mt-3">No builds match your search.</p>
                    )}

                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3 mt-1">
                        {builds.map((build) => (
                            <BuildCard
                                key={build.id}
                                build={build}
                                canManage
                                onDelete={setBuildToDelete}
                            />
                        ))}
                    </div>

                    <div className="d-flex justify-content-center mt-4">
                        <Pagination
                            page={buildPagination.page}
                            totalPages={buildPagination.totalPages}
                            loading={buildsStatus === "loading"}
                            onPageChange={handleBuildPageChange}
                        />
                    </div>
                </div>
            )}

            {partToDelete && (
                <ConfirmDeleteModal
                    itemName={partToDelete.name}
                    onConfirm={handlePartDelete}
                    onCancel={() => setPartToDelete(null)}
                    deleting={partDeleting}
                />
            )}

            {buildToDelete && (
                <ConfirmDeleteModal
                    itemName={buildToDelete.name}
                    onConfirm={handleBuildDelete}
                    onCancel={() => setBuildToDelete(null)}
                    deleting={buildDeleting}
                />
            )}
        </section>
    );
}

export default AdminPage;
