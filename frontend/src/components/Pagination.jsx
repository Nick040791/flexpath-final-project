export default function Pagination({
    page,
    totalPages,
    loading = false,
    onPageChange
}) {
    // No valid pages to navigate.
    if (totalPages <= 0) {
        return null;
    }

    const isFirstPage = page === 0;
    const isLastPage = page >= totalPages - 1;

    function handlePrevious() {
        if (!loading && !isFirstPage) {
            onPageChange(page - 1);
        }
    }

    function handleNext() {
        if (!loading && !isLastPage) {
            onPageChange(page + 1);
        }
    }

    return (
        <nav aria-label="Pagination">
            <button
                type="button"
                onClick={handlePrevious}
                disabled={loading || isFirstPage}
            >
                Previous
            </button>

            <span>
                Page {page + 1} of {totalPages}
            </span>

            <button
                type="button"
                onClick={handleNext}
                disabled={loading || isLastPage}
            >
                Next
            </button>
        </nav>
    );
}