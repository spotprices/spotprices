let gridFeesData = null;

async function loadGridFees() {
    try {
        const response = await fetch('https://spotprices.github.io/gridfees/v1/all.json');
        if (!response.ok) throw new Error(`Failed to load grid fees: ${response.statusText}`);
        gridFeesData = await response.json();
        console.log('Grid fees loaded from API.');
    } catch (error) {
        console.error('Error loading grid fees:', error);
    }
}

// Map a date to the correct amendment key
function getAmendmentKey(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    if (!gridFeesData) return null;
    const keys = Object.keys(gridFeesData.amendments);
    // Special case: 2023 has two amendments (2023_1 for Jan-Feb, 2023_2 for Mar-Dec)
    if (year === 2023) {
        return month <= 2 && keys.includes('2023_1') ? '2023_1' : (keys.includes('2023_2') ? '2023_2' : null);
    }
    const yearStr = String(year);
    if (keys.includes(yearStr)) return yearStr;
    // Fallback: use the latest available amendment
    const numericKeys = keys.map(k => parseInt(k)).filter(n => !isNaN(n)).sort((a, b) => b - a);
    if (numericKeys.length > 0 && year > numericKeys[0]) return String(numericKeys[0]);
    return null;
}

// Determine tariff period from a timestamp: SHT, SNT, WHT, WNT
function getTariffPeriod(date) {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const hour = d.getHours();
    const isSummer = month >= 4 && month <= 9;
    const isHighTariff = hour >= 6 && hour < 22;
    if (isSummer) return isHighTariff ? 'SHT' : 'SNT';
    return isHighTariff ? 'WHT' : 'WNT';
}

function getGridFee(region, date) {
    if (!gridFeesData) return null;
    const key = getAmendmentKey(date);
    if (!key) return null;
    const amendment = gridFeesData.amendments[key];
    if (!amendment || !amendment.netzebene_7_nicht_gemessen) return null;

    const entry = amendment.netzebene_7_nicht_gemessen.find(e => e.region === region);
    if (!entry) return null;

    const tariff = getTariffPeriod(date);
    const arbeitspreis = entry.netznutzungsentgelt.arbeitspreis_cent_per_kwh;
    const netzverlust = entry.netzverlustentgelt_cent_per_kwh;

    // arbeitspreis/netzverlust can be a flat number or an object with SHT/SNT/WHT/WNT
    const arb = typeof arbeitspreis === 'object' ? (arbeitspreis[tariff] ?? arbeitspreis.SHT) : arbeitspreis;
    const net = typeof netzverlust === 'object' ? (netzverlust[tariff] ?? netzverlust.SHT) : netzverlust;

    // Variable cost only (arbeitspreis + netzverlustentgelt), excluding fixed leistungspreis
    return arb + net;
}
