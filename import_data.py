

import argparse
import json
import os
import sys
from datetime import datetime

from pymongo import MongoClient, ASCENDING

DATE_FMT = "%B, %d %Y %H:%M:%S"


# ---------- field cleaners ----------

def clean_str(value):
    """Empty string / None -> None. Otherwise strip whitespace."""
    if value is None:
        return None
    if isinstance(value, str):
        value = value.strip()
        return value if value else None
    return value


def clean_int(value):
   
    if value is None or value == "":
        return None
    return int(value)


def clean_date(value):
   
    value = clean_str(value)
    if value is None:
        return None
    try:
        return datetime.strptime(value, DATE_FMT)
    except ValueError:
        print(f"  ! could not parse date: {value!r}", file=sys.stderr)
        return None


def clean_record(raw):
    return {
        "intensity": clean_int(raw.get("intensity")),
        "likelihood": clean_int(raw.get("likelihood")),
        "relevance": clean_int(raw.get("relevance")),
        "start_year": clean_int(raw.get("start_year")),
        "end_year": clean_int(raw.get("end_year")),
        "impact": clean_int(raw.get("impact")),  # numeric in source despite empty-string default
        "sector": clean_str(raw.get("sector")),
        "topic": clean_str(raw.get("topic")),
        "insight": clean_str(raw.get("insight")),
        "url": clean_str(raw.get("url")),
        "region": clean_str(raw.get("region")),
        "added": clean_date(raw.get("added")),
        "published": clean_date(raw.get("published")),
        "country": clean_str(raw.get("country")),
        "pestle": clean_str(raw.get("pestle")),
        "source": clean_str(raw.get("source")),
        "title": clean_str(raw.get("title")),
    }


# ---------- import ----------

def load_and_clean(path):
    with open(path, encoding="utf-8") as f:
        raw_records = json.load(f)
    print(f"Loaded {len(raw_records)} raw records from {path}")
    cleaned = [clean_record(r) for r in raw_records]
    return cleaned


def import_to_mongo(records, uri, db_name, collection_name):
    client = MongoClient(uri)
    db = client[db_name]
    collection = db[collection_name]

    print(f"Clearing existing '{collection_name}' collection (idempotent re-run)...")
    collection.delete_many({})

    result = collection.insert_many(records)
    print(f"Inserted {len(result.inserted_ids)} documents into {db_name}.{collection_name}")

    print("Creating indexes on filter fields...")
    for field in ["topic", "sector", "region", "pestle", "source", "country", "end_year"]:
        collection.create_index([(field, ASCENDING)])
    print("Done.")

    client.close()


def print_summary(records):
    def distinct(field):
        return sorted({r[field] for r in records if r[field] is not None})

    print("\n--- Data summary (for building filter dropdowns) ---")
    for field in ["sector", "region", "pestle", "topic"]:
        vals = distinct(field)
        print(f"{field}: {len(vals)} distinct values")
    print(f"end_year range: {min(distinct('end_year'), default='n/a')} - {max(distinct('end_year'), default='n/a')}")
    print(f"country: {len(distinct('country'))} distinct values")
    print(f"source: {len(distinct('source'))} distinct values")
    print("Note: dataset has no 'city' or 'swot' fields.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", default="jsondata.json", help="Path to jsondata.json")
    parser.add_argument("--uri", default=os.environ.get("MONGO_URI", "mongodb://localhost:27017"))
    parser.add_argument("--db", default=os.environ.get("MONGO_DB", "dashboard"))
    parser.add_argument("--collection", default=os.environ.get("MONGO_COLLECTION", "insights"))
    args = parser.parse_args()

    records = load_and_clean(args.file)
    print_summary(records)
    import_to_mongo(records, args.uri, args.db, args.collection)


if __name__ == "__main__":
    main()
