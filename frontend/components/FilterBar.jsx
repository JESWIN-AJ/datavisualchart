/**
 * Filter controls for the dashboard. `options` comes from GET /api/filters
 * (distinct values already in the database, not hardcoded). `filters` and
 * `onChange` implement a controlled-component pattern — the parent page
 * owns filter state and re-fetches chart data whenever it changes.
 */
export default function FilterBar({ options, filters, onChange, onReset }) {
  if (!options) {
    return <aside className="filter-bar"><p>Loading filters…</p></aside>;
  }

  const handleMultiChange = (field) => (e) => {
    const values = Array.from(e.target.selectedOptions, (opt) => opt.value);
    onChange({ ...filters, [field]: values });
  };

  const handleSingleChange = (field) => (e) => {
    const value = e.target.value;
    onChange({ ...filters, [field]: value === "" ? null : Number(value) });
  };

  const multiSelects = [
    { field: "topic", label: "Topics", items: options.topic },
    { field: "sector", label: "Sector", items: options.sector },
    { field: "region", label: "Region", items: options.region },
    { field: "pestle", label: "PEST", items: options.pestle },
    { field: "source", label: "Source", items: options.source },
    { field: "country", label: "Country", items: options.country },
  ];

  return (
    <aside className="filter-bar">
      <div className="filter-header">
        <h2>Filters</h2>
        <button className="reset-btn" onClick={onReset}>Reset</button>
      </div>

      <div className="filter-group">
        <label htmlFor="end_year">End year</label>
        <select id="end_year" value={filters.end_year ?? ""} onChange={handleSingleChange("end_year")}>
          <option value="">All years</option>
          {options.end_year.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {multiSelects.map(({ field, label, items }) => (
        <div className="filter-group" key={field}>
          <label htmlFor={field}>{label} ({items.length})</label>
          <select
            id={field}
            multiple
            size={Math.min(items.length, 6)}
            value={filters[field] || []}
            onChange={handleMultiChange(field)}
          >
            {items.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      ))}
      <p className="filter-hint">Ctrl/Cmd-click to select multiple values in a list.</p>
    </aside>
  );
}