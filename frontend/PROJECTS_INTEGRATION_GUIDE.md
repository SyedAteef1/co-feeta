# Feeta Projects Section - Integration Guide

## Overview
This guide explains how to integrate the new comprehensive Projects section into your demodash.

## New Components Created

### 1. ProjectsView.jsx
**Location:** `src/app/demodash/ProjectsView.jsx`

**Purpose:** Main project workspace with Feeta intelligence

**Features:**
- Intent → Action Panel (top)
- Feeta Activity Feed (left)
- AI-Organized Tasks (center)
- Clarifying Questions (right top)
- Blockers & Risks (right bottom)
- Team Availability (bottom left)
- Repo Intelligence (bottom right)

### 2. ProjectsOverview.jsx
**Location:** `src/app/demodash/ProjectsOverview.jsx`

**Purpose:** Projects overview page showing all projects with AI metrics

**Features:**
- Project cards with AI health scores
- Current risks display
- Pending clarifications count
- Auto-assigned tasks indicator
- Upcoming deadlines
- Last AI activity timestamp
- Feeta-verified progress bars

## Integration Steps

### Step 1: Import the New Components

Add these imports to your `demodash/page.jsx`:

```javascript
import ProjectsView from './ProjectsView';
import ProjectsOverview from './ProjectsOverview';
```

### Step 2: Add State for Projects View Mode

Add this state near your other state declarations:

```javascript
const [projectsViewMode, setProjectsViewMode] = useState('overview'); // 'overview' or 'detail'
```

### Step 3: Replace the Projects Section

Find the section where `activePage === 'projects'` and replace it with:

```javascript
{activePage === 'projects' && (
  <div className="h-[calc(100vh-80px)] flex flex-col">
    {projectsViewMode === 'overview' ? (
      <ProjectsOverview
        projects={projects}
        onSelectProject={(project) => {
          setSelectedProject(project);
          setProjectsViewMode('detail');
        }}
      />
    ) : (
      <div className="h-full flex flex-col">
        {/* Back Button */}
        <div className="p-4 border-b border-[#1f1f1f] bg-[#0a0a0a]">
          <button
            onClick={() => setProjectsViewMode('overview')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Back to Projects
          </button>
        </div>
        
        {/* Projects Detail View */}
        <ProjectsView
          selectedProject={selectedProject}
          user={user}
          githubConnected={githubConnected}
          slackConnected={slackConnected}
          onShowRepoModal={() => setShowRepoModal(true)}
          onShowApprovalModal={() => {
            const projectId = selectedProject._id || selectedProject.id;
            if (projectId) {
              showPendingTasksApproval(projectId);
            }
          }}
        />
      </div>
    )}
  </div>
)}
```

### Step 4: Update the Projects Menu Click Handler

Update your `handleMenuItemClick` function to reset the view mode:

```javascript
const handleMenuItemClick = (page) => {
  // ... existing code ...
  
  if (page === 'projects') {
    setProjectsViewMode('overview'); // Reset to overview when clicking Projects menu
  }
  
  setActivePage(page);
};
```

### Step 5: Update Project Selection in Sidebar

When a project is selected from the sidebar, set the view mode to detail:

```javascript
const selectProject = (project) => {
  setSelectedProject(project);
  setMessages([]);
  setSessionId(null);
  setProjectsViewMode('detail'); // Add this line
  
  // ... rest of existing code ...
};
```

## Backend API Requirements

The new components expect these API endpoints:

### 1. Intent Processing
```
POST /api/projects/:projectId/intent
Body: { intent: string }
Response: {
  tasks: [...],
  clarifications: [...],
  assignments: [...]
}
```

