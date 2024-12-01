import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Chart from "../components/Chart"
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import { getGridFee } from "../utils/gridFees";

interface DataPoint {
    start_timestamp: number;
    end_timestamp: number;
    marketprice: number;
}

const EnergyPriceNavigator: React.FC = () => {
    const [data, setData] = useState<DataPoint[]>([]);
    const [region, setRegion] = useState("Kärnten");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 50;

    useEffect(() => {
        // Initialize dates on load
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        setStartDate(today.toISOString().split("T")[0]);
        setEndDate(tomorrow.toISOString().split("T")[0]);
    }, []);

    // const fetchData = async () => {
    //     const url = `https://api.awattar.${region === "Austria" ? "at" : "de"}/v1/marketdata?start=${new Date(
    //         startDate
    //     ).getTime()}&end=${new Date(endDate).getTime()}`;
    //     const response = await fetch(url);
    //     const result = await response.json();

    //     const processedData = result.data.map((entry: DataPoint) => {
    //         const date = new Date(entry.start_timestamp).toISOString().split("T")[0];
    //         const gridFee = getGridFee(region, date) ?? 0;
    //         return {
    //             ...entry,
    //             marketprice: entry.marketprice * 0.1 + gridFee, // Apply grid fee
    //         };
    //     });

    //     setData(processedData);
    // };

    const fetchData = async () => {
        const url = `https://api.awattar.${region === "Austria" ? "at" : "de"}/v1/marketdata?start=${new Date(
            startDate
        ).getTime()}&end=${new Date(endDate).getTime()}`;
        const response = await fetch(url);
        const result = await response.json();
    
        const processedData = result.data.map((entry: DataPoint) => {
            const date = new Date(entry.start_timestamp).toISOString().split("T")[0];
            const gridFee = getGridFee(region, date) ?? 0; // Get grid fee for the region
            const marketPrice = entry.marketprice * 0.1; // Convert EUR/MWh to ct/kWh
            const totalPrice = marketPrice + gridFee; // Calculate total price
    
            return {
                ...entry,
                gridFee,
                totalPrice,
            };
        });
    
        setData(processedData);
    };
    return (
        <div>
            <Header
                region={region}
                setRegion={setRegion}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                fetchData={fetchData}
            />
            <Chart data={data} />
            <DataTable data={data} currentPage={currentPage} rowsPerPage={rowsPerPage} />
            <Pagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalRows={data.length}
                rowsPerPage={rowsPerPage}
            />
        </div>
    );
};

export default EnergyPriceNavigator;