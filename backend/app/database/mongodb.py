"""
MongoDB Database Layer for Feeta
Handles all database operations for projects, messages, and repo context
"""
import os
import logging
from datetime import datetime
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId

logger = logging.getLogger(__name__)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")

# MongoDB Client
client = None
db = None

# Collections
users_collection = None
projects_collection = None
messages_collection = None
repo_context_collection = None
conversation_history_collection = None
tasks_collection = None


def init_db():
    """Initialize MongoDB connection and create indexes"""
    global client, db, users_collection, projects_collection, messages_collection
    global repo_context_collection, conversation_history_collection, tasks_collection
    
    try:
        logger.info("🔌 Connecting to MongoDB...")
        logger.info(f"📍 MongoDB URI: {MONGO_URI[:50]}..." if len(MONGO_URI) > 50 else f"📍 MongoDB URI: {MONGO_URI}")
        
        # Enhanced connection settings with DNS timeout handling
        connection_options = {
            "serverSelectionTimeoutMS": 10000,  # 10 second timeout
            "connectTimeoutMS": 15000,  # 15 second connection timeout
            "socketTimeoutMS": 20000,  # 20 second socket timeout
            "maxPoolSize": 10,
            "retryWrites": True,
            "retryReads": True,
        }
        
        # For SRV connections (mongodb+srv://), add DNS timeout
        if MONGO_URI.startswith("mongodb+srv://"):
            # SRV connections need DNS resolution, add longer timeout
            connection_options["serverSelectionTimeoutMS"] = 20000
            connection_options["connectTimeoutMS"] = 20000
            logger.info("🔍 Detected SRV connection, using extended timeouts for DNS resolution")
        
        client = MongoClient(MONGO_URI, **connection_options)
        
        # Test the connection with retry
        max_retries = 3
        for attempt in range(max_retries):
            try:
                client.admin.command('ping')
                logger.info("✅ MongoDB connection successful!")
                break
            except Exception as ping_error:
                if attempt < max_retries - 1:
                    logger.warning(f"⚠️ Connection attempt {attempt + 1} failed, retrying... ({str(ping_error)[:100]})")
                    import time
                    time.sleep(2)  # Wait 2 seconds before retry
                else:
                    raise ping_error
        
        db = client['feeta']
        
        # Initialize collections
        users_collection = db['users']
        projects_collection = db['projects']
        messages_collection = db['messages']
        repo_context_collection = db['repo_contexts']
        conversation_history_collection = db['conversation_history']
        tasks_collection = db['tasks']
        
        # Create indexes for performance (with error handling)
        try:
            users_collection.create_index([("email", ASCENDING)], unique=True)
            projects_collection.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
            messages_collection.create_index([("project_id", ASCENDING), ("created_at", ASCENDING)])
            repo_context_collection.create_index([("repo_full_name", ASCENDING)], unique=True)
            conversation_history_collection.create_index([("session_id", ASCENDING)], unique=True)
            tasks_collection.create_index([("project_id", ASCENDING), ("created_at", DESCENDING)])
            tasks_collection.create_index([("status", ASCENDING)])
            logger.info("✅ MongoDB collections initialized with indexes")
        except Exception as index_error:
            logger.warning(f"⚠️ Some indexes may already exist: {str(index_error)[:100]}")
        
        return True
    except Exception as e:
        error_msg = str(e)
        logger.error(f"❌ Failed to initialize MongoDB: {error_msg}")
        
        # Provide helpful error messages
        if "DNS" in error_msg or "resolution" in error_msg:
            logger.error("💡 DNS Resolution Error - Check your network connection and MongoDB URI")
            logger.error("💡 If using MongoDB Atlas, verify your connection string is correct")
            logger.error("💡 Try using a direct connection string instead of SRV if DNS is failing")
        elif "timeout" in error_msg.lower():
            logger.error("💡 Connection Timeout - Check if MongoDB server is accessible")
            logger.error("💡 Verify firewall settings and network connectivity")
        
        # Don't raise - allow app to start but database operations will fail gracefully
        logger.warning("⚠️ Continuing without database connection - some features may not work")
        return False


