import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';

// Define CET timezone
const CET = 'Europe/Berlin';

// Determine the output directory
const outputDir = path.resolve('page');

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
}

// Determine the end date based on the current time in CET
const nowCET = DateTime.now().setZone(CET);
let endDateCET;

// Use the end of the following day if after 14:00 CET, otherwise use the end of today
if (nowCET.hour >= 14) {
    endDateCET = nowCET.plus({ days: 1 }).endOf('day');
} else {
    endDateCET = nowCET.endOf('day');
}

// Add 2 minutes to the end timestamp to adjust for "24:00"
endDateCET = endDateCET.plus({ minutes: 2 });

// Start date is 20 years before today in CET
const startDateCET = nowCET.minus({ years: 20 }).startOf('day');

const TARGET_URL_BASE = "https://spotprices.github.io/spotprices";
const FILE_NAME_COMMON_PART = "cached-data-";
const API_URL_COMMON="https://api.awattar.";

const COUNTRIES = [
    { name: "Austria", api: `${API_URL_COMMON}at`, cachedUrl: `${TARGET_URL_BASE}/${FILE_NAME_COMMON_PART}austria.json`, output: path.join(outputDir, `${FILE_NAME_COMMON_PART}austria.json`) },
    { name: "Germany", api: `${API_URL_COMMON}de`, cachedUrl: `${TARGET_URL_BASE}/${FILE_NAME_COMMON_PART}germany.json`, output: path.join(outputDir, `${FILE_NAME_COMMON_PART}germany.json`) },
];

console.log(`Execution at ${nowCET} CET and ${DateTime.now()} UTC`);

async function fetchExistingData(country) {
    try {
        console.log(`Checking existing cached data for ${country.name}...`);
        const response = await fetch(country.cachedUrl);
        if (!response.ok) throw new Error(`No existing cached data found for ${country.name}`);
        const existingData = await response.json();
        console.log(`Existing cached data loaded for ${country.name} from ${country.cachedUrl}`);
        return existingData;
    } catch (error) {
        console.warn(`No existing data available for ${country.name}. Fetching all data.`);
        return [];
    }
}

function getLatestEndTimestamp(data) {
    if (data.length === 0) return startDateCET.toMillis();
    const latestEntry = data[data.length - 1];
    return latestEntry.end_timestamp || startDateCET.toMillis();
}

async function fetchAndSaveDataForCountry(country) {
    const existingData = await fetchExistingData(country);
    const latestEndTimestamp = getLatestEndTimestamp(existingData);
    const newStartTimestamp = latestEndTimestamp;

    if (newStartTimestamp >= endDateCET.toMillis()) {
        console.error(`No new data to fetch for ${country.name}.`);
        fs.writeFileSync(country.output, JSON.stringify(existingData));
        return;
    }

    // Check if the time range is below 10 minutes
    if ((endDateCET.toMillis() - newStartTimestamp) < 10 * 60 * 1000) { // 10 minutes in milliseconds
        console.log(`Time range for ${country.name} is below 10 minutes. Skipping API fetch.`);
        fs.writeFileSync(country.output, JSON.stringify(existingData));
        return;
    }

    const url = `${country.api}/v1/marketdata?start=${newStartTimestamp}&end=${endDateCET.toMillis()}`;
    console.log(`Fetching missing data for ${country.name} from ${DateTime.fromMillis(newStartTimestamp, { zone: CET }).toISO()} to ${endDateCET.toISO()}...`);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch data for ${country.name}: ${response.statusText}`);
        const result = await response.json();

        // Merge existing data with the new data
        const mergedData = [...existingData, ...result.data].map(({ unit, ...rest }) => rest); // Remove 'unit' if it exists

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