
# Fix Canvas Node Connector Alignment

## Overview
Fix the connection lines on the Run Canvas page so they properly connect from the center/edge of each node to the center/edge of the next node. Currently the lines use hardcoded offset values that don't match the actual node sizes.

## Problem Analysis
Looking at the screenshot, the connection lines don't align properly with the nodes because:
1. All nodes are positioned using their center point (x, y) with `transform: translate(-50%, -50%)`
2. The connector offsets are hardcoded values that don't match actual node radii

**Current node sizes:**
- Suite Node: `w-24 h-24` = 96px diameter, radius = 48px
- Test Case Node: `w-16 h-16` = 64px diameter, radius = 32px  
- Test Step Node: `w-12 h-12` = 48px diameter, radius = 24px

**Current connector offsets (incorrect):**
- Suite to Case: `startX + 50` (should be +48), `endX - 35` (should be -32)
- Case to Step: `startX + 35` (should be +32), `endX - 30` (should be -24)

## Solution
Update `RunCanvasView.tsx` to use the correct node radii as constants and calculate connector positions accurately so lines connect edge-to-edge.

## Changes

### File: `src/components/RunCanvasView.tsx`

**Add node size constants:**
```typescript
// Node sizes (diameter in pixels based on Tailwind classes)
const SUITE_NODE_RADIUS = 48;    // w-24 = 96px / 2
const CASE_NODE_RADIUS = 32;     // w-16 = 64px / 2
const STEP_NODE_RADIUS = 24;     // w-12 = 48px / 2
```

**Update Suite to Test Case connectors (around line 352-361):**
- Start X: `nodePositions.suite.x + SUITE_NODE_RADIUS` (right edge of suite)
- Start Y: `nodePositions.suite.y` (center Y)
- End X: `casePos.x - CASE_NODE_RADIUS` (left edge of case)
- End Y: `casePos.y` (center Y)

**Update Test Case to Test Step connectors (around line 364-379):**
- Start X: `casePos.x + CASE_NODE_RADIUS` (right edge of case)
- Start Y: `casePos.y` (center Y)
- End X: `stepPos.x - STEP_NODE_RADIUS` (left edge of step)
- End Y: `stepPos.y` (center Y)

## Visual Result
After this fix, connection lines will:
- Start from the exact right edge of the source node
- End at the exact left edge of the target node
- Pass through the horizontal center (Y) of both nodes
- Create smooth curved bezier paths between nodes
