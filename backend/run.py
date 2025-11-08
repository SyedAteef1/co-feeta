#!/usr/bin/env python3
"""
Feeta Backend Server
Main entry point for the application
"""
from app import create_app

# Create Flask app using factory pattern
app = create_app()

if __name__ == "__main__":
    # Run with HTTP for development (no SSL certificate errors)
    # For production, use a proper WSGI server like Gunicorn with HTTPS
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
        # SSL removed for easier development - no certificate errors
    )
