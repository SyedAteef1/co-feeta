from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
import tempfile
from bson import ObjectId
import json
import re
import PyPDF2
from docx import Document
from datetime import datetime
import jwt
import logging
import vertexai
from vertexai.generative_models import GenerativeModel

from app.database.mongodb import get_db

teams_bp = Blueprint('teams', __name__)
logger = logging.getLogger(__name__)
JWT_SECRET = os.getenv('FLASK_SECRET', 'change_this_secret')
GCP_PROJECT_ID = os.getenv('GCP_PROJECT_ID')
GCP_LOCATION = os.getenv('GCP_LOCATION', 'us-central1')

# Initialize Vertex AI
if GCP_PROJECT_ID:
    vertexai.init(project=GCP_PROJECT_ID, location=GCP_LOCATION)

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    try:
        logger.info(f"📄 Extracting text from PDF: {file_path}")
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            num_pages = len(pdf_reader.pages)
            logger.info(f"📄 PDF has {num_pages} pages")
            
            for i, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
                except Exception as page_error:
                    logger.warning(f"⚠️ Error extracting page {i+1}: {page_error}")
                    continue
            
            logger.info(f"✅ Extracted {len(text)} characters from PDF")
            return text
    except Exception as e:
        logger.error(f"❌ Error extracting PDF text: {str(e)}")
        logger.exception("Full traceback:")
        return ""

def extract_text_from_docx(file_path):
    """Extract text from DOCX file"""
    try:
        logger.info(f"📄 Extracting text from DOCX: {file_path}")
        doc = Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text += paragraph.text + "\n"
        
        logger.info(f"✅ Extracted {len(text)} characters from DOCX")
        return text
    except Exception as e:
        logger.error(f"❌ Error extracting DOCX text: {str(e)}")
        logger.exception("Full traceback:")
        return ""

def parse_json_from_text(text, context="resume analysis"):
    """Extract and parse JSON from text with error recovery"""
    try:
        # Try to find JSON in the text (handle markdown code blocks)
        json_match = re.search(r'\{[\s\S]*\}', text)
        if not json_match:
            logger.error(f"❌ Could not find JSON in {context}")
            raise Exception(f"No JSON found in {context}")
        
        json_str = json_match.group()
        logger.info(f"📝 Extracted JSON ({len(json_str)} chars)")
        
        # Try to parse the JSON
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON Parse Error at position {e.pos}: {e.msg}")
            logger.error(f"📄 Problematic JSON snippet: ...{json_str[max(0, e.pos-100):min(len(json_str), e.pos+100)]}...")
            
            # Try to fix common JSON errors
            # Remove trailing commas before } or ]
            fixed_json = re.sub(r',(\s*[}\]])', r'\1', json_str)
            # Remove comments if any
            fixed_json = re.sub(r'//.*?\n', '\n', fixed_json)
            fixed_json = re.sub(r'/\*.*?\*/', '', fixed_json, flags=re.DOTALL)
            
            try:
                logger.info("🔧 Attempting to fix JSON errors...")
                return json.loads(fixed_json)
            except json.JSONDecodeError as e2:
                logger.error(f"❌ Could not fix JSON automatically")
                logger.error(f"📄 Full malformed JSON:\n{json_str[:1000]}...")
                raise Exception(f"Invalid JSON in {context}: {e.msg} at position {e.pos}")
    except Exception as e:
        logger.error(f"❌ JSON extraction failed: {str(e)}")
        raise


def analyze_resume_with_ai(resume_text):
    """Analyze resume using Vertex AI Gemini"""
    try:
        if not resume_text or not resume_text.strip():
            logger.error("❌ Empty resume text provided")
            return None
        
        if not GCP_PROJECT_ID:
            logger.error("❌ GCP_PROJECT_ID not configured")
            return None
        
        logger.info(f"🤖 Starting resume analysis (text length: {len(resume_text)} chars)")
        
        prompt = f"""Analyze this resume and extract the following information in JSON format:
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

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no extra text. Do not use trailing commas. Ensure all strings are properly quoted.

Return valid JSON:"""
        
        logger.info("🚀 Calling Vertex AI Gemini for resume analysis...")
        
        model = GenerativeModel("gemini-2.0-flash-exp")
        response = model.generate_content(
            prompt,
            generation_config={
                'temperature': 0.3,
                'max_output_tokens': 2048
            }
        )
        
        logger.info("✅ Vertex AI response received")
        
        text = response.text
        logger.info(f"✅ Gemini Response received ({len(text)} chars)")
        logger.info(f"📝 Response preview: {text[:200]}...")
        
        # Parse JSON from response (handles markdown code blocks)
        result = parse_json_from_text(text, "resume analysis")
        
        # Validate required fields
        if not result.get('name'):
            logger.warning("⚠️ No name found in resume analysis")
            result['name'] = 'Unknown'
        
        if not result.get('skills'):
            logger.warning("⚠️ No skills found in resume analysis")
            result['skills'] = []
        
        if not result.get('role'):
            logger.warning("⚠️ No role found in resume analysis")
            result['role'] = 'Developer'
        
        # Ensure experience_years is a number
        if not isinstance(result.get('experience_years'), (int, float)):
            try:
                result['experience_years'] = float(result.get('experience_years', 0))
            except (ValueError, TypeError):
                result['experience_years'] = 0
        
        # Add summary field (shorter version of description)
        if result.get('description'):
            sentences = result['description'].split('. ')
            result['summary'] = '. '.join(sentences[:2]) + '.' if len(sentences) > 1 else result['description']
        else:
            result['summary'] = ''
        
        logger.info(f"✅ Resume analysis complete: {result.get('name')}, {len(result.get('skills', []))} skills")
        return result
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ JSON parsing error: {str(e)}")
        if 'text' in locals():
            logger.error(f"📄 Response text: {text[:500]}")
        return None
    except Exception as e:
        logger.error(f"❌ AI analysis error: {str(e)}")
        logger.exception("Full traceback:")
        return None

