"""
Project and Message API Routes
Handles CRUD operations for projects and messages
"""
from flask import Blueprint, request, jsonify
import logging
import jwt
import os
import requests
from app.database.mongodb import (
    create_project, get_user_projects, update_project, delete_project,
    save_message, get_project_messages, get_database_stats,
    create_tasks, get_project_tasks, update_task, delete_task,
    get_weekly_deadlines, get_user_team_members, update_member_workload,
    get_all_user_tasks
)
from app.services.ai_service import create_deep_project_context
from app.api.slack import get_token_for_user
from bson import ObjectId

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


@project_bp.route("/tasks", methods=["GET"])
def get_all_tasks():
    """Get all tasks for the authenticated user across all projects"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Get user_id from JWT token
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        status_filter = request.args.get('status')  # Optional status filter
        
        logger.info(f"📋 Fetching all tasks for user: {user_id}")
        
        tasks = get_all_user_tasks(user_id)
        
        # Apply status filter if provided
        if status_filter:
            tasks = [task for task in tasks if task.get('status') == status_filter]
        
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
        logger.error(f"❌ Error fetching all tasks: {str(e)}")
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
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        data = request.get_json()
        
        # Get current task to check status change
        # First, find the task to get its project_id
        from app.database.mongodb import tasks_collection
        from bson import ObjectId
        
        current_task = None
        try:
            if ObjectId.is_valid(task_id):
                task_doc = tasks_collection.find_one({"_id": ObjectId(task_id)})
                if task_doc:
                    current_task = {
                        'id': str(task_doc['_id']),
                        'project_id': task_doc.get('project_id', ''),
                        'status': task_doc.get('status', ''),
                        'assigned_to': task_doc.get('assigned_to', ''),
                        'estimated_hours': task_doc.get('estimated_hours', '')
                    }
        except Exception as e:
            logger.error(f"Error finding task: {e}")
        
        old_status = current_task.get('status') if current_task else None
        new_status = data.get('status')
        assigned_to = data.get('assigned_to') or (current_task.get('assigned_to') if current_task else None)
        
        # Remove fields that shouldn't be updated directly
        updates = {k: v for k, v in data.items() if k not in ['_id', 'id', 'project_id', 'created_at', 'created_from']}
        
        logger.info(f"✏️ Updating task {task_id}")
        
        success = update_task(task_id, updates)
        
        if success:
            # Handle workload updates when task status changes
            if old_status and new_status and old_status != new_status:
                # Task completed/done - increase idle percentage
                if new_status in ['completed', 'done', 'finished'] and old_status not in ['completed', 'done', 'finished']:
                    if assigned_to and assigned_to != 'Unassigned' and current_task:
                        estimated_hours = current_task.get('estimated_hours', '')
                        if estimated_hours:
                            try:
                                hours = float(str(estimated_hours).strip())
                                if hours > 0:
                                    # Find member email from team members
                                    team_members = get_user_team_members(user_id)
                                    member_email = None
                                    for member in team_members:
                                        if member.get('name') == assigned_to:
                                            member_email = member.get('email')
                                            break
                                    update_member_workload(assigned_to, member_email, -hours)  # Negative = increase idle
                            except (ValueError, TypeError):
                                pass
                
                # Task reopened/in progress - decrease idle percentage
                elif new_status in ['in_progress', 'assigned', 'approved'] and old_status in ['completed', 'done', 'finished']:
                    if assigned_to and assigned_to != 'Unassigned' and current_task:
                        estimated_hours = current_task.get('estimated_hours', '')
                        if estimated_hours:
                            try:
                                hours = float(str(estimated_hours).strip())
                                if hours > 0:
                                    team_members = get_user_team_members(user_id)
                                    member_email = None
                                    for member in team_members:
                                        if member.get('name') == assigned_to:
                                            member_email = member.get('email')
                                            break
                                    update_member_workload(assigned_to, member_email, hours)  # Positive = decrease idle
                            except (ValueError, TypeError):
                                pass
            
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


def match_task_to_members(task, team_members):
    """Match a task to team members based on skills and role"""
    if not team_members:
        return []
    
    task_title = task.get('title', '').lower()
    task_description = task.get('description', '').lower()
    task_role = task.get('role', '').lower()
    task_text = f"{task_title} {task_description} {task_role}"
    
    matches = []
    
    for member in team_members:
        score = 0
        member_skills = [s.lower() for s in member.get('skills', [])]
        member_expertise = [e.lower() for e in member.get('expertise', [])]
        member_role = member.get('role', '').lower()
        
        # Check skill matches
        for skill in member_skills:
            if skill in task_text:
                score += 2
        
        # Check expertise matches
        for expertise in member_expertise:
            if expertise in task_text:
                score += 3
        
        # Check role match
        if task_role and member_role:
            if task_role in member_role or member_role in task_role:
                score += 5
        
        # Check if member is idle (prefer idle members)
        if member.get('status') == 'idle':
            score += 2
        
        if score > 0:
            matches.append({
                'member': member,
                'score': score,
                'match_reasons': []
            })
            
            # Add match reasons
            matched_skills = [s for s in member_skills if s in task_text]
            if matched_skills:
                matches[-1]['match_reasons'].append(f"Skills: {', '.join(matched_skills[:3])}")
            
            if task_role and member_role and (task_role in member_role or member_role in task_role):
                matches[-1]['match_reasons'].append(f"Role: {member_role}")
            
            if member.get('status') == 'idle':
                matches[-1]['match_reasons'].append("Available (idle)")
    
    # Sort by score descending
    matches.sort(key=lambda x: x['score'], reverse=True)
    
    return matches[:3]  # Return top 3 matches


@project_bp.route("/projects/<project_id>/tasks/pending-approval", methods=["GET", "OPTIONS"])
def get_pending_approval_tasks(project_id):
    """Get all tasks pending approval for a project with suggested team members"""
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200
    
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        logger.error("❌ No authorization header provided")
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Verify JWT token
        token = auth_header.replace('Bearer ', '')
        if not token:
            logger.error("❌ Empty token provided")
            return jsonify({"error": "Invalid authorization token"}), 401
        
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        logger.info(f"📋 Fetching pending approval tasks for project {project_id}, user {user_id}")
        
        # Get tasks
        try:
            tasks = get_project_tasks(project_id, status_filter="pending_approval")
            logger.info(f"✅ Found {len(tasks)} pending approval tasks")
        except Exception as e:
            logger.error(f"❌ Error getting tasks: {str(e)}")
            return jsonify({"error": f"Failed to fetch tasks: {str(e)}"}), 500
        
        # Get team members for matching
        try:
            team_members = get_user_team_members(user_id)
            logger.info(f"✅ Found {len(team_members)} team members for matching")
        except Exception as e:
            logger.error(f"❌ Error getting team members: {str(e)}")
            # Continue without team members - just return tasks without suggestions
            team_members = []
        
        # Match each task to team members
        tasks_with_suggestions = []
        for task in tasks:
            try:
                suggestions = match_task_to_members(task, team_members)
                task['suggested_members'] = [
                    {
                        'name': m['member'].get('name', 'Unknown'),
                        'email': m['member'].get('email', ''),
                        'role': m['member'].get('role', ''),
                        'skills': m['member'].get('skills', [])[:5],
                        'score': m['score'],
                        'match_reasons': m['match_reasons'],
                        'status': m['member'].get('status', 'idle'),
                        'idle_percentage': m['member'].get('idle_percentage', 100),
                        'idle_hours': m['member'].get('idle_hours', 40),
                        'current_load': m['member'].get('current_load', 0),
                        'capacity': m['member'].get('capacity', 40)
                    }
                    for m in suggestions
                ]
            except Exception as e:
                logger.warning(f"⚠️ Error matching task {task.get('id', 'unknown')}: {str(e)}")
                task['suggested_members'] = []
            
            tasks_with_suggestions.append(task)
        
        logger.info(f"✅ Returning {len(tasks_with_suggestions)} tasks with suggestions")
        return jsonify({
            "ok": True,
            "tasks": tasks_with_suggestions,
            "count": len(tasks_with_suggestions)
        })
        
    except jwt.ExpiredSignatureError:
        logger.error("❌ Token expired")
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        logger.error("❌ Invalid token")
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error fetching pending approval tasks: {str(e)}")
        logger.exception("Full traceback:")
        return jsonify({"error": f"Failed to load pending tasks: {str(e)}"}), 500


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
        task_assignments = data.get('task_assignments', {})  # {task_id: {assigned_member_name, assigned_member_email}}
        
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
                    # Update assigned member if provided
                    assignment = task_assignments.get(task_id, {})
                    if assignment.get('assigned_member_name'):
                        update_task(task_id, {
                            "status": "approved",
                            "assigned_to": assignment.get('assigned_member_name')
                        })
                    else:
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
        
        # Function to find Slack user by email
        def find_slack_user_by_email(email):
            """Find Slack user ID by email"""
            try:
                users_url = "https://slack.com/api/users.list"
                headers = {"Authorization": f"Bearer {slack_token}"}
                response = requests.get(users_url, headers=headers)
                if response.ok:
                    users_data = response.json()
                    if users_data.get('ok'):
                        for user in users_data.get('members', []):
                            if user.get('profile', {}).get('email') == email:
                                return user.get('id')
            except Exception as e:
                logger.error(f"Error finding Slack user: {e}")
            return None
        
        for task_id in task_ids:
            task = next((t for t in all_tasks if t.get('id') == task_id), None)
            
            if not task or task.get('status') != 'pending_approval':
                failed_tasks.append(task_id)
                continue
            
            # Get assignment info
            assignment = task_assignments.get(task_id, {})
            assigned_member_name = assignment.get('assigned_member_name') or task.get('assigned_to', 'Unassigned')
            assigned_member_email = assignment.get('assigned_member_email')
            
            # Update task status and assigned member
            update_data = {"status": "approved"}
            if assigned_member_name and assigned_member_name != 'Unassigned':
                update_data["assigned_to"] = assigned_member_name
                
                # Update member workload (decrease idle percentage)
                estimated_hours = task.get('estimated_hours', '')
                if estimated_hours:
                    try:
                        hours = float(str(estimated_hours).strip())
                        if hours > 0:
                            update_member_workload(assigned_member_name, assigned_member_email, hours)
                    except (ValueError, TypeError):
                        pass  # Skip if hours can't be parsed
            
            update_task(task_id, update_data)
            
            # Format task message for Slack
            task_title = task.get('title', 'New Task')
            task_description = task.get('description', '')
            deadline = task.get('deadline', 'Not set')
            timeline = task.get('timeline', '')
            estimated_hours = task.get('estimated_hours', 'Not specified')
            
            # Find Slack user ID for tagging
            slack_user_id = None
            if assigned_member_email:
                slack_user_id = find_slack_user_by_email(assigned_member_email)
            
            # Build message with mention
            mention = f"<@{slack_user_id}>" if slack_user_id else assigned_member_name
            if slack_user_id:
                message = f"""📋 *New Task: {task_title}*

