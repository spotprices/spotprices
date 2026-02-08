let chart;

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
            return 'rgba(255, 99, 132, 0.5)'; // Highlight current hour
        }
        return 'rgba(54, 162, 235, 0.5)';
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
                    backgroundColor: 'rgba(255, 206, 86, 0.5)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Grid Fee (ct/kWh)',
                    data: gridFees,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Market Price (ct/kWh)',
                    data: marketPrices,
                    backgroundColor: backgroundColors,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Provider Fee (ct/kWh)',
                    data: providerFees,
                    backgroundColor: 'rgba(153, 102, 255, 0.5)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Tax',
                    data: tax,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            const index = tooltipItem.dataIndex;
                            const entry = data[index];
                            const date = new Date(entry.start_timestamp).toLocaleDateString();
                            const time = new Date(entry.start_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                            const price = (totalPrices[index]).toFixed(2);
                            const marketPrice = (marketPrices[index]);
                            return `Date: ${date}, Time: ${time}, Price: ${price} ct/kWh, Marketprice: ${marketPrice} ct/kWh, provider: ${providerFees[index]} ct/kWh`;
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
