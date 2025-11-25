# Quick Integration - Copy & Paste

## Step 1: Add Imports (Top of demodash/page.jsx)

```javascript
import ProjectsView from './ProjectsView';
import ProjectsOverview from './ProjectsOverview';
```

## Step 2: Add State (After line 118 in your file)

```javascript
const [projectsViewMode, setProjectsViewMode] = useState('overview'); // 'overview' or 'detail'
```

## Step 3: Update handleMenuItemClick Function

Find your `handleMenuItemClick` function and add this at the beginning:

```javascript
const handleMenuItemClick = (page) => {
  console.log('🖱️ Menu item clicked:', page);
  
  // Reset projects view mode when clicking Projects menu
  if (page === 'projects') {
    setProjectsViewMode('overview');
  }
  
  // ... rest of your existing code ...
  setActivePage(page);
};
```

## Step 4: Update selectProject Function

Find your `selectProject` function and add this line:

```javascript
const selectProject = (project) => {
  setSelectedProject(project);
  setMessages([]);
  setSessionId(null);
  setProjectsViewMode('detail'); // ADD THIS LINE
  
  // ... rest of your existing code ...
};
```

## Step 5: Replace Projects Content Section

Find this in your code:
```javascript
{activePage === 'projects' ? (
  /* Projects View - Chat Interface */
  <>
    {/* ... existing projects code ... */}
  </>
) : ...
```

Replace the entire projects section with:

```javascript
{activePage === 'projects' ? (
  <div className="h-[calc(100vh-80px)] flex flex-col">
    {projectsViewMode === 'overview' ? (
      <div className="flex-1 overflow-y-auto p-8">
        <ProjectsOverview
          projects={projects}
          onSelectProject={(project) => {
            setSelectedProject(project);
            setProjectsViewMode('detail');
          }}
        />
      </div>
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
) : ...
```

## That's It!

Your Projects section now has:
- ✅ Projects Overview with AI health scores
- ✅ Intent → Action panel
- ✅ Feeta Activity Feed
- ✅ AI-Organized Tasks
- ✅ Clarifying Questions
- ✅ Blockers & Risks
- ✅ Team Availability
- ✅ Repo Intelligence

## Test It

1. Click "Projects" in sidebar
2. You should see the Projects Overview with all your projects
3. Click on a project card
4. You should see the detailed project view with all Feeta features
5. Click "Back to Projects" to return to overview

## Minimal Backend Changes Needed

If you want full functionality, add this endpoint:

```javascript
// Backend: routes/projects.js
router.get('/:projectId/activities', async (req, res) => {
  try {
    const activities = await Activity.find({ project_id: req.params.projectId })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json({ activities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:projectId/intent', async (req, res) => {
  try {
    const { intent } = req.body;
    // Process intent with AI
    // Create tasks, detect clarifications, assign team members
    // Return results
    res.json({ 
      tasks: [...],
      clarifications: [...],
      assignments: [...]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Without Backend Changes

The components will still work and show:
- Projects overview with basic metrics
- Task lists
- Team availability
- Repo connections

The Intent → Action and Activity Feed will just show "No activity yet" until you add the backend endpoints.
