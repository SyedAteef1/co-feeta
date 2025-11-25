"""
Ask Feeta API - Dedicated endpoint for Ask Feeta AI functionality
Uses Vertex AI SDK approach for AI-powered insights
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
import os
import json

logger = logging.getLogger(__name__)
ask_feeta_bp = Blueprint('ask_feeta', __name__)

@ask_feeta_bp.route('/api/ask-feeta', methods=['POST'])
@jwt_required()
def ask_feeta():
    """Ask Feeta AI - Agentic workflow with GitHub code reading, task analysis, bottleneck detection"""
    try:
        user_id = get_jwt_identity()
        body = request.get_json()
        question = body.get('question')
        
        if not question:
            return jsonify({"error": "question is required"}), 400
        
        logger.info(f"🔍 Ask Feeta AGENTIC request from user: {user_id}")
        logger.info(f"❓ Question: {question}")
        
        # Get user info
        from app.database.mongodb import db
        from bson import ObjectId
        import requests
        users_collection = db['users']
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        github_token = user.get('github_token')
        
        # AGENTIC WORKFLOW: Gather comprehensive context
        from app.database.mongodb import get_user_projects, get_project_tasks
        from app.services.ai_service import create_deep_project_context
        
        projects = get_user_projects(user_id)
        
        # 1. PROJECT & REPO ANALYSIS
        project_context = ""
        repo_files = {}
        if projects and github_token:
            logger.info(f"📦 Analyzing {len(projects)} projects...")
            all_repos = []
            for project in projects[:3]:
                repos = project.get('repos', [])
                for repo in repos[:2]:
                    if repo not in all_repos:
                        all_repos.append(repo)
            
            for repo in all_repos:
                try:
                    full_name = repo.get('full_name') or repo.get('name', '')
                    if '/' in full_name:
                        owner, repo_name = full_name.split('/', 1)
                        logger.info(f"🔍 Analyzing {owner}/{repo_name}...")
                        context = create_deep_project_context(owner, repo_name, github_token)
                        project_context += f"\n\n=== Repository: {full_name} ===\n{context}\n"
                        
                        # Store repo info for code reading
                        repo_files[full_name] = {'owner': owner, 'repo': repo_name}
                except Exception as e:
                    logger.error(f"❌ Error analyzing repo {repo.get('name')}: {str(e)}")
                    continue
        
        # 2. TASK ANALYSIS WITH BOTTLENECKS
        all_tasks = []
        tasks_by_status = {'pending': [], 'in_progress': [], 'completed': [], 'overdue': []}
        tasks_by_member = {}
        
        for project in projects:
            project_id = str(project.get('_id', ''))
            tasks = get_project_tasks(project_id)
            all_tasks.extend(tasks)
            
            for task in tasks:
                status = task.get('status', 'unknown')
                assigned_to = task.get('assigned_to', 'Unassigned')
                
                # Categorize by status
                if status in ['pending', 'pending_approval']:
                    tasks_by_status['pending'].append(task)
                elif status in ['in_progress', 'approved']:
                    tasks_by_status['in_progress'].append(task)
                elif status == 'completed':
                    tasks_by_status['completed'].append(task)
                
                # Check for overdue
                if task.get('deadline'):
                    from datetime import datetime
                    try:
                        deadline = datetime.fromisoformat(task['deadline'].replace('Z', '+00:00'))
                        if deadline < datetime.now(deadline.tzinfo) and status != 'completed':
                            tasks_by_status['overdue'].append(task)
                    except:
                        pass
                
                # Group by member
                if assigned_to not in tasks_by_member:
                    tasks_by_member[assigned_to] = []
                tasks_by_member[assigned_to].append(task)
        
        # 3. BOTTLENECK DETECTION
        bottlenecks = []
        overloaded_members = []
        for member, tasks in tasks_by_member.items():
            if member != 'Unassigned':
                active_tasks = [t for t in tasks if t.get('status') in ['in_progress', 'approved', 'pending']]
                if len(active_tasks) > 5:
                    overloaded_members.append(f"{member} ({len(active_tasks)} active tasks)")
                    bottlenecks.append(f"⚠️ {member} is overloaded with {len(active_tasks)} tasks")
        
        if tasks_by_status['overdue']:
            bottlenecks.append(f"🚨 {len(tasks_by_status['overdue'])} overdue tasks need immediate attention")
        
        if tasks_by_status['pending']:
            bottlenecks.append(f"⏳ {len(tasks_by_status['pending'])} tasks pending approval")
        
        # 4. BUILD COMPREHENSIVE CONTEXT
        tasks_context = f"""\n\n=== TASK ANALYSIS ===