# ============== USER OPERATIONS ==============

def create_or_update_user(user_id, email, name, github_data=None):
    """Create or update a user in the database"""
    try:
        user_data = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "updated_at": datetime.utcnow()
        }
        
        if github_data:
            user_data["github_connected"] = True
            user_data["github_username"] = github_data.get("login")
            user_data["github_token"] = github_data.get("token")
            user_data["github_id"] = github_data.get("id")
        
        result = users_collection.update_one(
            {"user_id": user_id},
            {"$set": user_data, "$setOnInsert": {"created_at": datetime.utcnow()}},
            upsert=True
        )
        
        logger.info(f"✅ User {user_id} saved to database")
        return True
    except Exception as e:
        logger.error(f"❌ Error saving user: {str(e)}")
        return False


def get_user(user_id):
    """Get user from database"""
    try:
        user = users_collection.find_one({"user_id": user_id})
        if user:
            user['_id'] = str(user['_id'])
        return user
    except Exception as e:
        logger.error(f"❌ Error getting user: {str(e)}")
        return None


# ============== PROJECT OPERATIONS ==============

def create_project(user_id, name, repo_data=None):
    """Create a new project"""
    try:
        project = {
            "user_id": user_id,
            "name": name,
            "repo": repo_data,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = projects_collection.insert_one(project)
        project['_id'] = str(result.inserted_id)
        project['id'] = str(result.inserted_id)
        
        logger.info(f"✅ Project '{name}' created for user {user_id}")
        return project
    except Exception as e:
        logger.error(f"❌ Error creating project: {str(e)}")
        return None


def get_user_projects(user_id):
    """Get all projects for a user"""
    try:
        projects = list(projects_collection.find(
            {"user_id": user_id}
        ).sort("created_at", DESCENDING))
        
        for project in projects:
            project['_id'] = str(project['_id'])
            project['id'] = str(project['_id'])
            
            # Get message count for each project
            msg_count = messages_collection.count_documents({"project_id": project['id']})
            project['message_count'] = msg_count
        
        logger.info(f"✅ Found {len(projects)} projects for user {user_id}")
        return projects
    except Exception as e:
        logger.error(f"❌ Error getting projects: {str(e)}")
        return []


def update_project(project_id, updates):
    """Update a project"""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(project_id):
            logger.error(f"❌ Invalid project_id: {project_id}")
            return False
        
        updates['updated_at'] = datetime.utcnow()
        
        result = projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": updates}
        )
        
        if result.modified_count > 0:
            logger.info(f"✅ Project {project_id} updated")
            return True
        return False
    except Exception as e:
        logger.error(f"❌ Error updating project: {str(e)}")
        return False


def delete_project(project_id):
    """Delete a project and its messages and tasks"""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(project_id):
            logger.error(f"❌ Invalid project_id: {project_id}")
            return False
        
        # Delete all messages for this project
        messages_collection.delete_many({"project_id": project_id})
        
        # Delete all tasks for this project
        tasks_collection.delete_many({"project_id": project_id})
        
        # Delete the project
        result = projects_collection.delete_one({"_id": ObjectId(project_id)})
        
        if result.deleted_count > 0:
            logger.info(f"✅ Project {project_id} deleted")
            return True
        return False
    except Exception as e:
        logger.error(f"❌ Error deleting project: {str(e)}")
        return False


# ============== MESSAGE OPERATIONS ==============

def save_message(project_id, role, content, data=None):
    """Save a message to the database"""
    try:
        message = {
            "project_id": project_id,
            "role": role,  # 'user' or 'assistant'
            "content": content,
            "data": data,  # Store questions, plans, etc.
            "created_at": datetime.utcnow()
        }
        
        result = messages_collection.insert_one(message)
        message['_id'] = str(result.inserted_id)
        message['id'] = str(result.inserted_id)
        
        # Update project's updated_at timestamp (only if valid ObjectId)
        if ObjectId.is_valid(project_id):
            try:
                projects_collection.update_one(
                    {"_id": ObjectId(project_id)},
                    {"$set": {"updated_at": datetime.utcnow()}}
                )
            except Exception:
                pass  # Ignore update errors for project timestamp
        
        logger.info(f"✅ Message saved to project {project_id}")
        return message
    except Exception as e:
        logger.error(f"❌ Error saving message: {str(e)}")
        return None


