"""
Slack API Routes
Handles Slack OAuth and messaging
"""
from flask import Blueprint, request, redirect, jsonify, session
import logging
import requests
import json
import re
from urllib.parse import urlencode
from datetime import datetime
from app.config import Config
import jwt
import os

logger = logging.getLogger(__name__)
slack_bp = Blueprint('slack', __name__)
JWT_SECRET = os.getenv('FLASK_SECRET', 'change_this_secret')

tokens_collection = None

def get_tokens_collection():
    """Get tokens collection (lazy initialization)"""
    global tokens_collection
    if tokens_collection is None:
        from app.database.mongodb import db
        tokens_collection = db['slack_tokens']
        tokens_collection.create_index([("user_id", 1)], unique=True)
    return tokens_collection

def save_token(user_id, team_id, access_token, scope, bot_token=None):
    """Save Slack token to database linked to authenticated user"""
    try:
        collection = get_tokens_collection()
        collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "team_id": team_id,
                    "access_token": access_token,
                    "scope": scope,
                    "bot_token": bot_token,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        logger.info(f"✅ Slack token saved for user {user_id}")
        return True
    except Exception as e:
        logger.error(f"❌ Error saving token: {str(e)}")
        return False

def get_token_for_user(user_id):
    """Get Slack token for user"""
    try:
        collection = get_tokens_collection()
        token_doc = collection.find_one({"user_id": user_id})
        return token_doc
    except Exception as e:
        logger.error(f"❌ Error getting token: {str(e)}")
        return None

@slack_bp.route("/install", methods=["GET"])
def slack_install():
    """Initiate Slack OAuth flow"""
    logger.info("="*60)
    logger.info("=== SLACK INSTALL INITIATED ===")
    
    # Get JWT token from query parameter
    token = request.args.get("token")
    if not token:
        return jsonify({"error": "No authentication token provided"}), 401
    
    try:
        # Verify JWT and extract user_id
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        # Store user_id in session for callback
        session['pending_slack_user_id'] = user_id
        session['auth_token'] = token
        
        logger.info(f"Slack OAuth initiated for user: {user_id}")
        
        # Generate state for CSRF protection
        import secrets
        state = secrets.token_hex(8)
        session['slack_state'] = state
        
        params = {
            "client_id": Config.SLACK_CLIENT_ID,
            "scope": (
                "app_mentions:read,bookmarks:read,assistant:write,canvases:read,"
                "canvases:write,channels:read,channels:join,groups:read,"
                "channels:history,groups:history,im:history,im:read,mpim:history,"
                "chat:write,users:read,team:read"
            ),
            "redirect_uri": f"{Config.BACKEND_URL}/slack/oauth_redirect",
            "state": state
        }
        
        auth_url = f"https://slack.com/oauth/v2/authorize?{urlencode(params)}"
        logger.info(f"🔗 Redirect to: {auth_url}")
        logger.info("="*60)
        
        return redirect(auth_url)
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401

@slack_bp.route("/oauth_redirect", methods=["GET"])
def slack_oauth_redirect():
    """Handle Slack OAuth callback"""
    logger.info("="*60)
    logger.info("=== OAUTH REDIRECT RECEIVED ===")
    
    code = request.args.get("code")
    error = request.args.get("error")
    state = request.args.get("state")
    
    if error:
        logger.error(f"❌ OAuth error: {error}")
        return redirect(f"{Config.FRONTEND_URL}/slack?error={error}")
    
    if not code:
        logger.error("❌ No authorization code received")
        return redirect(f"{Config.FRONTEND_URL}/slack?error=no_code")
    
    # Verify state to prevent CSRF
    if state != session.get('slack_state'):
        logger.error("State mismatch - possible CSRF attack")
        return redirect(f"{Config.FRONTEND_URL}/slack?error=invalid_state")
    
    # Get the authenticated user_id from session
    user_id = session.get('pending_slack_user_id')
    if not user_id:
        logger.error("No user_id in session")
        return redirect(f"{Config.FRONTEND_URL}/slack?error=session_expired")
    
    logger.info(f"✅ Authorization code received for user: {user_id}")
    
    # Exchange code for token
    try:
        token_url = "https://slack.com/api/oauth.v2.access"
        data = {
            "client_id": Config.SLACK_CLIENT_ID,
            "client_secret": Config.SLACK_CLIENT_SECRET,
            "code": code,
            "redirect_uri": f"{Config.BACKEND_URL}/slack/oauth_redirect"
        }
        
        logger.info("📡 Exchanging code for token...")
        response = requests.post(token_url, data=data)
        result = response.json()
        
        logger.info(f"📦 Token exchange response: {json.dumps(result, indent=2)}")
        
        if not result.get("ok"):
            error_msg = result.get("error", "unknown_error")
            logger.error(f"❌ Token exchange failed: {error_msg}")
            return redirect(f"{Config.FRONTEND_URL}/slack?error={error_msg}")
        
        # Save token to the AUTHENTICATED user
        team_id = result["team"]["id"]
        access_token = result.get("access_token")
        bot_token = result.get("access_token")
        scope = result.get("scope", "")
        
        from datetime import datetime
        save_token(user_id, team_id, access_token, scope, bot_token)
        
        # Clear session
        session.pop('pending_slack_user_id', None)
        session.pop('slack_state', None)
        
        logger.info("✅ Token exchange successful!")
        logger.info(f"👤 User ID: {user_id}")
        logger.info(f"🏢 Team ID: {team_id}")
        logger.info("="*60)
        
        # Redirect back to demodash page with success message
        return redirect(f"{Config.FRONTEND_URL}/demodash?slack_connected=true")
        
    except Exception as e:
        logger.error(f"❌ Exception during token exchange: {str(e)}")
        return redirect(f"{Config.FRONTEND_URL}/slack?error=exchange_failed")

