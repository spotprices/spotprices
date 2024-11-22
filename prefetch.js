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
    { name: "Austria", api: "https://api.awattar.at", cachedUrl: "https://reinsch82.github.io/spotprices/cached-data-austria.json", output: path.join(outputDir, "cached-data-austria.json") },
    { name: "Germany", api: "https://api.awattar.de", cachedUrl: "https://reinsch82.github.io/spotprices/cached-data-germany.json", output: path.join(outputDir, "cached-data-germany.json") },
];

async function fetchExistingData(country) {
    try {
        console.log(`Checking existing cached data for ${country.name}...`);
        const response = await fetch(country.cachedUrl);
        if (!response.ok) throw new Error(`No existing cached data found for ${country.name}`);
        const existingData = await response.json();
        console.log(`Existing cached data loaded for ${country.name}`);
        return existingData;
    } catch (error) {
        console.log(`No existing data available for ${country.name}. Fetching all data.`);
        return [];
    }
}

function getLatestEndTimestamp(data) {
    if (data.length === 0) return startDate.getTime();
    const latestEntry = data[data.length - 1];
    return latestEntry.end_timestamp || startDate.getTime();
}

async function fetchAndSaveDataForCountry(country) {
    const existingData = await fetchExistingData(country);
    const latestEndTimestamp = getLatestEndTimestamp(existingData);
    const newStartTimestamp = latestEndTimestamp;

    if (newStartTimestamp >= endDate.getTime()) {
        console.log(`No new data to fetch for ${country.name}.`);
        const minimalizedData = existingData.map(({ unit, ...rest }) => rest);
        fs.writeFileSync(country.output, JSON.stringify(minimalizedData));
        return;
    }

    const url = `${country.api}/v1/marketdata?start=${newStartTimestamp}&end=${endDate.getTime()}`;
    console.log(`Fetching missing data for ${country.name} from ${new Date(newStartTimestamp).toISOString()} to ${endDate.toISOString()}...`);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch data for ${country.name}: ${response.statusText}`);
        const result = await response.json();

        // Merge existing data with the new data and remove the "unit" field
        const mergedData = [...existingData, ...result.data].map(({ unit, ...rest }) => rest);

        // Save the merged data in a minimalized format
        fs.writeFileSync(country.output, JSON.stringify(mergedData));
        console.log(`Data successfully updated and saved to ${country.output} for ${country.name}!`);
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