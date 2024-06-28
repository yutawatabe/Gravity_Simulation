import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const GravityModelVisualizer = ({
  countries,
  solution,
  tariffs,
  onTariffChange,
}) => {
  const svgRef = useRef(null);
  const [tariffAdjustments, setTariffAdjustments] = useState([]);
  const [originalTariffs, setOriginalTariffs] = useState({});

  // Custom positions for countries
  const countryPositions = {
    USA: [300, 300],
    China: [1700, 300],
    Japan: [1700, 900],
    Germany: [1000, 300],
    UK: [900, 150],
    India: [1400, 500],
    France: [950, 400],
    Italy: [1050, 450],
    Brazil: [500, 800],
    Canada: [400, 200],
  };

  // Flag image URLs (replace with actual flag URLs)
  const flagUrls = {
    USA: "https://flagcdn.com/w320/us.png",
    China: "https://flagcdn.com/w320/cn.png",
    Japan: "https://flagcdn.com/w320/jp.png",
    Germany: "https://flagcdn.com/w320/de.png",
    UK: "https://flagcdn.com/w320/gb.png",
    India: "https://flagcdn.com/w320/in.png",
    France: "https://flagcdn.com/w320/fr.png",
    Italy: "https://flagcdn.com/w320/it.png",
    Brazil: "https://flagcdn.com/w320/br.png",
    Canada: "https://flagcdn.com/w320/ca.png",
  };

  useEffect(() => {
    const origTariffs = {};
    tariffs.forEach((t) => {
      origTariffs[`${t.source}-${t.target}`] = t.tariff;
    });
    setOriginalTariffs(origTariffs);
  }, []);

  useEffect(() => {
    if (!solution) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 2000;
    const height = 1200;

    svg.attr("width", width).attr("height", height);

    // Create scales for country circle size and trade flow line thickness
    const sizeScale = d3
      .scaleSqrt()
      .domain([
        0,
        d3.max(countries, (d) => solution.w[countries.indexOf(d)] * d.L),
      ])
      .range([20, 60]);

    const flowScale = d3
      .scalePow()
      .exponent(0.3)
      .domain([0, d3.max(solution.X.flat())])
      .range([0.5, 8]);

    // Define smaller arrowhead marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 5)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 0.9)
      .attr("markerHeight", 0.9)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#999")
      .style("stroke", "none");

    // Draw curved trade flow lines with arrows
    countries.forEach((source, i) => {
      countries.forEach((target, j) => {
        if (i !== j) {
          const sourcePos = countryPositions[source.id];
          const targetPos = countryPositions[target.id];
          const tradeVolume = solution.X[i][j] * solution.w[i] * countries[i].L;

          const sourceRadius = sizeScale(solution.w[i] * countries[i].L);
          const targetRadius = sizeScale(solution.w[j] * countries[j].L);

          const dx = targetPos[0] - sourcePos[0];
          const dy = targetPos[1] - sourcePos[1];
          const dr = Math.sqrt(dx * dx + dy * dy);

          // Calculate control point for quadratic curve
          const midX = (sourcePos[0] + targetPos[0]) / 2;
          const midY = (sourcePos[1] + targetPos[1]) / 2;
          const offsetX = (-dy / dr) * 100; // Perpendicular offset
          const offsetY = (dx / dr) * 100; // Perpendicular offset

          const path =
            `M${sourcePos[0]},${sourcePos[1]} ` +
            `Q${midX + offsetX},${midY + offsetY} ` +
            `${targetPos[0]},${targetPos[1]}`;

          svg
            .append("path")
            .attr("class", "trade-flow")
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", flowScale(tradeVolume))
            .attr("marker-end", "url(#arrowhead)")
            .append("title")
            .text(
              `Trade from ${source.id} to ${target.id}: ${tradeVolume.toFixed(
                2
              )}`
            );
        }
      });
    });

    // Draw country circles with flags
    countries.forEach((country, i) => {
      const [x, y] = countryPositions[country.id];
      const radius = sizeScale(solution.w[i] * country.L);

      // Create a clipPath for the circle
      const clipId = `clip-${country.id}`;
      svg
        .append("clipPath")
        .attr("id", clipId)
        .append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", radius);

      // Add the flag image
      svg
        .append("image")
        .attr("x", x - radius)
        .attr("y", y - radius)
        .attr("width", radius * 2)
        .attr("height", radius * 2)
        .attr("xlink:href", flagUrls[country.id])
        .attr("clip-path", `url(#${clipId})`)
        .attr("preserveAspectRatio", "xMidYMid slice");

      svg
        .append("text")
        .attr("class", "country-label")
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", "middle")
        .attr("dy", -radius - 10)
        .text(country.id)
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .attr("fill", "#000")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5);
    });

    // Add legend for trade volume
    const legendWidth = 200;
    const legendHeight = 20;
    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${width - legendWidth - 20}, ${height - 50})`
      );

    const legendScale = d3
      .scaleLinear()
      .domain(flowScale.domain())
      .range([0, legendWidth]);

    const legendAxis = d3
      .axisBottom(legendScale)
      .ticks(5)
      .tickFormat(d3.format(".2s"));

    legend.append("g").call(legendAxis);

    legend
      .selectAll("rect")
      .data(d3.range(0, legendWidth))
      .enter()
      .append("rect")
      .attr("x", (d) => d)
      .attr("y", -legendHeight)
      .attr("width", 1)
      .attr("height", legendHeight)
      .attr("fill", (d) => d3.interpolateBlues(d / legendWidth));

    legend
      .append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .text("Trade Volume")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");
  }, [countries, solution]);

  const handleAddTariffAdjustment = () => {
    setTariffAdjustments([
      ...tariffAdjustments,
      { exporter: "", importer: "", newTariff: 0 },
    ]);
  };

  const handleTariffAdjustmentChange = (index, field, value) => {
    const newAdjustments = [...tariffAdjustments];
    newAdjustments[index][field] = value;
    setTariffAdjustments(newAdjustments);

    if (
      field === "newTariff" &&
      newAdjustments[index].exporter &&
      newAdjustments[index].importer
    ) {
      onTariffChange(
        newAdjustments[index].exporter,
        newAdjustments[index].importer,
        value / 100
      );
    }
  };

  const getOriginalTariff = (exporter, importer) => {
    return (originalTariffs[`${exporter}-${importer}`] || 0) * 100;
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <div
        style={{ width: "100%", overflow: "auto", border: "1px solid #ccc" }}
      >
        <svg ref={svgRef}></svg>
      </div>
      <div style={{ width: "100%", maxWidth: "2000px", margin: "20px 0" }}>
        <h3>Adjust Tariffs</h3>
        <button onClick={handleAddTariffAdjustment}>
          Add Tariff Adjustment
        </button>
        {tariffAdjustments.map((adjustment, index) => (
          <div
            key={index}
            style={{
              marginTop: "10px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <select
              value={adjustment.exporter}
              onChange={(e) =>
                handleTariffAdjustmentChange(index, "exporter", e.target.value)
              }
            >
              <option value="">Select Exporter</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.id}
                </option>
              ))}
            </select>
            <select
              value={adjustment.importer}
              onChange={(e) =>
                handleTariffAdjustmentChange(index, "importer", e.target.value)
              }
            >
              <option value="">Select Importer</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.id}
                </option>
              ))}
            </select>
            {adjustment.exporter && adjustment.importer && (
              <>
                <span>
                  Original:{" "}
                  {getOriginalTariff(
                    adjustment.exporter,
                    adjustment.importer
                  ).toFixed(2)}
                  %
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={adjustment.newTariff}
                  onChange={(e) =>
                    handleTariffAdjustmentChange(
                      index,
                      "newTariff",
                      parseFloat(e.target.value)
                    )
                  }
                  style={{ width: "200px" }}
                />
                <span>New: {adjustment.newTariff.toFixed(2)}%</span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GravityModelVisualizer;
