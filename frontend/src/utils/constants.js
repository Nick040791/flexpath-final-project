// Shared option lists for search/sort controls.
// Sort values must match the whitelists in PartDao / BuildDao.

export const PART_CATEGORIES = [
    "CPU",
    "GPU",
    "Motherboard",
    "RAM",
    "Storage",
    "PSU",
    "Case",
    "Cooler",
];

export const PART_SORT_OPTIONS = [
    { value: "name", label: "Name" },
    { value: "price", label: "Price" },
    { value: "category", label: "Category" },
    { value: "created_at", label: "Date Added" },
];

export const BUILD_SORT_OPTIONS = [
    { value: "name", label: "Name" },
    { value: "created_at", label: "Date Created" },
];

export const BUILD_CONTENT_OPTIONS = [
    { value: "true", label: "With parts" },
    { value: "false", label: "Empty" },
];

export const DIRECTION_OPTIONS = [
    { value: "ASC", label: "Ascending" },
    { value: "DESC", label: "Descending" },
];
