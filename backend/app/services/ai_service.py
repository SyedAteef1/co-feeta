import os
import requests
import logging
import json
import re
from datetime import datetime
import vertexai
from vertexai.generative_models import GenerativeModel
from google.oauth2 import service_account

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
from app.database.mongodb import (
    save_repo_context, get_repo_context, update_repo_context,
    save_conversation_history, get_conversation_history as db_get_conversation_history
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(name)s] - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

GCP_PROJECT_ID = os.getenv('GCP_PROJECT_ID', 'your-project-id')
GCP_LOCATION = os.getenv('GCP_LOCATION', 'us-central1')

# Initialize credentials from environment variable or file
credentials = None
GCP_CREDENTIALS_JSON = os.getenv('GCP_CREDENTIALS_JSON')

if GCP_CREDENTIALS_JSON:
    # Load from environment variable (for deployment)
    try:
        creds_dict = json.loads(GCP_CREDENTIALS_JSON)
        credentials = service_account.Credentials.from_service_account_info(creds_dict)
        logger.info("✅ Loaded credentials from environment variable")
    except Exception as e:
        logger.error(f"❌ Failed to load credentials from env: {e}")
else:
    # Load from file (for local development)
    creds_file = os.path.join(os.path.dirname(__file__), '..', 'gen-lang-client-0364393343-26c3a291d763.json')
    if os.path.exists(creds_file):
        try:
            credentials = service_account.Credentials.from_service_account_file(creds_file)
            logger.info(f"✅ Loaded credentials from file: {creds_file}")
        except Exception as e:
            logger.error(f"❌ Failed to load credentials from file: {e}")
    else:
        logger.warning("⚠️ No credentials found. Vertex AI may not work.")

# Initialize Vertex AI with credentials
vertexai.init(project=GCP_PROJECT_ID, location=GCP_LOCATION, credentials=credentials)
logger.info("="*60)
logger.info("🤖 AI SERVICE INITIALIZATION")
logger.info("="*60)
logger.info(f"✅ Using VERTEX AI SDK")
logger.info(f"📦 Project: {GCP_PROJECT_ID}")
logger.info(f"🌍 Location: {GCP_LOCATION}")
logger.info(f"🔑 Credentials: {'✅ Loaded' if credentials else '❌ Not loaded'}")
logger.info("="*60)

# Store sessions in memory (use Redis in production)
task_sessions = {}

def add_to_history(session_id, prompt, analysis=None, plan=None):
    """Add a prompt and its results to conversation history (database)"""
    try:
        save_conversation_history(session_id, prompt, analysis, plan)
        logger.info(f"💾 Added to database history for session {session_id}")
    except Exception as e:
        logger.error(f"❌ Error saving to history: {str(e)}")

def get_conversation_history(session_id):
    """Retrieve conversation history for a session (from database)"""
    try:
        return db_get_conversation_history(session_id)
    except Exception as e:
        logger.error(f"❌ Error getting history: {str(e)}")
        return {'conversations': []}

def parse_json_from_text(text, context="response"):
    """Extract and parse JSON from text with error recovery"""
    try:
        # Remove markdown code blocks if present
        text = re.sub(r'```json\s*', '', text)
        text = re.sub(r'```\s*$', '', text)
        
        # Try to find JSON in the text
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
            fixed_json = json_str
            
            # Remove trailing commas before } or ]
            fixed_json = re.sub(r',(\s*[}\]])', r'\1', fixed_json)
            
            # Remove comments if any
            fixed_json = re.sub(r'//.*?\n', '\n', fixed_json)
            fixed_json = re.sub(r'/\*.*?\*/', '', fixed_json, flags=re.DOTALL)
            
            # Fix unescaped quotes in strings (common issue)
            # This is a simple heuristic - replace " with ' inside string values
            fixed_json = re.sub(r'"([^"]*?)"([^":,\]\}]*?)"', r'"\1\'\2"', fixed_json)
            
            # Try to truncate at last valid closing brace if JSON is incomplete
            if e.msg == "Expecting ',' delimiter" or "Expecting" in e.msg:
                # Find the last complete object/array
                brace_count = 0
                last_valid_pos = 0
                for i, char in enumerate(fixed_json):
                    if char == '{':
                        brace_count += 1
                    elif char == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            last_valid_pos = i + 1
                
                if last_valid_pos > 0 and last_valid_pos < len(fixed_json):
                    logger.info(f"🔧 Truncating JSON at position {last_valid_pos}")
                    fixed_json = fixed_json[:last_valid_pos]
            
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

def search_codebase_for_keywords(owner, repo, keywords, github_token=None):
    """Search GitHub repository for specific keywords"""
    logger.info(f"🔍 Searching codebase for: {keywords}")
    
    try:
        headers = {'Authorization': f'token {github_token}'} if github_token else {}
        search_results = []
        
        for keyword in keywords[:3]:  # Limit to 3 keywords
            search_url = f"https://api.github.com/search/code?q={keyword}+repo:{owner}/{repo}"
            resp = requests.get(search_url, headers=headers, timeout=10)
            
            if resp.status_code == 200:
                data = resp.json()
                items = data.get('items', [])[:5]
                for item in items:
                    search_results.append({
                        'file': item['path'],
                        'keyword': keyword,
                        'url': item['html_url']
                    })
                logger.info(f"✅ Found {len(items)} files with '{keyword}'")
            else:
                logger.warning(f"⚠️ Search failed for '{keyword}': {resp.status_code}")
        
        return search_results
    except Exception as e:
        logger.error(f"❌ Codebase search error: {str(e)}")
        return []

