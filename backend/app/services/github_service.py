import os
import requests
import logging
import json
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(name)s] - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

def get_user_repos(github_token):
    """Fetch user's GitHub repositories"""
    logger.info("🔍 Fetching user repositories...")
    
    headers = {'Authorization': f'token {github_token}'}
    url = "https://api.github.com/user/repos?per_page=100&sort=updated"
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        data = response.json()
        
        repos = [{
            'name': r['name'],
            'full_name': r['full_name'],
            'url': r['html_url'],
            'description': r['description'],
            'language': r['language'],
            'updated_at': r['updated_at']
        } for r in data if isinstance(data, list)]
        
        logger.info(f"✅ Found {len(repos)} repositories")
        return repos
    except Exception as e:
        logger.error(f"❌ Error fetching repos: {str(e)}")
        raise

def get_file_content(owner, repo, file_path, headers, max_size=5000):
    """Get content of a specific file from GitHub"""
    try:
        file_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{file_path}"
        response = requests.get(file_url, headers=headers, timeout=10)
        if response.status_code == 200:
            import base64
            content = base64.b64decode(response.json()['content']).decode('utf-8')
            return content[:max_size] if len(content) > max_size else content
    except Exception as e:
        logger.warning(f"Could not fetch {file_path}: {str(e)}")
    return None

