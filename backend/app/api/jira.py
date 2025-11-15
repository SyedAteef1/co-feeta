"""
Jira API Routes
"""
from flask import Blueprint, request, jsonify
import logging
import jwt
import os
import requests
from requests.auth import HTTPBasicAuth

logger = logging.getLogger(__name__)
JWT_SECRET = os.getenv('FLASK_SECRET', 'change_this_secret')

jira_bp = Blueprint('jira', __name__)


@jira_bp.route("/api/jira/connect", methods=["POST"])
def connect_jira():
    """Save Jira credentials"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        data = request.get_json()
        jira_url = data.get('jira_url')
        email = data.get('email')
        api_token = data.get('api_token')
        
        if not all([jira_url, email, api_token]):
            return jsonify({"error": "jira_url, email, and api_token required"}), 400
        
        # Test connection
        test_url = f"{jira_url.rstrip('/')}/rest/api/3/myself"
        response = requests.get(test_url, auth=HTTPBasicAuth(email, api_token), timeout=10)
        
        if response.status_code != 200:
            return jsonify({"error": "Invalid Jira credentials"}), 400
        
        # Save to database
        from app.database.mongodb import db
        from bson import ObjectId
        
        db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "jira_url": jira_url,
                "jira_email": email,
                "jira_api_token": api_token,
                "jira_connected": True
            }}
        )
        
        logger.info(f"✅ Jira connected for user {user_id}")
        return jsonify({"ok": True, "message": "Jira connected successfully"})
        
    except Exception as e:
        logger.error(f"❌ Error connecting Jira: {str(e)}")
        return jsonify({"error": str(e)}), 500


@jira_bp.route("/api/jira/status", methods=["GET"])
def jira_status():
    """Check if Jira is connected"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        from app.database.mongodb import db
        from bson import ObjectId
        
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if user and user.get('jira_connected'):
            return jsonify({
                "connected": True,
                "jira_url": user.get('jira_url'),
                "email": user.get('jira_email')
            })
        
        return jsonify({"connected": False})
        
    except Exception as e:
        logger.error(f"❌ Error checking Jira status: {str(e)}")
        return jsonify({"error": str(e)}), 500


