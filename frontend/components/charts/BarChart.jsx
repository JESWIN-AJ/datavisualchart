import { useEffect, useRef } from "react";
import * as d3 from "d3";

/**
 * Generic horizontal bar chart.
 * data: [{ label, value }], sorted by value descending, top `limit` shown.
 * Used for country / topic / region counts — same rendering logic,
 * different data feed, so one component covers all three.
 */
export default function BarChart({ data, title, valueLabel = "count", limit = 10, color = "#2563eb" }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const margin = { top: 8, right: 48, bottom: 8, left: 160 };
    const rowHeight = 26;
    const top = [...data]
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
    const height = top.length * rowHeight + margin.top + margin.bottom;
    const innerWidth = width - margin.left - margin.right;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(top, (d) => d.value) || 1])
      .range([0, innerWidth]);

    const y = d3
      .scaleBand()
      .domain(top.map((d) => d.label))
      .range([0, top.length * rowHeight])
      .padding(0.2);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.selectAll("rect")
      .data(top)
      .join("rect")
      .attr("x", 0)
      .attr("y", (d) => y(d.label))
      .attr("width", (d) => x(d.value))
      .attr("height", y.bandwidth())
      .attr("fill", color)
      .attr("rx", 3);

    g.selectAll(".label")
      .data(top)
      .join("text")
      .attr("class", "label")
      .attr("x", -8)
      .attr("y", (d) => y(d.label) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .attr("font-size", 12)
      .attr("fill", "#374151")
      .text((d) => (d.label.length > 22 ? d.label.slice(0, 20) + "…" : d.label));

    g.selectAll(".value")
      .data(top)
      .join("text")
      .attr("class", "value")
      .attr("x", (d) => x(d.value) + 6)
      .attr("y", (d) => y(d.label) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("font-size", 12)
      .attr("fill", "#6b7280")
      .text((d) => d.value);
  }, [data, limit, color]);

  return (
    <div className="chart-card" ref={containerRef}>
      <h3>{title}</h3>
      {(!data || data.length === 0) ? (
        <p className="chart-empty">No data for the current filters.</p>
      ) : (
        <svg ref={svgRef} />
      )}
    </div>
  );
}