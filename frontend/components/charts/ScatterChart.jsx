import { useEffect, useRef } from "react";
import * as d3 from "d3";

/**
 * Scatter plot: intensity (x) vs likelihood (y), point size = relevance,
 * point color = region. Uses raw /api/insights records, not aggregates —
 * this is the one chart that benefits from seeing individual data points
 * rather than a rollup.
 */
export default function ScatterChart({ data, title }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data) return;

    const points = data.filter(
      (d) => d.intensity !== null && d.intensity !== undefined && d.likelihood !== null && d.likelihood !== undefined
    );
    if (points.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth || 500;
    const height = 320;
    const margin = { top: 16, right: 16, bottom: 36, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const x = d3.scaleLinear().domain([0, d3.max(points, (d) => d.intensity) || 1]).nice().range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, d3.max(points, (d) => d.likelihood) || 1]).nice().range([innerHeight, 0]);
    const r = d3.scaleSqrt().domain([0, d3.max(points, (d) => d.relevance || 0) || 1]).range([2, 12]);
    const regions = Array.from(new Set(points.map((d) => d.region).filter(Boolean)));
    const color = d3.scaleOrdinal(d3.schemeTableau10).domain(regions);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(6))
      .attr("font-size", 11);
    g.append("g").call(d3.axisLeft(y).ticks(6)).attr("font-size", 11);

    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 32)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "#374151")
      .text("Intensity");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -28)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "#374151")
      .text("Likelihood");

    g.selectAll("circle")
      .data(points)
      .join("circle")
      .attr("cx", (d) => x(d.intensity))
      .attr("cy", (d) => y(d.likelihood))
      .attr("r", (d) => r(d.relevance || 0))
      .attr("fill", (d) => (d.region ? color(d.region) : "#9ca3af"))
      .attr("opacity", 0.7)
      .append("title")
      .text((d) => `${d.title || ""}\nRegion: ${d.region || "n/a"}\nRelevance: ${d.relevance ?? "n/a"}`);
  }, [data]);

  return (
    <div className="chart-card" ref={containerRef}>
      <h3>{title}</h3>
      <p className="chart-caption">Point size = relevance · color = region · hover a point for details</p>
      {(!data || data.length === 0) ? (
        <p className="chart-empty">No data for the current filters.</p>
      ) : (
        <svg ref={svgRef} />
      )}
    </div>
  );
}