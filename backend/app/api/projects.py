"""
Project and Message API Routes
Handles CRUD operations for projects and messages
"""
from flask import Blueprint, request, jsonify
import logging
import jwt
import os
from app.database.mongodb import (
    create_project, get_user_projects, update_project, delete_project,
    save_message, get_project_messages, get_database_stats,
    create_tasks, get_project_tasks, update_task, delete_task,
    get_weekly_deadlines
)

logger = logging.getLogger(__name__)
JWT_SECRET = os.getenv('FLASK_SECRET', 'change_this_secret')

project_bp = Blueprint('project', __name__)


@project_bp.route("/projects", methods=["GET"])
def get_projects():
    """Get all projects for the authenticated user"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Get user_id from JWT token
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        logger.info(f"📂 Fetching projects for user: {user_id}")
        
        projects = get_user_projects(user_id)
        
        return jsonify({
            "ok": True,
            "projects": projects
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error fetching projects: {str(e)}")
        return jsonify({"error": str(e)}), 500


@project_bp.route("/projects", methods=["POST"])
def create_new_project():
    """Create a new project"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Get user_id from JWT token
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        data = request.get_json()
        name = data.get('name')
        repo_data = data.get('repo')
        
        if not name:
            return jsonify({"error": "name required"}), 400
        
        logger.info(f"📝 Creating project '{name}' for user {user_id}")
        
        project = create_project(user_id, name, repo_data)
        
        if project:
            return jsonify({
                "ok": True,
                "project": project
            })
        else:
            return jsonify({"error": "Failed to create project"}), 500
            
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error creating project: {str(e)}")
        return jsonify({"error": str(e)}), 500


@project_bp.route("/projects/<project_id>", methods=["PUT"])
def update_project_route(project_id):
    """Update a project"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Verify JWT token
        token = auth_header.replace('Bearer ', '')
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        data = request.get_json()
        
        # Remove fields that shouldn't be updated directly
        updates = {k: v for k, v in data.items() if k not in ['_id', 'id', 'user_id', 'created_at']}
        
        logger.info(f"✏️ Updating project {project_id}")
        
        success = update_project(project_id, updates)
        
        if success:
            return jsonify({"ok": True})
        else:
            return jsonify({"error": "Failed to update project"}), 500
            
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error updating project: {str(e)}")
        return jsonify({"error": str(e)}), 500


@project_bp.route("/projects/<project_id>", methods=["DELETE"])
def delete_project_route(project_id):
    """Delete a project"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Verify JWT token
        token = auth_header.replace('Bearer ', '')
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        logger.info(f"🗑️ Deleting project {project_id}")
        
        success = delete_project(project_id)
        
        if success:
            return jsonify({"ok": True})
        else:
            return jsonify({"error": "Failed to delete project"}), 404
            
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error deleting project: {str(e)}")
        return jsonify({"error": str(e)}), 500


@project_bp.route("/projects/<project_id>/messages", methods=["GET"])
def get_messages(project_id):
    """Get all messages for a project"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Verify JWT token
        token = auth_header.replace('Bearer ', '')
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        logger.info(f"💬 Fetching messages for project {project_id}")
        
        messages = get_project_messages(project_id)
        
        return jsonify({
            "ok": True,
            "messages": messages
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error fetching messages: {str(e)}")
        return jsonify({"error": str(e)}), 500


@project_bp.route("/projects/<project_id>/messages", methods=["POST"])
def add_message(project_id):
    """Add a message to a project"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Verify JWT token
        token = auth_header.replace('Bearer ', '')
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        data = request.get_json()
        role = data.get('role')  # 'user' or 'assistant'
        content = data.get('content')
        message_data = data.get('data')  # questions, plans, etc.
        
        if not role or not content:
            return jsonify({"error": "role and content required"}), 400
        
        logger.info(f"💬 Saving {role} message to project {project_id}")
        
        message = save_message(project_id, role, content, message_data)
        
        if message:
            return jsonify({
                "ok": True,
                "message": message
            })
        else:
            return jsonify({"error": "Failed to save message"}), 500
            
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error saving message: {str(e)}")
        return jsonify({"error": str(e)}), 500


@project_bp.route("/api/database/stats", methods=["GET"])
def database_stats():
    """Get database statistics"""
    try:
        stats = get_database_stats()
        return jsonify({
            "ok": True,
            "stats": stats
        })
    except Exception as e:
        logger.error(f"❌ Error getting database stats: {str(e)}")
        return jsonify({"error": str(e)}), 500


# ============== TASK OPERATIONS ==============

