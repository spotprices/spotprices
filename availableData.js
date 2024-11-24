import fetch from 'node-fetch';

const COUNTRY_API = "https://api.awattar.de"; // Change to "https://api.awattar.de" for Germany
const INITIAL_START_DATE = new Date(new Date().setFullYear(new Date().getFullYear() - 20)); // Start 7 years ago
const ONE_DAY_MS = 24 * 60 * 60 * 1000; // One day in milliseconds

async function isDataAvailable(date) {
    const start = date.getTime();
    const end = start + ONE_DAY_MS - 1; // Include the entire day up to 23:59:59.999
    const url = `${COUNTRY_API}/v1/marketdata?start=${start}&end=${end}`;

    try {
        console.log(`Checking url: ${url}`);
        console.log(`Checking data for: ${date.toISOString().split('T')[0]}`);
        const response = await fetch(url);
        if (response.ok) {
            const result = await response.json();
            return result.data.length > 0;
        } else {
            console.error(`API responded with status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error(`Error while fetching data: ${error.message}`);
        return false;
    }
}

async function findEarliestData() {
    let low = INITIAL_START_DATE.getTime();
    let high = Date.now();
    let foundTimestamp = null;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const testDate = new Date(mid);

        const available = await isDataAvailable(testDate);
        if (available) {
            foundTimestamp = mid; // Update to the current midpoint
            high = mid - ONE_DAY_MS; // Look earlier
        } else {
            low = mid + ONE_DAY_MS; // Look later
        }
    }

    if (foundTimestamp) {
        const earliestDate = new Date(foundTimestamp);
        console.log(`Earliest data available from: ${earliestDate.toISOString().split('T')[0]}`);
    } else {
        console.log("No data available in the range.");
    }
}

findEarliestData();