const rowsPerPage = 50;
let currentPage = 1;

function updateTable() {
    const tableBody = document.querySelector("#data-table tbody");
    tableBody.innerHTML = "";

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, data.length);
    const pageData = data.slice(startIndex, endIndex);

    pageData.forEach(entry => {
        const startTime = new Date(entry.start_timestamp).toLocaleString('en-GB', { hour12: false });
        const endTime = new Date(entry.end_timestamp).toLocaleString('en-GB', { hour12: false });
        const marketPriceCtKWh = (entry.marketprice * 0.1).toFixed(2);
        const row = `
            <tr>
                <td>${startTime}</td>
                <td>${endTime}</td>
                <td>${marketPriceCtKWh}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });

    document.getElementById('page-info').textContent = `Page: ${currentPage}`;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        updateTable();
    }
}

function nextPage() {
    if (currentPage * rowsPerPage < data.length) {
        currentPage++;
        updateTable();
    }
}