Total Tasks: {len(all_tasks)}
- Completed: {len(tasks_by_status['completed'])}
- In Progress: {len(tasks_by_status['in_progress'])}
- Pending: {len(tasks_by_status['pending'])}
- Overdue: {len(tasks_by_status['overdue'])}

Tasks by Team Member:
{chr(10).join([f'- {member}: {len(tasks)} tasks' for member, tasks in tasks_by_member.items()])}

Recent Tasks:
{chr(10).join([f'- [{t.get("status", "unknown")}] {t.get("title", "Untitled")} (assigned to: {t.get("assigned_to", "Unassigned")})' for t in all_tasks[:10]])}
"""
        
        bottleneck_context = f"""\n\n=== BOTTLENECKS & ISSUES ===
{chr(10).join(bottlenecks) if bottlenecks else 'No bottlenecks detected'}

Overloaded Team Members:
{chr(10).join(overloaded_members) if overloaded_members else 'Team workload is balanced'}
"""
        
        # 5. CODE READING CAPABILITY (if question mentions specific files)
        code_context = ""
        if github_token and any(keyword in question.lower() for keyword in ['file', 'code', 'function', 'class', '.py', '.js', '.java']):
            logger.info("🔍 Question mentions code - enabling code reading capability")
            code_context = "\n\n=== CODE READING CAPABILITY ENABLED ===\nI can read specific files from your repositories. Available repos:\n"
            for repo_name, repo_info in repo_files.items():
                code_context += f"- {repo_name}\n"
        
        # Build AI prompt with agentic capabilities
        full_context = f"""You are Feeta AI, an agentic AI assistant with advanced capabilities:

**YOUR CAPABILITIES:**
1. 🔍 Analyze project repositories and code structure
2. 📊 Track tasks, deadlines, and team workload
3. 🚨 Identify bottlenecks and blockers
4. 💡 Provide actionable recommendations
5. 📖 Read and analyze code files (when needed)

**PROJECT CONTEXT:**
{project_context}

**TASK & TEAM ANALYSIS:**
{tasks_context}

**BOTTLENECKS & ISSUES:**
{bottleneck_context}

{code_context}

**USER QUESTION:**
{question}

**INSTRUCTIONS:**
Analyze the question using ALL available context. Provide a detailed, actionable response:
1. **Problem Analysis:** What is the user asking about?
2. **Context-Aware Insights:** Reference specific projects, tasks, or team members
3. **Actionable Solution:** Provide clear steps with specific details
4. **Code Examples:** Include relevant code if applicable
5. **Recommendations:** Suggest improvements or next steps

Be specific, reference actual data, and format your response with **bold headings** for clarity."""
        
        # Call AI service using Vertex AI SDK with agentic context
        logger.info("🚀 Calling Vertex AI Gemini with AGENTIC WORKFLOW...")
        logger.info("🔧 API Method: VERTEX AI SDK (GenerativeModel)")
        logger.info(f"📊 Context size: {len(full_context)} characters")
        
        try:
            import vertexai
            from vertexai.generative_models import GenerativeModel
            from google.oauth2 import service_account
            
            # Initialize Vertex AI (same as ai_service.py)
            GCP_PROJECT_ID = os.getenv('GCP_PROJECT_ID', 'your-project-id')
            GCP_LOCATION = os.getenv('GCP_LOCATION', 'us-central1')
            GCP_CREDENTIALS_JSON = os.getenv('GCP_CREDENTIALS_JSON')
            
            credentials = None
            if GCP_CREDENTIALS_JSON:
                creds_dict = json.loads(GCP_CREDENTIALS_JSON)
                credentials = service_account.Credentials.from_service_account_info(creds_dict)
            
            vertexai.init(project=GCP_PROJECT_ID, location=GCP_LOCATION, credentials=credentials)
            
            model = GenerativeModel('gemini-2.0-flash-exp')
            response = model.generate_content(
                full_context,
                generation_config={'temperature': 0.7, 'max_output_tokens': 2048}
            )
            
            solution = response.text
            logger.info("✅ Vertex AI response received successfully")
            logger.info(f"📄 Solution length: {len(solution)} characters")
            
            return jsonify({
                "ok": True,
                "answer": solution,
                "question": question
            })
            
        except Exception as e:
            logger.error(f"❌ Vertex AI error: {str(e)}")
            return jsonify({"error": "AI service error"}), 500
            
    except Exception as e:
        logger.error(f"❌ Error in Ask Feeta: {str(e)}")
        return jsonify({"error": str(e)}), 500
