import { useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import FilterBar from "../components/FilterBar";
import YearTrendChart from "../components/charts/YearTrendChart";
import BarChart from "../components/charts/BarChart";
import ScatterChart from "../components/charts/ScatterChart";

const EMPTY_FILTERS = {
  end_year: null,
  topic: [],
  sector: [],
  region: [],
  pestle: [],
  source: [],
  country: [],
};

export default function Dashboard() {
  const [filterOptions, setFilterOptions] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [yearData, setYearData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [topicData, setTopicData] = useState([]);
  const [regionData, setRegionData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load filter dropdown options once on mount.
  useEffect(() => {
    api
      .getFilters()
      .then(setFilterOptions)
      .catch((err) => setError(err.message));
  }, []);

  const loadChartData = useCallback(async (currentFilters) => {
    setLoading(true);
    setError(null);
    try {
      const [byYear, byCountry, byTopic, byRegion, records] = await Promise.all([
        api.getByYear(currentFilters),
        api.getByCountry(currentFilters),
        api.getByTopic(currentFilters),
        api.getByRegion(currentFilters),
        api.getInsights(currentFilters),
      ]);
      setYearData(byYear);
      setCountryData(byCountry.map((d) => ({ label: d.country, value: d.count })));
      setTopicData(byTopic.map((d) => ({ label: d.topic, value: d.count })));
      setRegionData(byRegion.map((d) => ({ label: d.region, value: d.count })));
      setInsights(records);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch every chart whenever filters change.
  useEffect(() => {
    loadChartData(filters);
  }, [filters, loadChartData]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Insights dashboard</h1>
        <p>Intensity, likelihood, and relevance across {insights.length} filtered records</p>
      </header>

      <div className="dashboard-body">
        <FilterBar
          options={filterOptions}
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(EMPTY_FILTERS)}
        />

        <main className="dashboard-main">
          {error && <p className="error-banner">{error}</p>}
          {loading && <p className="loading-banner">Loading…</p>}

          <div className="chart-grid">
            <YearTrendChart data={yearData} title="Intensity, likelihood & relevance by year" />
            <ScatterChart data={insights} title="Intensity vs likelihood" />
            <BarChart data={countryData} title="Top countries by record count" color="#2563eb" />
            <BarChart data={topicData} title="Top topics by record count" color="#16a34a" />
            <BarChart data={regionData} title="Records by region" color="#dc2626" />
          </div>
        </main>
      </div>
    </div>
  );
}