def analyze_dependencies(all_files, owner, repo, headers):
    """Universal dependency and tech stack analysis for any language"""
    dependencies = {}
    tech_stack = {
        'languages': [],
        'frameworks': [],
        'databases': [],
        'tools': [],
        'deployment': []
    }
    
    # Universal dependency files mapping
    dep_files = {
        # JavaScript/Node.js
        'package.json': 'javascript',
        'yarn.lock': 'javascript',
        'package-lock.json': 'javascript',
        
        # Python
        'requirements.txt': 'python',
        'Pipfile': 'python',
        'setup.py': 'python',
        'pyproject.toml': 'python',
        'poetry.lock': 'python',
        
        # Java
        'pom.xml': 'java',
        'build.gradle': 'java',
        'build.gradle.kts': 'kotlin',
        
        # .NET
        '*.csproj': 'csharp',
        'packages.config': 'csharp',
        
        # Go
        'go.mod': 'go',
        'go.sum': 'go',
        
        # Rust
        'Cargo.toml': 'rust',
        'Cargo.lock': 'rust',
        
        # PHP
        'composer.json': 'php',
        'composer.lock': 'php',
        
        # Ruby
        'Gemfile': 'ruby',
        'Gemfile.lock': 'ruby',
        
        # Swift
        'Package.swift': 'swift',
        
        # Dart/Flutter
        'pubspec.yaml': 'dart',
        
        # Docker
        'Dockerfile': 'docker',
        'docker-compose.yml': 'docker',
        'docker-compose.yaml': 'docker'
    }
    
    # Analyze file extensions for language detection
    file_extensions = {}
    for file_path in all_files:
        ext = file_path.split('.')[-1].lower() if '.' in file_path else 'no_ext'
        file_extensions[ext] = file_extensions.get(ext, 0) + 1
    
    # Language detection from extensions
    extension_map = {
        'py': 'python', 'js': 'javascript', 'ts': 'typescript', 'jsx': 'react',
        'tsx': 'react', 'java': 'java', 'kt': 'kotlin', 'go': 'go',
        'rs': 'rust', 'php': 'php', 'rb': 'ruby', 'swift': 'swift',
        'cs': 'csharp', 'cpp': 'cpp', 'c': 'c', 'dart': 'dart',
        'vue': 'vue', 'html': 'html', 'css': 'css', 'scss': 'sass',
        'sql': 'sql', 'sh': 'bash', 'yml': 'yaml', 'yaml': 'yaml',
        'json': 'json', 'xml': 'xml', 'md': 'markdown'
    }
    
    # Detect languages from file extensions
    for ext, count in file_extensions.items():
        if ext in extension_map and count > 0:
            lang = extension_map[ext]
            if lang not in tech_stack['languages']:
                tech_stack['languages'].append(lang)
    
    # Analyze dependency files
    for file_path in all_files:
        filename = file_path.split('/')[-1]
        
        # Check exact matches
        if filename in dep_files:
            content = get_file_content(owner, repo, file_path, headers)
            if content:
                dependencies[filename] = content
                lang = dep_files[filename]
                if lang not in tech_stack['languages']:
                    tech_stack['languages'].append(lang)
                
                # Framework detection based on content
                content_lower = content.lower()
                
                # Python frameworks
                if filename == 'requirements.txt':
                    frameworks = {
                        'flask': 'Flask', 'django': 'Django', 'fastapi': 'FastAPI',
                        'tornado': 'Tornado', 'pyramid': 'Pyramid', 'bottle': 'Bottle'
                    }
                    databases = {
                        'pymongo': 'MongoDB', 'psycopg2': 'PostgreSQL', 'mysql': 'MySQL',
                        'sqlite': 'SQLite', 'redis': 'Redis', 'elasticsearch': 'Elasticsearch'
                    }
                    tools = {
                        'celery': 'Celery', 'gunicorn': 'Gunicorn', 'uwsgi': 'uWSGI',
                        'pytest': 'PyTest', 'requests': 'HTTP Client'
                    }
                    
                # JavaScript frameworks
                elif filename == 'package.json':
                    try:
                        pkg_data = json.loads(content)
                        deps = {**pkg_data.get('dependencies', {}), **pkg_data.get('devDependencies', {})}
                        
                        frameworks = {
                            'react': 'React', 'vue': 'Vue.js', 'angular': 'Angular',
                            'express': 'Express.js', 'koa': 'Koa.js', 'fastify': 'Fastify',
                            'next': 'Next.js', 'nuxt': 'Nuxt.js', 'gatsby': 'Gatsby'
                        }
                        databases = {
                            'mongoose': 'MongoDB', 'pg': 'PostgreSQL', 'mysql2': 'MySQL',
                            'sqlite3': 'SQLite', 'redis': 'Redis'
                        }
                        tools = {
                            'webpack': 'Webpack', 'vite': 'Vite', 'jest': 'Jest',
                            'cypress': 'Cypress', 'eslint': 'ESLint'
                        }
                        
                        for dep in deps:
                            if dep in frameworks:
                                tech_stack['frameworks'].append(frameworks[dep])
                            elif dep in databases:
                                tech_stack['databases'].append(databases[dep])
                            elif dep in tools:
                                tech_stack['tools'].append(tools[dep])
                    except:
                        pass
                
                # Generic pattern matching for other files
                else:
                    patterns = {
                        'frameworks': {
                            'spring': 'Spring', 'hibernate': 'Hibernate', 'laravel': 'Laravel',
                            'symfony': 'Symfony', 'rails': 'Ruby on Rails', 'sinatra': 'Sinatra'
                        },
                        'databases': {
                            'mongodb': 'MongoDB', 'postgresql': 'PostgreSQL', 'mysql': 'MySQL',
                            'redis': 'Redis', 'cassandra': 'Cassandra', 'dynamodb': 'DynamoDB'
                        },
                        'tools': {
                            'docker': 'Docker', 'kubernetes': 'Kubernetes', 'terraform': 'Terraform',
                            'ansible': 'Ansible', 'jenkins': 'Jenkins', 'github': 'GitHub Actions'
                        }
                    }
                
                # Apply pattern matching
                for category, items in patterns.items():
                    for pattern, name in items.items():
                        if pattern in content_lower and name not in tech_stack[category]:
                            tech_stack[category].append(name)
    
    # Remove duplicates and sort
    for key in tech_stack:
        tech_stack[key] = sorted(list(set(tech_stack[key])))
    
    return dependencies, tech_stack

