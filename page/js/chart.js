let chart;

const chartColors = {
    tax:          { bg: 'rgba(148,163,184,0.5)', border: 'rgba(148,163,184,1)' },
    grid:         { bg: 'rgba(249,115,22,0.55)',  border: 'rgba(249,115,22,1)' },
    market:       { bg: 'rgba(59,130,246,0.55)',   border: 'rgba(59,130,246,1)' },
    marketNow:    { bg: 'rgba(16,185,129,0.7)',    border: 'rgba(16,185,129,1)' },
    provider:     { bg: 'rgba(139,92,246,0.5)',    border: 'rgba(139,92,246,1)' },
    electricity:  { bg: 'rgba(234,179,8,0.5)',     border: 'rgba(234,179,8,1)' },
};

function renderChart(data, marketPrices, gridFees, elektrizitatsabgabe, providerFees, totalPrices, tax) {
    const labels = data.map(entry =>
        new Date(entry.start_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    );

    const today = new Date();
    const currentHour = today.getHours();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const backgroundColors = data.map(entry => {
        const entryDate = new Date(entry.start_timestamp);
        if (entryDate.getHours() === currentHour && entryDate.getDate() === currentDay &&
            entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
            return chartColors.marketNow.bg;
        }
        return chartColors.market.bg;
    });

    const borderColors = data.map(entry => {
        const entryDate = new Date(entry.start_timestamp);
        if (entryDate.getHours() === currentHour && entryDate.getDate() === currentDay &&
            entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
            return chartColors.marketNow.border;
        }
        return chartColors.market.border;
    });

    const ctx = document.getElementById('price-chart').getContext('2d');

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Elektrizitätsabgabe (ct/kWh)',
                    data: elektrizitatsabgabe,
                    backgroundColor: chartColors.electricity.bg,
                    borderColor: chartColors.electricity.border,
                    borderWidth: 1
                },
                {
                    label: 'Grid Fee (ct/kWh)',
                    data: gridFees,
                    backgroundColor: chartColors.grid.bg,
                    borderColor: chartColors.grid.border,
                    borderWidth: 1
                },
                {
                    label: 'Market Price (ct/kWh)',
                    data: marketPrices,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1
                },
                {
                    label: 'Provider Fee (ct/kWh)',
                    data: providerFees,
                    backgroundColor: chartColors.provider.bg,
                    borderColor: chartColors.provider.border,
                    borderWidth: 1
                },
                {
                    label: 'Tax',
                    data: tax,
                    backgroundColor: chartColors.tax.bg,
                    borderColor: chartColors.tax.border,
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 600,
                easing: 'easeOutQuart'
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    callbacks: {
                        title: function (tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            const entry = data[index];
                            const d = new Date(entry.start_timestamp);
                            const date = d.toLocaleDateString();
                            const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                            const endTime = new Date(entry.end_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                            return `${date}  ${time} – ${endTime}`;
                        },
                        label: function (tooltipItem) {
                            const index = tooltipItem.dataIndex;
                            const val = parseFloat(tooltipItem.raw);
                            if (isNaN(val)) return null;
                            return `  ${tooltipItem.dataset.label}: ${val.toFixed(2)} ct/kWh`;
                        },
                        afterBody: function (tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            const total = totalPrices[index];
                            if (isNaN(total)) return '';
                            return `\n  Total (incl. VAT): ${total.toFixed(2)} ct/kWh`;
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x'
                    },
                    zoom: {
                        wheel: { enabled: true },
                        drag: { enabled: true },
                        pinch: { enabled: true },
                        mode: 'x'
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Time' },
                    stacked: true
                },
                y: {
                    title: { display: true, text: 'Price (ct/kWh)' },
                    beginAtZero: true,
                    stacked: true
                }
            }
        }
    });
}

function resetZoom() {
    if (chart) {
        chart.resetZoom();
    }
}
