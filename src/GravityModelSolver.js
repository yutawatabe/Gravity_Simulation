import React, { useState, useEffect } from "react";

const GravityModelSolver = ({ onSolve, tariffs }) => {
  const gdpData = {
    USA: 20580,
    China: 13895,
    Japan: 5000,
    Germany: 4000,
    UK: 2860,
    India: 2720,
    France: 2780,
    Italy: 2075,
    Brazil: 1870,
    Canada: 1720,
  };

  const popData = {
    USA: 327,
    China: 1393,
    Japan: 127,
    Germany: 83,
    UK: 66,
    India: 1353,
    France: 67,
    Italy: 60,
    Brazil: 209,
    Canada: 37,
  };

  const countries = [
    { id: "USA", L: 327, A: 1, area: 9833517 },
    { id: "China", L: 1393, A: 2, area: 9596961 },
    { id: "Japan", L: 127, A: 0.8, area: 377975 },
    { id: "Germany", L: 83, A: 0.9, area: 357022 },
    { id: "UK", L: 66, A: 0.95, area: 242495 },
    { id: "India", L: 1353, A: 2.5, area: 3287263 },
    { id: "France", L: 67, A: 0.95, area: 551695 },
    { id: "Italy", L: 60, A: 1, area: 301340 },
    { id: "Brazil", L: 209, A: 1.5, area: 8515767 },
    { id: "Canada", L: 37, A: 0.9, area: 9984670 },
  ];

  const distances = [
    { source: "USA", target: "China", distance: 11 },
    { source: "USA", target: "Japan", distance: 10 },
    { source: "USA", target: "Germany", distance: 7 },
    { source: "USA", target: "UK", distance: 6 },
    { source: "USA", target: "India", distance: 12 },
    { source: "USA", target: "France", distance: 6 },
    { source: "USA", target: "Italy", distance: 8 },
    { source: "USA", target: "Brazil", distance: 8 },
    { source: "USA", target: "Canada", distance: 2 },
    { source: "China", target: "Japan", distance: 2 },
    { source: "China", target: "Germany", distance: 8 },
    { source: "China", target: "UK", distance: 9 },
    { source: "China", target: "India", distance: 4 },
    { source: "China", target: "France", distance: 9 },
    { source: "China", target: "Italy", distance: 9 },
    { source: "China", target: "Brazil", distance: 17 },
    { source: "China", target: "Canada", distance: 11 },
    { source: "Japan", target: "Germany", distance: 9 },
    { source: "Japan", target: "UK", distance: 10 },
    { source: "Japan", target: "India", distance: 6 },
    { source: "Japan", target: "France", distance: 10 },
    { source: "Japan", target: "Italy", distance: 10 },
    { source: "Japan", target: "Brazil", distance: 18 },
    { source: "Japan", target: "Canada", distance: 10 },
    { source: "Germany", target: "UK", distance: 1 },
    { source: "Germany", target: "India", distance: 7 },
    { source: "Germany", target: "France", distance: 1 },
    { source: "Germany", target: "Italy", distance: 1 },
    { source: "Germany", target: "Brazil", distance: 10 },
    { source: "Germany", target: "Canada", distance: 6 },
    { source: "UK", target: "India", distance: 8 },
    { source: "UK", target: "France", distance: 1 },
    { source: "UK", target: "Italy", distance: 2 },
    { source: "UK", target: "Brazil", distance: 9 },
    { source: "UK", target: "Canada", distance: 5 },
    { source: "India", target: "France", distance: 8 },
    { source: "India", target: "Italy", distance: 7 },
    { source: "India", target: "Brazil", distance: 14 },
    { source: "India", target: "Canada", distance: 12 },
    { source: "France", target: "Italy", distance: 1 },
    { source: "France", target: "Brazil", distance: 9 },
    { source: "France", target: "Canada", distance: 6 },
    { source: "Italy", target: "Brazil", distance: 9 },
    { source: "Italy", target: "Canada", distance: 7 },
    { source: "Brazil", target: "Canada", distance: 8 },
  ];

  const deficits = {
    USA: 950,
    China: -420,
    Japan: -180,
    Germany: 290,
    UK: -100,
    India: -160,
    France: -70,
    Italy: 54,
    Brazil: -15,
    Canada: -45,
  };

  useEffect(() => {
    solveModel();
  }, [tariffs]);

  const solveModel = () => {
    const sigma = 4;
    const rho = 1.1 / 4;
    const damping = 0.3;

    let Y = countries.reduce((sum, c) => sum + gdpData[c.id], 0);
    let w = countries.map((c) => gdpData[c.id] / c.L);
    let Pi = countries.map(() => 1);
    let P = countries.map(() => 1);

    const getDistance = (i, j) => {
      if (i === j) {
        const area = countries[i].area;
        return ((2 / 3) * Math.sqrt(area / Math.PI)) / 1000;
      }
      const d = distances.find(
        (d) =>
          (d.source === countries[i].id && d.target === countries[j].id) ||
          (d.source === countries[j].id && d.target === countries[i].id)
      );
      return d ? d.distance : Infinity;
    };

    const getTariff = (i, j) => {
      if (i === j) return 0;
      const t = tariffs.find(
        (t) => t.source === countries[i].id && t.target === countries[j].id
      );
      return t ? t.tariff : 0;
    };

    for (let iter = 0; iter < 1000; iter++) {
      let newPi = countries.map((_, i) => {
        const sum = countries.reduce((sum, _, j) => {
          const distance = getDistance(i, j);
          const tariff = getTariff(i, j);
          const term =
            (Math.pow(distance, rho * sigma) *
              Math.pow(1 + tariff, sigma) *
              (w[j] * countries[j].L + deficits[countries[j].id])) /
            (Y * Math.pow(P[j], sigma));
          return sum + term;
        }, 0);
        return Math.pow(sum, -1 / sigma);
      });

      let newP = countries.map((_, j) => {
        const sum = countries.reduce((sum, _, i) => {
          const distance = getDistance(i, j);
          const tariff = getTariff(i, j);
          const term =
            (Math.pow(distance, rho * sigma) *
              Math.pow(1 + tariff, sigma) *
              w[i] *
              countries[i].L) /
            (Y * Math.pow(newPi[i], sigma) * countries[i].A);
          return sum + term;
        }, 0);
        return Math.pow(sum, -1 / sigma);
      });

      let newW = countries.map((c, i) => {
        const numerator = w[i] * c.L + deficits[c.id];
        const denominator =
          c.A *
          countries.reduce((sum, _, j) => {
            const distance = getDistance(i, j);
            const tariff = getTariff(i, j);
            const term =
              (Math.pow(distance, -rho * sigma) *
                Math.pow(1 + tariff, -sigma) *
                (w[j] * countries[j].L + deficits[countries[j].id])) /
              (Y * Math.pow(newPi[i], sigma) * Math.pow(newP[j], sigma));
            return sum + term;
          }, 0);
        return numerator / denominator;
      });

      w = w.map((oldW, i) => (1 - damping) * oldW + damping * newW[i]);
      Pi = Pi.map((oldPi, i) => (1 - damping) * oldPi + damping * newPi[i]);
      P = P.map((oldP, i) => (1 - damping) * oldP + damping * newP[i]);

      if (w.every((newW, i) => Math.abs(newW - w[i]) < 1e-6)) {
        break;
      }
    }

    let X = countries.map((ci, i) =>
      countries.map((cj, j) => {
        const flow =
          (((((w[i] * countries[i].L) / countries[i].A) *
            (w[j] * countries[j].L + deficits[countries[j].id])) /
            Y) *
            Math.pow(getDistance(i, j), -rho * sigma) *
            Math.pow(1 + getTariff(i, j), -sigma)) /
          (Math.pow(Pi[i], sigma) * Math.pow(P[j], sigma));
        return flow;
      })
    );

    onSolve({ countries, solution: { w, Pi, P, X } });
  };

  return null; // This component doesn't render anything
};

export default GravityModelSolver;