def analyze_task_with_llm(task, session_id=None, repositories=None, github_token=None):
    """Phase 1: Intelligent task analysis with multi-repository context"""
    logger.info("="*60)
    logger.info("STEP 1: MULTI-REPOSITORY TASK ANALYSIS")
    logger.info("="*60)
    logger.info(f"📝 Input Task: {task}")
    logger.info(f"🔑 Session ID: {session_id}")
    logger.info(f"🤖 Gemini API Key: {'✅ Set' if GEMINI_API_KEY else '❌ Missing'}")
    
    # Handle multiple repositories (frontend + backend)
    multi_repo_context = {}
    if repositories and github_token:
        logger.info(f"🔍 Analyzing {len(repositories)} repositories...")
        
        from app.services.github_service import analyze_repo_structure
        
        for repo_info in repositories:
            owner = repo_info.get('owner')
            repo_name = repo_info.get('repo')
            repo_type = repo_info.get('type', 'unknown')  # 'frontend', 'backend', 'fullstack'
            
            if owner and repo_name:
                try:
                    logger.info(f"📦 Analyzing {repo_type} repository: {owner}/{repo_name}")
                    context = analyze_repo_structure(owner, repo_name, github_token)
                    multi_repo_context[repo_type] = {
                        'owner': owner,
                        'repo': repo_name,
                        'context': context
                    }
                    logger.info(f"✅ {repo_type.capitalize()} analysis complete: {len(context.get('key_modules', []))} modules")
                except Exception as e:
                    logger.warning(f"⚠️ Could not analyze {repo_type} repo {owner}/{repo_name}: {str(e)}")
    
    # Fallback to single repo if provided
    repo_context = None
    if not multi_repo_context and repositories and len(repositories) == 1:
        repo_info = repositories[0]
        owner = repo_info.get('owner')
        repo_name = repo_info.get('repo')
        if owner and repo_name and github_token:
            logger.info(f"🔍 Fetching single repository analysis for {owner}/{repo_name}...")
            try:
                from app.services.github_service import analyze_repo_structure
                repo_context = analyze_repo_structure(owner, repo_name, github_token)
                logger.info(f"✅ Analysis complete: {len(repo_context.get('key_modules', []))} modules")
            except Exception as e:
                logger.warning(f"⚠️ Could not fetch repo analysis: {str(e)}")
                repo_context = None
    
    # Build enhanced context text with multi-repository understanding
    context_text = ""
    
    if multi_repo_context:
        context_text = "\n**Multi-Repository Project Context:**\n"
        
        for repo_type, repo_data in multi_repo_context.items():
            context = repo_data['context']
            owner = repo_data['owner']
            repo_name = repo_data['repo']
            
            context_text += f"\n--- {repo_type.upper()} REPOSITORY ({owner}/{repo_name}) ---\n"
            context_text += f"- Summary: {context.get('project_summary', 'N/A')}\n"
            context_text += f"- Architecture: {context.get('architecture_overview', 'N/A')}\n"
            
            tech_stack = context.get('tech_stack', {})
            if isinstance(tech_stack, dict):
                if 'primary_language' in tech_stack:
                    context_text += f"- Primary Language: {tech_stack.get('primary_language', 'N/A')}\n"
                    context_text += f"- Backend Framework: {tech_stack.get('backend_framework', 'N/A')}\n"
                    context_text += f"- Frontend Framework: {tech_stack.get('frontend_framework', 'N/A')}\n"
                else:
                    context_text += f"- Languages: {', '.join(tech_stack.get('languages', ['N/A']))}\n"
                    context_text += f"- Frameworks: {', '.join(tech_stack.get('frameworks', ['N/A']))}\n"
            
            context_text += f"- Total Files: {context.get('raw_data', {}).get('total_files', 0)}\n"
            
            # Add key modules
            modules = context.get('key_modules', [])
            if modules:
                context_text += f"- Key Modules: {', '.join([m.get('module_name', 'Unknown') for m in modules[:3]])}\n"
            
            # Add API info
            api_structure = context.get('api_structure', {})
            if api_structure.get('endpoints'):
                context_text += f"- API Endpoints: {len(api_structure.get('endpoints', []))} found\n"
    
    elif repo_context:
        # Single repository context (fallback)
        modules_text = ""
        if repo_context.get('key_modules'):
            modules_text = "\n\nKey Modules:\n" + "\n".join(
                [f"- {m.get('module_name', 'Unknown')}: {m.get('description', 'No description')}" for m in repo_context['key_modules'][:5]]
            )
        
        api_info = ""
        if repo_context.get('api_structure'):
            api_info = f"\n\nAPI Structure:\n- Endpoints: {', '.join(repo_context['api_structure'].get('endpoints', [])[:5])}\n- Authentication: {repo_context['api_structure'].get('authentication', 'Unknown')}"
        
        context_text = f"""
**Single Repository Project Context:**
- Summary: {repo_context.get('project_summary', 'N/A')}
- Architecture: {repo_context.get('architecture_overview', 'N/A')}
- Tech Stack: {repo_context.get('tech_stack', {}).get('language', 'N/A')}, {repo_context.get('tech_stack', {}).get('framework_backend', 'N/A')}, {repo_context.get('tech_stack', {}).get('framework_frontend', 'N/A')}
- Database: {repo_context.get('tech_stack', {}).get('database', 'N/A')}
- Total Files: {repo_context.get('raw_data', {}).get('total_files', 0)}
- Code Patterns: {len(repo_context.get('raw_data', {}).get('code_patterns', {}).get('api_endpoints', []))} API endpoints, {len(repo_context.get('raw_data', {}).get('code_patterns', {}).get('components', []))} components
{modules_text}{api_info}
"""
    
    # Step 1: Detect task type with project context
    logger.info("🔍 Step 1A: Detecting task type with project context...")
    
    type_detection_prompt = f"""Analyze this task with full project context.

{context_text}

Task: "{task}"

Task: "{task}"

Determine:
1. Is this adding a NEW feature that doesn't exist?
2. Is this UPDATING/MODIFYING an existing feature?
3. Is it BOTH (adding new + modifying existing)?

Extract keywords that might exist in the codebase (e.g., "dashboard", "payment", "login").

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no extra text.
Do not use trailing commas. Ensure all strings are properly quoted.

Respond with valid JSON:
{{
  "task_type": "new" | "update" | "both",
  "keywords": ["keyword1", "keyword2"],
  "reasoning": "Brief explanation"
}}"""
    
    try:
        # Detect task type
        logger.info("🚀 Calling Gemini for task type detection...")
        logger.info("🔧 API Method: VERTEX AI SDK (GenerativeModel)")
        model = GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content(
            type_detection_prompt,
            generation_config={'temperature': 0.3, 'max_output_tokens': 512}
        )
        
        text = response.text
        logger.info(f"📝 Task Type Response: {text[:500]}...")
        
        task_type_info = parse_json_from_text(text, "task type detection")
        
        logger.info(f"✅ Task Type: {task_type_info['task_type']}")
        logger.info(f"🔑 Keywords: {task_type_info['keywords']}")
        logger.info(f"💡 Reasoning: {task_type_info['reasoning']}")
        
        # Step 2: Search codebase if updating existing features
        # Extract owner and repo from repositories for codebase search
        owner = None
        repo = None
        
        if repositories and len(repositories) > 0:
            # Use first repository for codebase search
            first_repo = repositories[0]
            owner = first_repo.get('owner')
            repo = first_repo.get('repo')
        elif multi_repo_context:
            # Extract from multi_repo_context
            first_repo_type = list(multi_repo_context.keys())[0]
            first_repo_data = multi_repo_context[first_repo_type]
            owner = first_repo_data.get('owner')
            repo = first_repo_data.get('repo')
        
        codebase_findings = []
        if task_type_info['task_type'] in ['update', 'both'] and owner and repo and github_token:
            logger.info("🔍 Step 1B: Searching codebase for existing features...")
            codebase_findings = search_codebase_for_keywords(
                owner, repo, task_type_info['keywords'], github_token
            )
            
            if not codebase_findings:
                logger.warning("⚠️ No existing code found for keywords!")
                logger.info("💡 This might be a NEW feature, not an update")
        
        # Step 3: Intelligent clarification analysis using comprehensive context
        logger.info("🔍 Step 1C: Intelligent clarification analysis...")
        
        # Build comprehensive context summary
        context_summary = ""
        if multi_repo_context:
            # Multi-repository context
            context_summary = f"""
COMPREHENSIVE MULTI-REPOSITORY PROJECT CONTEXT:

Repositories Analyzed: {len(multi_repo_context.get('repositories', []))}
{chr(10).join([f"- {repo.get('name', 'Unknown')} ({repo.get('type', 'unknown')}): {repo.get('tech_stack', {}).get('language', 'Unknown')}" for repo in multi_repo_context.get('repositories', [])])}

Project Summary: {multi_repo_context.get('project_summary', 'Unknown')}
Architecture: {multi_repo_context.get('architecture_overview', 'Unknown')}

Combined Tech Stack:
- Languages: {', '.join(set([repo.get('tech_stack', {}).get('language', 'Unknown') for repo in multi_repo_context.get('repositories', [])]))}
- Frontend: {', '.join(set([repo.get('tech_stack', {}).get('framework_frontend', 'None') for repo in multi_repo_context.get('repositories', []) if repo.get('tech_stack', {}).get('framework_frontend', 'None') != 'None']))}
- Backend: {', '.join(set([repo.get('tech_stack', {}).get('framework_backend', 'None') for repo in multi_repo_context.get('repositories', []) if repo.get('tech_stack', {}).get('framework_backend', 'None') != 'None']))}
- Databases: {', '.join(set([db for repo in multi_repo_context.get('repositories', []) for db in repo.get('integration_points', {}).get('databases', [])]))}

Total Files: {sum([repo.get('raw_data', {}).get('total_files', 0) for repo in multi_repo_context.get('repositories', [])])}
Total Dependencies: {sum([len(repo.get('raw_data', {}).get('dependencies', {})) for repo in multi_repo_context.get('repositories', [])])}

Integration Points:
- External APIs: {', '.join(set([api for repo in multi_repo_context.get('repositories', []) for api in repo.get('integration_points', {}).get('external_apis', [])]))}
- Third Party: {', '.join(set([tp for repo in multi_repo_context.get('repositories', []) for tp in repo.get('integration_points', {}).get('third_party', [])]))}
"""
        elif repo_context:
            # Single repository context (fallback)
            context_summary = f"""
COMPREHENSIVE PROJECT CONTEXT:

Project Summary: {repo_context.get('project_summary', 'Unknown')}
Architecture: {repo_context.get('architecture_overview', 'Unknown')}

Tech Stack:
- Language: {repo_context.get('tech_stack', {}).get('language', 'Unknown')}
- Frontend: {repo_context.get('tech_stack', {}).get('framework_frontend', 'None')}
- Backend: {repo_context.get('tech_stack', {}).get('framework_backend', 'None')}
- Database: {repo_context.get('tech_stack', {}).get('database', 'Unknown')}
- Testing: {repo_context.get('tech_stack', {}).get('testing', 'Unknown')}

Key Modules ({len(repo_context.get('key_modules', []))}):
{chr(10).join([f"- {m.get('module_name', 'Unknown')}: {m.get('description', 'No description')}" for m in repo_context.get('key_modules', [])[:5]])}

API Structure:
- Endpoints: {', '.join(repo_context.get('api_structure', {}).get('endpoints', [])[:5])}
- Auth: {repo_context.get('api_structure', {}).get('authentication', 'Unknown')}
- Data Flow: {repo_context.get('api_structure', {}).get('data_flow', 'Unknown')}

Development Patterns:
- Code Organization: {repo_context.get('development_patterns', {}).get('code_organization', 'Unknown')}
- Naming Conventions: {repo_context.get('development_patterns', {}).get('naming_conventions', 'Unknown')}

Integrations:
- External APIs: {', '.join(repo_context.get('integration_points', {}).get('external_apis', [])[:3])}
- Databases: {', '.join(repo_context.get('integration_points', {}).get('databases', []))}
- Third Party: {', '.join(repo_context.get('integration_points', {}).get('third_party', [])[:3])}

Deployment:
- Build Process: {repo_context.get('deployment_info', {}).get('build_process', 'Unknown')}
- Environment: {repo_context.get('deployment_info', {}).get('environment_setup', 'Unknown')}

Raw Data:
- Total Files: {repo_context.get('raw_data', {}).get('total_files', 0)}
- Folder Structure: {len(repo_context.get('raw_data', {}).get('folder_structure', {}))}
- Dependencies: {len(repo_context.get('raw_data', {}).get('dependencies', {}))}
- Code Patterns: API endpoints ({len(repo_context.get('raw_data', {}).get('code_patterns', {}).get('api_endpoints', []))}), Models ({len(repo_context.get('raw_data', {}).get('code_patterns', {}).get('database_models', []))}), Components ({len(repo_context.get('raw_data', {}).get('code_patterns', {}).get('components', []))})
"""
        
        findings_text = ""
        if codebase_findings:
            findings_text = "\n\nEXISTING CODE FOUND:\n" + "\n".join(
                [f"- {f['file']} (contains '{f['keyword']}')" for f in codebase_findings[:5]]
            )
        elif task_type_info['task_type'] in ['update', 'both']:
            findings_text = "\n\n⚠️ WARNING: Task mentions updating existing features, but NO related code was found!"
        
        clarity_prompt = f"""You are a senior technical architect with deep understanding of software development. Analyze if this task needs clarification given the comprehensive project context.

TASK: "{task}"
TASK TYPE: {task_type_info['task_type']}
KEYWORDS IDENTIFIED: {task_type_info['keywords']}
REASONING: {task_type_info['reasoning']}

{context_summary}

CODEBASE FINDINGS: {len(codebase_findings)} relevant files found
FILES TO MODIFY: {[f['file'] for f in codebase_findings[:5]]}

INTELLIGENT CLARIFICATION RULES:
1. With comprehensive project context, 80% of tasks should be clear without questions
2. Only ask questions when there are genuine business/functional ambiguities
3. Don't ask technical questions that can be inferred from existing code patterns
4. Maximum 1-2 questions, and only if they significantly impact implementation
5. If the task is reasonably clear, proceed without questions

ASK QUESTIONS ONLY FOR:
- Business logic decisions not evident from code
- User experience choices that affect implementation
- Integration preferences when multiple options exist
- Scope clarification for vague requests

DON'T ASK QUESTIONS ABOUT:
- Technology choices (use what's already in the project)
- Code structure (follow existing patterns)
- Database selection (use existing database)
- Framework selection (use detected frameworks)
- File naming (follow existing conventions)

EXAMPLES:
✅ GOOD: "Should usage tracking be real-time or batch processed?"
✅ GOOD: "Do you want user-level or application-level usage analytics?"
❌ BAD: "What database should we use?" (already detected)
❌ BAD: "Should we use Flask or Django?" (already using Flask)
❌ BAD: "How should we structure the API?" (follow existing patterns)

Return JSON:
{{
  "status": "clear" | "ambiguous",
  "reasoning": "Detailed explanation of why clarification is/isn't needed given the comprehensive context",
  "confidence_score": 85,
  "questions": [
    {{
      "question": "Specific, business-focused question that can't be inferred from codebase",
      "explanation": "Why this question is critical and can't be determined from existing code patterns",
      "impact": "How the answer will significantly change the implementation approach",
      "options": ["Option A", "Option B", "Option C"]
    }}
  ]
}}"""
        
        # Call Gemini for clarity analysis
        logger.info("🚀 Calling Gemini for clarity analysis...")
        logger.info("🔧 API Method: VERTEX AI SDK (GenerativeModel)")
        model = GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content(
            clarity_prompt,
            generation_config={'temperature': 0.2, 'max_output_tokens': 512}
        )
        
        text = response.text
        logger.info(f"📝 Clarity Analysis Response: {text[:500]}...")
        
        # Parse strict JSON (will raise if model doesn't follow rules)
        clarity_result = parse_json_from_text(text, "clarity analysis")
        
        # Merge task_type and earlier info so caller has full context
        clarity_result['task_type'] = task_type_info['task_type']
        clarity_result['keywords'] = task_type_info['keywords']
        clarity_result['codebase_findings'] = codebase_findings
        
        # Store comprehensive context in session for plan generation
        if session_id:
            task_sessions[session_id] = {
                'task': task,
                'analysis': clarity_result,
                'repo_context': repo_context,  # Single repo context (fallback)
                'multi_repo_context': multi_repo_context,  # Multi-repo context
                'repositories': repositories,  # Store original repositories array
                'created_at': datetime.utcnow()
            }
            add_to_history(session_id, task, analysis=clarity_result)
        
        # If model asks questions, return them immediately
        if clarity_result.get('status') == 'ambiguous':
            logger.info(f"❓ {len(clarity_result.get('questions', []))} intelligent questions required")
            return clarity_result
        
        # Otherwise status == 'clear' -> ready for plan generation
        logger.info(f"✅ Task is clear (confidence: {clarity_result.get('confidence_score', 'N/A')}%)")
        logger.info(f"💡 Reasoning: {clarity_result.get('reasoning', 'No reasoning provided')}")
        return clarity_result
            
    except Exception as e:
        logger.error(f"❌ LLM Analysis Error: {str(e)}")
        logger.exception("Full traceback:")
        raise Exception(f"Gemini API failed: {str(e)}")

