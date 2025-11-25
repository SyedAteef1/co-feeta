from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from ..database.mongodb import get_db

feeta_bp = Blueprint('feeta', __name__)

@feeta_bp.route('/api/feeta/activities', methods=['GET'])
@jwt_required()
def get_activities():
    user_id = get_jwt_identity()
    db = get_db()
    activities = list(db.feeta_activities.find(
        {'user_id': user_id},
        {'_id': 0}
    ).sort('timestamp', -1).limit(50))
    return jsonify({'activities': activities})

@feeta_bp.route('/api/feeta/questions', methods=['GET'])
@jwt_required()
def get_questions():
    user_id = get_jwt_identity()
    db = get_db()
    questions = list(db.feeta_questions.find(
        {'user_id': user_id, 'answered': False},
        {'_id': 0}
    ))
    return jsonify({'questions': questions})

@feeta_bp.route('/api/feeta/questions/<question_id>/answer', methods=['POST'])
@jwt_required()
def answer_question(question_id):
    user_id = get_jwt_identity()
    data = request.json
    db = get_db()
    db.feeta_questions.update_one(
        {'id': question_id, 'user_id': user_id},
        {'$set': {'answered': True, 'answer': data['answer'], 'answered_at': datetime.utcnow()}}
    )
    return jsonify({'success': True})

@feeta_bp.route('/api/feeta/assignments', methods=['GET'])
@jwt_required()
def get_assignments():
    user_id = get_jwt_identity()
    db = get_db()
    assignments = list(db.feeta_assignments.find(
        {'user_id': user_id},
        {'_id': 0}
    ).sort('timestamp', -1).limit(20))
    return jsonify({'assignments': assignments})

@feeta_bp.route('/api/feeta/autopilot', methods=['GET'])
@jwt_required()
def get_autopilot():
    user_id = get_jwt_identity()
    db = get_db()
    config = db.feeta_config.find_one({'user_id': user_id}) or {}
    actions = list(db.feeta_autopilot.find(
        {'user_id': user_id},
        {'_id': 0}
    ).sort('timestamp', -1).limit(30))
    return jsonify({'enabled': config.get('autopilot_enabled', False), 'actions': actions})

@feeta_bp.route('/api/feeta/autopilot/toggle', methods=['POST'])
@jwt_required()
def toggle_autopilot():
    user_id = get_jwt_identity()
    db = get_db()
    config = db.feeta_config.find_one({'user_id': user_id}) or {}
    new_state = not config.get('autopilot_enabled', False)
    db.feeta_config.update_one(
        {'user_id': user_id},
        {'$set': {'autopilot_enabled': new_state}},
        upsert=True
    )
    return jsonify({'enabled': new_state})

@feeta_bp.route('/api/feeta/summaries', methods=['GET'])
@jwt_required()
def get_summaries():
    user_id = get_jwt_identity()
    db = get_db()
    
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)
    
    daily = db.tasks.aggregate([
        {'$match': {'user_id': user_id, 'created_at': {'$gte': today}}},
        {'$group': {
            '_id': None,
            'completed': {'$sum': {'$cond': [{'$eq': ['$status', 'completed']}, 1, 0]}},
            'created': {'$sum': 1}
        }}
    ])
    daily_data = list(daily)[0] if list(daily) else {'completed': 0, 'created': 0}
    
    weekly = db.tasks.aggregate([
        {'$match': {'user_id': user_id, 'created_at': {'$gte': week_ago}}},
        {'$group': {
            '_id': None,
            'completed': {'$sum': {'$cond': [{'$eq': ['$status', 'completed']}, 1, 0]}},
            'created': {'$sum': 1}
        }}
    ])
    weekly_data = list(weekly)[0] if list(weekly) else {'completed': 0, 'created': 0}
    
    return jsonify({
        'daily': {
            'completed': daily_data.get('completed', 0),
            'created': daily_data.get('created', 0),
            'followups': 0,
            'insights': 'Great progress today! Keep it up.'
        },
        'weekly': {
            'completed': weekly_data.get('completed', 0),
            'created': weekly_data.get('created', 0),
            'followups': 0,
            'insights': 'This week you completed ' + str(weekly_data.get('completed', 0)) + ' tasks.'
        }
    })

@feeta_bp.route('/api/projects/<project_id>/intents', methods=['GET'])
@jwt_required()
def get_project_intents(project_id):
    user_id = get_jwt_identity()
    db = get_db()
    intents = list(db.feeta_intents.find(
        {'user_id': user_id, 'project_id': project_id},
        {'_id': 0}
    ).sort('timestamp', -1).limit(20))
    return jsonify({'intents': intents})

@feeta_bp.route('/api/projects/<project_id>/repo-intelligence', methods=['GET'])
@jwt_required()
def get_repo_intelligence(project_id):
    user_id = get_jwt_identity()
    db = get_db()
    project = db.projects.find_one({'_id': project_id, 'user_id': user_id})
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    return jsonify({
        'commits': 0,
        'prs': 0,
        'issues': 0,
        'mappings': []
    })
