import React from "react";

interface DataTableProps {
    data: {
        start_timestamp: number;
        end_timestamp: number;
        marketprice: number;
        gridFee: number;
        totalPrice: number;
    }[];
    currentPage: number;
    rowsPerPage: number;
}

const DataTable: React.FC<DataTableProps> = ({ data, currentPage, rowsPerPage }) => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, data.length);
    const pageData = data.slice(startIndex, endIndex);

    return (
        <table>
            <thead>
                <tr>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Market Price (ct/kWh)</th>
                    <th>Grid Fee (ct/kWh)</th>
                    <th>Total Price (ct/kWh)</th>
                </tr>
            </thead>
            <tbody>
                {pageData.map((entry, index) => (
                    <tr key={index}>
                        <td>{new Date(entry.start_timestamp).toLocaleString()}</td>
                        <td>{new Date(entry.end_timestamp).toLocaleString()}</td>
                        <td>{entry.marketprice.toFixed(2)}</td>
                        <td>{entry.gridFee.toFixed(2)}</td>
                        <td>{entry.totalPrice.toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default DataTable;