def create_deep_project_context(owner, repo, github_token=None):
    """Deep analysis of repository to create comprehensive project context"""
    logger.info("="*60)
    logger.info("🧠 DEEP PROJECT CONTEXT ANALYSIS")
    logger.info("="*60)
    
    repo_full_name = f"{owner}/{repo}"
    logger.info(f"📦 Repository: {repo_full_name}")
    
    # ✨ CHECK DATABASE CACHE FIRST
    cached_context = get_repo_context(repo_full_name)
    if cached_context:
        logger.info(f"⚡ Using cached repo context (accessed {cached_context.get('access_count', 0)} times)")
        logger.info(f"📅 Cache age: {cached_context.get('updated_at', 'unknown')}")
        return cached_context['context_text']
    
    logger.info("🔄 Cache miss - performing fresh analysis...")
    
    try:
        headers = {'Authorization': f'token {github_token}'} if github_token else {}
        
        # Fetch complete file tree
        logger.info("🔍 Fetching complete file tree...")
        tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/main?recursive=1"
        tree_resp = requests.get(tree_url, headers=headers, timeout=60)
        
        if tree_resp.status_code != 200:
            tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/master?recursive=1"
            tree_resp = requests.get(tree_url, headers=headers, timeout=15)
        
        tree_data = tree_resp.json()
        all_files = [f['path'] for f in tree_data.get('tree', []) if f['type'] == 'blob']
        logger.info(f"📂 Found {len(all_files)} files")
        
        # Fetch README
        logger.info("📄 Fetching README...")
        readme_url = f"https://api.github.com/repos/{owner}/{repo}/readme"
        readme_resp = requests.get(readme_url, headers=headers, timeout=10)
        readme_content = ""
        if readme_resp.status_code == 200:
            import base64
            readme_content = base64.b64decode(readme_resp.json()['content']).decode('utf-8')[:3000]
            logger.info("✅ README fetched")
        
        # Deep analysis prompt
        file_list_str = ", ".join(all_files[:100])  # First 100 files
        
        prompt = f"""You are a 10x Senior Solutions Architect. Perform a deep analysis of this GitHub repository to create a comprehensive "Project Context" summary.

**Repository Information:**
---
**File Tree:**
{file_list_str}

**README.md:**
{readme_content}
---

Analyze and generate a JSON object with:

1. `project_summary`: One-paragraph description of the project's purpose
2. `tech_stack`: Object with keys: `language`, `framework_backend`, `framework_frontend`, `database`, `key_libraries`
3. `architecture_overview`: Brief architecture description (e.g., "Monolithic MVC", "Microservices")
4. `key_modules`: Array of core features/modules. For each:
   - `module_name`: Name of the module
   - `description`: What this module does
   - `relevant_files`: Top 3-5 most important file paths for this module

Do not guess. Prioritize accuracy.

Respond ONLY with valid JSON:
{{
  "project_summary": "...",
  "tech_stack": {{
    "language": "...",
    "framework_backend": "...",
    "framework_frontend": "...",
    "database": "...",
    "key_libraries": ["..."]
  }},
  "architecture_overview": "...",
  "key_modules": [
    {{
      "module_name": "...",
      "description": "...",
      "relevant_files": ["..."]
    }}
  ]
}}"""
        
        logger.info("🚀 Calling Gemini for deep analysis...")
        logger.info("🔧 API Method: VERTEX AI SDK (GenerativeModel)")
        model = GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content(
            prompt,
            generation_config={'temperature': 0.1, 'max_output_tokens': 4096}
        )
        
        text = response.text
        logger.info(f"📝 Deep Analysis Response: {text[:500]}...")
        
        project_context = parse_json_from_text(text, "deep analysis")
        logger.info("✅ Deep analysis complete!")
        logger.info(f"📊 Found {len(project_context.get('key_modules', []))} key modules")
        
        # ✨ SAVE TO DATABASE CACHE
        try:
            language = project_context.get('tech_stack', {}).get('language', 'Unknown')
            metadata = {
                'file_count': len(all_files),
                'has_readme': bool(readme_content),
                'tech_stack': project_context.get('tech_stack', {})
            }
            save_repo_context(repo_full_name, project_context, language, metadata)
            logger.info(f"💾 Repo context saved to database for future use")
        except Exception as save_error:
            logger.error(f"⚠️ Failed to save repo context (non-critical): {str(save_error)}")
        
        return project_context
        
    except Exception as e:
        logger.error(f"❌ Deep Analysis Error: {str(e)}")
        logger.exception("Full traceback:")
        raise Exception(f"Deep analysis failed: {str(e)}")

