import { useEffect, useRef } from "react";
import * as d3 from "d3";

/**
 * Line chart of avg intensity / likelihood / relevance over end_year.
 * data: [{ year, avg_intensity, avg_likelihood, avg_relevance, count }]
 */
const SERIES = [
  { key: "avg_intensity", label: "Intensity", color: "#dc2626" },
  { key: "avg_likelihood", label: "Likelihood", color: "#2563eb" },
  { key: "avg_relevance", label: "Relevance", color: "#16a34a" },
];

export default function YearTrendChart({ data, title }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth || 500;
    const height = 260;
    const margin = { top: 16, right: 16, bottom: 32, left: 36 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const sorted = [...data].sort((a, b) => a.year - b.year);

    const x = d3
      .scaleLinear()
      .domain(d3.extent(sorted, (d) => d.year))
      .range([0, innerWidth]);

    const maxY = d3.max(sorted, (d) =>
      Math.max(d.avg_intensity || 0, d.avg_likelihood || 0, d.avg_relevance || 0)
    );
    const y = d3.scaleLinear().domain([0, maxY || 1]).nice().range([innerHeight, 0]);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(Math.min(sorted.length, 8)).tickFormat(d3.format("d")))
      .attr("font-size", 11);

    g.append("g").call(d3.axisLeft(y).ticks(5)).attr("font-size", 11);

    SERIES.forEach((series) => {
      const validPoints = sorted.filter((d) => d[series.key] !== null && d[series.key] !== undefined);
      if (validPoints.length === 0) return;

      const line = d3
        .line()
        .x((d) => x(d.year))
        .y((d) => y(d[series.key]));

      g.append("path")
        .datum(validPoints)
        .attr("fill", "none")
        .attr("stroke", series.color)
        .attr("stroke-width", 2)
        .attr("d", line);

      g.selectAll(`.dot-${series.key}`)
        .data(validPoints)
        .join("circle")
        .attr("class", `dot-${series.key}`)
        .attr("cx", (d) => x(d.year))
        .attr("cy", (d) => y(d[series.key]))
        .attr("r", 3)
        .attr("fill", series.color);
    });
  }, [data]);

  return (
    <div className="chart-card" ref={containerRef}>
      <h3>{title}</h3>
      <div className="legend">
        {SERIES.map((s) => (
          <span key={s.key} className="legend-item">
            <span className="legend-swatch" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
      {(!data || data.length === 0) ? (
        <p className="chart-empty">No data for the current filters.</p>
      ) : (
        <svg ref={svgRef} />
      )}
    </div>
  );
}