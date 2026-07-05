

import sys
import certifi  
from pymongo import MongoClient

if len(sys.argv) < 2:
    print("Usage: python test_connection.py \"your-mongo-uri\"")
    sys.exit(1)

uri = sys.argv[1]

print(f"pymongo will use certifi bundle at: {certifi.where()}")
print("Attempting connection...")

try:
    client = MongoClient(uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=10000)
    info = client.admin.command("ping")
    print("SUCCESS:", info)
    print("Databases:", client.list_database_names())
except Exception as e:
    print("FAILED")
    print(type(e).__name__, "-", e)