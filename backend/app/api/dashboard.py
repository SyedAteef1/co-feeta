"""
Dashboard API - Optimized single endpoint for all dashboard data
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database.mongodb import db
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    """Get ALL dashboard data in ONE request - blazing fast!"""
    try:
        user_id = get_jwt_identity()
        
        # Parallel aggregation queries (MongoDB does these efficiently)
        pipeline_tasks = [
            {"$match": {"user_id": user_id}},
            {"$facet": {
                "by_status": [
                    {"$group": {"_id": "$status", "count": {"$sum": 1}}}
                ],
                "by_priority": [
                    {"$match": {"priority": {"$in": ["high", "urgent", "critical"]}}},
                    {"$count": "count"}
                ],
                "total": [{"$count": "count"}]
            }}
        ]
        
        task_stats = list(db.tasks.aggregate(pipeline_tasks))
        
        # Get projects with task counts in one query
        projects = list(db.projects.aggregate([
            {"$match": {"user_id": user_id}},
            {"$sort": {"updated_at": -1}},
            {"$limit": 10},
            {"$lookup": {
                "from": "tasks",
                "localField": "_id",
                "foreignField": "project_id",
                "as": "tasks"
            }},
            {"$project": {
                "name": 1,
                "created_at": 1,
                "updated_at": 1,
                "repos": 1,
                "task_count": {"$size": "$tasks"}
            }}
        ]))
        
        # Get team members count
        members_count = db.team_members.count_documents({"user_id": user_id})
        
        # Parse task stats
        stats = task_stats[0] if task_stats else {}
        by_status = {item["_id"]: item["count"] for item in stats.get("by_status", [])}
        priority_tasks = stats.get("by_priority", [{}])[0].get("count", 0) if stats.get("by_priority") else 0
        total_tasks = stats.get("total", [{}])[0].get("count", 0) if stats.get("total") else 0
        
        completed = by_status.get("completed", 0) + by_status.get("done", 0)
        in_progress = by_status.get("in_progress", 0) + by_status.get("approved", 0)
        pending = by_status.get("pending", 0) + by_status.get("pending_approval", 0)
        
        return jsonify({
            "stats": {
                "activeProjects": len(projects),
                "priorityTasks": priority_tasks,
                "tasksCompleted": completed,
                "members": members_count
            },
            "projects": projects,
            "taskBreakdown": {
                "completed": completed,
                "inProgress": in_progress,
                "pending": pending,
                "total": total_tasks
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        return jsonify({"error": str(e)}), 500
