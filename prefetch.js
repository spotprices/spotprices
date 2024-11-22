import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Configuration
const OUTPUT_DIR = path.resolve('page');
const COUNTRIES = [
    { name: "Austria", api: "https://api.awattar.at", cachedFile: "cached-data-austria.json" },
    { name: "Germany", api: "https://api.awattar.de", cachedFile: "cached-data-germany.json" },
];
const START_DATE = new Date(new Date().setFullYear(new Date().getFullYear() - 5)); // 5 years ago
const END_DATE = calculateEndDate(new Date()); // Dynamic end date

// Ensure output directory exists
ensureDirectoryExists(OUTPUT_DIR);

/**
 * Calculates the end date based on the current time.
 * If after 14:00, use the end of the next day; otherwise, use the end of today.
 */
function calculateEndDate(now) {
    const endOfDay = now.getHours() >= 14
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999)
        : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    return new Date(endOfDay.getTime() + 2 * 60 * 1000); // Adjust to simulate "24:00"
}

/**
 * Ensures the specified directory exists, creating it if necessary.
 */
function ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

/**
 * Fetches and processes existing cached data for a country.
 */
async function fetchExistingData(country) {
    const filePath = path.join(OUTPUT_DIR, country.cachedFile);

    try {
        console.log(`Loading existing data for ${country.name}...`);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContents);
        console.log(`Existing data loaded for ${country.name}.`);
        return data;
    } catch {
        console.log(`No existing data found for ${country.name}.`);
        return [];
    }
}

/**
 * Fetches new data from the API for a given country and date range.
 */
async function fetchNewData(country, startTimestamp, endTimestamp) {
    const url = `${country.api}/v1/marketdata?start=${startTimestamp}&end=${endTimestamp}`;
    console.log(`Fetching new data for ${country.name} from ${new Date(startTimestamp).toISOString()} to ${new Date(endTimestamp).toISOString()}...`);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch data for ${country.name}: ${response.statusText}`);
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error(`Error fetching data for ${country.name}:`, error.message);
        return [];
    }
}

/**
 * Saves data to the specified file in the output directory.
 */
function saveData(country, data) {
    const filePath = path.join(OUTPUT_DIR, country.cachedFile);
    fs.writeFileSync(filePath, JSON.stringify(data));
    console.log(`Data successfully saved to ${filePath} for ${country.name}.`);
}

/**
 * Processes raw data by removing unnecessary fields (e.g., `unit`).
 */
function processData(data) {
    return data.map(({ unit, ...rest }) => rest);
}

/**
 * Fetches and updates data for a specific country.
 */
async function fetchAndUpdateCountryData(country) {
    const existingData = await fetchExistingData(country);
    const latestEndTimestamp = existingData.length
        ? existingData[existingData.length - 1].end_timestamp
        : START_DATE.getTime();

    if (latestEndTimestamp >= END_DATE.getTime()) {
        console.log(`No new data needed for ${country.name}.`);
        saveData(country, existingData);
        return;
    }

    const newData = await fetchNewData(country, latestEndTimestamp, END_DATE.getTime());
    const mergedData = [...existingData, ...processData(newData)];
    saveData(country, mergedData);
}

/**
 * Main function to fetch and update data for all countries.
 */
async function fetchAndUpdateAllCountries() {
    console.log("Starting data fetch and update process...");
    for (const country of COUNTRIES) {
        await fetchAndUpdateCountryData(country);
    }
    console.log("Data fetch and update process completed.");
}

// Execute the script
fetchAndUpdateAllCountries();