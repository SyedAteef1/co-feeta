"""
Demo Booking API
Handles demo booking requests
"""
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
demo_bp = Blueprint('demo', __name__)

@demo_bp.route('/book', methods=['POST'])
@cross_origin()
def book_demo():
    """Store demo booking request"""
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        company = data.get('company', '')
        team_size = data.get('teamSize')
        
        if not name or not email or not team_size:
            return jsonify({'error': 'Name, email, and team size are required'}), 400
        
        from app.database.mongodb import db
        demo_bookings = db['demo_bookings']
        
        booking = {
            'name': name,
            'email': email,
            'company': company,
            'team_size': team_size,
            'created_at': datetime.utcnow(),
            'status': 'pending'
        }
        
        result = demo_bookings.insert_one(booking)
        logger.info(f"Demo booking created: {email}")
        
        return jsonify({
            'success': True,
            'message': 'Demo booking received successfully',
            'booking_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating demo booking: {str(e)}")
        return jsonify({'error': 'Failed to book demo'}), 500