@project_bp.route("/projects/<project_id>/tasks", methods=["GET"])
def get_tasks(project_id):
    """Get all tasks for a project with deadline and timeline information"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Verify JWT token
        token = auth_header.replace('Bearer ', '')
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        status_filter = request.args.get('status')  # Optional status filter
        
        logger.info(f"📋 Fetching tasks for project {project_id}")
        
        tasks = get_project_tasks(project_id, status_filter)
        
        # Calculate total time for all tasks
        total_hours = 0
        total_timeline = ""
        valid_deadlines = []
        
        for task in tasks:
            # Sum up estimated hours
            estimated_hours = task.get("estimated_hours", "")
            if estimated_hours:
                try:
                    # Try to parse as number
                    hours = float(str(estimated_hours).strip())
                    total_hours += hours
                except (ValueError, TypeError):
                    pass
            
            # Collect valid deadlines
            deadline = task.get("deadline", "")
            if deadline:
                try:
                    from datetime import datetime
                    deadline_date = datetime.strptime(deadline, "%Y-%m-%d")
                    valid_deadlines.append(deadline_date)
                except (ValueError, TypeError):
                    pass
        
        # Find earliest and latest deadlines
        earliest_deadline = None
        latest_deadline = None
        if valid_deadlines:
            earliest_deadline = min(valid_deadlines).strftime("%Y-%m-%d")
            latest_deadline = max(valid_deadlines).strftime("%Y-%m-%d")
        
        # Convert total hours to human-readable format
        if total_hours > 0:
            if total_hours < 8:
                total_timeline = f"{int(total_hours)} hours"
            elif total_hours < 40:
                days = total_hours / 8
                total_timeline = f"{days:.1f} days" if days < 1 else f"{int(days)} days"
            else:
                weeks = total_hours / 40
                total_timeline = f"{weeks:.1f} weeks" if weeks < 1 else f"{int(weeks)} weeks"
        
        return jsonify({
            "ok": True,
            "tasks": tasks,
            "summary": {
                "total_tasks": len(tasks),
                "total_estimated_hours": round(total_hours, 1),
                "total_timeline": total_timeline,
                "earliest_deadline": earliest_deadline,
                "latest_deadline": latest_deadline
            }
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error fetching tasks: {str(e)}")
        return jsonify({"error": str(e)}), 500


@project_bp.route("/projects/<project_id>/tasks", methods=["POST"])
def create_project_tasks(project_id):
    """Create tasks for a project from AI-generated subtasks"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Verify JWT token
        token = auth_header.replace('Bearer ', '')
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        data = request.get_json()
        subtasks = data.get('subtasks', [])
        session_id = data.get('session_id')
        
        if not subtasks:
            return jsonify({"error": "subtasks required"}), 400
        
        logger.info(f"✅ Creating {len(subtasks)} tasks for project {project_id}")
        
        task_ids = create_tasks(project_id, subtasks, session_id)
        
        if task_ids:
            return jsonify({
                "ok": True,
                "task_ids": task_ids,
                "count": len(task_ids)
            })
        else:
            return jsonify({"error": "Failed to create tasks"}), 500
            
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error creating tasks: {str(e)}")
        return jsonify({"error": str(e)}), 500


@project_bp.route("/tasks/<task_id>", methods=["PUT"])
def update_task_route(task_id):
    """Update a task (e.g., status, assignee, etc.)"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Verify JWT token
        token = auth_header.replace('Bearer ', '')
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        data = request.get_json()
        
        # Remove fields that shouldn't be updated directly
        updates = {k: v for k, v in data.items() if k not in ['_id', 'id', 'project_id', 'created_at', 'created_from']}
        
        logger.info(f"✏️ Updating task {task_id}")
        
        success = update_task(task_id, updates)
        
        if success:
            return jsonify({"ok": True})
        else:
            return jsonify({"error": "Failed to update task"}), 500
            
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error updating task: {str(e)}")
        return jsonify({"error": str(e)}), 500


@project_bp.route("/tasks/<task_id>", methods=["DELETE"])
def delete_task_route(task_id):
    """Delete a task"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Verify JWT token
        token = auth_header.replace('Bearer ', '')
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        logger.info(f"🗑️ Deleting task {task_id}")
        
        success = delete_task(task_id)
        
        if success:
            return jsonify({"ok": True})
        else:
            return jsonify({"error": "Failed to delete task"}), 404
            
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error deleting task: {str(e)}")
        return jsonify({"error": str(e)}), 500