{task_description}

👤 *Assigned to:* {mention}
⏰ *Deadline:* {deadline}
⏱️ *Estimated Time:* {estimated_hours} {f"({timeline})" if timeline else ""}

Please confirm receipt and provide updates as you progress."""
            else:
                message = f"""📋 *New Task: {task_title}*

{task_description}

👤 *Assigned to:* {assigned_member_name}
⏰ *Deadline:* {deadline}
⏱️ *Estimated Time:* {estimated_hours} {f"({timeline})" if timeline else ""}

Please confirm receipt and provide updates as you progress."""
            
            # Send to Slack
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
                # Join channel first (required for bot to post)
                join_url = "https://slack.com/api/conversations.join"
                join_response = requests.post(join_url, headers=headers, json={"channel": channel_id}, timeout=5)
                if not join_response.json().get('ok'):
                    logger.warning(f"⚠️ Could not join channel {channel_id}, but continuing...")
            except Exception as join_error:
                logger.warning(f"⚠️ Error joining channel: {join_error}")
                # Continue anyway - might already be in channel
            
            try:
                response = requests.post(url, headers=headers, json=payload, timeout=10)
                slack_response = response.json()
                
                if slack_response.get("ok"):
                    approved_count += 1
                    # Update task status to sent
                    update_task(task_id, {"status": "sent_to_slack"})
                    logger.info(f"✅ Task {task_id} approved and sent to Slack")
                else:
                    error_msg = slack_response.get('error', 'Unknown error')
                    logger.error(f"❌ Failed to send task {task_id} to Slack: {error_msg}")
                    # Still mark as approved even if Slack send failed
                    approved_count += 1
                    update_task(task_id, {"status": "approved"})
            except Exception as send_error:
                logger.error(f"❌ Error sending to Slack: {send_error}")
                # Still mark as approved
                approved_count += 1
                update_task(task_id, {"status": "approved"})
        
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


@project_bp.route("/projects/<project_id>/resolve-issue", methods=["POST"])
def resolve_issue(project_id):
    """Analyze issue question with project context and send solution to Slack"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({"error": "No authorization provided"}), 401
    
    try:
        # Verify JWT token
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
        body = request.get_json()
        question = body.get('question')
        channel = body.get('channel')
        
        if not question or not channel:
            return jsonify({"error": "question and channel are required"}), 400
        
        logger.info(f"🔍 Issue resolution request for project: {project_id}")
        logger.info(f"❓ Question: {question}")
        
        # Get project
        from app.database.mongodb import db
        projects_collection = db['projects']
        project = projects_collection.find_one({"_id": ObjectId(project_id), "user_id": user_id})
        
        if not project:
            return jsonify({"error": "Project not found"}), 404
        
        # Get user's GitHub token
        users_collection = db['users']
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        github_token = user.get('github_token') if user else None
        
        if not github_token:
            return jsonify({"error": "GitHub not connected"}), 400
        
        # Get Slack token
        slack_token_info = get_token_for_user(user_id)
        if not slack_token_info:
            return jsonify({"error": "Slack not connected"}), 400
        
        slack_token = slack_token_info.get("bot_token") or slack_token_info.get("access_token")
        
        # Build project context from repos
        project_context = ""
        repos = project.get('repos', [])
        
        if repos:
            logger.info(f"📦 Analyzing {len(repos)} repositories...")
            for repo in repos[:3]:  # Limit to 3 repos to avoid timeout
                try:
                    full_name = repo.get('full_name') or repo.get('name', '')
                    if '/' in full_name:
                        owner, repo_name = full_name.split('/', 1)
                        logger.info(f"🔍 Analyzing {owner}/{repo_name}...")
                        context = create_deep_project_context(owner, repo_name, github_token)
                        project_context += f"\n\n=== Repository: {full_name} ===\n{context}\n"
                    else:
                        logger.warning(f"⚠️ Invalid repo format: {full_name}")
                except Exception as e:
                    logger.error(f"❌ Error analyzing repo {repo.get('name')}: {str(e)}")
                    continue
        
        # Get project tasks for additional context
        tasks = get_project_tasks(project_id)
        tasks_context = ""
        if tasks:
            tasks_context = "\n\n=== Project Tasks ===\n"
            for task in tasks[:10]:  # Limit to 10 tasks
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
        logger.info("🤖 Calling AI service for issue resolution...")
        import requests
        import os
        
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
        
        # Format message for Slack
        slack_message = f"""🔍 *Issue Resolution Request*

*Question:*
{question}

*Solution:*
{solution}

---
_Generated by Feeta AI based on your project context_"""
        
        # Send to Slack
        logger.info(f"📤 Sending solution to Slack channel: {channel}")
        
        # Join channel first
        try:
            join_url = "https://slack.com/api/conversations.join"
            join_headers = {"Authorization": f"Bearer {slack_token}", "Content-Type": "application/json"}
            join_payload = {"channel": channel}
            requests.post(join_url, headers=join_headers, json=join_payload, timeout=5)
        except Exception as e:
            logger.warning(f"⚠️ Could not join channel: {str(e)}")
        
        # Send message
        url = "https://slack.com/api/chat.postMessage"
        headers = {
            "Authorization": f"Bearer {slack_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "channel": channel,
            "text": slack_message,
            "parse": "full"
        }
        
        slack_response = requests.post(url, headers=headers, json=payload, timeout=10)
        slack_data = slack_response.json()
        
        if slack_data.get("ok"):
            logger.info("✅ Solution sent to Slack successfully")
            return jsonify({
                "ok": True,
                "message": "Issue analyzed and solution sent to Slack",
                "slack_ts": slack_data.get("ts")
            })
        else:
            error_msg = slack_data.get('error', 'Unknown error')
            logger.error(f"❌ Failed to send to Slack: {error_msg}")
            return jsonify({"error": f"Failed to send to Slack: {error_msg}"}), 500
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 401
    except Exception as e:
        logger.error(f"❌ Error resolving issue: {str(e)}")
        return jsonify({"error": str(e)}), 500


logger.info("✅ Project routes registered")