### 2. Project Activities
```
GET /api/projects/:projectId/activities
Response: {
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

### 3. Enhanced Tasks Endpoint
The existing `/api/projects/:projectId/tasks` should include:
- `confidence_score` (0-100)
- `needs_clarification` (boolean)
- `suggested_assignee` (string)
- `reasoning` (string)
- `repo_evidence` (array)

## Styling Notes

The components use your existing design system:
- Background: `bg-[#0a0a0a]`, `bg-[#0f0f0f]/60`
- Borders: `border-[#1f1f1f]`, `border-[#2a2a2a]`
- Primary color: `#4C3BCF` to `#6B5CE6` gradient
- Text: `text-white`, `text-gray-400`, `text-gray-500`

## Features Implemented

### ✅ Projects Overview (Main Page)
- [x] Project cards with AI health scores
- [x] Current risks display
- [x] Pending clarifications count
- [x] Auto-assigned tasks indicator
- [x] Upcoming deadlines
- [x] Last AI activity timestamp
- [x] "Operated by Feeta" label
- [x] Feeta-verified progress bars

### ✅ Inside a Project
- [x] Intent → Action Panel (top)
- [x] Feeta Activity Feed (left side)
- [x] Clarifying Questions Center (right side)
- [x] Tasks (AI-Organized) (center)
- [x] Blockers & Risks Panel (right bottom)
- [x] Team Availability View (bottom)
- [x] Repo Intelligence (bottom)

### Task Card Details
Each task shows:
- [x] Title & Description
- [x] Subtasks
- [x] Suggested assignee
- [x] Match percentage
- [x] Reasoning
- [x] Repo evidence
- [x] Confidence score

## Testing Checklist

1. [ ] Projects overview loads with all projects
2. [ ] Health scores calculate correctly
3. [ ] Clicking a project opens detail view
4. [ ] Intent input processes and creates tasks
5. [ ] Activity feed updates in real-time
6. [ ] Clarifications appear when needed
7. [ ] Tasks show all required information
8. [ ] Team availability displays correctly
9. [ ] Repo intelligence shows connected repos
10. [ ] Back button returns to overview

## Troubleshooting

### Projects not loading
- Check if `projects` prop is being passed correctly
- Verify API endpoint `/api/projects` is working
- Check browser console for errors

### Health scores showing 0
- Ensure tasks are being loaded for each project
- Verify task data includes `status`, `deadline`, `confidence_score`

### Activity feed empty
- Check if `/api/projects/:projectId/activities` endpoint exists
- Verify activities are being created when actions occur

### Team availability not showing
- Ensure `/api/teams/members` endpoint is working
- Check if members have `idle_percentage` field

## Next Steps

After integration, you can enhance with:

1. **Real-time Updates**: Add WebSocket support for live activity feed
2. **AI Summaries**: Daily/weekly AI-generated project summaries
3. **Risk Predictions**: ML-based risk prediction before they occur
4. **Auto-reassignment**: Feeta automatically reassigns tasks based on workload
5. **Code Analysis**: Deep repo analysis with hotspot detection

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify all API endpoints are working
3. Ensure all required props are being passed
4. Check that state management is correct

## Example Usage

```javascript
// In your demodash/page.jsx

// 1. Import components
import ProjectsView from './ProjectsView';
import ProjectsOverview from './ProjectsOverview';

// 2. Add state
const [projectsViewMode, setProjectsViewMode] = useState('overview');

// 3. Use in render
{activePage === 'projects' && (
  projectsViewMode === 'overview' ? (
    <ProjectsOverview
      projects={projects}
      onSelectProject={(project) => {
        setSelectedProject(project);
        setProjectsViewMode('detail');
      }}
    />
  ) : (
    <ProjectsView
      selectedProject={selectedProject}
      user={user}
      githubConnected={githubConnected}
      slackConnected={slackConnected}
      onShowRepoModal={() => setShowRepoModal(true)}
      onShowApprovalModal={() => showPendingTasksApproval(selectedProject._id)}
    />
  )
)}
```

## Summary

This implementation provides a complete Feeta-powered Projects section that:
- Shows AI intelligence at every level
- Provides real-time insights and recommendations
- Automates task assignment and risk detection
- Integrates seamlessly with your existing codebase
- Follows your design system and patterns

The Projects section is now the central hub where Feeta's AI operates your projects autonomously.