def analyze_code_patterns(all_files, owner, repo, headers):
    """Universal code pattern analysis for any programming language"""
    patterns = {
        'api_endpoints': [],
        'database_models': [],
        'functions': [],
        'classes': [],
        'components': [],
        'config_files': [],
        'test_files': [],
        'build_files': [],
        'documentation': []
    }
    
    # Categorize files by type
    code_files = [f for f in all_files if any(f.endswith(ext) for ext in 
                 ['.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.go', '.rs', '.php', '.rb', '.cs', '.cpp', '.c', '.swift', '.kt', '.dart'])]
    
    config_files = [f for f in all_files if any(x in f.lower() for x in 
                   ['config', '.env', 'settings', 'properties', 'yml', 'yaml', 'toml', 'ini'])]
    
    test_files = [f for f in all_files if any(x in f.lower() for x in 
                 ['test', 'spec', '__tests__', '.test.', '.spec.'])]
    
    build_files = [f for f in all_files if any(f.endswith(x) for x in 
                  ['Dockerfile', 'Makefile', 'CMakeLists.txt']) or any(x in f for x in 
                  ['build.', 'webpack.', 'rollup.', 'vite.', 'gulpfile', 'gruntfile'])]
    
    doc_files = [f for f in all_files if any(f.lower().endswith(x) for x in 
                ['.md', '.rst', '.txt']) and any(x in f.lower() for x in 
                ['readme', 'doc', 'guide', 'manual'])]
    
    # Analyze code files for patterns (limit to top 20 for performance)
    for file_path in code_files[:20]:
        content = get_file_content(owner, repo, file_path, headers, max_size=4000)
        if not content:
            continue
            
        file_ext = file_path.split('.')[-1].lower()
        
        # Universal API endpoint patterns
        api_patterns = [
            # Python (Flask, FastAPI, Django)
            (r'@app\.route\(["\']([^"\']+)["\'].*?\)\s*def\s+(\w+)', 'Flask'),
            (r'@app\.(get|post|put|delete|patch)\(["\']([^"\']+)["\'].*?\)\s*def\s+(\w+)', 'FastAPI'),
            (r'path\(["\']([^"\']+)["\'].*?\)', 'Django'),
            
            # JavaScript/Node.js
            (r'app\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']', 'Express.js'),
            (r'router\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']', 'Router'),
            
            # Java (Spring)
            (r'@(Get|Post|Put|Delete|Patch)Mapping\(["\']([^"\']+)["\']\)', 'Spring'),
            (r'@RequestMapping\(["\']([^"\']+)["\']\)', 'Spring'),
            
            # Go
            (r'HandleFunc\(["\']([^"\']+)["\']', 'Go HTTP'),
            
            # PHP (Laravel)
            (r'Route::(get|post|put|delete|patch)\(["\']([^"\']+)["\']', 'Laravel'),
            
            # C# (ASP.NET)
            (r'\[Route\(["\']([^"\']+)["\']\)\]', 'ASP.NET'),
        ]
        
        for pattern, framework in api_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
            for match in matches:
                if isinstance(match, tuple):
                    endpoint = next((x for x in match if x and not x.upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']), '')
                else:
                    endpoint = match
                if endpoint:
                    patterns['api_endpoints'].append(f"{file_path}: {endpoint} ({framework})")
        
        # Universal class/model patterns
        class_patterns = [
            (r'class\s+(\w+)\s*[\(:]', 'Python/Java/C#'),
            (r'interface\s+(\w+)', 'TypeScript/Java'),
            (r'struct\s+(\w+)', 'Go/Rust/C'),
            (r'type\s+(\w+)\s*=', 'TypeScript/Go'),
            (r'class\s+(\w+)\s*{', 'JavaScript/Java/C#'),
        ]
        
        for pattern, lang in class_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                if isinstance(match, str) and match[0].isupper():  # Likely a class name
                    patterns['classes'].append(f"{file_path}: {match} ({lang})")
        
        # Universal function patterns
        function_patterns = [
            (r'def\s+(\w+)\s*\(', 'Python'),
            (r'function\s+(\w+)\s*\(', 'JavaScript'),
            (r'func\s+(\w+)\s*\(', 'Go'),
            (r'fn\s+(\w+)\s*\(', 'Rust'),
            (r'public\s+\w+\s+(\w+)\s*\(', 'Java/C#'),
            (r'private\s+\w+\s+(\w+)\s*\(', 'Java/C#'),
        ]
        
        for pattern, lang in function_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches[:3]:  # Limit per file
                if not match.startswith('_') and not match.startswith('__'):
                    patterns['functions'].append(f"{file_path}: {match}() ({lang})")
        
        # React/Vue component patterns
        if file_ext in ['jsx', 'tsx', 'vue']:
            component_patterns = [
                (r'export\s+default\s+function\s+(\w+)', 'React Function'),
                (r'const\s+(\w+)\s*=\s*\([^)]*\)\s*=>', 'React Arrow'),
                (r'class\s+(\w+)\s+extends\s+Component', 'React Class'),
                (r'<template>', 'Vue Template'),
            ]
            
            for pattern, comp_type in component_patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                for match in matches:
                    if isinstance(match, str) and match[0].isupper():
                        patterns['components'].append(f"{file_path}: {match} ({comp_type})")
    
    # Store categorized files
    patterns['config_files'] = config_files[:10]
    patterns['test_files'] = test_files[:10]
    patterns['build_files'] = build_files[:10]
    patterns['documentation'] = doc_files[:5]
    
    return patterns

def analyze_repo_structure(owner, repo, github_token):
    """Get comprehensive repo analysis with detailed context"""
    logger.info(f"📦 Deep analyzing {owner}/{repo}...")
    
    headers = {'Authorization': f'token {github_token}'}
    
    try:
        # Get repo info
        repo_url = f"https://api.github.com/repos/{owner}/{repo}"
        repo_resp = requests.get(repo_url, headers=headers, timeout=10)
        repo_info = repo_resp.json() if repo_resp.status_code == 200 else {}
        
        # Get repo tree
        tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/main?recursive=1"
        tree_resp = requests.get(tree_url, headers=headers, timeout=10)
        
        if tree_resp.status_code != 200:
            tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/master?recursive=1"
            tree_resp = requests.get(tree_url, headers=headers, timeout=10)
        
        tree_data = tree_resp.json()
        all_files = [f['path'] for f in tree_data.get('tree', []) if f['type'] == 'blob']
        
        # Build detailed folder structure
        folder_analysis = {}
        for file in all_files:
            parts = file.split('/')
            if len(parts) > 1:
                folder = parts[0]
                if folder not in folder_analysis:
                    folder_analysis[folder] = {'count': 0, 'types': set(), 'key_files': []}
                folder_analysis[folder]['count'] += 1
                
                # Analyze file types in folder
                ext = parts[-1].split('.')[-1] if '.' in parts[-1] else 'no_ext'
                folder_analysis[folder]['types'].add(ext)
                
                # Identify key files
                filename = parts[-1].lower()
                if any(key in filename for key in ['index', 'main', 'app', 'server', 'config', 'route', 'model']):
                    folder_analysis[folder]['key_files'].append(parts[-1])
        
        # Convert sets to lists for JSON serialization
        for folder in folder_analysis:
            folder_analysis[folder]['types'] = list(folder_analysis[folder]['types'])
        
        # Get comprehensive file contents
        readme_content = get_file_content(owner, repo, 'README.md', headers) or get_file_content(owner, repo, 'readme.md', headers) or ""
        
        # Analyze dependencies
        dependencies, tech_stack = analyze_dependencies(all_files, owner, repo, headers)
        
        # Analyze code patterns
        code_patterns = analyze_code_patterns(all_files, owner, repo, headers)
        
        # Get configuration files
        config_files = {}
        config_patterns = ['config', '.env', 'docker', 'package.json', 'requirements.txt', 'tsconfig', 'webpack']
        for file_path in all_files:
            if any(pattern in file_path.lower() for pattern in config_patterns):
                content = get_file_content(owner, repo, file_path, headers, max_size=3000)
                if content:
                    config_files[file_path] = content
        
        # Create comprehensive file analysis
        file_list = "\n".join([f"- {f}" for f in all_files[:40]])
        
        # Universal AI analysis prompt
        prompt = f"""You are a senior software architect. Analyze this repository to provide comprehensive, accurate context for any programming language or framework.

REPOSITORY: {owner}/{repo}
DESCRIPTION: {repo_info.get('description', 'No description')}
GITHUB LANGUAGE: {repo_info.get('language', 'Not specified')}
TOTAL FILES: {len(all_files)}

COMPLETE FILE STRUCTURE:
{file_list}

DETECTED TECHNOLOGIES:
Languages: {', '.join(tech_stack.get('languages', ['Unknown']))}
Frameworks: {', '.join(tech_stack.get('frameworks', ['None detected']))}
Databases: {', '.join(tech_stack.get('databases', ['None detected']))}
Tools: {', '.join(tech_stack.get('tools', ['None detected']))}

DEPENDENCY FILES ANALYZED:
{json.dumps(list(dependencies.keys()), indent=2)}

CODE PATTERNS FOUND:
{json.dumps(code_patterns, indent=2)}

README CONTENT:
{readme_content[:2000]}

CRITICAL ANALYSIS RULES:
1. Base ALL conclusions on ACTUAL files present - no assumptions
2. If multiple languages detected, identify the primary one and supporting ones
3. Only mention frameworks/tools that are actually found in dependencies or code
4. Identify the actual project type (web app, CLI tool, library, microservice, etc.)
5. Determine real architecture from file organization, not guesswork
6. List actual API endpoints found, or state 'none detected' if no API patterns found
7. Be specific about what each file/module actually does

Provide comprehensive JSON analysis:
{{
  "project_summary": "Detailed description of what this project actually does based on code analysis",
  "project_type": "web_application|cli_tool|library|microservice|desktop_app|mobile_app|data_pipeline|other",
  "architecture_overview": "Actual architecture pattern observed (monolithic, microservices, MVC, layered, etc.)",
  "tech_stack": {{
    "primary_language": "Main programming language used",
    "secondary_languages": ["Other languages if any"],
    "backend_framework": "Actual backend framework found or 'none'",
    "frontend_framework": "Actual frontend framework found or 'none'",
    "database_systems": ["Actual databases detected"],
    "testing_frameworks": ["Testing tools found"],
    "build_tools": ["Build/deployment tools found"],
    "development_tools": ["Dev tools and utilities"]
  }},
  "key_modules": [
    {{
      "module_name": "Actual file/module name",
      "description": "What this module does based on code analysis",
      "files": ["Specific files in this module"],
      "purpose": "Core functionality this module provides",
      "dependencies": ["What this module depends on"]
    }}
  ],
  "api_structure": {{
    "has_api": true/false,
    "api_type": "REST|GraphQL|gRPC|WebSocket|none",
    "endpoints": ["Actual endpoints found with methods"],
    "authentication": "Auth method detected or 'none'",
    "data_formats": ["JSON|XML|Protocol Buffers|etc"]
  }},
  "development_patterns": {{
    "code_organization": "How code is structured (modules, packages, layers)",
    "naming_conventions": "Observed naming patterns",
    "design_patterns": ["Design patterns evident in code"],
    "coding_standards": "Code style and standards observed"
  }},
  "integration_points": {{
    "external_apis": ["External services/APIs used"],
    "database_connections": ["Database integrations found"],
    "third_party_services": ["Third-party integrations"],
    "file_systems": ["File I/O operations detected"]
  }},
  "deployment_info": {{
    "containerization": "Docker/container setup if any",
    "build_process": "How to build/compile the project",
    "environment_setup": "Environment requirements and setup",
    "configuration_files": ["Config files that need setup"],
    "deployment_targets": ["Where this can be deployed"]
  }},
  "project_maturity": {{
    "development_stage": "prototype|development|production|maintenance",
    "code_quality_indicators": ["Tests present|Documentation|Error handling|etc"],
    "scalability_considerations": "Architecture scalability assessment"
  }}
}}"""
        
        logger.info("🤖 Calling Gemini for comprehensive analysis...")
        api_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
        response = requests.post(
            api_url,
            headers={'Content-Type': 'application/json'},
            params={'key': GEMINI_API_KEY},
            json={
                'contents': [{'parts': [{'text': prompt}]}],
                'generationConfig': {'temperature': 0.2, 'maxOutputTokens': 4096}
            },
            timeout=45
        )
        
        data = response.json()
        
        if 'candidates' in data and data['candidates']:
            text = data['candidates'][0]['content']['parts'][0]['text']
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                result = json.loads(json_match.group())
                
                # Add raw analysis data
                result['raw_data'] = {
                    'total_files': len(all_files),
                    'folder_structure': folder_analysis,
                    'dependencies': dependencies,
                    'code_patterns': code_patterns,
                    'config_files': list(config_files.keys()),
                    'repo_info': {
                        'stars': repo_info.get('stargazers_count', 0),
                        'language': repo_info.get('language', 'Unknown'),
                        'size': repo_info.get('size', 0),
                        'created_at': repo_info.get('created_at', ''),
                        'updated_at': repo_info.get('updated_at', '')
                    }
                }
                
                logger.info(f"✅ Comprehensive analysis complete - {len(result.get('key_modules', []))} modules identified")
                return result
        
        raise Exception("Failed to parse Gemini response")
        
    except Exception as e:
        logger.error(f"❌ Error in comprehensive analysis: {str(e)}")
        # Return basic analysis if comprehensive fails
        return {
            'project_summary': f"Repository {owner}/{repo} analysis failed, using basic structure",
            'architecture_overview': 'Unable to determine architecture',
            'tech_stack': tech_stack,
            'raw_data': {
                'total_files': len(all_files),
                'folder_structure': folder_analysis,
                'error': str(e)
            }
        }
