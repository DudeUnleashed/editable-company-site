import React from "react";
import "../styles/Pagination.css";

/* ==========================================
   PAGINATION COMPONENT
   ========================================== */

/**
 * Reusable pagination component for navigating through paginated data
 * Displays page numbers, prev/next buttons, and pagination info
 */

export interface PaginationInfo {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  prev_page: number | null;
  next_page: number | null;
}

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function Pagination({ pagination, onPageChange, loading = false }: PaginationProps) {
  const { current_page, total_pages, prev_page, next_page, total_items, per_page } = pagination;

  // Don't render if only one page or no items
  if (total_pages <= 1) {
    return null;
  }

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Max page buttons to show

    if (total_pages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current_page > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, current_page - 1);
      const end = Math.min(total_pages - 1, current_page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current_page < total_pages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(total_pages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Calculate item range display
  const startItem = (current_page - 1) * per_page + 1;
  const endItem = Math.min(current_page * per_page, total_items);

  return (
    <div className="pagination-container">
      {/* Info text */}
      <div className="pagination-info">
        Showing {startItem} to {endItem} of {total_items} items
      </div>

      {/* Pagination controls */}
      <div className="pagination-controls">
        {/* Previous button */}
        <button
          className="pagination-btn pagination-prev"
          onClick={() => onPageChange(current_page - 1)}
          disabled={!prev_page || loading}
          aria-label="Previous page"
        >
          ← Previous
        </button>

        {/* Page numbers */}
        <div className="pagination-numbers">
          {pageNumbers.map((page, index) =>
            typeof page === "number" ? (
              <button
                key={`page-${page}`}
                className={`pagination-number ${page === current_page ? "active" : ""}`}
                onClick={() => onPageChange(page)}
                disabled={loading}
                aria-label={`Page ${page}`}
                aria-current={page === current_page ? "page" : undefined}
              >
                {page}
              </button>
            ) : (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                {page}
              </span>
            )
          )}
        </div>

        {/* Next button */}
        <button
          className="pagination-btn pagination-next"
          onClick={() => onPageChange(current_page + 1)}
          disabled={!next_page || loading}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