def get_project_messages(project_id):
    """Get all messages for a project"""
    try:
        messages = list(messages_collection.find(
            {"project_id": project_id}
        ).sort("created_at", ASCENDING))
        
        for message in messages:
            message['_id'] = str(message['_id'])
            message['id'] = str(message['_id'])
        
        logger.info(f"✅ Found {len(messages)} messages for project {project_id}")
        return messages
    except Exception as e:
        logger.error(f"❌ Error getting messages: {str(e)}")
        return []


# ============== REPO CONTEXT OPERATIONS ==============

def save_repo_context(repo_full_name, context_text, language=None, metadata=None):
    """Save GitHub repo context for reuse"""
    try:
        repo_context = {
            "repo_full_name": repo_full_name,
            "context_text": context_text,
            "language": language,
            "metadata": metadata or {},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "access_count": 0
        }
        
        result = repo_context_collection.update_one(
            {"repo_full_name": repo_full_name},
            {
                "$set": repo_context,
                "$inc": {"access_count": 1}
            },
            upsert=True
        )
        
        logger.info(f"✅ Repo context saved for {repo_full_name}")
        return True
    except Exception as e:
        logger.error(f"❌ Error saving repo context: {str(e)}")
        return False


def get_repo_context(repo_full_name):
    """Get cached repo context"""
    try:
        context = repo_context_collection.find_one({"repo_full_name": repo_full_name})
        
        if context:
            # Increment access count
            repo_context_collection.update_one(
                {"repo_full_name": repo_full_name},
                {"$inc": {"access_count": 1}}
            )
            
            context['_id'] = str(context['_id'])
            logger.info(f"✅ Repo context found for {repo_full_name} (cached)")
            return context
        
        logger.info(f"ℹ️ No cached context for {repo_full_name}")
        return None
    except Exception as e:
        logger.error(f"❌ Error getting repo context: {str(e)}")
        return None


def update_repo_context(repo_full_name, context_text):
    """Update existing repo context"""
    try:
        result = repo_context_collection.update_one(
            {"repo_full_name": repo_full_name},
            {
                "$set": {
                    "context_text": context_text,
                    "updated_at": datetime.utcnow()
                },
                "$inc": {"access_count": 1}
            }
        )
        
        if result.modified_count > 0:
            logger.info(f"✅ Repo context updated for {repo_full_name}")
            return True
        return False
    except Exception as e:
        logger.error(f"❌ Error updating repo context: {str(e)}")
        return False


# ============== CONVERSATION HISTORY OPERATIONS ==============

def save_conversation_history(session_id, prompt, analysis=None, plan=None):
    """Save conversation history to database"""
    try:
        conversation_entry = {
            "timestamp": datetime.utcnow(),
            "prompt": prompt,
            "analysis": analysis,
            "plan": plan
        }
        
        result = conversation_history_collection.update_one(
            {"session_id": session_id},
            {
                "$push": {"conversations": conversation_entry},
                "$setOnInsert": {"created_at": datetime.utcnow()}
            },
            upsert=True
        )
        
        logger.info(f"✅ Conversation saved for session {session_id}")
        return True
    except Exception as e:
        logger.error(f"❌ Error saving conversation history: {str(e)}")
        return False


def get_conversation_history(session_id):
    """Get conversation history from database"""
    try:
        history = conversation_history_collection.find_one({"session_id": session_id})
        
        if history:
            history['_id'] = str(history['_id'])
            logger.info(f"✅ Found {len(history.get('conversations', []))} conversations")
            return history
        
        return {"conversations": []}
    except Exception as e:
        logger.error(f"❌ Error getting conversation history: {str(e)}")
        return {"conversations": []}


