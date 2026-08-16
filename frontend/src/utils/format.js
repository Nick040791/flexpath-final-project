export function formatPrice(value) {
    const number = Number(value);
    if (value === null || value === undefined || Number.isNaN(number)) {
        return "—";
    }
    return `$${number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value) {
    if (!value) {
        return "—";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "—";
    }
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