def analyze_github_repo(repo_url, github_token=None):
    """Analyze GitHub repository - wrapper for backward compatibility"""
    parts = repo_url.rstrip('/').split('/')
    owner, repo = parts[-2], parts[-1]
    return create_deep_project_context(owner, repo, github_token)

def generate_implementation_plan(task, answers=None, session_id=None, team_members=None):
    """Phase 2: Generate detailed implementation plan based on task type and codebase findings"""
    logger.info("="*60)
    logger.info("STEP 2: IMPLEMENTATION PLAN GENERATION")
    logger.info("="*60)
    logger.info(f"📝 Task: {task}")
    logger.info(f"💬 Answers: {answers}")
    logger.info(f"🔑 Session ID: {session_id}")
    logger.info(f"👥 Team Members: {len(team_members) if team_members else 0}")
    
    # Get task analysis from session
    task_type = "new"
    codebase_findings = []
    if session_id and session_id in task_sessions:
        session = task_sessions[session_id]
        analysis = session.get('analysis', {})
        task_type = analysis.get('task_type', 'new')
        codebase_findings = analysis.get('codebase_findings', [])
        logger.info(f"📂 Task Type: {task_type}")
        logger.info(f"🔍 Codebase Findings: {len(codebase_findings)} files")
    
    answers_text = ""
    if answers:
        answers_text = "\n".join([f"- {k}: {v}" for k, v in answers.items()])
        logger.info(f"📋 Clarifications:\n{answers_text}")
    
    findings_text = ""
    if codebase_findings:
        findings_text = "\n\nExisting Code to Modify:\n" + "\n".join(
            [f"- {f['file']}" for f in codebase_findings[:5]]
        )
    
    # Get comprehensive repository context for better planning
    repo_context_summary = ""
    if session_id and session_id in task_sessions:
        session = task_sessions[session_id]
        multi_repo_context = session.get('multi_repo_context', {})
        repo_context = session.get('repo_context')
        
        if multi_repo_context:
            repo_context_summary = "\n\nMULTI-REPOSITORY PROJECT CONTEXT FOR PLANNING:\n"
            
            for repo_type, repo_data in multi_repo_context.items():
                context = repo_data['context']
                owner = repo_data['owner']
                repo_name = repo_data['repo']
                
                repo_context_summary += f"\n--- {repo_type.upper()} ({owner}/{repo_name}) ---\n"
                repo_context_summary += f"Project: {context.get('project_summary', 'Unknown')}\n"
                repo_context_summary += f"Architecture: {context.get('architecture_overview', 'Unknown')}\n"
                
                tech_stack = context.get('tech_stack', {})
                if 'primary_language' in tech_stack:
                    repo_context_summary += f"Language: {tech_stack.get('primary_language', 'Unknown')}\n"
                    repo_context_summary += f"Backend: {tech_stack.get('backend_framework', 'None')}\n"
                    repo_context_summary += f"Frontend: {tech_stack.get('frontend_framework', 'None')}\n"
                else:
                    repo_context_summary += f"Languages: {', '.join(tech_stack.get('languages', ['Unknown']))}\n"
                    repo_context_summary += f"Frameworks: {', '.join(tech_stack.get('frameworks', ['None']))}\n"
                
                modules = context.get('key_modules', [])
                if modules:
                    repo_context_summary += f"Key Modules: {', '.join([m.get('module_name', 'Unknown') for m in modules[:3]])}\n"
                
                api_structure = context.get('api_structure', {})
                if api_structure.get('endpoints'):
                    repo_context_summary += f"API Endpoints: {len(api_structure.get('endpoints', []))} found\n"
        
        elif repo_context:
            repo_context_summary = f"""

SINGLE REPOSITORY PROJECT CONTEXT FOR PLANNING:

Project: {repo_context.get('project_summary', 'Unknown')}
Architecture: {repo_context.get('architecture_overview', 'Unknown')}
Tech Stack: {repo_context.get('tech_stack', {}).get('language', 'Unknown')} + {repo_context.get('tech_stack', {}).get('framework_backend', 'None')} + {repo_context.get('tech_stack', {}).get('framework_frontend', 'None')}
Database: {repo_context.get('tech_stack', {}).get('database', 'Unknown')}

Existing Modules:
{chr(10).join([f"- {m.get('module_name', 'Unknown')}: {m.get('description', 'No description')}" for m in repo_context.get('key_modules', [])[:5]])}

API Patterns:
- Endpoints: {', '.join(repo_context.get('api_structure', {}).get('endpoints', [])[:5])}
- Auth Method: {repo_context.get('api_structure', {}).get('authentication', 'Unknown')}

Code Organization: {repo_context.get('development_patterns', {}).get('code_organization', 'Unknown')}
Naming Conventions: {repo_context.get('development_patterns', {}).get('naming_conventions', 'Unknown')}

Integrations: {', '.join(repo_context.get('integration_points', {}).get('external_apis', [])[:3])}
Build Process: {repo_context.get('deployment_info', {}).get('build_process', 'Unknown')}
"""
    
    # Build team members context for AI assignment
    team_context = ""
    if team_members:
        team_context = "\n\nAVAILABLE TEAM MEMBERS:\n"
        for member in team_members:
            name = member.get('name', 'Unknown')
            skills = member.get('skills', [])
            role = member.get('role', 'Developer')
            team_context += f"- {name} ({role}): {', '.join(skills)}\n"
        logger.info(f"👥 Team context built for {len(team_members)} members")
    
    # Get current date for deadline calculation
    from datetime import datetime, timedelta
    today = datetime.utcnow()
    current_date_str = today.strftime("%Y-%m-%d")
    
    prompt = f"""You are a senior software architect with expertise in ALL programming languages and frameworks. Create a precise implementation plan based on the ACTUAL project analysis.

CRITICAL JSON FORMATTING RULES:
- Return ONLY valid JSON - no markdown, no code blocks, no extra text
- Escape all quotes inside string values using backslash (\")
- Do NOT use trailing commas before closing braces or brackets
- Keep descriptions concise (under 200 characters) to avoid formatting issues
- If a description contains quotes, use single quotes (') instead
- Ensure all arrays and objects are properly closed

CURRENT DATE: {current_date_str} (Use this as the starting point for all deadline calculations)

TASK: "{task}"
TASK TYPE: {task_type.upper()}
{f"\nCLARIFICATIONS PROVIDED:\n{answers_text}" if answers_text else ""}
{findings_text}
{repo_context_summary}
{team_context}

UNIVERSAL IMPLEMENTATION RULES:
1. Use ONLY the technologies, frameworks, and patterns actually detected in the project
2. Follow the existing file structure, naming conventions, and code organization
3. Suggest file paths that match the current project layout
4. Assign roles based on the actual tech stack (Python Dev for Python, Java Dev for Java, etc.)
5. If no framework is detected, suggest the most appropriate one for the language
6. Consider the project type (web app, CLI tool, library) when planning tasks
7. Use actual dependency management systems found (pip, npm, maven, etc.)
8. Follow language-specific conventions (snake_case for Python, camelCase for JavaScript, etc.)

TEAM MEMBER ASSIGNMENT RULES:
1. Match team members to tasks based on their skills and the required technology
2. If a team member has exact skill match (e.g., Python + Flask), assign them
3. If no exact match, find the closest match (e.g., Python developer for Django task)
4. If no reasonable match exists, set assigned_to as 'Unassigned'
5. Consider both technical skills and role compatibility
6. Prefer team members with multiple relevant skills for complex tasks

TECHNOLOGY-SPECIFIC GUIDELINES:
- Python: Use .py files, pip/requirements.txt, Flask/Django/FastAPI patterns
- JavaScript/Node.js: Use .js/.ts files, npm/package.json, Express/React patterns
- Java: Use .java files, Maven/Gradle, Spring patterns
- Go: Use .go files, go.mod, standard library patterns
- C#: Use .cs files, NuGet, ASP.NET patterns
- PHP: Use .php files, Composer, Laravel/Symfony patterns
- Ruby: Use .rb files, Gemfile, Rails patterns
- Rust: Use .rs files, Cargo.toml, standard patterns

SUBTASK GENERATION RULES:
- Generate ONLY the subtasks that are actually needed for this specific task
- Simple tasks may need only 2-3 subtasks, complex tasks may need 6-8
- Each subtask should represent a meaningful, atomic piece of work
- Don't create unnecessary subtasks just to reach a number
- Focus on logical workflow and dependencies
- Use exact technology names and file extensions from the analysis
- Reference actual files and modules found in the repository
- Follow the detected architecture and patterns

DEADLINE AND TIMELINE GENERATION RULES:
- CURRENT DATE: {current_date_str} - Use this as the starting point for ALL deadline calculations
- Calculate deadlines based on task complexity, dependencies, and realistic work estimates
- Simple tasks (1-4 hours): Same day or next day deadline (add 0-1 days to current date)
- Medium tasks (4-8 hours): 1-2 days deadline (add 1-2 days to current date)
- Complex tasks (8+ hours): 2-5 days deadline (add 2-5 days to current date)
- Very complex tasks (16+ hours): 5-7 days deadline (add 5-7 days to current date)
- Consider dependencies: tasks that depend on others should have later deadlines than their dependencies
- Use YYYY-MM-DD format for deadlines (e.g., {current_date_str} for today, or add days for future dates)
- estimated_hours should be a number (e.g., 4, 8, 16) - realistic estimate based on the actual work required
- timeline should be human-readable (e.g., "2 days", "4 hours", "1 week") - how long it will take to complete
- IMPORTANT: Calculate actual dates by adding days to {current_date_str}. For example:
  * Task taking 2 days: deadline = {today + timedelta(days=2):%Y-%m-%d}
  * Task taking 1 week: deadline = {today + timedelta(days=7):%Y-%m-%d}
  * Task taking 4 hours: deadline = {today + timedelta(days=1):%Y-%m-%d} (next day)

EXAMPLES:
- Simple task "Add logging" → 2 subtasks (setup logging, integrate in main files)
- Complex task "Build user authentication" → 6 subtasks (database, API, frontend, tests, etc.)
- Medium task "Create API endpoint" → 3-4 subtasks (endpoint, validation, database, tests)

Return ONLY valid JSON:
{{
  "main_task": "Task title using actual project terminology",
  "goal": "Specific objective achievable with detected tech stack",
  "task_type": "{task_type}",
  "estimated_duration": "X days",
  "complexity": "low|medium|high",
  "subtask_count": "Number of subtasks generated",
  "technology_context": {{
    "primary_language": "Detected primary language",
    "frameworks_used": ["Actual frameworks to use"],
    "file_extensions": ["File types to create/modify"],
    "dependency_manager": "pip|npm|maven|cargo|composer|etc"
  }},
  "subtasks": [
    {{
      "title": "Short, clear task title",
      "description": "Detailed implementation steps with specific file paths, methods, and technical requirements",
      "role": "Specific role for the technology (e.g., Senior Python Developer, React Frontend Developer, Java Spring Developer)",
      "assigned_to": "Best matching team member name or 'Unassigned' if no good match",
      "deadline": "YYYY-MM-DD format (e.g., 2024-11-15) - specific date when this task should be completed",
      "estimated_hours": "Number of hours (e.g., 4, 8, 16) - realistic estimate based on complexity",
      "timeline": "Human-readable timeline (e.g., '2 days', '1 week', '4 hours') - how long it will take to complete",
      "output": "Concrete deliverable with acceptance criteria",
      "dependencies": ["Prerequisites using actual project components"],
      "files_to_create": ["New files with correct extensions and naming"],
      "files_to_modify": ["Existing files from actual project structure"],
      "technical_requirements": ["Specific technical implementation details"],
      "clarity_score": 92
    }}
  ]
}}"""

    try:
        logger.info("🚀 Calling Gemini API for implementation plan...")
        logger.info("🔧 API Method: VERTEX AI SDK (GenerativeModel)")
        model = GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content(
            prompt,
            generation_config={'temperature': 0.6, 'max_output_tokens': 2048}
        )
        
        text = response.text
        logger.info(f"📝 Plan Response Preview: {text[:200]}...")
        
        result = parse_json_from_text(text, "plan generation")
        logger.info(f"✨ Plan Generated: {len(result.get('subtasks', []))} subtasks")
        logger.info("="*60)
        logger.info(f"✅ PLAN COMPLETE")
        logger.info("="*60)
        
        # Add plan to conversation history in database
        if session_id:
            try:
                # Save to database with plan included
                save_conversation_history(session_id, task, analysis=None, plan=result)
                logger.info(f"💾 Added plan to database history")
            except Exception as e:
                logger.error(f"❌ Error saving plan to history: {str(e)}")
        
        return result
            
    except Exception as e:
        logger.error(f"❌ Plan Generation Error: {str(e)}")
        raise Exception(f"Gemini API failed: {str(e)}")