@slack_bp.route("/api/list_conversations", methods=["GET"])
def list_conversations():
    """List Slack conversations for authenticated user"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Get user's JWT token
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        token_info = get_token_for_user(user_id)
        if not token_info:
            return jsonify({"error": "Slack not connected"}), 404
        
        slack_token = token_info.get("bot_token") or token_info.get("access_token")
        
        url = "https://slack.com/api/conversations.list"
        headers = {"Authorization": f"Bearer {slack_token}"}
        params = {"types": "public_channel,private_channel"}
        
        response = requests.get(url, headers=headers, params=params)
        data = response.json()
        
        if not data.get("ok"):
            return jsonify({"error": data.get("error", "unknown")}), 400
        
        channels = data.get("channels", [])
        return jsonify({"channels": channels})
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error listing conversations: {str(e)}")
        return jsonify({"error": str(e)}), 500

@slack_bp.route("/api/status", methods=["GET"])
def slack_status():
    """Check if user has Slack connected"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"connected": False}), 200
    
    try:
        # Get user's JWT token
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        # Check if user has Slack token
        token_info = get_token_for_user(user_id)
        
        if token_info and token_info.get('access_token'):
            logger.info(f"✅ Slack connected for user: {user_id}")
            return jsonify({
                "connected": True,
                "slack_user_id": user_id,
                "team_id": token_info.get('team_id')
            })
        else:
            logger.info(f"❌ Slack not connected for user: {user_id}")
            return jsonify({"connected": False})
            
    except jwt.ExpiredSignatureError:
        return jsonify({"connected": False, "error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"connected": False, "error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error checking Slack status: {str(e)}")
        return jsonify({"connected": False, "error": str(e)}), 500

@slack_bp.route("/api/channel_history", methods=["GET"])
def get_channel_history():
    """Get message history from a Slack channel"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401

    try:
        # Get user's JWT token
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']

        slack_token_doc = get_token_for_user(user_id)
        if not slack_token_doc or not slack_token_doc.get('access_token'):
            return jsonify({"error": "Slack not connected for this user"}), 400
        
        slack_access_token = slack_token_doc['access_token']
        
        channel_id = request.args.get("channel")
        limit = request.args.get("limit", "50")  # Default last 50 messages
        
        if not channel_id:
            return jsonify({"error": "Channel ID required"}), 400

        # Get messages from Slack API
        url = "https://slack.com/api/conversations.history"
        headers = {"Authorization": f"Bearer {slack_access_token}"}
        params = {"channel": channel_id, "limit": limit}
        
        response = requests.get(url, headers=headers, params=params)
        data = response.json()
        
        if data.get("ok"):
            messages = data.get("messages", [])
            
            # Get user info for each message
            user_cache = {}
            enriched_messages = []
            
            for msg in messages:
                user_id_msg = msg.get("user")
                if user_id_msg and user_id_msg not in user_cache:
                    # Fetch user info
                    user_url = "https://slack.com/api/users.info"
                    user_response = requests.get(user_url, headers=headers, params={"user": user_id_msg})
                    user_data = user_response.json()
                    if user_data.get("ok"):
                        user_cache[user_id_msg] = user_data.get("user", {}).get("real_name", "Unknown")
                    else:
                        user_cache[user_id_msg] = "Unknown"
                
                enriched_messages.append({
                    "text": msg.get("text", ""),
                    "user": user_cache.get(msg.get("user"), "Bot"),
                    "timestamp": msg.get("ts", ""),
                    "type": msg.get("type", "message")
                })
            
            return jsonify({"ok": True, "messages": enriched_messages})
        else:
            logger.error(f"❌ Slack API error: {data.get('error')}")
            return jsonify({"error": data.get("error", "Unknown Slack API error")}), 500
            
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error fetching channel history: {str(e)}")
        return jsonify({"error": str(e)}), 500

@slack_bp.route("/api/summarize_channel", methods=["POST"])
def summarize_channel():
    """Generate AI summary of Slack channel messages"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401

    try:
        # Get user's JWT token
        token = auth_header.replace('Bearer ', '')
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        body = request.get_json()
        messages = body.get("messages", [])
        
        if not messages:
            return jsonify({"error": "No messages provided"}), 400

        # Call AI service to generate summary
        from app.services.ai_service import summarize_slack_messages
        
        summary = summarize_slack_messages(messages)
        
        return jsonify({"ok": True, "summary": summary})
            
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error generating summary: {str(e)}")
        return jsonify({"error": str(e)}), 500

@slack_bp.route("/api/send_message", methods=["POST"])
def send_message():
    """Send a message to Slack"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    body = request.get_json()
    channel = body.get("channel")
    text = body.get("text")
    mention_user_id = body.get("mention_user_id")
    
    logger.info("=== SEND MESSAGE REQUEST ===")
    logger.info(f"Channel: {channel}")
    logger.info(f"Message: {text}")
    
    if not channel or not text:
        return jsonify({"error": "channel and text required"}), 400
    
    try:
        # Get user's JWT token
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        token_info = get_token_for_user(user_id)
        if not token_info:
            return jsonify({"error": "Slack not connected"}), 404
        
        slack_token = token_info.get("bot_token") or token_info.get("access_token")
        
        # Join channel first
        try:
            join_url = "https://slack.com/api/conversations.join"
            join_headers = {"Authorization": f"Bearer {slack_token}", "Content-Type": "application/json"}
            join_payload = {"channel": channel}
            requests.post(join_url, headers=join_headers, json=join_payload)
        except Exception as e:
            logger.warning(f"⚠️ Could not join channel: {str(e)}")
        
        # Send message
        final_text = text
        if mention_user_id:
            final_text = f"<@{mention_user_id}> {text}"
        
        url = "https://slack.com/api/chat.postMessage"
        headers = {"Authorization": f"Bearer {slack_token}", "Content-Type": "application/json"}
        payload = {"channel": channel, "text": final_text}
        
        response = requests.post(url, headers=headers, json=payload)
        data = response.json()
        
        logger.info(f"Slack response: {json.dumps(data, indent=2)}")
        
        return jsonify(data)
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error sending message: {str(e)}")
        return jsonify({"error": str(e)}), 500


@slack_bp.route("/events", methods=["POST"])
def slack_events():
    """Handle Slack events including app_mentions"""
    try:
        data = request.get_json()
        
        # URL verification challenge
        if data.get("type") == "url_verification":
            return jsonify({"challenge": data.get("challenge")})
        
        # Handle event callback
        if data.get("type") == "event_callback":
            event = data.get("event", {})
            event_type = event.get("type")
            
            # Handle app_mentions (when Feeta is tagged)
            if event_type == "app_mentions":
                logger.info("🔔 Feeta mentioned in Slack!")
                
                # Get team_id to find the right token
                team_id = data.get("team_id")
                if not team_id:
                    logger.error("No team_id in event")
                    return jsonify({"ok": True})
                
                # Find token by team_id
                collection = get_tokens_collection()
                token_info = collection.find_one({"team_id": team_id})
                
                if not token_info:
                    logger.error(f"No token found for team: {team_id}")
                    return jsonify({"ok": True})
                
                slack_token = token_info.get("bot_token") or token_info.get("access_token")
                user_id_in_db = token_info.get("user_id")  # The user who installed the app
                
                # Get the user who mentioned Feeta
                slack_user_id = event.get("user")
                channel = event.get("channel")
                text = event.get("text", "")
                
                logger.info(f"📢 Channel ID from event: {channel}")
                logger.info(f"👤 User ID: {slack_user_id}")
                logger.info(f"💬 Message text: {text[:100]}...")
                
                # Get bot user ID to filter out bot's own messages
                bot_info_url = "https://slack.com/api/auth.test"
                bot_info_headers = {"Authorization": f"Bearer {slack_token}"}
                bot_info_resp = requests.get(bot_info_url, headers=bot_info_headers, timeout=5)
                bot_info = bot_info_resp.json()
                bot_user_id = bot_info.get("user_id") if bot_info.get("ok") else None
                
                # Skip if the message is from the bot itself
                if slack_user_id == bot_user_id:
                    logger.info("⏭️ Skipping bot's own message")
                    return jsonify({"ok": True})
                
                # Extract question by removing mentions
                # Remove all user mentions like <@U123456>
                question = re.sub(r'<@[^>]+>', '', text).strip()
                # Clean up extra whitespace
                question = ' '.join(question.split())
                
                if not question:
                    question = "Help me with my project"
                
                logger.info(f"👤 User {slack_user_id} asked: {question}")
                
                # Get Slack user info to find email
                try:
                    user_info_url = "https://slack.com/api/users.info"
                    user_info_headers = {"Authorization": f"Bearer {slack_token}"}
                    user_info_params = {"user": slack_user_id}
                    user_info_resp = requests.get(user_info_url, headers=user_info_headers, params=user_info_params, timeout=5)
                    user_info = user_info_resp.json()
                    
                    if not user_info.get("ok"):
                        logger.error(f"Failed to get user info: {user_info.get('error')}")
                        return jsonify({"ok": True})
                    
                    slack_user_email = user_info.get("user", {}).get("profile", {}).get("email")
                    slack_user_name = user_info.get("user", {}).get("real_name") or user_info.get("user", {}).get("name", "User")
                    
                    if not slack_user_email:
                        logger.error("No email found for Slack user")
                        # Still try to help - use the installing user's context
                        event_ts = event.get("ts")
                        handle_mention_with_context(user_id_in_db, slack_token, channel, slack_user_id, question, slack_user_name, event_ts)
                        return jsonify({"ok": True})
                    
                    logger.info(f"📧 Found email: {slack_user_email}")
                    
                    # Find user in database by email
                    from app.database.mongodb import db
                    users_collection = db['users']
                    user = users_collection.find_one({"email": slack_user_email})
                    
                    if not user:
                        logger.warning(f"User not found in database for email: {slack_user_email}")
                        # Send helpful message
                        send_dm_to_user(slack_token, slack_user_id, 
                            f"Hi {slack_user_name}! 👋\n\nI couldn't find your account in Feeta. Please connect your account at the dashboard first.\n\nIf you need help, tag me with your question and I'll do my best!")
                        return jsonify({"ok": True})
                    
                    db_user_id = str(user["_id"])
                    logger.info(f"✅ Found user in database: {db_user_id}")
                    
                    # Handle the mention with user's context (reply in thread)
                    event_ts = event.get("ts")
                    logger.info(f"🔄 Processing mention and will reply in Slack thread (ts: {event_ts})")
                    logger.info("="*60)
                    logger.info("🚀 CALLING handle_mention_with_context")
                    logger.info("="*60)
                    result = handle_mention_with_context(db_user_id, slack_token, channel, slack_user_id, question, slack_user_name, event_ts)
                    logger.info("="*60)
                    logger.info(f"📊 handle_mention_with_context returned: {result}")
                    logger.info("="*60)
                    if not result:
                        logger.error("❌❌❌ handle_mention_with_context returned False - message was NOT sent! ❌❌❌")
                    
                except Exception as e:
                    logger.error(f"❌ Error processing mention: {str(e)}")
                    # Try to send error message
                    try:
                        send_dm_to_user(slack_token, slack_user_id, 
                            "Sorry, I encountered an error processing your request. Please try again later.")
                    except:
                        pass
                
                return jsonify({"ok": True})
        
        return jsonify({"ok": True})
        
    except Exception as e:
        logger.error(f"❌ Error handling Slack event: {str(e)}")
        return jsonify({"ok": True})


def send_message_to_channel(slack_token, channel_id, message, thread_ts=None):
    """Send a message to a Slack channel, optionally as a thread reply"""
    try:
        logger.info("="*80)
        logger.info("="*80)
        logger.info("🚀🚀🚀 send_message_to_channel FUNCTION CALLED 🚀🚀🚀")
        logger.info("="*80)
        logger.info(f"📤 Preparing to send message to channel: {channel_id}")
        logger.info(f"🧵 Thread TS: {thread_ts if thread_ts else 'None (new message)'}")
        logger.info(f"🔑 Slack token present: {bool(slack_token)}")
        logger.info(f"📝 Message length: {len(message)} characters")
        logger.info("="*80)
        
        # Join channel first (required for public channels)
        try:
            join_url = "https://slack.com/api/conversations.join"
            join_headers = {"Authorization": f"Bearer {slack_token}", "Content-Type": "application/json"}
            join_payload = {"channel": channel_id}
            join_response = requests.post(join_url, headers=join_headers, json=join_payload, timeout=5)
            join_data = join_response.json()
            if join_data.get("ok"):
                logger.info(f"✅ Successfully joined channel: {channel_id}")
            else:
                logger.warning(f"⚠️ Could not join channel (may already be in channel): {join_data.get('error')}")
        except Exception as e:
            logger.warning(f"⚠️ Error joining channel: {str(e)}")
        
        # Send message
        url = "https://slack.com/api/chat.postMessage"
        headers = {
            "Authorization": f"Bearer {slack_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "channel": channel_id,
            "text": message,
            "parse": "full"
        }
        
        # Add thread_ts if provided (to reply in thread)
        if thread_ts:
            payload["thread_ts"] = thread_ts
            logger.info(f"💬 Sending as thread reply to message: {thread_ts}")
        else:
            logger.info(f"💬 Sending as new message (not a thread reply)")
        
        logger.info(f"📨 Sending message to Slack API...")
        logger.info(f"🌐 API URL: {url}")
        logger.info(f"📋 Payload: channel={channel_id}, thread_ts={thread_ts}, message_length={len(message)}")
        logger.info(f"🔑 Authorization header present: {bool(headers.get('Authorization'))}")
        logger.info(f"📝 Message preview (first 200 chars): {message[:200]}...")
        
        # Make the actual HTTP request
        logger.info("="*60)
        logger.info("🚀 MAKING HTTP POST REQUEST TO SLACK API")
        logger.info("="*60)
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        logger.info(f"📥 HTTP Response Status Code: {response.status_code}")
        logger.info(f"📥 HTTP Response Headers: {dict(response.headers)}")
        
        data = response.json()
        logger.info(f"📥 Slack API Response JSON: {data}")
        
        # Log the actual API call details
        logger.info("="*60)
        logger.info("📡 SLACK API CALL COMPLETED")
        logger.info(f"   Status: {response.status_code}")
        logger.info(f"   Success: {data.get('ok', False)}")
        if data.get('ts'):
            logger.info(f"   Message TS: {data.get('ts')}")
        if data.get('error'):
            logger.info(f"   Error: {data.get('error')}")
        logger.info("="*60)
        
        if not data.get("ok"):
            error_msg = data.get('error', 'Unknown error')
            logger.error(f"❌ Failed to send message to channel {channel_id}: {error_msg}")
            logger.error(f"❌ Full Slack API response: {data}")
            
            # Try to provide helpful error messages
            if error_msg == "channel_not_found":
                logger.error(f"❌ Channel {channel_id} not found. Make sure the bot is in the channel.")
            elif error_msg == "not_in_channel":
                logger.error(f"❌ Bot is not in channel {channel_id}. Trying to join...")
                # Try joining again
                try:
                    retry_join_url = "https://slack.com/api/conversations.join"
                    retry_join_headers = {"Authorization": f"Bearer {slack_token}", "Content-Type": "application/json"}
                    retry_join_payload = {"channel": channel_id}
                    join_response = requests.post(retry_join_url, headers=retry_join_headers, json=retry_join_payload, timeout=5)
                    join_data = join_response.json()
                    if join_data.get("ok"):
                        logger.info("✅ Successfully joined channel, retrying message send...")
                        # Retry sending
                        retry_response = requests.post(url, headers=headers, json=payload, timeout=10)
                        retry_data = retry_response.json()
                        if retry_data.get("ok"):
                            logger.info(f"✅ Message sent successfully after joining! Channel: {channel_id}, TS: {retry_data.get('ts')}")
                            return True
                except Exception as retry_error:
                    logger.error(f"❌ Retry failed: {str(retry_error)}")
            
            return False
        
        logger.info(f"✅✅✅ Message sent successfully! Channel: {channel_id}, TS: {data.get('ts')}")
        logger.info(f"✅ Message will appear in Slack channel: {channel_id}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error sending message to channel {channel_id}: {str(e)}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        return False


def handle_mention_with_context(user_id, slack_token, channel, slack_user_id, question, user_name, thread_ts=None):
    """Handle mention by analyzing user's tasks, repos, and providing solution"""
    try:
        logger.info("="*60)
        logger.info("🚀 FEETA MENTION PROCESSING STARTED")
        logger.info("="*60)
        logger.info(f"👤 User: {user_name} (ID: {user_id})")
        logger.info(f"❓ Question: {question}")
        logger.info(f"📢 Channel ID: {channel} (will send reply here)")
        logger.info(f"🔍 Analyzing context for user: {user_id}")
        
        # Get user's projects
        from app.database.mongodb import db, get_user_projects, get_project_tasks
        from app.services.ai_service import create_deep_project_context
        from bson import ObjectId
        
        users_collection = db['users']
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            logger.error("❌ User not found in database")
            return False
        
        github_token = user.get('github_token')
        if not github_token:
            logger.warning("⚠️ No GitHub token found for user")
            send_dm_to_user(slack_token, slack_user_id,
                f"Hi {user_name}! 👋\n\nI need GitHub to be connected to analyze your repositories. Please connect GitHub in your dashboard first.")
            return False
        
        # Get all projects for user
        projects = get_user_projects(user_id)
        
        if not projects:
            logger.warning("⚠️ No projects found for user")
            send_dm_to_user(slack_token, slack_user_id,
                f"Hi {user_name}! 👋\n\nYou don't have any projects yet. Create a project in your dashboard and connect repositories to get started!")
            return False
        
        # Build comprehensive context
        project_context = ""
        tasks_context = ""
        
        # Analyze repos from all projects
        all_repos = []
        for project in projects[:3]:  # Limit to 3 projects
            repos = project.get('repos', [])
            for repo in repos[:2]:  # Limit to 2 repos per project
                if repo not in all_repos:
                    all_repos.append(repo)
        
        logger.info(f"📦 Analyzing {len(all_repos)} repositories for context...")
        for repo in all_repos:
            try:
                full_name = repo.get('full_name') or repo.get('name', '')
                if '/' in full_name:
                    owner, repo_name = full_name.split('/', 1)
                    logger.info(f"🔍 Analyzing repository {owner}/{repo_name} to include in LLM context...")
                    context = create_deep_project_context(owner, repo_name, github_token)
                    project_context += f"\n\n=== Repository: {full_name} ===\n{context}\n"
                    logger.info(f"✅ Repository context added for {full_name}")
            except Exception as e:
                logger.error(f"❌ Error analyzing repo {repo.get('name')}: {str(e)}")
                continue
        
        # Get tasks from all projects
        all_tasks = []
        for project in projects:
            project_id = str(project.get('_id', ''))
            tasks = get_project_tasks(project_id)
            all_tasks.extend(tasks[:5])  # Limit to 5 tasks per project
        
        if all_tasks:
            tasks_context = "\n\n=== Your Active Tasks ===\n"
            for task in all_tasks[:15]:  # Limit to 15 tasks total
                status = task.get('status', 'unknown')
                if status in ['in_progress', 'approved', 'pending_approval', 'pending']:
                    tasks_context += f"- {task.get('title', 'Untitled')}: {task.get('description', '')[:100]}\n"
                    if task.get('assigned_to') and task.get('assigned_to') != 'Unassigned':
                        tasks_context += f"  (Assigned to: {task.get('assigned_to')})\n"
        
        # Build AI prompt
        full_context = f"""USER CONTEXT:
{project_context}

{tasks_context}

USER QUESTION FROM SLACK:
{question}

You are Feeta AI, an expert developer assistant. The user has tagged you in Slack with a question about their project.

**IMPORTANT INSTRUCTIONS:**
1. Analyze the user's question in the context of their repositories and active tasks above
2. **ALWAYS reference specific files, modules, or code sections from their repositories** when providing solutions
3. Use the repository context (project summary, tech stack, architecture, key modules) to provide accurate, project-specific answers
4. Consider their current tasks and workload when suggesting solutions
5. Provide clear, step-by-step guidance with actionable steps
6. Include code examples that match their tech stack and repository structure
7. If the question relates to a specific file or module mentioned in the repository context, reference it directly

**Response Format:**
- Start with a brief acknowledgment
- Provide a clear analysis of the problem
- Give step-by-step solution with specific file/module references
- Include code examples if relevant (matching their tech stack)
- End with any additional tips or considerations

Format your response in a friendly, helpful tone suitable for Slack. Be concise but thorough. Reference actual repository files and code when possible."""
        
        # Call AI service
        logger.info("="*60)
        logger.info("🤖 SENDING TO LLM WITH FULL CONTEXT")
        logger.info("="*60)
        logger.info(f"📝 Question: {question}")
        logger.info(f"📚 Repository context: {len(project_context)} characters")
        logger.info(f"📋 Tasks context: {len(tasks_context)} characters")
        logger.info(f"📊 Total context size: {len(full_context)} characters")
        logger.info("🔄 Calling Gemini LLM API...")
        import os
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            logger.error("❌ GEMINI_API_KEY not configured")
            send_dm_to_user(slack_token, slack_user_id, "Sorry, AI service is not configured.")
            return False
        
        api_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
        headers = {'Content-Type': 'application/json'}
        payload = {
            "contents": [{
                "parts": [{"text": full_context}]
            }]
        }
        params = {'key': api_key}
        
        logger.info("🌐 Making HTTP POST request to Gemini LLM API...")
        response = requests.post(api_url, headers=headers, json=payload, params=params, timeout=60)
        logger.info(f"📥 LLM API Response Status: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"❌ AI API error: {response.status_code}")
            logger.error(f"❌ Response: {response.text}")
            send_dm_to_user(slack_token, slack_user_id, "Sorry, I encountered an error analyzing your question. Please try again.")
            return False
        
        ai_response = response.json()
        solution = ""
        
        if 'candidates' in ai_response and len(ai_response['candidates']) > 0:
            solution = ai_response['candidates'][0]['content']['parts'][0]['text']
            logger.info("✅ LLM response received successfully")
            logger.info(f"📄 Solution length: {len(solution)} characters")
            logger.info("="*60)
            logger.info("✅✅✅ LLM PROCESSING COMPLETE - NOW SENDING TO SLACK ✅✅✅")
            logger.info("="*60)
        else:
            logger.error("❌ No response from LLM")
            logger.error(f"❌ LLM Response: {ai_response}")
            send_dm_to_user(slack_token, slack_user_id, "Sorry, I couldn't generate a response. Please try rephrasing your question.")
            return False
        
        # Format and send message in channel
        message = f"""Hi <@{slack_user_id}>! 👋

You asked: *{question}*

Here's my analysis based on your projects and tasks:

{solution}

---
_Generated by Feeta AI based on your repositories and active tasks_"""
        
        logger.info(f"📝 Formatted message length: {len(message)} characters")
        logger.info(f"📝 Message preview: {message[:300]}...")
        
        # Send message in channel (as thread reply if thread_ts provided)
        logger.info("="*60)
        logger.info("📤 PREPARING TO SEND RESPONSE TO SLACK")
        logger.info(f"   Channel: {channel}")
        logger.info(f"   Thread TS: {thread_ts if thread_ts else 'None (new message)'}")
        logger.info("="*60)
        if thread_ts:
            logger.info(f"💬 Replying to Slack thread (thread_ts: {thread_ts}) in channel {channel}")
        else:
            logger.info(f"💬 Sending message to Slack channel {channel}")
        result = send_message_to_channel(slack_token, channel, message, thread_ts)
        if result:
            logger.info("✅✅✅ SOLUTION SENT TO SLACK SUCCESSFULLY ✅✅✅")
            logger.info("="*60)
        else:
            logger.error("❌❌❌ FAILED TO SEND SOLUTION TO SLACK ❌❌❌")
            logger.error("="*60)
        return result
        
    except Exception as e:
        logger.error(f"❌ Error handling mention: {str(e)}")
        try:
            send_dm_to_user(slack_token, slack_user_id, "Sorry, I encountered an error. Please try again later.")
        except:
            pass
        return False


@slack_bp.route("/api/resolve-issue", methods=["POST"])
def resolve_issue_general():
    """Resolve issue without requiring a specific project - uses all user projects"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        body = request.get_json()
        question = body.get('question')
        channel = body.get('channel')
        
        if not question or not channel:
            return jsonify({"error": "question and channel are required"}), 400
        
        logger.info(f"🔍 General issue resolution request for user: {user_id}")
        logger.info(f"❓ Question: {question}")
        
        # Get Slack token
        token_info = get_token_for_user(user_id)
        if not token_info:
            return jsonify({"error": "Slack not connected"}), 400
        
        slack_token = token_info.get("bot_token") or token_info.get("access_token")
        
        # Get user info
        from app.database.mongodb import db
        from bson import ObjectId
        users_collection = db['users']
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        user_name = user.get('name', 'User')
        github_token = user.get('github_token')
        
        if not github_token:
            return jsonify({"error": "GitHub not connected"}), 400
        
        # Build context from all user projects
        from app.database.mongodb import get_user_projects, get_project_tasks
        from app.services.ai_service import create_deep_project_context
        
        projects = get_user_projects(user_id)
        
        project_context = ""
        if projects:
            logger.info(f"📦 Analyzing {len(projects)} projects...")
            all_repos = []
            for project in projects[:3]:  # Limit to 3 projects
                repos = project.get('repos', [])
                for repo in repos[:2]:  # Limit to 2 repos per project
                    if repo not in all_repos:
                        all_repos.append(repo)
            
            for repo in all_repos:
                try:
                    full_name = repo.get('full_name') or repo.get('name', '')
                    if '/' in full_name:
                        owner, repo_name = full_name.split('/', 1)
                        logger.info(f"🔍 Analyzing {owner}/{repo_name}...")
                        context = create_deep_project_context(owner, repo_name, github_token)
                        project_context += f"\n\n=== Repository: {full_name} ===\n{context}\n"
                except Exception as e:
                    logger.error(f"❌ Error analyzing repo {repo.get('name')}: {str(e)}")
                    continue
        
        # Get tasks from all projects
        tasks_context = ""
        all_tasks = []
        for project in projects:
            project_id = str(project.get('_id', ''))
            tasks = get_project_tasks(project_id)
            all_tasks.extend(tasks[:5])
        
        if all_tasks:
            tasks_context = "\n\n=== Active Tasks ===\n"
            for task in all_tasks[:15]:
                status = task.get('status', 'unknown')
                if status in ['in_progress', 'approved', 'pending_approval', 'pending']:
                    tasks_context += f"- {task.get('title', 'Untitled')}: {task.get('description', '')[:100]}\n"
        
        # Build AI prompt
        full_context = f"""PROJECT CONTEXT:
{project_context}
{tasks_context}

USER QUESTION:
{question}

Analyze the question in the context of the project repositories and tasks above. Provide a detailed, actionable solution. Format your response clearly with:
1. Problem Analysis
2. Root Cause (if applicable)
3. Solution Steps
4. Code examples (if relevant)
5. Prevention tips (if applicable)
Be specific and reference actual files/code from the repositories when relevant."""
        
        # Call AI service
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return jsonify({"error": "AI service not configured"}), 500
        
        api_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
        headers = {'Content-Type': 'application/json'}
        payload = {
            "contents": [{
                "parts": [{"text": full_context}]
            }]
        }
        params = {'key': api_key}
        
        response = requests.post(api_url, headers=headers, json=payload, params=params, timeout=60)
        
        if response.status_code != 200:
            logger.error(f"❌ AI API error: {response.status_code} - {response.text}")
            return jsonify({"error": "AI service error"}), 500
        
        ai_response = response.json()
        solution = ""
        
        if 'candidates' in ai_response and len(ai_response['candidates']) > 0:
            solution = ai_response['candidates'][0]['content']['parts'][0]['text']
        else:
            return jsonify({"error": "No response from AI"}), 500
        
        # Format and send message to channel
        message = f"""🔍 *Issue Resolution Request*
*Question:*
{question}
*Solution:*
{solution}
---
_Generated by Feeta AI based on your project context_"""
        
        # Join channel and send message
        try:
            join_url = "https://slack.com/api/conversations.join"
            join_headers = {"Authorization": f"Bearer {slack_token}", "Content-Type": "application/json"}
            join_payload = {"channel": channel}
            requests.post(join_url, headers=join_headers, json=join_payload, timeout=5)
        except:
            pass
        
        result = send_message_to_channel(slack_token, channel, message, None)
        
        if result:
            return jsonify({
                "ok": True,
                "message": "Issue analyzed and solution sent to Slack"
            })
        else:
            return jsonify({"error": "Failed to process issue"}), 500
            
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error resolving issue: {str(e)}")
        return jsonify({"error": str(e)}), 500


def send_dm_to_user(slack_token, slack_user_id, message):
    """Send a direct message to a Slack user"""
    try:
        # Open DM channel
        im_url = "https://slack.com/api/conversations.open"
        im_headers = {"Authorization": f"Bearer {slack_token}", "Content-Type": "application/json"}
        im_payload = {"users": slack_user_id}
        
        im_response = requests.post(im_url, headers=im_headers, json=im_payload, timeout=5)
        im_data = im_response.json()
        
        if not im_data.get("ok"):
            logger.error(f"Failed to open DM: {im_data.get('error')}")
            return
        
        channel_id = im_data.get("channel", {}).get("id")
        if not channel_id:
            logger.error("No channel ID in DM response")
            return
        
        # Send message
        url = "https://slack.com/api/chat.postMessage"
        headers = {
            "Authorization": f"Bearer {slack_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "channel": channel_id,
            "text": message,
            "parse": "full"
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        data = response.json()
        
        if not data.get("ok"):
            logger.error(f"Failed to send DM: {data.get('error')}")
        
    except Exception as e:
        logger.error(f"❌ Error sending DM: {str(e)}")


@slack_bp.route("/api/check-channel-mentions", methods=["POST"])
def check_channel_mentions():
    """Check a specific channel for @Feeta mentions and process them"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Verify JWT token
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        body = request.get_json()
        channel_id = body.get('channel')
        project_id = body.get('project_id')
        auto_fetch = body.get('auto_fetch', False)  # Flag for auto-fetch mode
        processed_mention_ids = body.get('processed_mention_ids', [])  # Already processed mention IDs
        
        if not channel_id:
            return jsonify({"error": "channel is required"}), 400
        
        if not auto_fetch:
            logger.info(f"🔄 Checking channel {channel_id} for mentions...")
        # In auto-fetch mode, we skip verbose logging
        
        # Get Slack token
        token_info = get_token_for_user(user_id)
        if not token_info:
            return jsonify({"error": "Slack not connected"}), 400
        
        slack_token = token_info.get("bot_token") or token_info.get("access_token")
        team_id = token_info.get("team_id")
        
        # Get bot user ID to identify mentions
        bot_info_url = "https://slack.com/api/auth.test"
        bot_info_headers = {"Authorization": f"Bearer {slack_token}"}
        bot_info_resp = requests.get(bot_info_url, headers=bot_info_headers, timeout=5)
        bot_info = bot_info_resp.json()
        
        if not bot_info.get("ok"):
            return jsonify({"error": "Failed to get bot info"}), 500
        
        bot_user_id = bot_info.get("user_id")
        logger.info(f"🤖 Bot user ID: {bot_user_id}")
        
        # Get channel messages (last 100 messages)
        messages_url = "https://slack.com/api/conversations.history"
        messages_headers = {"Authorization": f"Bearer {slack_token}"}
        messages_params = {
            "channel": channel_id,
            "limit": 100
        }
        
        messages_resp = requests.get(messages_url, headers=messages_headers, params=messages_params, timeout=10)
        messages_data = messages_resp.json()
        
        if not messages_data.get("ok"):
            error_msg = messages_data.get('error', 'Unknown error')
            logger.error(f"Failed to get messages: {error_msg}")
            return jsonify({"error": f"Failed to get messages: {error_msg}"}), 500
        
        messages = messages_data.get("messages", [])
        if not auto_fetch:
            logger.info(f"📨 Found {len(messages)} messages in channel")
        
        # Prepare response data
        logs = []
        processed_messages = []
        mentions = []
        
        if not auto_fetch:
            logs.append({
                "type": "info",
                "message": f"📨 Scanning {len(messages)} messages in channel (excluding Feeta's own messages)...",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Get user names for all messages (only cache for mentions in auto-fetch mode)
        user_names_cache = {}
        
        # Find messages that mention the bot (excluding bot's own messages)
        for msg in messages:
            text = msg.get("text", "")
            user = msg.get("user")
            ts = msg.get("ts")
            
            # Skip messages from the bot itself
            if user == bot_user_id:
                continue
            
            # Skip messages without a user (system messages, etc.)
            if not user:
                continue
            
            # Check if message mentions the bot (do this first to skip non-mentions in auto-fetch mode)
            is_mention = bot_user_id and f"<@{bot_user_id}>" in text if bot_user_id else False
            
            # In auto-fetch mode, only process mentions (skip storing all messages)
            if auto_fetch and not is_mention:
                continue
            
            # Get user name (only for mentions in auto-fetch mode)
            user_name = "Unknown User"
            if user and user not in user_names_cache:
                try:
                    user_info_url = "https://slack.com/api/users.info"
                    user_info_headers = {"Authorization": f"Bearer {slack_token}"}
                    user_info_params = {"user": user}
                    user_info_resp = requests.get(user_info_url, headers=user_info_headers, params=user_info_params, timeout=5)
                    user_info = user_info_resp.json()
                    if user_info.get("ok"):
                        user_name = user_info.get("user", {}).get("real_name") or user_info.get("user", {}).get("name", "Unknown")
                        user_names_cache[user] = user_name
                    else:
                        user_names_cache[user] = "Unknown User"
                except:
                    user_names_cache[user] = "Unknown User"
            
            if user in user_names_cache:
                user_name = user_names_cache[user]
            
            # Store message info (only for non-bot messages)
            message_info = {
                "text": text,
                "user": user,
                "user_name": user_name,
                "timestamp": float(ts) if ts else None,
                "is_mention": is_mention,
                "status": None
            }
            
            if is_mention:
                logger.info(f"🔔 Found @Feeta mention from {user_name} (ID: {user})")
                logger.info(f"   Message text: {text[:200]}...")
                
                # Check if this mention was already processed
                mention_id = f"{channel_id}_{ts}"
                if mention_id in processed_mention_ids:
                    logger.info(f"⏭️ Skipping already processed mention: {mention_id}")
                    continue  # Skip already processed mentions
                
                # Extract question
                question = re.sub(r'<@[^>]+>', '', text).strip()
                question = ' '.join(question.split())
                
                logger.info(f"   Extracted question: {question[:200]}...")
                
                if question:  # Only process if there's actual content
                    message_info["question"] = question
                    mentions.append({
                        "user": user,
                        "question": question,
                        "ts": ts,
                        "text": text,
                        "user_name": user_name
                    })
                    logger.info(f"✅ Added mention to processing queue")
                else:
                    logger.warning(f"⚠️ Mention found but no question content extracted")
            
            # Only store messages if not in auto-fetch mode (to save bandwidth)
            if not auto_fetch:
                processed_messages.append(message_info)
        
        if not auto_fetch:
            logs.append({
                "type": "info",
                "message": f"🔔 Found {len(mentions)} @Feeta mention(s) in channel",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        logger.info(f"🔍 Found {len(mentions)} mention(s) to process")
        
        if not mentions:
            logger.info("ℹ️ No mentions found, returning early")
            return jsonify({
                "ok": True,
                "processed_count": 0,
                "mentions_found": 0,
                "message": "No mentions found",
                "logs": logs if not auto_fetch else [],
                "messages": processed_messages[:50] if not auto_fetch else []  # Skip messages in auto-fetch mode
            })
        
        # Process each mention
        processed_count = 0
        from app.database.mongodb import db
        users_collection = db['users']
        
        logger.info(f"🚀 Starting to process {len(mentions)} mention(s)...")
        
        for mention in mentions:
            try:
                slack_user_id = mention["user"]
                question = mention["question"]
                slack_user_name = mention.get("user_name", "Unknown User")
                
                if not auto_fetch:
                    logs.append({
                        "type": "info",
                        "message": f"🔍 Processing mention from {slack_user_name}: {question[:50]}...",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                # Update message status (only if not in auto-fetch mode)
                if not auto_fetch:
                    for msg in processed_messages:
                        if msg.get("user") == slack_user_id and msg.get("is_mention"):
                            msg["status"] = "processing"
                
                # Use the app installer's context (token owner) - no need to match by email
                # Just get the name and use the installer's projects/repos for context
                token_owner_user_id = token_info.get("user_id")
                
                if not token_owner_user_id:
                    logger.error("❌ No user_id found in token_info")
                    if not auto_fetch:
                        logs.append({
                            "type": "error",
                            "message": f"❌ Could not process mention - app not properly configured",
                            "timestamp": datetime.utcnow().isoformat()
                        })
                    continue
                
                logger.info(f"✅ Using app installer's context (user_id: {token_owner_user_id})")
                logger.info(f"👤 Question from: {slack_user_name} (Slack ID: {slack_user_id})")
                
                db_user_id = token_owner_user_id
                
                if not auto_fetch:
                    logs.append({
                        "type": "info",
                        "message": f"📦 Analyzing project context for {slack_user_name}...",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                # Process with project context if project_id provided
                logger.info("="*60)
                logger.info("🚀 STARTING MENTION PROCESSING")
                logger.info("="*60)
                logger.info(f"📢 Processing mention from channel: {channel_id}")
                logger.info(f"❓ Question: {question}")
                logger.info(f"👤 User: {slack_user_name} (Slack ID: {slack_user_id})")
                logger.info(f"🧵 Thread TS: {mention.get('ts')}")
                logger.info(f"📁 Project ID: {project_id if project_id else 'None (using all projects)'}")
                
                if project_id:
                    # Use specific project context
                    logger.info(f"📁 Using project-specific context: {project_id}")
                    logger.info("🔄 Calling handle_mention_with_project_context...")
                    result = handle_mention_with_project_context(db_user_id, slack_token, channel_id, slack_user_id, question, slack_user_name, project_id, mention.get("ts"))
                    logger.info(f"📊 handle_mention_with_project_context returned: {result}")
                else:
                    # Use general context (all projects)
                    logger.info("📁 Using general context (all projects)")
                    logger.info("🔄 Calling handle_mention_with_context...")
                    result = handle_mention_with_context(db_user_id, slack_token, channel_id, slack_user_id, question, slack_user_name, mention.get("ts"))
                    logger.info(f"📊 handle_mention_with_context returned: {result}")
                
                logger.info("="*60)
                logger.info(f"✅ MENTION PROCESSING COMPLETE - Result: {result}")
                logger.info("="*60)
                
                if result:
                    processed_count += 1
                    logger.info(f"✅ Processed mention from {slack_user_name}")
                    if not auto_fetch:
                        logs.append({
                            "type": "success",
                            "message": f"✅ Successfully processed and sent solution to {slack_user_name}",
                            "timestamp": datetime.utcnow().isoformat()
                        })
                        for msg in processed_messages:
                            if msg.get("user") == slack_user_id and msg.get("is_mention"):
                                msg["status"] = "processed"
                else:
                    if not auto_fetch:
                        logs.append({
                            "type": "error",
                            "message": f"❌ Failed to process mention from {slack_user_name}",
                            "timestamp": datetime.utcnow().isoformat()
                        })
                        for msg in processed_messages:
                            if msg.get("user") == slack_user_id and msg.get("is_mention"):
                                msg["status"] = "error"
                
            except Exception as e:
                logger.error(f"❌ Error processing mention: {str(e)}")
                if not auto_fetch:
                    logs.append({
                        "type": "error",
                        "message": f"❌ Error: {str(e)}",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    for msg in processed_messages:
                        if msg.get("user") == mention.get("user") and msg.get("is_mention"):
                            msg["status"] = "error"
                continue
        
        # Prepare mentions data for auto-fetch mode
        mentions_data = []
        if auto_fetch and mentions:
            for mention in mentions:
                mentions_data.append({
                    "user": mention.get("user"),
                    "user_name": mention.get("user_name", "Unknown User"),
                    "question": mention.get("question", ""),
                    "text": mention.get("text", ""),
                    "ts": mention.get("ts")
                })
        
        return jsonify({
            "ok": True,
            "processed_count": processed_count,
            "mentions_found": len(mentions),
            "message": f"Processed {processed_count} mention(s)",
            "logs": logs if not auto_fetch else [],
            "messages": processed_messages[:100] if not auto_fetch else [],  # Skip messages in auto-fetch mode
            "mentions": mentions_data if auto_fetch else []  # Return mentions details in auto-fetch mode
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error checking channel mentions: {str(e)}")
        return jsonify({"error": str(e)}), 500


def handle_mention_with_project_context(user_id, slack_token, channel, slack_user_id, question, user_name, project_id, thread_ts=None):
    """Handle mention with specific project context"""
    try:
        logger.info("="*60)
        logger.info("🚀 FEETA MENTION PROCESSING STARTED (WITH PROJECT)")
        logger.info("="*60)
        logger.info(f"👤 User: {user_name} (ID: {user_id})")
        logger.info(f"❓ Question: {question}")
        logger.info(f"📢 Channel ID: {channel} (will send reply here)")
        logger.info(f"📁 Project ID: {project_id}")
        logger.info(f"🔍 Analyzing context for user: {user_id} with project: {project_id}")
        
        from app.database.mongodb import db, get_project_tasks
        from app.services.ai_service import create_deep_project_context
        from bson import ObjectId
        
        users_collection = db['users']
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            logger.error("User not found")
            return False
        
        github_token = user.get('github_token')
        if not github_token:
            send_dm_to_user(slack_token, slack_user_id,
                f"Hi {user_name}! 👋\n\nI need GitHub to be connected to analyze your repositories. Please connect GitHub in your dashboard first.")
            return False
        
        # Get project
        projects_collection = db['projects']
        project = projects_collection.find_one({"_id": ObjectId(project_id), "user_id": user_id})
        
        if not project:
            logger.error("Project not found")
            send_dm_to_user(slack_token, slack_user_id,
                f"Hi {user_name}! 👋\n\nProject not found. Please select a valid project.")
            return False
        
        # Build context from project repos
        project_context = ""
        repos = project.get('repos', [])
        
        logger.info(f"📦 Analyzing {len(repos)} repositories from project to include in LLM context...")
        for repo in repos[:3]:  # Limit to 3 repos
            try:
                full_name = repo.get('full_name') or repo.get('name', '')
                if '/' in full_name:
                    owner, repo_name = full_name.split('/', 1)
                    logger.info(f"🔍 Analyzing repository {owner}/{repo_name} to include in LLM context...")
                    context = create_deep_project_context(owner, repo_name, github_token)
                    project_context += f"\n\n=== Repository: {full_name} ===\n{context}\n"
                    logger.info(f"✅ Repository context added for {full_name}")
            except Exception as e:
                logger.error(f"❌ Error analyzing repo {repo.get('name')}: {str(e)}")
                continue
        
        # Get tasks from project
        tasks = get_project_tasks(project_id)
        tasks_context = ""
        if tasks:
            tasks_context = "\n\n=== Project Tasks ===\n"
            for task in tasks[:15]:
                status = task.get('status', 'unknown')
                if status in ['in_progress', 'approved', 'pending_approval', 'pending']:
                    tasks_context += f"- {task.get('title', 'Untitled')}: {task.get('description', '')[:100]}\n"
                    if task.get('assigned_to') and task.get('assigned_to') != 'Unassigned':
                        tasks_context += f"  (Assigned to: {task.get('assigned_to')})\n"
        
        # Build AI prompt
        full_context = f"""PROJECT CONTEXT:
Project: {project.get('name', 'Unknown')}

{project_context}

{tasks_context}

USER QUESTION FROM SLACK:
{question}

You are Feeta AI, an expert developer assistant. The user has tagged you in Slack with a question about their project "{project.get('name', 'Unknown')}".

**IMPORTANT INSTRUCTIONS:**
1. Analyze the user's question in the context of their project repositories and tasks above
2. **ALWAYS reference specific files, modules, or code sections from their repositories** when providing solutions
3. Use the repository context (project summary, tech stack, architecture, key modules) to provide accurate, project-specific answers
4. Consider their current tasks and workload when suggesting solutions
5. Provide clear, step-by-step guidance with actionable steps
6. Include code examples that match their tech stack and repository structure
7. If the question relates to a specific file or module mentioned in the repository context, reference it directly (e.g., "In your {module_name} module, check the {file_path} file")

**Response Format:**
- Start with a brief acknowledgment
- Provide a clear analysis of the problem
- Give step-by-step solution with specific file/module references from the repository context
- Include code examples if relevant (matching their tech stack)
- End with any additional tips or considerations

Format your response in a friendly, helpful tone suitable for Slack. Be concise but thorough. Reference actual repository files and code when possible."""
        
        # Call AI service
        logger.info("="*60)
        logger.info("🤖 SENDING TO LLM WITH FULL CONTEXT")
        logger.info("="*60)
        logger.info(f"📝 Question: {question}")
        logger.info(f"📚 Repository context: {len(project_context)} characters")
        logger.info(f"📋 Tasks context: {len(tasks_context)} characters")
        logger.info(f"📊 Total context size: {len(full_context)} characters")
        logger.info("🔄 Calling Gemini LLM API...")
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            send_dm_to_user(slack_token, slack_user_id, "Sorry, AI service is not configured.")
            return False
        
        api_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
        headers = {'Content-Type': 'application/json'}
        payload = {
            "contents": [{
                "parts": [{"text": full_context}]
            }]
        }
        params = {'key': api_key}
        
        response = requests.post(api_url, headers=headers, json=payload, params=params, timeout=60)
        
        if response.status_code != 200:
            logger.error(f"❌ AI API error: {response.status_code}")
            send_dm_to_user(slack_token, slack_user_id, "Sorry, I encountered an error analyzing your question. Please try again.")
            return False
        
        ai_response = response.json()
        solution = ""
        
        if 'candidates' in ai_response and len(ai_response['candidates']) > 0:
            solution = ai_response['candidates'][0]['content']['parts'][0]['text']
            logger.info("✅ LLM response received successfully")
            logger.info(f"📄 Solution length: {len(solution)} characters")
            logger.info("="*60)
            logger.info("✅✅✅ LLM PROCESSING COMPLETE - NOW SENDING TO SLACK ✅✅✅")
            logger.info("="*60)
        else:
            logger.error("❌ No response from LLM")
            send_dm_to_user(slack_token, slack_user_id, "Sorry, I couldn't generate a response. Please try rephrasing your question.")
            return False
        
        # Format and send message in channel (as a reply/thread)
        message = f"""Hi <@{slack_user_id}>! 👋

You asked: *{question}*

Here's my analysis based on your project *{project.get('name', 'Unknown')}*:

{solution}

---
_Generated by Feeta AI based on your project repositories and tasks_"""
        
        logger.info(f"📝 Formatted message length: {len(message)} characters")
        logger.info(f"📝 Message preview: {message[:300]}...")
        
        # Send message in channel (reply to the original message if we have thread_ts)
        logger.info("="*60)
        logger.info("📤 PREPARING TO SEND RESPONSE TO SLACK")
        logger.info(f"   Channel: {channel}")
        logger.info(f"   Thread TS: {thread_ts if thread_ts else 'None (new message)'}")
        logger.info("="*60)
        if thread_ts:
            logger.info(f"💬 Replying to Slack thread (thread_ts: {thread_ts}) in channel {channel}")
        else:
            logger.info(f"💬 Sending message to Slack channel {channel}")
        result = send_message_to_channel(slack_token, channel, message, thread_ts)
        if result:
            logger.info("✅✅✅ SOLUTION SENT TO SLACK SUCCESSFULLY ✅✅✅")
            logger.info("="*60)
        else:
            logger.error("❌❌❌ FAILED TO SEND SOLUTION TO SLACK ❌❌❌")
            logger.error("="*60)
        return result
        
    except Exception as e:
        logger.error(f"❌ Error handling mention with project context: {str(e)}")
        try:
            send_dm_to_user(slack_token, slack_user_id, "Sorry, I encountered an error. Please try again later.")
        except:
            pass
        return False


@slack_bp.route("/api/test-slack-message", methods=["POST"])
def test_slack_message():
    """Test endpoint to verify Slack message sending works"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        body = request.get_json()
        channel_id = body.get('channel_id')
        test_message = body.get('message', 'Test message from Feeta')
        
        if not channel_id:
            return jsonify({"error": "channel_id is required"}), 400
        
        # Get Slack token
        token_info = get_token_for_user(user_id)
        if not token_info:
            return jsonify({"error": "Slack not connected"}), 400
        
        slack_token = token_info.get("bot_token") or token_info.get("access_token")
        
        logger.info("="*80)
        logger.info("🧪 TEST: Sending test message to Slack")
        logger.info(f"   Channel: {channel_id}")
        logger.info(f"   Message: {test_message}")
        logger.info("="*80)
        
        result = send_message_to_channel(slack_token, channel_id, test_message, None)
        
        if result:
            return jsonify({
                "ok": True,
                "message": "Test message sent successfully",
                "channel": channel_id
            })
        else:
            return jsonify({
                "ok": False,
                "error": "Failed to send test message",
                "channel": channel_id
            }), 500
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error in test endpoint: {str(e)}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500