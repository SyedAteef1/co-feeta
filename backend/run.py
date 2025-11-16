#!/usr/bin/env python3
"""
Feeta Backend Server
Main entry point for the application
"""
import os
from app import create_app

# Create Flask app using factory pattern
app = create_app()

if __name__ == "__main__":
    # Use PORT from environment (Render provides this) or default to 5000
    port = int(os.environ.get("PORT", 5000))
    
    # For production (Render), don't use SSL context or debug
    is_production = os.environ.get("BASE_URL", "").startswith("https://co-feeta.onrender.com")
    
    if is_production:
        app.run(
            host="0.0.0.0",
            port=port,
            debug=False
        )
    else:
        app.run(
            host="0.0.0.0",
            port=port,
            debug=True,
            ssl_context='adhoc'
        )