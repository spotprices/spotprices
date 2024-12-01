import React from "react";
import { Bar } from "react-chartjs-2";

interface ChartProps {
    data: {
        labels: string[];
        marketPrices: number[];
        gridFees: number[];
    };
}


const Chart: React.FC<ChartProps> = ({ data }) => {
    const chartData = {
        labels: data.labels,
        datasets: [
            {
                label: "Market Price (ct/kWh)",
                data: data.marketPrices,
                backgroundColor: "rgba(54, 162, 235, 0.5)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
            },
            {
                label: "Grid Fees (ct/kWh)",
                data: data.gridFees,
                backgroundColor: "rgba(255, 99, 132, 0.5)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { title: { display: true, text: "Time" } },
            y: { title: { display: true, text: "Price (ct/kWh)" }, beginAtZero: true },
        },
    };

    return (
        <div style={{ height: "500px" }}>
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default Chart;
