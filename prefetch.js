const fetch = require('node-fetch');
const fs = require('fs');

const COUNTRY_API = "https://api.awattar.at"; // Change to Germany's API for German data
const MILLISECONDS_IN_A_DAY = 86400000;
const startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 5)); // 5 years ago
const endDate = new Date(); // Today

async function fetchAndSaveData() {
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();
    const url = `${COUNTRY_API}/v1/marketdata?start=${startTimestamp}&end=${endTimestamp}`;

    try {
        console.log(`Fetching data from ${startDate.toISOString()} to ${endDate.toISOString()}...`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch data: ${response.statusText}`);
        const result = await response.json();

        fs.writeFileSync('cached-data.json', JSON.stringify(result.data, null, 2));
        console.log('Data successfully saved to cached-data.json!');
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

fetchAndSaveData();