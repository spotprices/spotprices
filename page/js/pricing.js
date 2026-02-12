// Electricity tax (Elektrizitätsabgabe) — reduced rate during 2022-04-01 to 2024-12-31 and from 2026-01-01 onwards
const ELEKTRIZITAETSABGABE = 1.5; // ct/kWh standard
const OEKOSTROMFOERDERBETRAG_ARBEIT = 0.00737;
const OEKOSTROMFOERDERBETRAG_VERLUST = 0.0059;
const REDUCED_TAX_START = new Date("2022-04-01");
const REDUCED_TAX_END = new Date("2024-12-31");
const REDUCED_TAX_START_2026 = new Date("2026-01-01");

function getElektrizitaetsabgabe(date) {
    const d = new Date(date);
    let abgabe = ELEKTRIZITAETSABGABE;
    if ((d >= REDUCED_TAX_START && d <= REDUCED_TAX_END) || d >= REDUCED_TAX_START_2026) {
        abgabe = 0.1;
    }
    return OEKOSTROMFOERDERBETRAG_ARBEIT + OEKOSTROMFOERDERBETRAG_VERLUST + abgabe;
}

function calculateProviderFees(marketPrices, provider) {
    return marketPrices.map(marketPrice => {
        switch (provider) {
            case 'awattar':
                return (parseFloat(marketPrice) * 0.03 + 1.5).toFixed(2); // 3% of market price + 1.5 ct
            case 'smartenergy':
                return 1.2.toFixed(2); // Fixed 1.2 ct
            default:
                return 0.0.toFixed(2); // No provider fee
        }
    });
}
