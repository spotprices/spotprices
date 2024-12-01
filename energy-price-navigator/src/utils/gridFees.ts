
type Region = 
    | "Kleinwalsertal"
    | "Kärnten"
    | "Steiermark"
    | "Oberösterreich"
    | "Innsbruck"
    | "Burgenland"
    | "Klagenfurt"
    | "Niederösterreich"
    | "Salzburg"
    | "Wien"
    | "Tirol"
    | "Graz"
    | "Linz"
    | "Vorarlberg";

interface GridFeeData {
    [region: string]: number | string;
    startDate: string;
    endDate: string;
}

class GridFeePeriod {
    startDate: Date;
    endDate: Date;
    fees: Record<Region, number>;

    constructor(gridFeeData: GridFeeData) {
        this.startDate = new Date(gridFeeData.startDate);
        this.endDate = new Date(gridFeeData.endDate);

        // Extract region fees from the data
        this.fees = Object.keys(gridFeeData)
            .filter(key => key !== "startDate" && key !== "endDate")
            .reduce((acc, key) => {
                acc[key as Region] = gridFeeData[key] as number;
                return acc;
            }, {} as Record<Region, number>);
    }

    // Get the grid fee for a specific region
    getGridFee(region: Region): number | null {
        return this.fees[region] ?? null;
    }

    // Check if a date falls within the grid fee period
    isWithinPeriod(date: Date): boolean {
        return date >= this.startDate && date <= this.endDate;
    }
}

export default GridFeePeriod;

export const gridFees2024: GridFeeData = {
    endDate: "2024-12-31",
    startDate: "2024-01-01",
    "Kleinwalsertal": 17.9,
    "Kärnten": 10.26,
    "Steiermark": 8.43,
    "Oberösterreich": 6.48,
    "Innsbruck": 9.58,
    "Burgenland": 6.98,
    "Klagenfurt": 7.64,
    "Niederösterreich": 7.58,
    "Salzburg": 8.22,
    "Wien": 7.19,
    "Tirol": 7.25,
    "Graz": 7.84,
    "Linz": 5.94,
    "Vorarlberg": 5.93,
};

export const gridFees2025: GridFeeData = {
    startDate: "2025-01-01",
    endDate: "9999-12-31",
    "Kleinwalsertal": 17.9 * 1.33,
    "Kärnten": 11.77,
    "Steiermark": 10.87,
    "Oberösterreich": 8.15,
    "Innsbruck": 10.03,
    "Burgenland": 8.62,
    "Klagenfurt": 9.37,
    "Niederösterreich": 10.01,
    "Salzburg": 9.33,
    "Wien": 9.46,
    "Tirol": 7.85,
    "Graz": 7.48,
    "Linz": 7.06,
    "Vorarlberg": 7.06,
};

const gridFees2023: GridFeeData = {
    endDate: "2023-12-31",
    startDate: "1970-01-01",
    "Kleinwalsertal": 14.82,
    "Kärnten": 10.58,
    "Steiermark": 9.46,
    "Oberösterreich": 8.67,
    "Innsbruck": 9.65,
    "Burgenland": 9.33,
    "Klagenfurt": 8.22,
    "Niederösterreich": 8.62,
    "Salzburg": 8.04,
    "Wien": 8.94,
    "Tirol": 8.74,
    "Graz": 8.88,
    "Linz": 6.56,
    "Vorarlberg": 6.39,
};

const gridFees = [gridFees2023, gridFees2024, gridFees2025].map(data => new GridFeePeriod(data));

export function getGridFee(region: string, date: string): number | null {
    const targetDate = new Date(date);

    for (const gridFeePeriod of gridFees) {
        const startDate = gridFeePeriod.startDate;
        const endDate = gridFeePeriod.endDate;

        if (targetDate >= startDate && targetDate <= endDate) {
            return gridFeePeriod.fees[region as Region] || null;
        }
    }

    return null;
}