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
// Summer (Apr-Sep): SHT = 06:00-10:00 and 16:00-22:00; SNT = 10:00-16:00 and 22:00-06:00 (midday valley)
// Winter (Oct-Mar): WHT = 06:00-22:00; WNT = 22:00-06:00
function getTariffPeriod(date) {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const hour = d.getHours();
    const isSummer = month >= 4 && month <= 9;
    if (isSummer) {
        const isHighTariff = (hour >= 6 && hour < 10);
        return isHighTariff ? 'SHT' : 'SNT';
    }
    const isHighTariff = hour >= 6 && hour < 22;
    return isHighTariff ? 'WHT' : 'WNT';
}

// Resolve a rate value that may be a number, seasonal object (SHT/SNT/WHT/WNT), or simple object (AP/SNAP)
function resolveRate(rate, date) {
    if (typeof rate === 'number') return rate;
    if (typeof rate !== 'object' || rate === null) return null;
    // Simple format (2026+): AP with optional SNAP (Apr-Sep 10:00-16:00)
    if ('AP' in rate) {
        if ('SNAP' in rate && rate.SNAP != null) {
            const d = new Date(date);
            const month = d.getMonth() + 1;
            const hour = d.getHours();
            const isSNAP = month >= 4 && month <= 9 && hour >= 10 && hour < 16;
            return isSNAP ? rate.SNAP : rate.AP;
        }
        return rate.AP;
    }
    // Seasonal format (2015-2025)
    const tariff = getTariffPeriod(date);
    return rate[tariff] ?? rate.SHT;
}

function getGridFee(region, date) {
    if (!gridFeesData) return null;
    const key = getAmendmentKey(date);
    if (!key) return null;
    const amendment = gridFeesData.amendments[key];
    if (!amendment || !amendment.netzebene_7_nicht_gemessen) return null;

    const entry = amendment.netzebene_7_nicht_gemessen.find(e => e.region === region);
    if (!entry) return null;

    const arbeitspreis = entry.netznutzungsentgelt.arbeitspreis_cent_per_kwh;
    const netzverlust = entry.netzverlustentgelt_cent_per_kwh;

    // arbeitspreis/netzverlust can be:
    // - a flat number
    // - seasonal format (2015-2025): { SHT, SNT, WHT, WNT }
    // - simple format (2026+): { AP, SNAP } where SNAP = summer off-peak (Apr-Sep 10:00-16:00)
    const arb = resolveRate(arbeitspreis, date);
    const net = resolveRate(netzverlust, date);

    // Variable cost only (arbeitspreis + netzverlustentgelt), excluding fixed leistungspreis
    return arb + net;
}
