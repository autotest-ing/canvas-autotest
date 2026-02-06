

# Create Visual Run Canvas Page

## Overview
Create a new dedicated Run Canvas page that displays a visual, node-based flow diagram showing the test execution hierarchy. The visualization follows the pattern from Make.com (reference image) with:
- **Test Suite** as a central circle node with suite name (e.g., "Smoke", "Regression", "Leads API")
- **Test Cases** connected via lines from the suite node
- **Test Steps** connected via lines from each test case
- **Assertions** shown on hover as popup cards on test steps
- **Run command** button fixed at bottom-left

## Technical Approach

### SVG-based Canvas
The visual flow will be rendered using SVG for smooth lines/connections and positioned HTML elements for interactive nodes. This approach:
- Allows for curved/dotted connector lines like in the reference
- Enables interactive hover states
- Works well with existing Tailwind styling

### Node Layout Algorithm
Nodes will be laid out in a left-to-right flow:
1. Suite node on the left (large circle)
2. Test Case nodes in the middle column
3. Test Step nodes on the right
4. Lines connecting related nodes with dotted paths

## Files to Create/Modify

### 1. New Page: `src/pages/RunCanvas.tsx`
- Route handler page that wraps the canvas component
- Uses LeftRail for navigation
- Passes runId from URL params

### 2. New Component: `src/components/RunCanvasView.tsx`
Main canvas container with:
- Full viewport SVG canvas
- Node rendering
- Line/connector rendering
- Zoom/pan controls (optional, basic version first)

### 3. New Component: `src/components/canvas/SuiteNode.tsx`
Circle node for Test Suite:
- Large circle (80-100px diameter)
- Suite name label below
- Colored based on status
- Badge showing count

### 4. New Component: `src/components/canvas/TestCaseNode.tsx`
Circle node for Test Case:
- Medium circle (60-70px diameter)
- Test case name below
- Status indicator badge
- Click to select/highlight

### 5. New Component: `src/components/canvas/TestStepNode.tsx`
Circle node for Test Step:
- Smaller circle (50-60px diameter)
- Step name + method badge
- Hover triggers assertion popup

### 6. New Component: `src/components/canvas/AssertionPopover.tsx`
Hover popup showing assertion details:
- Uses HoverCard component
- Lists all assertions with status icons
- Shows pass/fail counts

### 7. New Component: `src/components/canvas/NodeConnector.tsx`
SVG path component for connecting nodes:
- Dotted line style (like reference image)
- Curved bezier paths
- Color based on status

### 8. Update Routes: `src/App.tsx`
Add new route:
```
/runs/:runId/canvas → RunCanvas page
```

## Visual Layout

```text
+------------------------------------------------------------------+
|                                                                  |
|    +------+                                                      |
|    |      |        +-------+          +---------+                |
|    | Suite|---●●●--| Case 1|---●●●----| Step 1  |[hover:popup]   |
|    | Node |        +-------+          +---------+                |
|    | "Smoke"                   \                                 |
|    +------+                     \     +---------+                |
|        \                         `●●--| Step 2  |                |
|         \                             +---------+                |
|          \         +-------+                                     |
|           `---●●●--| Case 2|---●●●----+---------+                |
|                    +-------+          | Step 3  |                |
|                                       +---------+                |
|                                                                  |
+------------------------------------------------------------------+
| [▶ Run]                                                          |
+------------------------------------------------------------------+
```

## Node Colors (based on status)
- **Pass**: Emerald/Green circle with check icon
- **Fail**: Red/Destructive circle with X icon  
- **Pending**: Gray circle with clock icon
- **Running**: Primary/Teal with animated pulse

## Data Structure
Uses existing `RunTestCase` and `RunTestStep` interfaces from `RunTestCaseList.tsx`:
- Each test case contains steps array
- Steps have assertion counts
- Status determines node styling

## Implementation Order
1. Create basic page and route
2. Build node components (Suite, TestCase, TestStep)
3. Add SVG connector lines
4. Implement assertion hover popup
5. Add fixed Run button
6. Polish styling and animations

## Technical Details

### Canvas Positioning
- Use CSS Grid or absolute positioning within a relative container
- Calculate node positions based on hierarchy level
- SVG overlay for connection lines

### Hover Card for Assertions
```tsx
<HoverCard>
  <HoverCardTrigger asChild>
    <TestStepNode step={step} />
  </HoverCardTrigger>
  <HoverCardContent>
    <AssertionList assertions={step.assertions} />
  </HoverCardContent>
</HoverCard>
```

### Fixed Run Button
```tsx
<div className="fixed bottom-6 left-6 z-50">
  <Button onClick={handleRun} className="gap-2 shadow-lg">
    <Play className="w-4 h-4" />
    Run
  </Button>
</div>
```

## Build Errors to Fix First
Before implementing this feature, the existing build errors in `EnvironmentsView.tsx` and `environments.ts` need to be fixed:
1. Add `is_default` and `isDefault` properties to `EnvironmentDetailResponse` type
2. Add `is_overridable` and `isOverridable` properties to `EnvironmentVariable` type
3. Remove the `base_url` check in `updateEnvironment` function since it was removed from the payload type

