import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Determine the output directory
const outputDir = path.resolve('page');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
}

// Determine the end date based on the current time
const now = new Date();
let endDate;

// Use the end of the following day if after 14:00, otherwise use the end of today
if (now.getHours() >= 14) {
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);
} else {
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

// Add 2 minutes to the end timestamp to adjust for "24:00"
endDate = new Date(endDate.getTime() + 2 * 60 * 1000);

// Start date is 5 years before today
const startDate = new Date(new Date().setFullYear(now.getFullYear() - 5));

const COUNTRIES = [
    { name: "Austria", api: "https://api.awattar.at", output: path.join(outputDir, "cached-data-austria.json") },
    { name: "Germany", api: "https://api.awattar.de", output: path.join(outputDir, "cached-data-germany.json") },
];

async function fetchAndSaveDataForCountry(country) {
    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();
    const url = `${country.api}/v1/marketdata?start=${startTimestamp}&end=${endTimestamp}`;

    try {
        console.log(`Fetching data for ${country.name} from ${startDate.toISOString()} to ${endDate.toISOString()}...`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch data for ${country.name}: ${response.statusText}`);
        const result = await response.json();

        // Save the data to the respective file
        fs.writeFileSync(country.output, JSON.stringify(result.data, null, 2));
        console.log(`Data successfully saved to ${country.output} for ${country.name}!`);
    } catch (error) {
        console.error(`Error fetching data for ${country.name}:`, error.message);
    }
}

async function fetchAndSaveDataForAllCountries() {
    console.log("Starting to fetch data for all countries...");
    await Promise.all(COUNTRIES.map(fetchAndSaveDataForCountry));
    console.log("Data fetching completed for all countries!");
}

fetchAndSaveDataForAllCountries();