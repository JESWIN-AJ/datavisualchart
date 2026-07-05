"""
MongoDB connection, shared across the app.

Reads connection settings from environment variables so the same code
works locally and when deployed:
    MONGO_URI        (default: mongodb://localhost:27017)
    MONGO_DB         (default: dashboard)
    MONGO_COLLECTION (default: insights)
"""

import os
import certifi
from dotenv import load_dotenv
from pymongo import MongoClient

# Loads variables from a .env file (in the same folder as this script)
# into os.environ, if that file exists. If you use $env:MONGO_URI in
# PowerShell instead, that still works too — this just adds a second,
# more permanent way to set the same variable.
load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.environ.get("MONGO_DB", "dashboard")
MONGO_COLLECTION = os.environ.get("MONGO_COLLECTION", "insights")

# tlsCAFile=certifi.where() fixes a common Windows issue where Python's
# default root certificates are outdated and the TLS handshake with
# Atlas fails with "TLSV1_ALERT_INTERNAL_ERROR".
client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client[MONGO_DB]
insights_collection = db[MONGO_COLLECTION]