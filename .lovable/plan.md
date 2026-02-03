
# Add Unsaved Changes Confirmation Dialog

## Overview
Add a confirmation dialog that prompts users to save or discard changes when they:
1. Try to switch to a different environment tab with unsaved changes
2. Try to navigate away from the Environments page with unsaved changes

The dialog will include three buttons: Save, Discard, and Cancel.

## Changes

### 1. Update EnvironmentsView Component
**File:** `src/components/EnvironmentsView.tsx`

**New State:**
- `showUnsavedDialog`: Boolean to control dialog visibility
- `pendingEnvironment`: Store the environment tab the user wants to switch to (null if navigating away)

**New Imports:**
- `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` from `@/components/ui/alert-dialog`
- `useBlocker` from `react-router-dom` (for blocking navigation)

**Logic Changes:**
- Intercept tab switching: When user clicks a different tab, check `hasChanges`. If true, show dialog instead of switching
- Use `useBlocker` hook to intercept route navigation when there are unsaved changes
- Handle browser refresh/close with `beforeunload` event

**Dialog Actions:**
- **Save**: Call `handleSave()`, then proceed with the pending action (switch tab or navigate away)
- **Discard**: Reset the current environment changes, then proceed with the pending action
- **Cancel**: Close dialog and stay on current view

### Technical Details

```text
+----------------------------------------------+
|        Save or discard changes?              |
+----------------------------------------------+
| You have unsaved changes to the Development  |
| environment. Would you like to save them     |
| before leaving?                              |
+----------------------------------------------+
|           [Cancel]  [Discard]  [Save]        |
+----------------------------------------------+
```

**Navigation Blocking:**
- Use `react-router-dom`'s `useBlocker` hook to intercept in-app navigation
- Add `beforeunload` event listener for browser close/refresh
- Track pending action type to know whether to switch tab or navigate

**Cancel Button in Header:**
- Add a "Cancel" button next to the "Save Changes" button
- Only visible when `hasChanges` is true
- Clicking it resets the current environment to its initial state

### Files to Modify
- `src/components/EnvironmentsView.tsx`
