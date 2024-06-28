import React, { useState, useEffect } from "react";
import GravityModelSolver from "./GravityModelSolver";
import GravityModelVisualizer from "./GravityModelVisualizer";

export default function App() {
  const [modelData, setModelData] = useState(null);
  const [tariffs, setTariffs] = useState([]);

  useEffect(() => {
    // Initialize tariffs
    const countries = [
      "USA",
      "China",
      "Japan",
      "Germany",
      "UK",
      "India",
      "France",
      "Italy",
      "Brazil",
      "Canada",
    ];
    const initialTariffs = countries.flatMap((source) =>
      countries
        .filter((target) => source !== target)
        .map((target) => ({
          source,
          target,
          tariff: Math.random() * 0.1, // Random tariff between 0 and 10%
        }))
    );
    setTariffs(initialTariffs);
  }, []);

  const handleSolverResult = (result) => {
    setModelData(result);
  };

  const handleTariffChange = (source, target, newTariff) => {
    setTariffs((prevTariffs) => {
      const updatedTariffs = prevTariffs.map((t) =>
        t.source === source && t.target === target
          ? { ...t, tariff: newTariff }
          : t
      );
      return updatedTariffs;
    });
  };

  return (
    <div className="App">
      <h1>Trade Simulation with Gravity Model</h1>
      <GravityModelSolver onSolve={handleSolverResult} tariffs={tariffs} />
      {modelData && (
        <GravityModelVisualizer
          countries={modelData.countries}
          solution={modelData.solution}
          tariffs={tariffs}
          onTariffChange={handleTariffChange}
        />
      )}
    </div>
  );
}
