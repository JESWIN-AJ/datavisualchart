"""
Endpoints for the dashboard:

    GET /api/insights          filtered raw records
    GET /api/filters           distinct values for every filter dropdown
    GET /api/aggregate/by-year        avg intensity/likelihood/relevance per end_year
    GET /api/aggregate/by-country     count + avg intensity per country
    GET /api/aggregate/by-topic       count per topic
    GET /api/aggregate/by-region      count + avg intensity per region
"""

from typing import List, Optional

from fastapi import APIRouter, Query

from database import insights_collection

router = APIRouter()


def serialize(doc):
    doc["_id"] = str(doc["_id"])
    return doc


def build_filter_query(end_year, topic, sector, region, pestle, source, country):
    """Build a MongoDB query dict from the filter params the frontend sends.
    Every filter is optional and additive (AND'ed together). List-type
    filters (topic, sector, ...) match any value in the list ($in) since
    the dashboard should support multi-select dropdowns."""
    query = {}
    if end_year is not None:
        query["end_year"] = end_year
    if topic:
        query["topic"] = {"$in": topic}
    if sector:
        query["sector"] = {"$in": sector}
    if region:
        query["region"] = {"$in": region}
    if pestle:
        query["pestle"] = {"$in": pestle}
    if source:
        query["source"] = {"$in": source}
    if country:
        query["country"] = {"$in": country}
    return query


@router.get("/insights")
def get_insights(
    end_year: Optional[int] = None,
    topic: Optional[List[str]] = Query(None),
    sector: Optional[List[str]] = Query(None),
    region: Optional[List[str]] = Query(None),
    pestle: Optional[List[str]] = Query(None),
    source: Optional[List[str]] = Query(None),
    country: Optional[List[str]] = Query(None),
    limit: int = 1000,
):
    """Returns raw filtered records. The frontend can feed these straight
    into D3 for record-level charts (e.g. intensity vs likelihood scatter)."""
    query = build_filter_query(end_year, topic, sector, region, pestle, source, country)
    docs = insights_collection.find(query).limit(limit)
    return [serialize(d) for d in docs]


@router.get("/filters")
def get_filters():
    """Distinct values for every filter dropdown. Call this once on page
    load to populate the sidebar controls dynamically instead of
    hardcoding option lists in the frontend."""
    def distinct(field):
        values = insights_collection.distinct(field, {field: {"$ne": None}})
        return sorted(values)

    end_years = distinct("end_year")
    return {
        "topic": distinct("topic"),
        "sector": distinct("sector"),
        "region": distinct("region"),
        "pestle": distinct("pestle"),
        "source": distinct("source"),
        "country": distinct("country"),
        "end_year": end_years,
        "end_year_range": {
            "min": min(end_years) if end_years else None,
            "max": max(end_years) if end_years else None,
        },
    }


@router.get("/aggregate/by-year")
def aggregate_by_year(
    topic: Optional[List[str]] = Query(None),
    sector: Optional[List[str]] = Query(None),
    region: Optional[List[str]] = Query(None),
    pestle: Optional[List[str]] = Query(None),
    source: Optional[List[str]] = Query(None),
    country: Optional[List[str]] = Query(None),
):
    """Average intensity/likelihood/relevance grouped by end_year.
    Feeds a line/trend chart. Records with no end_year are excluded
    since they can't be placed on a year axis."""
    match = build_filter_query(None, topic, sector, region, pestle, source, country)
    match["end_year"] = {"$ne": None}

    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": "$end_year",
            "avg_intensity": {"$avg": "$intensity"},
            "avg_likelihood": {"$avg": "$likelihood"},
            "avg_relevance": {"$avg": "$relevance"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]
    results = list(insights_collection.aggregate(pipeline))
    return [
        {
            "year": r["_id"],
            "avg_intensity": round(r["avg_intensity"], 2) if r["avg_intensity"] is not None else None,
            "avg_likelihood": round(r["avg_likelihood"], 2) if r["avg_likelihood"] is not None else None,
            "avg_relevance": round(r["avg_relevance"], 2) if r["avg_relevance"] is not None else None,
            "count": r["count"],
        }
        for r in results
    ]


@router.get("/aggregate/by-country")
def aggregate_by_country(
    end_year: Optional[int] = None,
    topic: Optional[List[str]] = Query(None),
    sector: Optional[List[str]] = Query(None),
    region: Optional[List[str]] = Query(None),
    pestle: Optional[List[str]] = Query(None),
    source: Optional[List[str]] = Query(None),
):
    """Count + average intensity per country. Feeds a bar chart or map.
    Records with no country are excluded."""
    match = build_filter_query(end_year, topic, sector, region, pestle, source, None)
    match["country"] = {"$ne": None}

    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": "$country",
            "count": {"$sum": 1},
            "avg_intensity": {"$avg": "$intensity"},
        }},
        {"$sort": {"count": -1}},
    ]
    results = list(insights_collection.aggregate(pipeline))
    return [
        {
            "country": r["_id"],
            "count": r["count"],
            "avg_intensity": round(r["avg_intensity"], 2) if r["avg_intensity"] is not None else None,
        }
        for r in results
    ]


@router.get("/aggregate/by-topic")
def aggregate_by_topic(
    end_year: Optional[int] = None,
    sector: Optional[List[str]] = Query(None),
    region: Optional[List[str]] = Query(None),
    pestle: Optional[List[str]] = Query(None),
    source: Optional[List[str]] = Query(None),
    country: Optional[List[str]] = Query(None),
):
    """Count per topic. Feeds a bar chart or word-cloud-style visual."""
    match = build_filter_query(end_year, None, sector, region, pestle, source, country)
    match["topic"] = {"$ne": None}

    pipeline = [
        {"$match": match},
        {"$group": {"_id": "$topic", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    results = list(insights_collection.aggregate(pipeline))
    return [{"topic": r["_id"], "count": r["count"]} for r in results]


@router.get("/aggregate/by-region")
def aggregate_by_region(
    end_year: Optional[int] = None,
    topic: Optional[List[str]] = Query(None),
    sector: Optional[List[str]] = Query(None),
    pestle: Optional[List[str]] = Query(None),
    source: Optional[List[str]] = Query(None),
    country: Optional[List[str]] = Query(None),
):
    """Count + average intensity per region. Feeds a bar chart."""
    match = build_filter_query(end_year, topic, sector, None, pestle, source, country)
    match["region"] = {"$ne": None}

    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": "$region",
            "count": {"$sum": 1},
            "avg_intensity": {"$avg": "$intensity"},
        }},
        {"$sort": {"count": -1}},
    ]
    results = list(insights_collection.aggregate(pipeline))
    return [
        {
            "region": r["_id"],
            "count": r["count"],
            "avg_intensity": round(r["avg_intensity"], 2) if r["avg_intensity"] is not None else None,
        }
        for r in results
    ]