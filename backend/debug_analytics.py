import sys
import os
from datetime import datetime, timedelta
from app import create_app
from app.database.mongodb import get_db

# Ensure we are in the backend directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = create_app()

print("\n--- Debugging Analytics Data ---")

with app.app_context():
    db = get_db()
    
    # 1. Check Collection Count
    count = db.site_visits.count_documents({})
    print(f"Total visits in DB: {count}")
    
    # 2. Check Recent Visits (Last 24h)
    now = datetime.utcnow()
    last_24h = now - timedelta(hours=24)
    recent_count = db.site_visits.count_documents({'timestamp': {'$gte': last_24h}})
    print(f"Visits in last 24h: {recent_count}")
    
    # 3. Insert Test Data
    print("Inserting test visit...")
    test_visit = {
        'path': '/debug-test',
        'referrer': 'DebugScript',
        'duration': 120,
        'timestamp': datetime.utcnow(),
        'user_agent': 'Python Debugger',
        'ip': '127.0.0.1'
    }
    db.site_visits.insert_one(test_visit)
    print("Test visit inserted.")
    
    # 4. Verify Count Increased
    new_count = db.site_visits.count_documents({})
    print(f"New total visits: {new_count}")
    
    # 5. Test Aggregation Logic (Simulate /analytics/founder)
    print("Testing aggregation logic...")
    pipeline_pages = [
        {'$match': {'timestamp': {'$gte': last_24h}}}, # Changed to 24h for immediate visibility
        {'$group': {'_id': '$path', 'count': {'$sum': 1}, 'avg_duration': {'$avg': '$duration'}}},
        {'$sort': {'count': -1}},
        {'$limit': 10}
    ]
    top_pages = list(db.site_visits.aggregate(pipeline_pages))
    print(f"Top Pages (Last 24h): {top_pages}")
