import React from "react";

interface HeaderProps {
    region: string;
    setRegion: (region: string) => void;
    startDate: string;
    setStartDate: (date: string) => void;
    endDate: string;
    setEndDate: (date: string) => void;
    fetchData: () => void;
}

const Header: React.FC<HeaderProps> = ({
    region,
    setRegion,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    fetchData,
}) => {
    return (
        <header>
            <h1>Energy Price Navigator</h1>
            <div>
                <label htmlFor="region">Region:</label>
                <select
                    id="region"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                >
                    <option value="Kleinwalsertal">Kleinwalsertal</option>
                    <option value="Kärnten">Kärnten</option>
                    <option value="Steiermark">Steiermark</option>
                    <option value="Oberösterreich">Oberösterreich</option>
                    <option value="Innsbruck">Innsbruck</option>
                    <option value="Burgenland">Burgenland</option>
                    <option value="Klagenfurt">Klagenfurt</option>
                    <option value="Niederösterreich">Niederösterreich</option>
                    <option value="Salzburg">Salzburg</option>
                    <option value="Wien">Wien</option>
                    <option value="Tirol">Tirol</option>
                    <option value="Graz">Graz</option>
                    <option value="Linz">Linz</option>
                    <option value="Vorarlberg">Vorarlberg</option>
                </select>

                <label htmlFor="start-date">Start Date:</label>
                <input
                    type="date"
                    id="start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />

                <label htmlFor="end-date">End Date:</label>
                <input
                    type="date"
                    id="end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />

                <button onClick={fetchData}>Fetch Data</button>
            </div>
        </header>
    );
};

export default Header;