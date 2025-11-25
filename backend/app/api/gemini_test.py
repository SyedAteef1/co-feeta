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
    """Test Gemini API with custom prompt using Vertex AI SDK"""
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
        
        logger.info("🔧 API Method: VERTEX AI SDK (GenerativeModel)")
        
        try:
            import vertexai
            from vertexai.generative_models import GenerativeModel
            from google.oauth2 import service_account
            import json
            
            # Initialize Vertex AI
            GCP_PROJECT_ID = os.getenv('GCP_PROJECT_ID', 'your-project-id')
            GCP_LOCATION = os.getenv('GCP_LOCATION', 'us-central1')
            GCP_CREDENTIALS_JSON = os.getenv('GCP_CREDENTIALS_JSON')
            
            credentials = None
            if GCP_CREDENTIALS_JSON:
                creds_dict = json.loads(GCP_CREDENTIALS_JSON)
                credentials = service_account.Credentials.from_service_account_info(creds_dict)
            
            vertexai.init(project=GCP_PROJECT_ID, location=GCP_LOCATION, credentials=credentials)
            
            model = GenerativeModel('gemini-2.0-flash-exp')
            response = model.generate_content(
                prompt,
                generation_config={'temperature': 0.7, 'max_output_tokens': 2048}
            )
            
            text = response.text
            
            return jsonify({
                'success': True,
                'response': text
            })
            
        except Exception as e:
            logger.error(f"Vertex AI Error: {str(e)}")
            return jsonify({'success': False, 'error': str(e)}), 500
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"Error testing Gemini: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
