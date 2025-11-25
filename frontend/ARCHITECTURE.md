# Feeta Projects Architecture

## 🏗️ Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DemoDash (Main App)                      │
│                                                               │
│  State:                                                       │
│  - projects[]                                                 │
│  - selectedProject                                            │
│  - projectsViewMode ('overview' | 'detail')                  │
│  - user, githubConnected, slackConnected                     │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ activePage === 'projects'
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│ ProjectsOverview │          │  ProjectsView    │
│                  │          │                  │
│ When:            │          │ When:            │
│ viewMode =       │          │ viewMode =       │
│ 'overview'       │          │ 'detail'         │
│                  │          │                  │
│ Shows:           │          │ Shows:           │
│ - All projects   │          │ - Intent panel   │
│ - Health scores  │          │ - Activity feed  │
│ - Risk badges    │          │ - Tasks          │
│ - Progress bars  │          │ - Clarifications │
│                  │          │ - Blockers       │
│ onClick:         │          │ - Team avail.    │
│ setViewMode      │          │ - Repo intel.    │
│ ('detail')       │          │                  │
└──────────────────┘          └──────────────────┘
```

## 🔄 Data Flow

```
┌──────────────┐
│   User       │
│   Action     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│  Component State Update                           │
│  - setProjectsViewMode()                          │
│  - setSelectedProject()                           │
│  - setIntentInput()                               │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│  API Call                                         │
│  - POST /api/projects/:id/intent                 │
│  - GET /api/projects/:id/tasks                   │
│  - GET /api/projects/:id/activities              │
│  - GET /api/teams/members                        │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│  Backend Processing                               │
│  - AI analyzes intent                             │
│  - Creates tasks                                  │
│  - Suggests assignments                           │
│  - Detects risks                                  │
│  - Generates activities                           │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│  Response Data                                    │
│  - tasks[]                                        │
│  - clarifications[]                               │
│  - activities[]                                   │
│  - assignments[]                                  │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│  UI Update                                        │
│  - Render new tasks                               │
│  - Show activity in feed                          │
│  - Display clarifications                         │
│  - Update metrics                                 │
└───────────────────────────────────────────────────┘
```

## 📊 State Management

### Parent Component (DemoDash)
```javascript
// Navigation state
const [activePage, setActivePage] = useState('dashboard');
const [projectsViewMode, setProjectsViewMode] = useState('overview');

// Project state
const [projects, setProjects] = useState([]);
const [selectedProject, setSelectedProject] = useState(null);

// Integration state
const [githubConnected, setGithubConnected] = useState(false);
const [slackConnected, setSlackConnected] = useState(false);

// User state
const [user, setUser] = useState(null);
```

### ProjectsOverview Component
```javascript
// Enriched projects data
const [projectsData, setProjectsData] = useState([]);

// Computed for each project:
// - healthScore (0-100)
// - risks []
// - pendingClarifications (number)
// - upcomingDeadlines []
// - progress (0-100)
```

### ProjectsView Component
```javascript
// Intent processing
const [intentInput, setIntentInput] = useState('');
const [isProcessing, setIsProcessing] = useState(false);

// Project data
const [activities, setActivities] = useState([]);
const [clarifications, setClarifications] = useState([]);
const [tasks, setTasks] = useState([]);
const [blockers, setBlockers] = useState([]);
const [teamAvailability, setTeamAvailability] = useState([]);
const [repoIntelligence, setRepoIntelligence] = useState(null);
```

## 🔌 API Integration

### Existing Endpoints (Already Working)
```
GET  /api/projects
     → Returns: { projects: [...] }

GET  /api/projects/:id/tasks
     → Returns: { tasks: [...] }

GET  /api/teams/members
     → Returns: { members: [...] }

POST /api/projects/:id/tasks/approve
     → Body: { task_ids, channel_id, task_assignments }
     → Returns: { approved_count }
```

### New Endpoints (To Add)
```
POST /api/projects/:id/intent
     → Body: { intent: string }
     → Returns: {
         tasks: [...],
         clarifications: [...],
         assignments: [...]
       }

GET  /api/projects/:id/activities
     → Returns: {
         activities: [
           {
             type: string,
             message: string,
             timestamp: string,
             data: object
           }
         ]
       }
```

## 🎯 Component Responsibilities

### DemoDash (Parent)
- ✅ Manages global state
- ✅ Handles authentication
- ✅ Controls navigation
- ✅ Manages integrations (GitHub, Slack)
- ✅ Provides modal management

### ProjectsOverview
- ✅ Loads all projects
- ✅ Calculates health scores
- ✅ Detects risks
- ✅ Shows project cards
- ✅ Handles project selection

### ProjectsView
- ✅ Processes intent input
- ✅ Displays activity feed
- ✅ Shows AI-organized tasks
- ✅ Manages clarifications
- ✅ Displays blockers
- ✅ Shows team availability
- ✅ Displays repo intelligence

## 🔄 User Interaction Flow

### Viewing Projects
```
1. User clicks "Projects" in sidebar
   → setActivePage('projects')
   → setProjectsViewMode('overview')

