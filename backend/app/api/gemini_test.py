"""
Gemini Test API
Test endpoint for Gemini prompts
"""
import logging
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import jwt
import os
import requests

logger = logging.getLogger(__name__)

gemini_test_bp = Blueprint('gemini_test', __name__)
JWT_SECRET = os.getenv('FLASK_SECRET', 'change_this_secret')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Store chat sessions per user
chat_sessions = {}

@gemini_test_bp.route('/ping', methods=['GET'])
def ping():
    """Simple ping endpoint to test deployment"""
    return jsonify({
        'status': 'ok',
        'message': 'Feeta API is running!',
        'gemini_configured': bool(GEMINI_API_KEY)
    }), 200

@gemini_test_bp.route('/test-gemini', methods=['POST'])
@cross_origin()
def test_gemini():
    """Test Gemini API with custom prompt"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization provided'}), 401
    
    try:
        token = auth_header.replace('Bearer ', '')
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        body = request.get_json()
        prompt = body.get('prompt')
        history = body.get('history', [])
        
        if not prompt:
            return jsonify({'error': 'prompt is required'}), 400
        
        if not GEMINI_API_KEY:
            return jsonify({'error': 'GEMINI_API_KEY not configured'}), 500
        
        # Build contents with history
        contents = []
        for msg in history:
            contents.append({
                'role': msg['role'],
                'parts': [{'text': msg['content']}]
            })
        contents.append({'parts': [{'text': prompt}]})
        
        logger.info("🔧 API Method: GENERATIVE AI REST API (Direct HTTP)")
        logger.info("🔑 Using GEMINI_API_KEY for authentication")
        api_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
        
        response = requests.post(
            api_url,
            headers={'Content-Type': 'application/json'},
            params={'key': GEMINI_API_KEY},
            json={
                'contents': contents,
                'generationConfig': {'temperature': 0.7, 'maxOutputTokens': 2048}
            },
            timeout=30
        )
        
        data = response.json()
        
        if 'error' in data:
            error_msg = data['error'].get('message', 'Unknown error')
            logger.error(f"Gemini API Error: {error_msg}")
            return jsonify({'success': False, 'error': error_msg}), 500
        
        if 'candidates' not in data or not data['candidates']:
            logger.error("No candidates in response")
            return jsonify({'success': False, 'error': 'No response from Gemini'}), 500
        
        text = data['candidates'][0]['content']['parts'][0]['text']
        
        return jsonify({
            'success': True,
            'response': text
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Error testing Gemini: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
