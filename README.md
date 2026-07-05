# Data import — step by step

## 1. Install MongoDB
Easiest path: create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and copy its connection string. (Or run MongoDB locally with `mongod` if you'd rather not use Atlas.)

## 2. Install dependencies
```bash
pip install -r requirements.txt
```

## 3. Put `jsondata.json` next to `import_data.py`
(or pass a path with `--file`)

## 4. Run the import
```bash
python import_data.py --uri "your-mongodb-connection-string" --db dashboard --collection insights
```

This will:
- Load the raw JSON
- Clean every record (see field notes below)
- Print a summary of distinct values per filter field — use this to sanity-check what your frontend dropdowns should show
- Wipe and re-insert into `dashboard.insights` (safe to re-run any time)
- Create indexes on `topic`, `sector`, `region`, `pestle`, `source`, `country`, `end_year` so filtered queries stay fast

## Field cleaning notes (verified against your actual data)
- `intensity`, `likelihood`, `relevance`, `start_year`, `end_year`, `impact` — cast to `int`, or `null` if the source had `""` (38 rows for intensity/likelihood, 1 for relevance, most rows for start/end_year and impact)
- `added`, `published` — parsed from `"January, 20 2017 03:51:25"` into real `datetime` objects
- All text fields — `.strip()`'d and empty strings converted to `null` (source data has some values like `"UNESCO "` with trailing whitespace)
- **No `city` or `swot` field exists in the source data** — don't build filters for these

## Next step
Once this is imported, the FastAPI backend queries this cleaned collection directly — no cleaning logic needed there.

## Running the API

```bash
pip install -r requirements.txt
cd app
uvicorn main:app --reload
```

Set your Atlas connection string as an environment variable first (same one used for the import):

```bash
# Windows PowerShell
$env:MONGO_URI="mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"

# Mac/Linux
export MONGO_URI="mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
```

Then open http://localhost:8000/docs — FastAPI auto-generates interactive API docs where you can try every endpoint directly in the browser.

### Endpoints
- `GET /api/insights` — filtered raw records (params: `end_year`, `topic`, `sector`, `region`, `pestle`, `source`, `country`)
- `GET /api/filters` — distinct values for every dropdown, call once on page load
- `GET /api/aggregate/by-year` — avg intensity/likelihood/relevance per year, for trend charts
- `GET /api/aggregate/by-country` — count + avg intensity per country, for bar chart/map
- `GET /api/aggregate/by-topic` — count per topic
- `GET /api/aggregate/by-region` — count + avg intensity per region