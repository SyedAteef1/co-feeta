"""
Follow-up Test API
Handles the follow-up test toggle functionality
"""
import logging
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import threading
import time
import jwt
import os
import requests

logger = logging.getLogger(__name__)

followup_bp = Blueprint('followup', __name__)
JWT_SECRET = os.getenv('FLASK_SECRET', 'change_this_secret')

# Global state for follow-up test
followup_state = {
    'active': False,
    'thread': None,
    'user_id': None,
    'channel_id': None
}

def get_token_for_user(user_id):
    """Get Slack token for user"""
    try:
        from app.database.mongodb import db
        tokens_collection = db['slack_tokens']
        token_doc = tokens_collection.find_one({"user_id": user_id})
        return token_doc
    except Exception as e:
        logger.error(f"❌ Error getting token: {str(e)}")
        return None

def send_message_to_slack(slack_token, channel_id, message):
    """Send message to Slack channel"""
    try:
        # Join channel first
        join_url = "https://slack.com/api/conversations.join"
        join_headers = {"Authorization": f"Bearer {slack_token}", "Content-Type": "application/json"}
        join_payload = {"channel": channel_id}
        requests.post(join_url, headers=join_headers, json=join_payload, timeout=5)
        
        # Send message
        url = "https://slack.com/api/chat.postMessage"
        headers = {"Authorization": f"Bearer {slack_token}", "Content-Type": "application/json"}
        payload = {"channel": channel_id, "text": message}
        
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        data = response.json()
        
        if data.get("ok"):
            logger.info(f"✅ Message sent to Slack: {message}")
            return True
        else:
            logger.error(f"❌ Failed to send message: {data.get('error')}")
            return False
    except Exception as e:
        logger.error(f"❌ Error sending to Slack: {str(e)}")
        return False

def send_followup_message():
    """Send follow-up test message every 10 seconds"""
    while followup_state['active']:
        user_id = followup_state.get('user_id')
        channel_id = followup_state.get('channel_id')
        
        if user_id and channel_id:
            token_info = get_token_for_user(user_id)
            if token_info:
                slack_token = token_info.get("bot_token") or token_info.get("access_token")
                send_message_to_slack(slack_token, channel_id, "follow up test")
        
        time.sleep(10)

@followup_bp.route('/toggle', methods=['POST'])
@cross_origin()
def toggle_followup():
    """Toggle the follow-up test on/off"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'No authorization provided'}), 401
    
    try:
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        body = request.get_json()
        channel_id = body.get('channel_id')
        
        if not channel_id:
            return jsonify({'error': 'channel_id is required'}), 400
        
        current_state = followup_state['active']
        
        if current_state:
            # Turn off
            followup_state['active'] = False
            if followup_state['thread'] and followup_state['thread'].is_alive():
                followup_state['thread'].join(timeout=1)
            logger.info("🔴 Follow-up test stopped")
            return jsonify({
                'success': True,
                'active': False,
                'message': 'Follow-up test stopped'
            })
        else:
            # Turn on
            followup_state['active'] = True
            followup_state['user_id'] = user_id
            followup_state['channel_id'] = channel_id
            followup_state['thread'] = threading.Thread(target=send_followup_message, daemon=True)
            followup_state['thread'].start()
            logger.info("🟢 Follow-up test started")
            return jsonify({
                'success': True,
                'active': True,
                'message': 'Follow-up test started - sending every 10 seconds'
            })
            
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"❌ Error toggling follow-up test: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@followup_bp.route('/status', methods=['GET'])
@cross_origin()
def get_followup_status():
    """Get current follow-up test status"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'active': False})
    
    try:
        token = auth_header.replace('Bearer ', '')
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return jsonify({'active': followup_state['active']})
    except:
        return jsonify({'active': False})
