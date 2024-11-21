import fetch from 'node-fetch';
import fs from 'fs';

const COUNTRIES = [
    { name: "Austria", api: "https://api.awattar.at", output: "cached-data-austria.json" },
    { name: "Germany", api: "https://api.awattar.de", output: "cached-data-germany.json" },
];

const startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 5)); // 5 years ago
const endDate = new Date(); // Today

async function fetchAndSaveDataForCountry(country) {
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();
    const url = `${country.api}/v1/marketdata?start=${startTimestamp}&end=${endTimestamp}`;

    try {
        console.log(`Fetching data for ${country.name} from ${startDate.toISOString()} to ${endDate.toISOString()}...`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch data for ${country.name}: ${response.statusText}`);
        const result = await response.json();

        fs.writeFileSync(country.output, JSON.stringify(result.data, null, 2));
        console.log(`Data successfully saved to ${country.output} for ${country.name}!`);
    } catch (error) {
        console.error(`Error fetching data for ${country.name}: ${error.message}`);
    }
}

async function fetchAndSaveDataForAllCountries() {
    console.log("Starting to fetch data for all countries...");
    await Promise.all(COUNTRIES.map(fetchAndSaveDataForCountry));
    console.log("Data fetching completed for all countries!");
}

fetchAndSaveDataForAllCountries();