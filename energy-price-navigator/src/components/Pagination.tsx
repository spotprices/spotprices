import React from "react";

interface PaginationProps {
    currentPage: number;
    setCurrentPage: (page: number) => void;
    totalRows: number;
    rowsPerPage: number;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    setCurrentPage,
    totalRows,
    rowsPerPage,
}) => {
    const totalPages = Math.ceil(totalRows / rowsPerPage);

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    return (
        <div>
            <button onClick={handlePrev} disabled={currentPage === 1}>
                Previous
            </button>
            <span>
                Page {currentPage} of {totalPages}
            </span>
            <button onClick={handleNext} disabled={currentPage === totalPages}>
                Next
            </button>
        </div>
    );
};

export default Pagination;