@project_bp.route("/projects/<project_id>/tasks/pending-approval", methods=["GET"])
def get_pending_approval_tasks(project_id):
    """Get all tasks pending approval for a project"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Verify JWT token
        token = auth_header.replace('Bearer ', '')
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        
        logger.info(f"📋 Fetching pending approval tasks for project {project_id}")
        
        tasks = get_project_tasks(project_id, status_filter="pending_approval")
        
        return jsonify({
            "ok": True,
            "tasks": tasks,
            "count": len(tasks)
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error fetching pending approval tasks: {str(e)}")
        return jsonify({"error": str(e)}), 500


@project_bp.route("/projects/<project_id>/tasks/approve", methods=["POST"])
def approve_and_send_tasks(project_id):
    """Approve tasks and send them to Slack"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Verify JWT token
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        data = request.get_json()
        task_ids = data.get('task_ids', [])
        channel_id = data.get('channel_id')  # Optional: Slack channel ID
        
        if not task_ids:
            return jsonify({"error": "task_ids required"}), 400
        
        logger.info(f"✅ Approving {len(task_ids)} tasks for project {project_id}")
        
        # Get all tasks for the project
        all_tasks = get_project_tasks(project_id)
        
        approved_count = 0
        failed_tasks = []
        
        # Check if Slack is connected
        from app.api.slack import get_token_for_user
        slack_token_info = get_token_for_user(user_id)
        
        if not slack_token_info or not channel_id:
            # Update tasks to approved but don't send to Slack
            for task_id in task_ids:
                task = next((t for t in all_tasks if t.get('id') == task_id), None)
                if task and task.get('status') == 'pending_approval':
                    update_task(task_id, {"status": "approved"})
                    approved_count += 1
                else:
                    failed_tasks.append(task_id)
            
            return jsonify({
                "ok": True,
                "approved_count": approved_count,
                "failed_tasks": failed_tasks,
                "message": f"{approved_count} tasks approved (Slack not configured, tasks not sent)"
            })
        
        # Send approved tasks to Slack
        slack_token = slack_token_info.get("bot_token") or slack_token_info.get("access_token")
        
        for task_id in task_ids:
            task = next((t for t in all_tasks if t.get('id') == task_id), None)
            
            if not task or task.get('status') != 'pending_approval':
                failed_tasks.append(task_id)
                continue
            
            # Update task status to approved
            update_task(task_id, {"status": "approved"})
            
            # Format task message for Slack
            task_title = task.get('title', 'New Task')
            task_description = task.get('description', '')
            assigned_to = task.get('assigned_to', 'Unassigned')
            deadline = task.get('deadline', 'Not set')
            estimated_hours = task.get('estimated_hours', 'Not specified')
            
            message = f"""📋 *New Task: {task_title}*
            
{task_description}

👤 *Assigned to:* {assigned_to}
⏰ *Deadline:* {deadline}
⏱️ *Estimated Time:* {estimated_hours}

Please confirm receipt and provide updates as you progress."""
            
            # Send to Slack
            import requests
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
            
            try:
                # Join channel first
                join_url = "https://slack.com/api/conversations.join"
                requests.post(join_url, headers=headers, json={"channel": channel_id})
            except:
                pass  # Ignore join errors
            
            response = requests.post(url, headers=headers, json=payload)
            slack_response = response.json()
            
            if slack_response.get("ok"):
                approved_count += 1
                # Update task status to sent
                update_task(task_id, {"status": "sent_to_slack"})
                logger.info(f"✅ Task {task_id} approved and sent to Slack")
            else:
                failed_tasks.append(task_id)
                logger.error(f"❌ Failed to send task {task_id} to Slack: {slack_response.get('error')}")
        
        return jsonify({
            "ok": True,
            "approved_count": approved_count,
            "failed_tasks": failed_tasks,
            "message": f"{approved_count} tasks approved and sent to Slack"
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error approving tasks: {str(e)}")
        return jsonify({"error": str(e)}), 500


@project_bp.route("/dashboard/weekly-deadlines", methods=["GET"])
def get_weekly_deadlines_route():
    """Get minimum deadlines for tasks in the current week"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Verify JWT token
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        week_start = request.args.get('week_start')  # Optional: YYYY-MM-DD format
        
        logger.info(f"📅 Fetching weekly deadlines for user: {user_id}")
        
        deadlines = get_weekly_deadlines(user_id, week_start)
        
        return jsonify({
            "ok": True,
            "deadlines": deadlines
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error fetching weekly deadlines: {str(e)}")
        return jsonify({"error": str(e)}), 500


logger.info("✅ Project routes registered")

