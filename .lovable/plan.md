

# Add Dedicated Test Cases Page

## Overview
Create a new dedicated page for Test Cases with a link in the side navigation menu. This page will display all test cases across suites in a centralized list view, following the existing UI patterns and architecture.

## Changes Required

### 1. Create Test Cases Page Component
**File: `src/pages/TestCases.tsx`** (new file)

Create a new page component following the pattern from `Runs.tsx`:
- Import and use `LeftRail` with `activeItem="testcases"`
- Wrap with `AuthGate` and `TooltipProvider`
- Render the main `TestCasesListView` component

### 2. Create Test Cases List View Component
**File: `src/components/TestCasesListView.tsx`** (new file)

Create a list view component following the pattern from `RunsListView.tsx`:
- Header with title "Test Cases" and count
- Mobile-responsive layout (cards on mobile, table on desktop)
- Show test case name, associated suite, step count, and status
- Clickable rows that navigate to the suite with the test case selected
- Filter/search functionality
- Status badges for pass/fail/pending states

### 3. Update Left Rail Navigation
**File: `src/components/LeftRail.tsx`**

Add the Test Cases item to navigation arrays:
- Add `FileText` icon import from lucide-react
- Add to `topItems` array between Suites and Runs:
  ```typescript
  { icon: FileText, label: "Test Cases", id: "testcases", path: "/test-cases" }
  ```

### 4. Update App Router
**File: `src/App.tsx`**

Add routes for the Test Cases page:
- Import the new `TestCases` page component
- Add route: `<Route path="/test-cases" element={<TestCases />} />`
- Add route with optional case ID: `<Route path="/test-cases/:caseId" element={<TestCases />} />`

## Data Structure

The Test Cases page will display:

| Column | Description |
|--------|-------------|
| Name | Test case name |
| Suite | Parent suite name with link |
| Steps | Number of test steps |
| Status | Last run status (pass/fail/pending) |
| Last Run | Timestamp of last execution |

## Technical Details

### Navigation Flow
- Click on test case row navigates to `/suites/:suiteId?selectedCase=:caseId`
- This allows viewing the test case in context of its parent suite

### Component Hierarchy
```text
TestCases (page)
  +-- LeftRail
  +-- TestCasesListView
        +-- Header (title, count, filters)
        +-- ScrollArea
              +-- Table (desktop) / Cards (mobile)
```

### API Integration
For now, use mock data similar to `RunsListView`. The component will be structured to easily integrate with the real API when available:
- Aggregate test cases from multiple suites
- Include suite reference for navigation

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/TestCases.tsx` | Create |
| `src/components/TestCasesListView.tsx` | Create |
| `src/components/LeftRail.tsx` | Modify (add nav item) |
| `src/App.tsx` | Modify (add route) |

