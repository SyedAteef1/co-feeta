import logging
import threading
import time
from datetime import datetime, timedelta
from app.database.mongodb import tasks_collection
from app.api.slack import get_token_for_user
import requests

logger = logging.getLogger(__name__)

def send_followup_for_task(task, slack_token):
    try:
        task_id = str(task.get('_id'))
        slack_channel_id = task.get('slack_channel_id')
        slack_user_id = task.get('slack_user_id')
        task_title = task.get('title', 'Task')
        deadline = task.get('deadline', 'Not set')
        
        if not slack_channel_id or not slack_user_id:
            return False
        
        message = f"<@{slack_user_id}> - Quick check-in on:\n\n*{task_title}*\nDeadline: {deadline}\n\nPlease share a quick status update when you can. Thanks!"
        
        headers = {"Authorization": f"Bearer {slack_token}", "Content-Type": "application/json"}
        url = "https://slack.com/api/chat.postMessage"
        payload = {"channel": slack_channel_id, "text": message, "mrkdwn": True}
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        
        if response.json().get("ok"):
            from bson import ObjectId
            tasks_collection.update_one({"_id": ObjectId(task_id)}, {"$set": {"last_followup_at": datetime.utcnow()}})
            logger.info(f"Follow-up sent for task {task_id}")
            return True
        return False
    except Exception as e:
        logger.error(f"Error sending follow-up: {str(e)}")
        return False

def check_and_send_followups():
    try:
        ten_mins_ago = datetime.utcnow() - timedelta(minutes=10)
        query = {
            "status": {"$in": ["sent_to_slack", "approved", "in_progress"]},
            "slack_channel_id": {"$exists": True},
            "slack_user_id": {"$exists": True},
            "$or": [{"last_followup_at": {"$exists": False}}, {"last_followup_at": {"$lt": ten_mins_ago}}]
        }
        tasks = list(tasks_collection.find(query))
        if not tasks:
            return
        logger.info(f"Found {len(tasks)} tasks needing follow-up")
        user_tasks = {}
        for task in tasks:
            project_id = str(task.get('project_id'))
            if project_id not in user_tasks:
                user_tasks[project_id] = []
            user_tasks[project_id].append(task)
        for project_id, project_tasks in user_tasks.items():
            try:
                from app.database.mongodb import projects_collection
                from bson import ObjectId
                project = projects_collection.find_one({"_id": ObjectId(project_id)})
                if not project:
                    continue
                user_id = project.get('user_id')
                if not user_id:
                    continue
                token_info = get_token_for_user(user_id)
                if not token_info:
                    continue
                slack_token = token_info.get("bot_token") or token_info.get("access_token")
                for task in project_tasks:
                    send_followup_for_task(task, slack_token)
                    time.sleep(1)
            except Exception as e:
                logger.error(f"Error processing project {project_id}: {str(e)}")
                continue
    except Exception as e:
        logger.error(f"Error in follow-up checker: {str(e)}")

def start_followup_scheduler():
    def run_scheduler():
        logger.info("Task follow-up scheduler started (every 10 minutes)")
        while True:
            try:
                check_and_send_followups()
            except Exception as e:
                logger.error(f"Scheduler error: {str(e)}")
            time.sleep(600)
    thread = threading.Thread(target=run_scheduler, daemon=True)
    thread.start()
    logger.info("Follow-up scheduler thread started")