@teams_bp.route('/api/teams/analyze_resume', methods=['POST'])
def analyze_resume():
    """Analyze uploaded resume with AI"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization provided'}), 401
        
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        
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
        logger.info("🤖 Starting AI analysis...")
        analysis = analyze_resume_with_ai(resume_text)
        if not analysis:
            logger.error("❌ AI analysis returned None")
            return jsonify({'error': 'AI analysis failed. Please check the resume format and try again.'}), 500
        
        logger.info(f"✅ Resume analysis successful: {analysis.get('name', 'Unknown')}")
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'resume_text': resume_text[:1000]  # First 1000 chars for preview
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    except Exception as e:
        logger.error(f"❌ Resume analysis error: {str(e)}")
        logger.exception("Full traceback:")
        return jsonify({'error': f'Resume analysis failed: {str(e)}'}), 500

@teams_bp.route('/api/teams/preview', methods=['POST'])
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
        
        # Quick AI analysis for suggested roles and name
        analysis = analyze_resume_with_ai(resume_text)
        
        return jsonify({
            'suggested_roles': analysis.get('selected_roles', []) if analysis else [],
            'name': analysis.get('name', '') if analysis else ''
        })
        
    except Exception as e:
        print(f"Preview error: {e}")
        return jsonify({'suggested_roles': [], 'name': ''})

@teams_bp.route('/api/teams/members', methods=['POST'])
def add_member():
    """Add team member to database"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization provided'}), 401
        
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        db = get_db()
        
        # Handle form data
        email = request.form.get('email', '')
        manual_name = request.form.get('name', '')
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
        
        # Use manual name if provided
        if manual_name:
            member_data['name'] = manual_name
        
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
                # Only use AI name if manual name not provided
                if not manual_name:
                    member_data['name'] = analysis.get('name', '')
                
                member_data.update({
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
def get_members():
    """Get all team members for user"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization provided'}), 401
        
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
        db = get_db()
        
        members = list(db.team_members.find({'user_id': ObjectId(user_id)}))
        
        # Convert ObjectId to string and recalculate metrics
        for member in members:
            member['_id'] = str(member['_id'])
            member['user_id'] = str(member['user_id'])
            
            # Recalculate availability metrics (always use latest values from DB)
            current_load = member.get('current_load', 0)
            capacity = member.get('capacity', 40)
            idle_hours = max(capacity - current_load, 0)
            idle_percentage = (idle_hours / capacity) * 100 if capacity > 0 else 100
            
            if idle_hours >= capacity * 0.5:
                status = 'idle'
            elif idle_hours > 0:
                status = 'busy'
            else:
                status = 'overloaded'
            
            member.update({
                'idle_hours': idle_hours,
                'idle_percentage': round(idle_percentage, 1),
                'status': status,
                'current_load': current_load,
                'capacity': capacity
            })
        
        return jsonify({
            'success': True,
            'members': members
        })
        
    except Exception as e:
        print(f"Get members error: {e}")
        return jsonify({'error': 'Failed to fetch team members'}), 500

@teams_bp.route('/api/teams/members/<member_id>', methods=['DELETE'])
def delete_member(member_id):
    """Delete team member"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization provided'}), 401
        
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
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
def update_workload(member_id):
    """Update member workload"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization provided'}), 401
        
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
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
def get_project_team(project_id):
    """Get team members assigned to specific project"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No authorization provided'}), 401
        
        token = auth_header.replace('Bearer ', '')
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload['user_id']
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