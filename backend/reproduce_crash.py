import sys
import os
from flask import Flask
from datetime import datetime, timedelta

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from app.api.analytics import analytics_bp
    from app.database.mongodb import init_db, get_db
    
    app = Flask(__name__)
    app.register_blueprint(analytics_bp)
    
    # Mock DB
    class MockDB:
        def __getattr__(self, name):
            return self
        def insert_one(self, data):
            print(f"Inserted: {data}")
        def find(self, *args, **kwargs):
            return self
        def sort(self, *args, **kwargs):
            return self
        def limit(self, *args, **kwargs):
            return []
        def count_documents(self, *args, **kwargs):
            return 0
        def aggregate(self, *args, **kwargs):
            return []

    # Patch get_db to return MockDB if real one fails
    import app.api.analytics
    app.api.analytics.get_db = lambda: MockDB()

    print("Testing /analytics/founder...")
    with app.test_client() as client:
        try:
            resp = client.get('/analytics/founder')
            print(f"Response status: {resp.status_code}")
            print(f"Response data: {resp.get_data(as_text=True)}")
        except Exception as e:
            print(f"CRASHED: {e}")
            import traceback
            traceback.print_exc()

except Exception as e:
    print(f"Import/Setup Error: {e}")
    import traceback
    traceback.print_exc()