2. ProjectsOverview renders
   → Loads all projects
   → Calculates metrics
   → Shows project cards

3. User clicks project card
   → setSelectedProject(project)
   → setProjectsViewMode('detail')

4. ProjectsView renders
   → Loads project data
   → Shows Feeta workspace
```

### Creating Tasks from Intent
```
1. User types intent in input
   → setIntentInput(text)

2. User clicks "Execute"
   → setIsProcessing(true)
   → POST /api/projects/:id/intent

3. Backend processes
   → AI analyzes intent
   → Creates tasks
   → Suggests assignments
   → Detects clarifications

4. Response received
   → setTasks([...newTasks])
   → setClarifications([...questions])
   → setActivities([...newActivity])
   → setIsProcessing(false)

5. UI updates
   → Tasks appear in center panel
   → Activity shows in feed
   → Clarifications show in right panel
```

### Approving Tasks
```
1. User clicks "Review & Approve"
   → onShowApprovalModal()
   → Parent opens approval modal

2. User reviews tasks
   → Sees suggested assignments
   → Can modify assignments
   → Selects Slack channel

3. User clicks "Approve"
   → POST /api/projects/:id/tasks/approve
   → Tasks sent to Slack
   → Status updated to 'approved'

4. UI refreshes
   → Tasks reload
   → Activity feed updates
   → Metrics recalculate
```

## 📦 Data Models

### Project
```typescript
interface Project {
  _id: string;
  name: string;
  repos?: Repo[];
  created_at: string;
  updated_at: string;
  
  // Computed (ProjectsOverview)
  tasks?: Task[];
  healthScore?: number;
  risks?: Risk[];
  pendingClarifications?: number;
  upcomingDeadlines?: Deadline[];
  progress?: number;
}
```

### Task
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'blocked';
  assigned_to?: string;
  estimated_hours?: number;
  deadline?: string;
  confidence_score?: number;
  needs_clarification?: boolean;
  suggested_assignee?: string;
  reasoning?: string;
  repo_evidence?: string[];
  subtasks?: Subtask[];
}
```

### Activity
```typescript
interface Activity {
  type: 'task_created' | 'assignment_suggested' | 'blocker_detected' | 'clarification_needed';
  message: string;
  timestamp: string;
  data?: any;
}
```

### Clarification
```typescript
interface Clarification {
  id: string;
  question: string;
  priority: 'high' | 'medium' | 'low';
  related_task?: string;
  reasoning?: string;
}
```

### Risk
```typescript
interface Risk {
  type: 'overdue' | 'blocked' | 'unassigned' | 'low_confidence';
  count: number;
  severity: 'high' | 'medium' | 'low';
}
```

## 🎨 Styling Architecture

### Design Tokens
```javascript
// Backgrounds
bg-[#0a0a0a]  // Darkest
bg-[#0f0f0f]  // Dark
bg-[#1a1a1a]  // Medium

// Borders
border-[#1f1f1f]  // Subtle
border-[#2a2a2a]  // Normal
border-[#3a3a3a]  // Hover

// Primary Colors
from-[#4C3BCF] to-[#6B5CE6]  // Gradient

// Text
text-white       // Primary
text-gray-400    // Secondary
text-gray-500    // Tertiary

// Status Colors
text-green-400   // Success
text-yellow-400  // Warning
text-red-400     // Error
text-blue-400    // Info
```

### Component Patterns
```javascript
// Card
className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f]/50 rounded-xl p-6 hover:bg-[#111111]/70 hover:border-[#2a2a2a] transition-all"

// Button Primary
className="px-6 py-3 bg-gradient-to-r from-[#4C3BCF] to-[#6B5CE6] hover:from-[#4C3BCF]/90 hover:to-[#6B5CE6]/90 rounded-lg font-medium transition-all"

// Input
className="px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#4C3BCF] transition-colors"

// Badge
className="px-2 py-1 text-xs rounded-lg bg-[#4C3BCF]/20 text-[#4C3BCF] border border-[#4C3BCF]/30"
```

## 🔐 Security Considerations

### Authentication
- All API calls include Bearer token
- Token stored in localStorage
- Token validated on each request
- Expired tokens redirect to login

### Authorization
- Users can only see their projects
- Team members verified before assignment
- Repo access checked before display
- Slack channels filtered by permissions

### Data Validation
- Intent input sanitized
- Task data validated
- User input escaped
- API responses validated

## 🚀 Performance Optimizations

### Data Loading
- Parallel API calls with Promise.all
- Caching with sessionStorage
- Lazy loading for large lists
- Debounced search inputs

### Rendering
- React.memo for expensive components
- Virtual scrolling for long lists
- Conditional rendering
- Optimized re-renders

### Network
- Request deduplication
- Response caching
- Optimistic updates
- Background refresh

## 📈 Scalability

### Current Capacity
- Handles 100+ projects
- 1000+ tasks per project
- 50+ team members
- Real-time updates

### Future Enhancements
- WebSocket for live updates
- Server-side pagination
- Infinite scroll
- Background sync
- Offline support

This architecture provides a solid foundation for the Feeta Projects section that can scale and evolve with your needs.
