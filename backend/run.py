#!/usr/bin/env python3
"""
Feeta Backend Server
Main entry point for the application
"""
from app import create_app

# Create Flask app using factory pattern
app = create_app()

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True,
        ssl_context='adhoc'
    )