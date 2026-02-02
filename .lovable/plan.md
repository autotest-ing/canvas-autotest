

# Deployments Page Implementation Plan

## Overview
Create a new dedicated Deployments page that displays all deployments and their test results in a data table format. The page will include search functionality, filter dropdowns, and a mobile-optimized layout that transforms the table into cards on small screens.

## Visual Design (based on reference)
- Page header with "Deployments" title (with green dot) and subtitle "All deployments and their test results"
- Search input on the left with filter dropdowns on the right (Status, Envs, Branches)
- Data table with columns: Deploy ID, Repo, Branch, Commit, Env, Risk, Result, Started, Duration, Tests
- Result badges: Passed (green), Failed (red), Partial (amber)
- Risk badges: Low (green), Medium (amber), High (red) with numeric score
- Mobile optimization: Transform table rows into stacked cards

## Files to Create

### 1. `src/components/DeploymentsView.tsx`
Main view component containing:
- Page header with PageTitle and subtitle
- Search input and filter dropdowns (All Status, All Envs, All Branches)
- Data table with mock deployment data
- Mobile-responsive card layout
- Entrance animation (animate-fade-in)

### 2. `src/pages/Deployments.tsx`
Page wrapper with LeftRail and DeploymentsView

## Files to Modify

### 3. `src/App.tsx`
- Import Deployments page
- Add route: `/deployments`

### 4. `src/components/LeftRail.tsx`
- Add Deployments nav item to topItems (using Rocket or Ship icon from lucide-react)
- Position after Integrations

## Deployment Data Structure

```text
interface Deployment {
  id: string
  deployId: string
  repo: string
  branch: string
  commit: {
    hash: string
    message: string
  }
  env: 'Production' | 'Staging' | 'Development'
  risk: {
    score: number
    level: 'Low' | 'Medium' | 'High'
  }
  result: 'Passed' | 'Failed' | 'Partial'
  started: string
  duration: string
  tests: {
    passed: number
    total: number
  }
}
```

## Mock Deployments Data
- dep-001: autotest/webapp, main, a1b2c3d, Production, 23 Low, Passed, 5m 42s, 156/160
- dep-002: autotest/webapp, feature/payments, e4f5g6h, Staging, 67 High, Failed, 7m 8s, 189/191
- dep-003: autotest/api, main, i7j8k9l, Production, 45 Medium, Partial, 9m 27s, 234/246
- dep-004: autotest/webapp, hotfix/login, m0n1o2p, Production, 12 Low, Passed, 3m 18s, 89/89

---

## Technical Details

### Layout Specifications
- Centered container: `max-w-6xl mx-auto px-4 md:px-6`
- Search/filter row: `flex flex-col md:flex-row gap-4 items-stretch md:items-center`
- Table container: `border rounded-xl overflow-hidden`

### Desktop Table Structure
```text
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Deploy ID</TableHead>
      <TableHead>Repo</TableHead>
      <TableHead>Branch</TableHead>
      <TableHead>Commit</TableHead>
      <TableHead>Env</TableHead>
      <TableHead>Risk</TableHead>
      <TableHead>Result</TableHead>
      <TableHead>Started</TableHead>
      <TableHead>Duration</TableHead>
      <TableHead>Tests</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {deployments.map(d => <TableRow>...</TableRow>)}
  </TableBody>
</Table>
```

### Mobile Optimization Strategy
The table is too wide for mobile screens. Implementation approach:
1. Use `useIsMobile()` hook to detect screen size
2. On mobile: Render deployments as stacked cards instead of table rows
3. Each card shows key info in a structured layout:
   - Header: Deploy ID + Result badge
   - Body: Repo, Branch, Commit (truncated)
   - Footer: Env, Risk, Duration, Tests

### Mobile Card Layout
```text
<Card>
  <div className="flex justify-between items-start mb-2">
    <span className="font-mono text-sm">{deployId}</span>
    <Badge>{result}</Badge>
  </div>
  <div className="text-sm text-muted-foreground space-y-1">
    <div>{repo} / {branch}</div>
    <div className="truncate">{commit.message}</div>
  </div>
  <div className="flex items-center gap-3 mt-3 text-xs">
    <span>{env}</span>
    <RiskBadge />
    <span>{duration}</span>
    <span>{tests.passed}/{tests.total}</span>
  </div>
</Card>
```

### Badge Styling
- Result Passed: `bg-green-500/10 text-green-600 border-green-500/20`
- Result Failed: `bg-red-500/10 text-red-600 border-red-500/20`
- Result Partial: `bg-amber-500/10 text-amber-600 border-amber-500/20`
- Risk Low: `bg-green-500/15 text-green-600`
- Risk Medium: `bg-amber-500/15 text-amber-600`
- Risk High: `bg-red-500/15 text-red-600`

### Filter Dropdowns
Using Select component from shadcn/ui:
- All Status: Shows all, Passed, Failed, Partial
- All Envs: Shows all, Production, Staging, Development
- All Branches: Shows all branches from data

### Search Functionality
- Input with Search icon (lucide-react)
- Filters deployments by deployId, repo, branch, or commit message
- Client-side filtering on mock data

### Navigation Addition
- Icon: `Rocket` from lucide-react
- Label: "Deployments"
- Path: `/deployments`
- Position: After Integrations in topItems

