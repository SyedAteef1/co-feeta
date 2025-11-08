from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import tempfile
from bson import ObjectId
import google.generativeai as genai
import json
import PyPDF2
from docx import Document
from datetime import datetime

from app.database.mongodb import get_db

teams_bp = Blueprint('teams', __name__)

# Configure Gemini AI
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return ""

def extract_text_from_docx(file_path):
    """Extract text from DOCX file"""
    try:
        doc = Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        print(f"Error extracting DOCX text: {e}")
        return ""

def analyze_resume_with_ai(resume_text):
    """Analyze resume using Gemini AI"""
    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        prompt = f"""
Analyze this resume and extract the following information in JSON format:
{{
    "name": "Full Name",
    "email": "email@example.com or empty string if not found",
    "role": "Primary Role/Title (e.g., Senior Frontend Developer, Backend Engineer)",
    "skills": ["skill1", "skill2", ...] (list all technical skills),
    "experience_years": number (total years of experience),
    "expertise": ["area1", "area2", ...] (main areas of expertise like React, Node.js, AWS, etc.),
    "description": "A well-formatted 2-3 paragraph professional summary describing the candidate's background, key achievements, technical expertise, and career highlights. Make it readable and professional.",
    "selected_roles": ["role1", "role2"] (suggest 2-3 best matching roles from: Frontend Developer, Backend Developer, Full Stack Developer, DevOps Engineer, QA Engineer, UI/UX Designer, Product Manager, Data Engineer)
}}

Resume Text:
{resume_text[:4000]}

Return ONLY valid JSON, no markdown formatting.
"""
        
        response = model.generate_content(prompt)
        result = json.loads(response.text)
        
        # Add summary field (shorter version of description)
        if result.get('description'):
            sentences = result['description'].split('. ')
            result['summary'] = '. '.join(sentences[:2]) + '.' if len(sentences) > 1 else result['description']
        
        return result
    except Exception as e:
        print(f"AI analysis error: {e}")
        return None

@teams_bp.route('/api/teams/analyze_resume', methods=['POST'])
@jwt_required()
def analyze_resume():
    """Analyze uploaded resume with AI"""
    try:
        user_id = get_jwt_identity()
        
        if 'resume' not in request.files:
            return jsonify({'error': 'No resume file provided'}), 400
        
        file = request.files['resume']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        temp_dir = tempfile.mkdtemp()
        file_path = os.path.join(temp_dir, filename)
        file.save(file_path)
        
        # Extract text based on file type
        if filename.lower().endswith('.pdf'):
            resume_text = extract_text_from_pdf(file_path)
        elif filename.lower().endswith(('.docx', '.doc')):
            resume_text = extract_text_from_docx(file_path)
        else:
            return jsonify({'error': 'Unsupported file format. Please use PDF or DOCX.'}), 400
        
        # Clean up temp file
        os.remove(file_path)
        os.rmdir(temp_dir)
        
        if not resume_text.strip():
            return jsonify({'error': 'Could not extract text from resume'}), 400
        
        # Analyze with AI
        analysis = analyze_resume_with_ai(resume_text)
        if not analysis:
            return jsonify({'error': 'AI analysis failed'}), 500
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'resume_text': resume_text[:1000]  # First 1000 chars for preview
        })
        
    except Exception as e:
        print(f"Resume analysis error: {e}")
        return jsonify({'error': 'Resume analysis failed'}), 500

@teams_bp.route('/api/teams/preview', methods=['POST'])
@jwt_required()
def preview_resume():
    """Quick preview of resume analysis"""
    try:
        if 'resume' not in request.files:
            return jsonify({'error': 'No resume file provided'}), 400
        
        file = request.files['resume']
        filename = secure_filename(file.filename)
        temp_dir = tempfile.mkdtemp()
        file_path = os.path.join(temp_dir, filename)
        file.save(file_path)
        
        # Extract text
        if filename.lower().endswith('.pdf'):
            resume_text = extract_text_from_pdf(file_path)
        elif filename.lower().endswith(('.docx', '.doc')):
            resume_text = extract_text_from_docx(file_path)
        else:
            return jsonify({'error': 'Unsupported file format'}), 400
        
        # Clean up
        os.remove(file_path)
        os.rmdir(temp_dir)
        
        # Quick AI analysis for suggested roles
        analysis = analyze_resume_with_ai(resume_text)
        
        return jsonify({
            'suggested_roles': analysis.get('selected_roles', []) if analysis else []
        })
        
    except Exception as e:
        print(f"Preview error: {e}")
        return jsonify({'suggested_roles': []})