# ============== TASK OPERATIONS ==============

def create_tasks(project_id, subtasks, session_id=None):
    """Create multiple tasks from AI-generated subtasks"""
    try:
        if not subtasks or not isinstance(subtasks, list):
            logger.warning(f"⚠️ Invalid subtasks provided: {subtasks}")
            return []
        
        if not project_id:
            logger.error("❌ project_id is required")
            return []
        
        task_ids = []
        
        for subtask in subtasks:
            # Skip invalid subtasks
            if not isinstance(subtask, dict):
                logger.warning(f"⚠️ Skipping invalid subtask: {subtask}")
                continue
            
            # Ensure title exists
            title = subtask.get("title") or subtask.get("task", "")
            if not title:
                logger.warning(f"⚠️ Skipping subtask with no title: {subtask}")
                continue
            
            task = {
                "project_id": project_id,
                "title": title,
                "description": subtask.get("description", ""),
                "priority": subtask.get("priority", "medium"),
                "status": "pending_approval",  # Require approval before sending to Slack
                "assigned_to": subtask.get("assigned_to", "Unassigned"),
                "deadline": subtask.get("deadline", ""),  # YYYY-MM-DD format from LLM
                "estimated_hours": subtask.get("estimated_hours", ""),
                "timeline": subtask.get("timeline", ""),  # Human-readable timeline from LLM
                "role": subtask.get("role", ""),
                "session_id": session_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = tasks_collection.insert_one(task)
            task_ids.append(str(result.inserted_id))
        
        logger.info(f"✅ Created {len(task_ids)} tasks for project {project_id}")
        return task_ids
    except Exception as e:
        logger.error(f"❌ Error creating tasks: {str(e)}")
        return []


def get_project_tasks(project_id, status_filter=None):
    """Get all tasks for a project"""
    try:
        query = {"project_id": project_id}
        
        if status_filter:
            query["status"] = status_filter
        
        tasks = list(tasks_collection.find(query).sort("created_at", DESCENDING))
        
        for task in tasks:
            task['_id'] = str(task['_id'])
            task['id'] = str(task['_id'])
        
        logger.info(f"✅ Found {len(tasks)} tasks for project {project_id}")
        return tasks
    except Exception as e:
        logger.error(f"❌ Error getting tasks: {str(e)}")
        return []


def update_task(task_id, updates):
    """Update a task"""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(task_id):
            logger.error(f"❌ Invalid task_id: {task_id}")
            return False
        
        updates['updated_at'] = datetime.utcnow()
        
        result = tasks_collection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": updates}
        )
        
        if result.modified_count > 0:
            logger.info(f"✅ Task {task_id} updated")
            return True
        return False
    except Exception as e:
        logger.error(f"❌ Error updating task: {str(e)}")
        return False


def delete_task(task_id):
    """Delete a task"""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(task_id):
            logger.error(f"❌ Invalid task_id: {task_id}")
            return False
        
        result = tasks_collection.delete_one({"_id": ObjectId(task_id)})
        
        if result.deleted_count > 0:
            logger.info(f"✅ Task {task_id} deleted")
            return True
        return False
    except Exception as e:
        logger.error(f"❌ Error deleting task: {str(e)}")
        return False


# ============== UTILITY FUNCTIONS ==============

def get_database_stats():
    """Get database statistics"""
    try:
        # Check if collections are initialized
        if not all([users_collection, projects_collection, messages_collection, 
                   tasks_collection, repo_context_collection, conversation_history_collection]):
            logger.warning("⚠️ Some collections not initialized, returning empty stats")
            return {}
        
        stats = {
            "users": users_collection.count_documents({}),
            "projects": projects_collection.count_documents({}),
            "messages": messages_collection.count_documents({}),
            "tasks": tasks_collection.count_documents({}),
            "repo_contexts": repo_context_collection.count_documents({}),
            "conversations": conversation_history_collection.count_documents({})
        }
        return stats
    except Exception as e:
        logger.error(f"❌ Error getting database stats: {str(e)}")
        return {}


