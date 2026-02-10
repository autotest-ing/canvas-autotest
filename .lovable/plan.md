

# Refactor Variables Popup: Two-Column Layout with Environment Variables

## Overview
Refactor the existing variables dropdown (the popup that appears when clicking "+ var" on JSON response fields) to display two side-by-side sections: **Runtime variables** (existing step exports) and **Environment variables** (fetched from the environments API).

## Current Behavior
When clicking the "+ var" button on a JSON field in the StepDetailDialog's Request tab, a dropdown (`ExistingExportsDropdown`) appears showing all runtime variables (step exports like OTP_TOKEN, PROD_JWT, etc.) in a single-column list.

## New Behavior
The dropdown will be wider and contain two titled columns:
- **Left column** - "Runtime variables": Same as current step exports
- **Right column** - "Environment variables": Variables from the user's default environment, fetched via the environments API

## Changes Required

### 1. Add Environment Variables Fetching in StepDetailDialog
**File: `src/components/canvas/StepDetailDialog.tsx`** (modify)

Add a new `useEffect` alongside the existing exports fetching to:
1. Call `fetchEnvironments(accountId, token)` to get the list of environments
2. Find the default environment (or use the first one)
3. Call `fetchEnvironmentDetail(envId, token)` to get its variables array
4. Store in new state: `environmentVariables`, `envVarsLoading`, `envVarsError`

Pass these new values down through `RequestTab` to `JsonResponseExporter`.

### 2. Update JsonResponseExporter Props and Data Flow
**File: `src/components/canvas/JsonResponseExporter.tsx`** (modify)

Add new props to `JsonResponseExporterProps`:
- `environmentVariables?: EnvironmentDetailVariable[]`
- `environmentVariablesLoading?: boolean`
- `environmentVariablesError?: string | null`

Pass these through to the `ExistingExportsDropdown` component via `renderValue`.

### 3. Refactor ExistingExportsDropdown to Two-Column Layout
**File: `src/components/canvas/JsonResponseExporter.tsx`** (modify)

Refactor `ExistingExportsDropdown` to:
- Widen the dropdown content from `w-72` to approximately `w-[560px]`
- Create a two-column grid layout inside the dropdown content
- **Left column**: "Runtime variables" header + existing exports list (current behavior)
- **Right column**: "Environment variables" header + environment variables list with key/value display
- Each section handles its own loading/error/empty states independently
- Clicking a runtime variable triggers the existing `onSelect` behavior
- Clicking an environment variable triggers the same `onSelect` callback (or a dedicated `onSelectEnvVar`) to insert the variable reference

### 4. Update renderValue Function Signature
**File: `src/components/canvas/JsonResponseExporter.tsx`** (modify)

Add environment variable parameters to the `renderValue` function so the data flows through to every `ExistingExportsDropdown` instance rendered inline with JSON fields.

### 5. Wire Up Data in StepDetailDialog
**File: `src/components/canvas/StepDetailDialog.tsx`** (modify)

Update `RequestTab` props interface and the `JsonResponseExporter` usage to include the new environment variables props.

## Technical Details

### API Flow for Environment Variables

```text
1. GET /v1.0/environments?account_id={accountId}
   Response: { items: [{ id: "env-1", name: "Default" }, ...] }

2. GET /v1.0/environments/{envId}  (using default or first env)
   Response: {
     id: "env-1",
     name: "Default",
     variables: [
       { id: "...", key: "BASE_URL", value: "https://..." },
       { id: "...", key: "OTP_TOKEN", value: "..." },
       ...
     ]
   }
```

### Updated Dropdown Layout

```text
+------------------------------------------------------------+
|  Runtime variables          |  Environment variables        |
|                             |  (Default)                    |
|-----------------------------|-------------------------------|
|  OTP_TOKEN                  |  BASE_URL                     |
|  [PROD] Signin              |  https://internal-api...      |
|  $.token                    |                               |
|                             |  OTP_TOKEN                    |
|  PROD_JWT                   |  ******                       |
|  [PROD] Signin Confirm      |                               |
|  $.access_token             |  PROD_JWT                     |
|                             |  ******                       |
|  SELECTED_PROJECT_ID        |                               |
|  Get current user           |  SELECTED_PROJECT             |
|  $.projects.0.id            |  ******                       |
|                             |                               |
|  TOKEN                      |  TOKEN                        |
|  [PROD] Signin              |  ******                       |
|  $.token                    |                               |
+------------------------------------------------------------+
```

### Environment Variable Display
Each environment variable item shows:
- **Key** (bold, e.g., `BASE_URL`)
- **Value** (truncated, muted text, e.g., `https://internal-api...`) - secrets are masked

### Existing API Functions Used
- `fetchEnvironments(accountId, token)` - already exists in `src/lib/api/suites.ts`
- `fetchEnvironmentDetail(envId, token)` - already exists in `src/lib/api/suites.ts`
- `EnvironmentDetailVariable` type - already defined with `{ key, value, is_overridable }`

## Files Summary

| File | Action |
|------|--------|
| `src/components/canvas/StepDetailDialog.tsx` | Modify - add env vars fetch + pass down |
| `src/components/canvas/JsonResponseExporter.tsx` | Modify - refactor dropdown to two columns |

## Edge Cases
- If no environments exist, the right column shows "No environments configured"
- If the environment has no variables, show "No variables"
- Loading and error states are handled independently for each column
- The dropdown remains functional if either API call fails
- Environment name is shown in the column header (e.g., "Environment variables (Default)")

