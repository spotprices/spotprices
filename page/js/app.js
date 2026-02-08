let cachedData = {};
let data = [];

window.onload = async () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    document.getElementById('start-date').value = today.toISOString().split('T')[0];
    document.getElementById('end-date').value = tomorrow.toISOString().split('T')[0];
    adjustChartHeight();
    await loadGridFees();
    fetchData();
};

function adjustChartHeight() {
    const viewportHeight = window.innerHeight;
    const headerHeight = document.querySelector("h1").offsetHeight;
    const controlsHeight = document.querySelector("p").offsetHeight + 40;
    const availableHeight = viewportHeight - headerHeight - controlsHeight - 100;
    document.getElementById('chart-container').style.height = `${availableHeight}px`;
}

async function fetchData() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const country = document.getElementById('country').value;

    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(new Date(endDate).setHours(23, 59, 59, 999)).getTime() + 1000;

    if (!cachedData[country]) {
        console.log(`Loading cached data for ${country}...`);
        try {
            const cachedFile = country === "Austria" ? "cached-data-austria.json" : "cached-data-germany.json";
            const response = await fetch(cachedFile);
            if (response.ok) {
                cachedData[country] = (await response.json()).map(({ unit, ...rest }) => rest);
                console.log(`Cached data for ${country} loaded.`);
            } else {
                cachedData[country] = [];
                console.warn(`No cached data found for ${country}.`);
            }
        } catch (error) {
            console.error(`Error loading cached data for ${country}:`, error);
            cachedData[country] = [];
        }
    }

    const cachedResults = cachedData[country].filter(entry =>
        entry.start_timestamp >= startTimestamp && entry.end_timestamp <= endTimestamp
    );

    if (cachedResults.length === 0 && cachedData[country].length > 0) {
        alert("No data available for the selected date range.");
        return;
    }

    if (cachedResults.length > 0) {
        console.log(`Data loaded from cache for ${country}.`);
        data = cachedResults;
        currentPage = 1;
        updatePricesWithGridFee();
        updateTable();
        return;
    }

    console.log(`Fetching API data for ${country}...`);
    const apiURL = country === "Austria" ? "https://api.awattar.at" : "https://api.awattar.de";
    const url = `${apiURL}/v1/marketdata?start=${startTimestamp}&end=${endTimestamp}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
        const result = await response.json();
        const fetchedData = result.data.map(({ unit, ...rest }) => rest);

        cachedData[country] = [...cachedData[country], ...fetchedData];

        data = fetchedData;
        currentPage = 1;
        updatePricesWithGridFee();
        updateTable();
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

function updatePricesWithGridFee() {
    const selectElement = document.getElementById('region');
    const selectedOptionText = selectElement.options[selectElement.selectedIndex].text;
    const provider = document.getElementById('provider').value;

    const marketPrices = data.map(entry => (entry.marketprice * 0.1).toFixed(2));
    const gridFees = data.map(entry => getGridFee(selectedOptionText, entry.start_timestamp));
    const elektrizitatsabgabe = data.map(entry => getElektrizitaetsabgabe(entry.start_timestamp).toFixed(2));
    const providerFees = calculateProviderFees(marketPrices, provider);

    const totalPrices = marketPrices.map((marketPrice, index) =>
        (parseFloat(marketPrice) + gridFees[index] + parseFloat(elektrizitatsabgabe[index]) + parseFloat(providerFees[index])) * 1.2
    );
    const tax = totalPrices.map(totalPrice => totalPrice / 6.0);

    renderChart(data, marketPrices, gridFees, elektrizitatsabgabe, providerFees, totalPrices, tax);
}

window.addEventListener('resize', adjustChartHeight);
