"""
Analytics API - Team member progress and project analytics
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.database.mongodb import get_db
from bson import ObjectId
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics/team-progress', methods=['GET'])
@jwt_required()
def get_team_progress():
    """Get progress analytics for all team members"""
    try:
        user_email = get_jwt_identity()
        db = get_db()
        
        # Get all team members
        members = list(db.team_members.find({'user_email': user_email}))
        
        # Get all tasks
        tasks = list(db.tasks.find({'user_email': user_email}))
        
        team_progress = []
        for member in members:
            member_name = member.get('name', 'Unknown')
            member_email = member.get('email', '')
            
            # Filter tasks for this member
            member_tasks = [t for t in tasks if t.get('assigned_to') == member_name]
            
            total_tasks = len(member_tasks)
            completed_tasks = len([t for t in member_tasks if t.get('status') == 'completed'])
            in_progress_tasks = len([t for t in member_tasks if t.get('status') in ['approved', 'in_progress']])
            pending_tasks = len([t for t in member_tasks if t.get('status') in ['pending', 'pending_approval']])
            
            # Calculate completion rate
            completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
            # Calculate average task completion time
            completed_with_dates = [t for t in member_tasks if t.get('status') == 'completed' and t.get('created_at') and t.get('updated_at')]
            avg_completion_time = 0
            if completed_with_dates:
                total_time = sum([
                    (t.get('updated_at') - t.get('created_at')).total_seconds() / 3600
                    for t in completed_with_dates
                ])
                avg_completion_time = total_time / len(completed_with_dates)
            
            team_progress.append({
                'name': member_name,
                'email': member_email,
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'in_progress_tasks': in_progress_tasks,
                'pending_tasks': pending_tasks,
                'completion_rate': round(completion_rate, 1),
                'avg_completion_time_hours': round(avg_completion_time, 1),
                'idle_percentage': member.get('idle_percentage', 0),
                'skills': member.get('skills', [])
            })
        
        return jsonify({'team_progress': team_progress}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/analytics/project-stats', methods=['GET'])
@jwt_required()
def get_project_stats():
    """Get analytics for all projects"""
    try:
        user_email = get_jwt_identity()
        db = get_db()
        
        # Get all projects
        projects = list(db.projects.find({'user_email': user_email}))
        
        project_stats = []
        for project in projects:
            project_id = str(project['_id'])
            
            # Get tasks for this project
            tasks = list(db.tasks.find({
                'user_email': user_email,
                'project_id': project_id
            }))
            
            total_tasks = len(tasks)
            completed_tasks = len([t for t in tasks if t.get('status') == 'completed'])
            in_progress_tasks = len([t for t in tasks if t.get('status') in ['approved', 'in_progress']])
            pending_tasks = len([t for t in tasks if t.get('status') in ['pending', 'pending_approval']])
            
            # Calculate project health score (0-100)
            health_score = 0
            if total_tasks > 0:
                completion_weight = (completed_tasks / total_tasks) * 50
                progress_weight = (in_progress_tasks / total_tasks) * 30
                pending_penalty = (pending_tasks / total_tasks) * 20
                health_score = completion_weight + progress_weight + (20 - pending_penalty)
            
            # Calculate estimated completion date
            if in_progress_tasks > 0 and completed_tasks > 0:
                completed_with_dates = [t for t in tasks if t.get('status') == 'completed' and t.get('created_at') and t.get('updated_at')]
                if completed_with_dates:
                    avg_time = sum([
                        (t.get('updated_at') - t.get('created_at')).total_seconds() / 86400
                        for t in completed_with_dates
                    ]) / len(completed_with_dates)
                    estimated_days = avg_time * (in_progress_tasks + pending_tasks)
                    estimated_completion = datetime.now() + timedelta(days=estimated_days)
                else:
                    estimated_completion = None
            else:
                estimated_completion = None
            
            project_stats.append({
                'project_id': project_id,
                'project_name': project.get('name', 'Untitled'),
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'in_progress_tasks': in_progress_tasks,
                'pending_tasks': pending_tasks,
                'completion_percentage': round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1),
                'health_score': round(health_score, 1),
                'estimated_completion': estimated_completion.isoformat() if estimated_completion else None,
                'created_at': project.get('created_at').isoformat() if project.get('created_at') else None
            })
        
        return jsonify({'project_stats': project_stats}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/analytics/overview', methods=['GET'])
@jwt_required()
def get_analytics_overview():
    """Get overall analytics overview"""
    try:
        user_email = get_jwt_identity()
        db = get_db()
        
        # Get all data
        projects = list(db.projects.find({'user_email': user_email}))
        tasks = list(db.tasks.find({'user_email': user_email}))
        members = list(db.team_members.find({'user_email': user_email}))
        
        # Overall stats
        total_projects = len(projects)
        total_tasks = len(tasks)
        total_members = len(members)
        
        completed_tasks = len([t for t in tasks if t.get('status') == 'completed'])
        in_progress_tasks = len([t for t in tasks if t.get('status') in ['approved', 'in_progress']])
        pending_tasks = len([t for t in tasks if t.get('status') in ['pending', 'pending_approval']])
        
        # Calculate velocity (tasks completed per week)
        one_week_ago = datetime.now() - timedelta(days=7)
        recent_completions = [t for t in tasks if t.get('status') == 'completed' and t.get('updated_at') and t.get('updated_at') >= one_week_ago]
        velocity = len(recent_completions)
        
        # Calculate average task duration
        completed_with_dates = [t for t in tasks if t.get('status') == 'completed' and t.get('created_at') and t.get('updated_at')]
        avg_task_duration = 0
        if completed_with_dates:
            total_duration = sum([
                (t.get('updated_at') - t.get('created_at')).total_seconds() / 3600
                for t in completed_with_dates
            ])
            avg_task_duration = total_duration / len(completed_with_dates)
        
        # Team utilization
        active_members = len([m for m in members if m.get('idle_percentage', 100) < 80])
        
        overview = {
            'total_projects': total_projects,
            'total_tasks': total_tasks,
            'total_members': total_members,
            'completed_tasks': completed_tasks,
            'in_progress_tasks': in_progress_tasks,
            'pending_tasks': pending_tasks,
            'completion_rate': round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1),
            'velocity': velocity,
            'avg_task_duration_hours': round(avg_task_duration, 1),
            'active_members': active_members,
            'team_utilization': round((active_members / total_members * 100) if total_members > 0 else 0, 1)
        }
        
        return jsonify({'overview': overview}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@analytics_bp.route('/analytics/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'pong'}), 200

@analytics_bp.route('/analytics/track', methods=['POST'])
def track_visit():
    """Track a site visit"""
    try:
        data = request.get_json()
        
        # Basic validation
        if not data:
            print('[Analytics] ❌ No data provided')
            return jsonify({'error': 'No data provided'}), 400
            
        db = get_db()
        if db is None:
            print('[Analytics] ❌ Database not available')
            return jsonify({'error': 'Database connection not available'}), 503
        
        visit_data = {
            'user_id': data.get('user_id'),
            'path': data.get('path'),
            'referrer': data.get('referrer'),
            'duration': data.get('duration', 0),
            'timestamp': datetime.utcnow(),
            'user_agent': request.headers.get('User-Agent'),
            'ip': request.remote_addr
        }
        
        print(f'[Analytics] ✅ Tracking: {visit_data["path"]} | User: {visit_data["user_id"] or "Anonymous"} | Duration: {visit_data["duration"]}s')
        
        db.site_visits.insert_one(visit_data)
        
        return jsonify({'ok': True}), 201
        
    except Exception as e:
        # Don't block the frontend if tracking fails
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/analytics/founder', methods=['GET'])
def get_founder_insights():
    """Get aggregated analytics for the founder dashboard"""
    import os
    import logging
    
    logger = logging.getLogger(__name__)
    
    # Detect environment
    is_local = request.remote_addr in ['127.0.0.1', 'localhost', '::1'] or request.host.startswith('localhost')
    env = 'LOCAL' if is_local else 'DEPLOYMENT'
    
    # Log access details
    access_log = {
        'environment': env,
        'timestamp': datetime.utcnow().isoformat(),
        'ip': request.remote_addr,
        'host': request.host,
        'user_agent': request.headers.get('User-Agent'),
        'referer': request.headers.get('Referer'),
        'origin': request.headers.get('Origin')
    }
    
    logger.warning(f"🔍 [{env}] FOUNDER ANALYTICS ACCESS | IP: {access_log['ip']} | Host: {access_log['host']} | UA: {access_log['user_agent'][:50] if access_log['user_agent'] else 'None'}")
    print(f"\n{'='*80}")
    print(f"🚨 FOUNDER ANALYTICS ACCESSED - {env}")
    print(f"{'='*80}")
    print(f"⏰ Time: {access_log['timestamp']}")
    print(f"🌐 IP Address: {access_log['ip']}")
    print(f"🏠 Host: {access_log['host']}")
    print(f"🔗 Origin: {access_log['origin']}")
    print(f"📱 User Agent: {access_log['user_agent']}")
    print(f"🔙 Referer: {access_log['referer']}")
    print(f"{'='*80}\n")
    
    try:
        db = get_db()
        if db is None:
            return jsonify({'error': 'Database connection not available'}), 503
        
        # Store access log in database
        try:
            db.founder_analytics_access.insert_one(access_log)
        except Exception as log_err:
            logger.error(f"Failed to log access: {log_err}")
            
        # Time ranges
        now = datetime.utcnow()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        
        # 1. Total Visitors (Unique IPs approx)
        total_visits_24h = db.site_visits.count_documents({'timestamp': {'$gte': last_24h}})
        total_visits_7d = db.site_visits.count_documents({'timestamp': {'$gte': last_7d}})
        
        # 2. Top Pages (Last 7 days)
        pipeline_pages = [
            {'$match': {'timestamp': {'$gte': last_7d}}},
            {'$group': {'_id': '$path', 'count': {'$sum': 1}, 'avg_duration': {'$avg': '$duration'}}},
            {'$sort': {'count': -1}},
            {'$limit': 10}
        ]
        top_pages = list(db.site_visits.aggregate(pipeline_pages))
        
        # 3. Top Sources/Referrers (Last 7 days)
        pipeline_sources = [
            {'$match': {'timestamp': {'$gte': last_7d}}},
            {'$group': {'_id': '$referrer', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 10}
        ]
        top_sources = list(db.site_visits.aggregate(pipeline_sources))
        
        # 4. Recent Activity Feed
        recent_visits = list(db.site_visits.find().sort('timestamp', -1).limit(20))
        
        # Format for frontend
        formatted_pages = [{'path': p['_id'], 'views': p['count'], 'avg_time': round(p['avg_duration'] or 0, 1)} for p in top_pages]
        formatted_sources = [{'source': s['_id'] or 'Direct', 'count': s['count']} for s in top_sources]
        
        formatted_activity = []
        for v in recent_visits:
            formatted_activity.append({
                'path': v.get('path'),
                'time': v.get('timestamp').isoformat(),
                'source': v.get('referrer') or 'Direct',
                'duration': v.get('duration'),
                'user': v.get('user_id') or 'Anonymous'
            })

        return jsonify({
            'stats': {
                'visits_24h': total_visits_24h,
                'visits_7d': total_visits_7d,
            },
            'top_pages': formatted_pages,
            'top_sources': formatted_sources,
            'recent_activity': formatted_activity
        }), 200
        
    except Exception as e:
        logger.error(f"Founder analytics error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/analytics/founder/access-logs', methods=['GET'])
def get_founder_access_logs():
    """View who has accessed the founder analytics - LOCAL vs DEPLOYMENT"""
    try:
        db = get_db()
        if db is None:
            return jsonify({'error': 'Database connection not available'}), 503
        
        # Get all access logs
        logs = list(db.founder_analytics_access.find().sort('timestamp', -1).limit(100))
        
        # Separate by environment
        local_accesses = []
        deployment_accesses = []
        
        for log in logs:
            log_entry = {
                'timestamp': log.get('timestamp'),
                'ip': log.get('ip'),
                'host': log.get('host'),
                'user_agent': log.get('user_agent'),
                'referer': log.get('referer'),
                'origin': log.get('origin')
            }
            
            if log.get('environment') == 'LOCAL':
                local_accesses.append(log_entry)
            else:
                deployment_accesses.append(log_entry)
        
        return jsonify({
            'total_accesses': len(logs),
            'local_accesses': {
                'count': len(local_accesses),
                'logs': local_accesses
            },
            'deployment_accesses': {
                'count': len(deployment_accesses),
                'logs': deployment_accesses
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
