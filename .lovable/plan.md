

# Deployment Detail Page Implementation Plan

## Overview
Add click functionality to deployment rows/cards that navigates to a dedicated detail page. The detail page displays comprehensive deployment information with a header, metadata cards, timeline visualization, and runs table - matching the provided reference design.

## Visual Design (based on reference)
- **Header**: Back arrow, Deploy ID with result badge, commit message subtitle, action buttons (Rerun affected, Rerun full, Create issue)
- **Metadata cards row**: Branch, Commit hash, Author, Started date - each in a bordered card with icon and label
- **Stats card**: Risk Score badge, Environment, Duration, Tests (executed and skipped)
- **Timeline section**: Horizontal timeline showing Build, Deploy, Tests phases with durations
- **Runs table**: Table of test runs associated with this deployment (Run ID, Suite, Env, Status, Duration, Results)

## Files to Create

### 1. `src/components/DeploymentDetailView.tsx`
Main detail view component containing:
- Back button navigation to `/deployments`
- Header with Deploy ID, result badge, and action buttons
- Commit message subtitle
- Four metadata cards in a responsive grid (Branch, Commit, Author, Started)
- Stats card with Risk Score, Environment, Duration, Tests
- Timeline visualization with three phases
- Runs in this deployment table
- Mobile-responsive layouts
- Entrance animation (animate-fade-in)

### 2. `src/pages/DeploymentDetail.tsx`
Page wrapper with LeftRail and DeploymentDetailView

## Files to Modify

### 3. `src/App.tsx`
- Add dynamic route: `/deployments/:deployId`
- Import DeploymentDetail page

### 4. `src/components/DeploymentsView.tsx`
- Add `useNavigate` hook
- Add `onClick` handler to table rows
- Add `onClick` handler to mobile cards
- Add cursor pointer styling for clickable rows/cards

## Extended Data Structure

```text
// Extended deployment data for detail page
interface DeploymentDetail extends Deployment {
  author: string
  startedDate: string  // Full date for display
  timeline: {
    build: { duration: string; status: 'success' | 'failure' }
    deploy: { duration: string; status: 'success' | 'failure' }
    tests: { duration: string; status: 'success' | 'failure' }
  }
  runs: Array<{
    id: string
    runId: string
    suite: string
    env: string
    status: 'Passed' | 'Failed'
    duration: string
    results: number
  }>
}
```

## Mock Data for Detail Page
For dep-001:
- Author: Sarah Chen
- Started: 14/01/2024
- Timeline: Build 45s, Deploy 1m 12s, Tests 3m 45s
- Runs: run-001, Auth E2E Suite, Production, Passed, 1m 29s, 24

---

## Technical Details

### Layout Structure

```text
<div className="flex-1 p-4 md:p-6 overflow-auto animate-fade-in">
  <div className="max-w-5xl mx-auto space-y-6">
    
    <!-- Header -->
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1>dep-001 <ResultBadge /></h1>
          <p>feat: add user authentication flow</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button>Rerun affected</Button>
        <Button>Rerun full</Button>
        <Button>Create issue</Button>
      </div>
    </div>
    
    <!-- Metadata Cards -->
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetadataCard icon={GitBranch} label="Branch" value="main" />
      <MetadataCard icon={GitCommit} label="Commit" value="a1b2c3d" />
      <MetadataCard icon={User} label="Author" value="Sarah Chen" />
      <MetadataCard icon={Clock} label="Started" value="14/01/2024" />
    </div>
    
    <!-- Stats Card -->
    <Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Risk Score" value={<RiskBadge />} />
        <Stat label="Environment" value="Production" />
        <Stat label="Duration" value="5m 42s" />
        <Stat label="Tests" value="156 executed, 4 skipped" />
      </div>
    </Card>
    
    <!-- Timeline -->
    <Card>
      <h2>Timeline</h2>
      <TimelineVisualization />
    </Card>
    
    <!-- Runs Table -->
    <Card>
      <h2>Runs in this deployment</h2>
      <Table>...</Table>
    </Card>
    
  </div>
</div>
```

### Navigation Click Handler (DeploymentsView)
```text
const navigate = useNavigate();

// For table rows:
<TableRow 
  key={deployment.id}
  className="cursor-pointer hover:bg-muted/50"
  onClick={() => navigate(`/deployments/${deployment.deployId}`)}
>

// For mobile cards:
<Card 
  className="p-4 cursor-pointer hover:bg-muted/50"
  onClick={() => navigate(`/deployments/${deployment.deployId}`)}
>
```

### Route Configuration
```text
<Route path="/deployments/:deployId" element={<DeploymentDetail />} />
```

### Back Button Component
```text
<button onClick={() => navigate('/deployments')} className="...">
  <ArrowLeft className="w-5 h-5" />
</button>
```

### Timeline Visualization
Three connected nodes with lines:
- Each node: colored circle (green for success) + label + duration
- Horizontal connecting lines between nodes
- Responsive: stack vertically on mobile

```text
<div className="flex items-center justify-between">
  <TimelineNode label="Build" duration="45s" status="success" />
  <div className="flex-1 h-0.5 bg-green-500/30 mx-2" />
  <TimelineNode label="Deploy" duration="1m 12s" status="success" />
  <div className="flex-1 h-0.5 bg-green-500/30 mx-2" />
  <TimelineNode label="Tests" duration="3m 45s" status="success" />
</div>
```

### Runs Table Structure
```text
<Table>
  <TableHeader>
    <TableHead>Run ID</TableHead>
    <TableHead>Suite</TableHead>
    <TableHead>Env</TableHead>
    <TableHead>Status</TableHead>
    <TableHead>Duration</TableHead>
    <TableHead>Results</TableHead>
  </TableHeader>
  <TableBody>
    {runs.map(run => <TableRow>...</TableRow>)}
  </TableBody>
</Table>
```

### Action Buttons
- Rerun affected: Outline button with RefreshCw icon
- Rerun full: Outline button with Play icon
- Create issue: Outline button with ExternalLink icon
- Toast notification on click

### Mobile Responsiveness
- Header: Stack title and buttons vertically
- Metadata cards: 2 columns on mobile, 4 on desktop
- Stats: 2 columns on mobile, 4 on desktop
- Timeline: Horizontal with smaller font sizes
- Runs table: Convert to cards (similar to deployments list)

### Icons to Use (from lucide-react)
- ArrowLeft (back button)
- GitBranch (branch card)
- GitCommit (commit card)
- User (author card)
- Clock (started card)
- RefreshCw (rerun affected)
- Play (rerun full)
- ExternalLink (create issue)
- Check (passed status)