@teams_bp.route('/api/teams/members', methods=['POST'])
@jwt_required()
def add_member():
    """Add team member to database"""
    try:
        user_id = get_jwt_identity()
        db = get_db()
        
        # Handle form data
        email = request.form.get('email', '')
        selected_roles = json.loads(request.form.get('selected_roles', '[]'))
        
        # Process resume if provided
        member_data = {
            'user_id': ObjectId(user_id),
            'email': email,
            'selected_roles': selected_roles,
            'current_load': 0,
            'capacity': 40,
            'created_at': datetime.utcnow()
        }
        
        if 'resume' in request.files:
            file = request.files['resume']
            filename = secure_filename(file.filename)
            temp_dir = tempfile.mkdtemp()
            file_path = os.path.join(temp_dir, filename)
            file.save(file_path)
            
            # Extract and analyze
            if filename.lower().endswith('.pdf'):
                resume_text = extract_text_from_pdf(file_path)
            elif filename.lower().endswith(('.docx', '.doc')):
                resume_text = extract_text_from_docx(file_path)
            else:
                return jsonify({'error': 'Unsupported file format'}), 400
            
            os.remove(file_path)
            os.rmdir(temp_dir)
            
            # AI analysis
            analysis = analyze_resume_with_ai(resume_text)
            if analysis:
                member_data.update({
                    'name': analysis.get('name', ''),
                    'role': analysis.get('role', ''),
                    'skills': analysis.get('skills', []),
                    'experience_years': analysis.get('experience_years', 0),
                    'expertise': analysis.get('expertise', []),
                    'description': analysis.get('description', ''),
                    'summary': analysis.get('summary', ''),
                    'suggested_roles': analysis.get('selected_roles', []),
                    'resume_text': resume_text[:1000]
                })
                
                # Use AI email if not provided
                if not email and analysis.get('email'):
                    member_data['email'] = analysis['email']
        
        # Calculate availability metrics
        idle_hours = max(member_data['capacity'] - member_data['current_load'], 0)
        idle_percentage = (idle_hours / member_data['capacity']) * 100
        
        if idle_hours >= member_data['capacity'] * 0.5:
            status = 'idle'
        elif idle_hours > 0:
            status = 'busy'
        else:
            status = 'overloaded'
        
        member_data.update({
            'idle_hours': idle_hours,
            'idle_percentage': round(idle_percentage, 1),
            'status': status
        })
        
        # Insert into database
        result = db.team_members.insert_one(member_data)
        
        return jsonify({
            'success': True,
            'member_id': str(result.inserted_id),
            'message': 'Team member added successfully'
        })
        
    except Exception as e:
        print(f"Add member error: {e}")
        return jsonify({'error': 'Failed to add team member'}), 500

@teams_bp.route('/api/teams/members', methods=['GET'])
@jwt_required()
def get_members():
    """Get all team members for user"""
    try:
        user_id = get_jwt_identity()
        db = get_db()
        
        members = list(db.team_members.find({'user_id': ObjectId(user_id)}))
        
        # Convert ObjectId to string and recalculate metrics
        for member in members:
            member['_id'] = str(member['_id'])
            member['user_id'] = str(member['user_id'])
            
            # Recalculate availability metrics
            current_load = member.get('current_load', 0)
            capacity = member.get('capacity', 40)
            idle_hours = max(capacity - current_load, 0)
            idle_percentage = (idle_hours / capacity) * 100
            
            if idle_hours >= capacity * 0.5:
                status = 'idle'
            elif idle_hours > 0:
                status = 'busy'
            else:
                status = 'overloaded'
            
            member.update({
                'idle_hours': idle_hours,
                'idle_percentage': round(idle_percentage, 1),
                'status': status
            })
        
        return jsonify({
            'success': True,
            'members': members
        })
        
    except Exception as e:
        print(f"Get members error: {e}")
        return jsonify({'error': 'Failed to fetch team members'}), 500

@teams_bp.route('/api/teams/members/<member_id>', methods=['DELETE'])
@jwt_required()
def delete_member(member_id):
    """Delete team member"""
    try:
        user_id = get_jwt_identity()
        db = get_db()
        
        result = db.team_members.delete_one({
            '_id': ObjectId(member_id),
            'user_id': ObjectId(user_id)
        })
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Member not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Team member deleted successfully'
        })
        
    except Exception as e:
        print(f"Delete member error: {e}")
        return jsonify({'error': 'Failed to delete team member'}), 500

@teams_bp.route('/api/teams/members/<member_id>/workload', methods=['PATCH'])
@jwt_required()
def update_workload(member_id):
    """Update member workload"""
    try:
        user_id = get_jwt_identity()
        db = get_db()
        data = request.get_json()
        
        current_load = data.get('current_load', 0)
        capacity = data.get('capacity', 40)
        
        # Calculate metrics
        idle_hours = max(capacity - current_load, 0)
        idle_percentage = (idle_hours / capacity) * 100
        
        if idle_hours >= capacity * 0.5:
            status = 'idle'
        elif idle_hours > 0:
            status = 'busy'
        else:
            status = 'overloaded'
        
        result = db.team_members.update_one(
            {'_id': ObjectId(member_id), 'user_id': ObjectId(user_id)},
            {'$set': {
                'current_load': current_load,
                'capacity': capacity,
                'idle_hours': idle_hours,
                'idle_percentage': round(idle_percentage, 1),
                'status': status
            }}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Member not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Workload updated successfully'
        })
        
    except Exception as e:
        print(f"Update workload error: {e}")
        return jsonify({'error': 'Failed to update workload'}), 500

@teams_bp.route('/api/teams/projects/<project_id>/team', methods=['GET'])
@jwt_required()
def get_project_team(project_id):
    """Get team members assigned to specific project"""
    try:
        user_id = get_jwt_identity()
        db = get_db()
        
        # For now, return empty array as project-team assignment is not implemented
        # This can be extended to track which members are assigned to which projects
        
        return jsonify({
            'success': True,
            'team': []
        })
        
    except Exception as e:
        print(f"Get project team error: {e}")
        return jsonify({'error': 'Failed to fetch project team'}), 500