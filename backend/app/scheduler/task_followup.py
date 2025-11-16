"""
Task Follow-up Scheduler
Automatically sends follow-up messages for tasks every 2 minutes
"""
import logging
import threading
import time
from datetime import datetime, timedelta
from app.database.mongodb import tasks_collection
from app.api.slack import get_token_for_user
import requests
import os

logger = logging.getLogger(__name__)

def send_followup_for_task(task, slack_token):
    """Send follow-up message for a single task"""
    try:
        task_id = str(task.get('_id'))
        slack_channel_id = task.get('slack_channel_id')
        slack_user_id = task.get('slack_user_id')
        task_title = task.get('title', 'Task')
        deadline = task.get('deadline', 'Not set')
        
        if not slack_channel_id or not slack_user_id:
            return False
        
        # Build follow-up messages
        dm_followup = f"""👋 Hey! Just checking in on your task:

📋 *{task_title}*
⏰ Deadline: {deadline}

How's it going? Any blockers or questions? Let me know if you need help! 🚀"""
        
        channel_followup = f"""<@{slack_user_id}> - Quick check-in on:

📋 *{task_title}*
⏰ Deadline: {deadline}

Please share a quick status update when you can. Thanks! 👍"""
        
        headers = {
            "Authorization": f"Bearer {slack_token}",
            "Content-Type": "application/json"
        }
        
        # Send DM
        try:
            im_url = "https://slack.com/api/conversations.open"
            im_response = requests.post(im_url, headers=headers, json={"users": slack_user_id}, timeout=5)
            im_data = im_response.json()
            
            if im_data.get("ok"):
                dm_channel_id = im_data.get("channel", {}).get("id")
                if dm_channel_id:
                    dm_url = "https://slack.com/api/chat.postMessage"
                    dm_payload = {"channel": dm_channel_id, "text": dm_followup, "mrkdwn": True}
                    requests.post(dm_url, headers=headers, json=dm_payload, timeout=10)
        except Exception as dm_error:
            logger.warning(f"⚠️ Error sending follow-up DM: {dm_error}")
        
        # Send channel message
        channel_url = "https://slack.com/api/chat.postMessage"
        channel_payload = {"channel": slack_channel_id, "text": channel_followup, "mrkdwn": True}
        response = requests.post(channel_url, headers=headers, json=channel_payload, timeout=10)
        
        if response.json().get("ok"):
            # Update last follow-up time
            from bson import ObjectId
            tasks_collection.update_one(
                {"_id": ObjectId(task_id)},
                {"$set": {"last_followup_at": datetime.utcnow()}}
            )
            logger.info(f"✅ Follow-up sent for task {task_id}")
            return True
        
        return False
    except Exception as e:
        logger.error(f"❌ Error sending follow-up: {str(e)}")
        return False

def check_and_send_followups():
    """Check all tasks and send follow-ups if needed"""
    try:
        # Find tasks that need follow-up (sent to Slack, not completed, last follow-up > 2 mins ago)
        two_mins_ago = datetime.utcnow() - timedelta(minutes=2)
        
        query = {
            "status": {"$in": ["sent_to_slack", "approved", "in_progress"]},
            "slack_channel_id": {"$exists": True},
            "slack_user_id": {"$exists": True},
            "$or": [
                {"last_followup_at": {"$exists": False}},
                {"last_followup_at": {"$lt": two_mins_ago}}
            ]
        }
        
        tasks = list(tasks_collection.find(query))
        
        if not tasks:
            return
        
        logger.info(f"📋 Found {len(tasks)} tasks needing follow-up")
        
        # Group tasks by user to get their Slack tokens
        user_tasks = {}
        for task in tasks:
            project_id = str(task.get('project_id'))
            if project_id not in user_tasks:
                user_tasks[project_id] = []
            user_tasks[project_id].append(task)
        
        # Send follow-ups
        for project_id, project_tasks in user_tasks.items():
            try:
                # Get project to find user_id
                from app.database.mongodb import projects_collection
                from bson import ObjectId
                project = projects_collection.find_one({"_id": ObjectId(project_id)})
                if not project:
                    continue
                
                user_id = project.get('user_id')
                if not user_id:
                    continue
                
                # Get Slack token
                token_info = get_token_for_user(user_id)
                if not token_info:
                    continue
                
                slack_token = token_info.get("bot_token") or token_info.get("access_token")
                
                # Send follow-ups for all tasks
                for task in project_tasks:
                    send_followup_for_task(task, slack_token)
                    time.sleep(1)  # Rate limiting
                    
            except Exception as e:
                logger.error(f"❌ Error processing project {project_id}: {str(e)}")
                continue
                
    except Exception as e:
        logger.error(f"❌ Error in follow-up checker: {str(e)}")

def start_followup_scheduler():
    """Start the follow-up scheduler in a background thread"""
    def run_scheduler():
        logger.info("🚀 Task follow-up scheduler started (every 2 minutes)")
        while True:
            try:
                check_and_send_followups()
            except Exception as e:
                logger.error(f"❌ Scheduler error: {str(e)}")
            time.sleep(120)  # 2 minutes
    
    thread = threading.Thread(target=run_scheduler, daemon=True)
    thread.start()
    logger.info("✅ Follow-up scheduler thread started")
