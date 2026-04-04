let cachedData = {};
let data = [];

function showLoading() {
    document.getElementById('loading-overlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
}

window.onload = async () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    document.getElementById('start-date').value = today.toISOString().split('T')[0];
    document.getElementById('end-date').value = tomorrow.toISOString().split('T')[0];
    adjustChartHeight();
    showLoading();
    await loadGridFees();
    fetchData();
};

function adjustChartHeight() {
    const viewportHeight = window.innerHeight;
    const headerHeight = document.querySelector("h1").offsetHeight;
    const controlsHeight = document.querySelector(".controls").offsetHeight + 40;
    const availableHeight = viewportHeight - headerHeight - controlsHeight - 160;
    document.getElementById('chart-container').style.height = `${Math.max(300, availableHeight)}px`;
}

async function fetchData() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const country = document.getElementById('country').value;

    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(new Date(endDate).setHours(23, 59, 59, 999)).getTime() + 1000;

    showLoading();

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
        hideLoading();
        alert("No data available for the selected date range.");
        return;
    }

    if (cachedResults.length > 0) {
        console.log(`Data loaded from cache for ${country}.`);
        data = cachedResults;
        currentPage = 1;
        updatePricesWithGridFee();
        updateTable();
        hideLoading();
        applyFadeIn();
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
        hideLoading();
        applyFadeIn();
    } catch (error) {
        hideLoading();
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
    const timestamps = data.map(entry => entry.start_timestamp);
    const providerFees = calculateProviderFees(marketPrices, provider, timestamps);

    const totalPrices = marketPrices.map((marketPrice, index) =>
        (parseFloat(marketPrice) + gridFees[index] + parseFloat(elektrizitatsabgabe[index]) + parseFloat(providerFees[index])) * 1.2
    );
    const tax = totalPrices.map(totalPrice => totalPrice / 6.0);

    updateCurrentPriceCard(data, marketPrices, gridFees, elektrizitatsabgabe, providerFees, totalPrices);
    renderChart(data, marketPrices, gridFees, elektrizitatsabgabe, providerFees, totalPrices, tax);
}

function updateCurrentPriceCard(data, marketPrices, gridFees, elektrizitatsabgabe, providerFees, totalPrices) {
    const card = document.getElementById('current-price-card');
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const index = data.findIndex(entry => {
        const d = new Date(entry.start_timestamp);
        return d.getHours() === currentHour && d.getDate() === currentDay &&
               d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    if (index === -1 || isNaN(totalPrices[index])) {
        card.classList.remove('visible');
        return;
    }

    const total = totalPrices[index].toFixed(2);
    const market = parseFloat(marketPrices[index]).toFixed(2);
    const grid = gridFees[index] != null ? gridFees[index].toFixed(2) : '--';
    const elekAbg = parseFloat(elektrizitatsabgabe[index]).toFixed(2);
    const prov = parseFloat(providerFees[index]).toFixed(2);

    document.getElementById('current-price-amount').textContent = total;
    document.getElementById('current-price-breakdown').innerHTML =
        `<span>Market: ${market}</span>` +
        `<span>Grid: ${grid}</span>` +
        `<span>Tax & fees: ${elekAbg}</span>` +
        `<span>Provider: ${prov}</span>`;

    card.classList.add('visible');
}

function applyFadeIn() {
    const elements = [
        document.getElementById('chart-container'),
        document.getElementById('data-table')
    ];
    elements.forEach(el => {
        el.classList.remove('fade-in');
        void el.offsetWidth; // force reflow
        el.classList.add('fade-in');
    });
}

window.addEventListener('resize', adjustChartHeight);