# ============== TEAM MEMBER OPERATIONS ==============

def get_db():
    """Get database instance"""
    return db

def get_user_team_members(user_id):
    """Get all team members for a user"""
    try:
        # Validate ObjectId before querying
        if not ObjectId.is_valid(user_id):
            logger.warning(f"⚠️ Invalid user_id format: {user_id}, returning empty list")
            return []
        
        members = list(db.team_members.find({'user_id': ObjectId(user_id)}))
        
        # Convert ObjectId to string and format for AI service
        formatted_members = []
        for member in members:
            formatted_member = {
                'name': member.get('name', member.get('email', 'Unknown')),
                'role': member.get('role', 'Developer'),
                'skills': member.get('skills', []),
                'expertise': member.get('expertise', []),
                'experience_years': member.get('experience_years', 0),
                'status': member.get('status', 'available')
            }
            formatted_members.append(formatted_member)
        
        logger.info(f"✅ Found {len(formatted_members)} team members for user {user_id}")
        return formatted_members
    except Exception as e:
        logger.error(f"❌ Error getting team members: {str(e)}")
        return []


def get_weekly_deadlines(user_id, week_start_date=None):
    """Get minimum deadlines for tasks in the current week"""
    try:
        from datetime import timedelta
        
        # Get all projects for the user
        user_projects = list(projects_collection.find({"user_id": user_id}))
        project_ids = [str(p["_id"]) for p in user_projects]
        
        if not project_ids:
            return {"min_deadline": None, "tasks_this_week": [], "count": 0}
        
        # Calculate week range (Monday to Sunday)
        if week_start_date:
            try:
                week_start = datetime.strptime(week_start_date, "%Y-%m-%d")
            except:
                week_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                # Get Monday of current week
                days_since_monday = week_start.weekday()
                week_start = week_start - timedelta(days=days_since_monday)
        else:
            week_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            # Get Monday of current week
            days_since_monday = week_start.weekday()
            week_start = week_start - timedelta(days=days_since_monday)
        
        week_end = week_start + timedelta(days=6)
        
        # Get all tasks for user's projects
        all_tasks = list(tasks_collection.find({"project_id": {"$in": project_ids}}))
        
        # Filter tasks with deadlines in this week
        tasks_this_week = []
        valid_deadlines = []
        
        for task in all_tasks:
            deadline_str = task.get("deadline", "")
            if deadline_str:
                try:
                    # Parse deadline (YYYY-MM-DD format)
                    deadline_date = datetime.strptime(deadline_str, "%Y-%m-%d")
                    
                    # Check if deadline is within this week
                    if week_start <= deadline_date <= week_end:
                        tasks_this_week.append({
                            "id": str(task.get("_id", "")),
                            "title": task.get("title", ""),
                            "deadline": deadline_str,
                            "timeline": task.get("timeline", ""),
                            "estimated_hours": task.get("estimated_hours", ""),
                            "project_id": task.get("project_id", ""),
                            "assigned_to": task.get("assigned_to", "Unassigned"),
                            "status": task.get("status", "pending")
                        })
                        valid_deadlines.append(deadline_date)
                except ValueError:
                    # Invalid date format, skip
                    continue
        
        # Find minimum deadline
        min_deadline = None
        if valid_deadlines:
            min_deadline = min(valid_deadlines).strftime("%Y-%m-%d")
        
        return {
            "min_deadline": min_deadline,
            "week_start": week_start.strftime("%Y-%m-%d"),
            "week_end": week_end.strftime("%Y-%m-%d"),
            "tasks_this_week": sorted(tasks_this_week, key=lambda x: x.get("deadline", "")),
            "count": len(tasks_this_week)
        }
    except Exception as e:
        logger.error(f"❌ Error getting weekly deadlines: {str(e)}")
        return {"min_deadline": None, "tasks_this_week": [], "count": 0}

logger.info("✅ Database module initialized successfully")