@jira_bp.route("/api/jira/projects", methods=["GET"])
def get_jira_projects():
    """Get Jira projects"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        from app.database.mongodb import db
        from bson import ObjectId
        
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user or not user.get('jira_connected'):
            return jsonify({"error": "Jira not connected"}), 400
        
        jira_url = user.get('jira_url')
        email = user.get('jira_email')
        api_token = user.get('jira_api_token')
        
        url = f"{jira_url.rstrip('/')}/rest/api/3/project"
        response = requests.get(url, auth=HTTPBasicAuth(email, api_token), timeout=10)
        
        if response.status_code == 200:
            projects = response.json()
            return jsonify({"ok": True, "projects": projects})
        
        return jsonify({"error": "Failed to fetch projects"}), 500
        
    except Exception as e:
        logger.error(f"❌ Error fetching Jira projects: {str(e)}")
        return jsonify({"error": str(e)}), 500


@jira_bp.route("/api/jira/issues", methods=["GET"])
def get_jira_issues():
    """Get Jira issues"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        from app.database.mongodb import db
        from bson import ObjectId
        
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user or not user.get('jira_connected'):
            return jsonify({"error": "Jira not connected"}), 400
        
        jira_url = user.get('jira_url')
        email = user.get('jira_email')
        api_token = user.get('jira_api_token')
        
        # Get current user's issues
        jql = "assignee = currentUser() ORDER BY created DESC"
        url = f"{jira_url.rstrip('/')}/rest/api/3/search?jql={jql}&maxResults=50"
        response = requests.get(url, auth=HTTPBasicAuth(email, api_token), timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            issues = [{
                "key": issue["key"],
                "summary": issue["fields"]["summary"],
                "status": issue["fields"]["status"]["name"],
                "project": issue["fields"]["project"]["key"],
                "url": f"{jira_url}/browse/{issue['key']}",
                "created": issue["fields"]["created"]
            } for issue in data.get("issues", [])]
            return jsonify({"ok": True, "issues": issues})
        
        return jsonify({"error": "Failed to fetch issues"}), 500
        
    except Exception as e:
        logger.error(f"❌ Error fetching Jira issues: {str(e)}")
        return jsonify({"error": str(e)}), 500


@jira_bp.route("/api/jira/issue-types", methods=["GET"])
def get_issue_types():
    """Get issue types for a project"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        project_key = request.args.get('project_key')
        if not project_key:
            return jsonify({"error": "project_key required"}), 400
        
        from app.database.mongodb import db
        from bson import ObjectId
        
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user or not user.get('jira_connected'):
            return jsonify({"error": "Jira not connected"}), 400
        
        jira_url = user.get('jira_url')
        email = user.get('jira_email')
        api_token = user.get('jira_api_token')
        
        url = f"{jira_url.rstrip('/')}/rest/api/3/issue/createmeta?projectKeys={project_key}&expand=projects.issuetypes"
        response = requests.get(url, auth=HTTPBasicAuth(email, api_token), timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('projects') and len(data['projects']) > 0:
                issue_types = data['projects'][0].get('issuetypes', [])
                return jsonify({"ok": True, "issue_types": issue_types})
        
        return jsonify({"error": "Failed to fetch issue types"}), 500
        
    except Exception as e:
        logger.error(f"❌ Error fetching issue types: {str(e)}")
        return jsonify({"error": str(e)}), 500


@jira_bp.route("/api/jira/create-issue", methods=["POST"])
def create_jira_issue():
    """Create Jira issue"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        data = request.get_json()
        project_key = data.get('project_key')
        summary = data.get('summary')
        description = data.get('description')
        assignee_id = data.get('assignee_id')
        
        if not all([project_key, summary]):
            return jsonify({"error": "project_key and summary required"}), 400
        
        from app.database.mongodb import db
        from bson import ObjectId
        
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user or not user.get('jira_connected'):
            return jsonify({"error": "Jira not connected"}), 400
        
        jira_url = user.get('jira_url')
        email = user.get('jira_email')
        api_token = user.get('jira_api_token')
        auth = HTTPBasicAuth(email, api_token)
        
        # Get first available issue type
        meta_url = f"{jira_url.rstrip('/')}/rest/api/3/issue/createmeta?projectKeys={project_key}&expand=projects.issuetypes"
        meta_response = requests.get(meta_url, auth=auth, timeout=10)
        
        if meta_response.status_code != 200:
            return jsonify({"error": "Failed to fetch issue types"}), 500
        
        meta_data = meta_response.json()
        if not meta_data.get('projects') or len(meta_data['projects']) == 0:
            return jsonify({"error": "Project not found"}), 404
        
        project_id = meta_data['projects'][0]['id']
        issue_types = meta_data['projects'][0].get('issuetypes', [])
        if not issue_types:
            return jsonify({"error": "No issue types available"}), 400
        
        issue_type_id = issue_types[0]['id']
        
        # Get active sprint
        board_url = f"{jira_url.rstrip('/')}/rest/agile/1.0/board?projectKeyOrId={project_key}"
        board_response = requests.get(board_url, auth=auth, timeout=10)
        
        sprint_id = None
        if board_response.status_code == 200:
            boards = board_response.json().get('values', [])
            if boards:
                board_id = boards[0]['id']
                sprint_url = f"{jira_url.rstrip('/')}/rest/agile/1.0/board/{board_id}/sprint?state=active"
                sprint_response = requests.get(sprint_url, auth=auth, timeout=10)
                if sprint_response.status_code == 200:
                    sprints = sprint_response.json().get('values', [])
                    if sprints:
                        sprint_id = sprints[0]['id']
        
        # Create issue
        url = f"{jira_url.rstrip('/')}/rest/api/3/issue"
        issue_data = {
            "fields": {
                "project": {"key": project_key},
                "summary": summary,
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [{
                        "type": "paragraph",
                        "content": [{"type": "text", "text": description or ""}]
                    }]
                },
                "issuetype": {"id": issue_type_id}
            }
        }
        
        if assignee_id:
            issue_data["fields"]["assignee"] = {"id": assignee_id}
        
        response = requests.post(url, json=issue_data, auth=auth, headers={"Content-Type": "application/json"}, timeout=10)
        
        if response.status_code in [200, 201]:
            result = response.json()
            issue_key = result.get('key')
            issue_id = result.get('id')
            
            # Add to sprint if active sprint exists
            if sprint_id and issue_id:
                sprint_add_url = f"{jira_url.rstrip('/')}/rest/agile/1.0/sprint/{sprint_id}/issue"
                requests.post(sprint_add_url, json={"issues": [issue_id]}, auth=auth, timeout=10)
            
            return jsonify({"ok": True, "issue_key": issue_key, "issue_url": f"{jira_url}/browse/{issue_key}"})
        
        logger.error(f"Jira API error: {response.text}")
        return jsonify({"error": "Failed to create issue"}), 500
        
    except Exception as e:
        logger.error(f"❌ Error creating Jira issue: {str(e)}")
        return jsonify({"error": str(e)}), 500


logger.info("✅ Jira routes registered")