def summarize_slack_messages(messages):
    """
    Generate AI-powered summary of Slack channel messages
    
    Args:
        messages: List of message objects with 'user', 'text', 'timestamp'
    
    Returns:
        dict: Summary with key_updates, active_users, blockers, overall_status
    """
    logger.info("="*60)
    logger.info("SLACK CHANNEL SUMMARIZATION")
    logger.info("="*60)
    logger.info(f"📊 Analyzing {len(messages)} messages")
    
    try:
        # Prepare messages for AI
        conversation_text = ""
        for msg in messages:
            user = msg.get('user', 'Unknown')
            text = msg.get('text', '')
            conversation_text += f"{user}: {text}\n"
        
        prompt = f"""Analyze the following Slack channel conversation and provide a concise summary.

SLACK MESSAGES:
{conversation_text}

Generate a JSON response with this structure:
{{
  "key_updates": [
    {{"user": "User Name", "update": "Brief description of what they said/did"}},
    ...
  ],
  "active_users": ["List of users who participated"],
  "blockers": ["Any blockers or issues mentioned"],
  "progress_indicators": ["Any progress updates or completed tasks"],
  "overall_status": "A one-sentence summary of the channel activity",
  "sentiment": "positive/neutral/negative",
  "action_items": ["Any action items or next steps mentioned"]
}}

Keep updates brief (max 15 words each). Return ONLY valid JSON, no markdown, no code blocks."""
        
        logger.info("🚀 Calling Gemini API for summary...")
        logger.info("🔧 API Method: VERTEX AI SDK (GenerativeModel)")
        model = GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content(
            prompt,
            generation_config={
                'temperature': 0.3,
                'top_k': 40,
                'top_p': 0.95,
                'max_output_tokens': 2048
            }
        )
        
        text = response.text
        logger.info(f"📝 Summary Response Preview: {text[:200]}...")
        
        result = parse_json_from_text(text, "slack summary")
        logger.info(f"✨ Summary Generated Successfully")
        logger.info("="*60)
        
        return result
            
    except Exception as e:
        logger.error(f"❌ Summary Generation Error: {str(e)}")
        # Return a fallback summary
        return {
            "key_updates": [],
            "active_users": list(set([msg.get('user', 'Unknown') for msg in messages])),
            "blockers": [],
            "progress_indicators": [],
            "overall_status": f"Channel has {len(messages)} recent messages",
            "sentiment": "neutral",
            "action_items": [],
            "error": str(e)
        }

def send_periodic_followup(session_id, callback_url, interval=10):
    """
    Send follow-up requests every 10 seconds
    
    Args:
        session_id: Session identifier
        callback_url: URL to send follow-up requests to
        interval: Interval in seconds (default: 10)
    """
    import threading
    import time
    
    def followup_worker():
        while True:
            try:
                logger.info(f"🔄 Sending follow-up for session {session_id}")
                response = requests.post(
                    callback_url,
                    json={"session_id": session_id, "type": "followup"},
                    timeout=5
                )
                logger.info(f"✅ Follow-up sent: {response.status_code}")
            except Exception as e:
                logger.error(f"❌ Follow-up error: {str(e)}")
            
            time.sleep(interval)
    
    thread = threading.Thread(target=followup_worker, daemon=True)
    thread.start()
    logger.info(f"🚀 Started periodic follow-up every {interval}s for session {session_id}")
    return thread
