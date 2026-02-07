
# Add Ability to Schedule Runs

## Overview
Add a scheduling feature that allows users to configure recurring test suite runs. This includes a dedicated Schedules page accessible from the side navigation, a dialog for creating/editing schedules, and the ability to view upcoming scheduled runs.

## Changes Required

### 1. Create Schedule Run Dialog Component
**File: `src/components/ScheduleRunDialog.tsx`** (new file)

A dialog for creating and editing scheduled runs with the following fields:
- **Suite selection**: Dropdown to select which suite to schedule (required)
- **Environment selection**: Optional environment for the scheduled run
- **Schedule type**: One-time or recurring
- **For one-time**: Date picker for start date/time
- **For recurring**: Cron-style frequency options:
  - Every X minutes/hours
  - Daily at specific time
  - Weekly on specific days
  - Custom cron expression (advanced)
- **Enabled toggle**: Turn schedule on/off without deleting
- **Name**: Optional descriptive name for the schedule

UI Pattern: Follow the existing `CreateTestCaseDialog.tsx` pattern with controlled form state and async submission.

### 2. Create Schedules List View Component
**File: `src/components/SchedulesListView.tsx`** (new file)

A list view displaying all configured schedules with:
- Header with title, count, and "New Schedule" button
- Search/filter functionality
- Table (desktop) / Cards (mobile) layout showing:
  - Schedule name
  - Suite name
  - Frequency description (e.g., "Daily at 9:00 AM")
  - Next run time
  - Status (enabled/disabled)
  - Last run status badge
- Row actions: Edit, Enable/Disable toggle, Delete

### 3. Create Schedules Page
**File: `src/pages/Schedules.tsx`** (new file)

Page component following existing patterns:
- Uses `LeftRail` with `activeItem="schedules"`
- Wrapped with `AuthGate` and `TooltipProvider`
- Renders `SchedulesListView`

### 4. Update Navigation
**File: `src/components/LeftRail.tsx`**

Add Schedules to navigation:
- Import `Calendar` icon from lucide-react
- Add to `topItems` array after Runs:
  ```typescript
  { icon: Calendar, label: "Schedules", id: "schedules", path: "/schedules" }
  ```

### 5. Update App Router
**File: `src/App.tsx`**

Add routes:
- `<Route path="/schedules" element={<Schedules />} />`
- `<Route path="/schedules/:scheduleId" element={<Schedules />} />`

### 6. Add API Types and Functions
**File: `src/lib/api/suites.ts`**

Add types and API functions for schedules:

```typescript
// Schedule Types
export type ScheduleFrequency = "once" | "hourly" | "daily" | "weekly" | "cron";

export type ScheduleConfig = {
  frequency: ScheduleFrequency;
  start_time?: string;
  hour?: number;
  minute?: number;
  days_of_week?: number[];
  cron_expression?: string;
};

export type Schedule = {
  id: string;
  account_id: string;
  suite_id: string;
  suite_name: string;
  environment_id: string | null;
  name: string;
  config: ScheduleConfig;
  is_enabled: boolean;
  next_run_at: string | null;
  last_run_at: string | null;
  last_run_status: RunStatus | null;
  created_at: string;
  updated_at: string;
};

export type CreateSchedulePayload = {
  suite_id: string;
  environment_id?: string | null;
  name: string;
  config: ScheduleConfig;
  is_enabled: boolean;
};

// API Functions
export async function fetchSchedules(accountId: string, token: string): Promise<Schedule[]>;
export async function createSchedule(payload: CreateSchedulePayload, token: string): Promise<Schedule>;
export async function updateSchedule(scheduleId: string, payload: Partial<CreateSchedulePayload>, token: string): Promise<Schedule>;
export async function deleteSchedule(scheduleId: string, token: string): Promise<void>;
```

### 7. Quick Schedule from Suite View (Optional Enhancement)
**File: `src/components/SuiteCanvas.tsx`**

Add a "Schedule" button next to "Run Suite" that opens the ScheduleRunDialog pre-filled with the current suite.

## Data Flow

```text
Schedules Page
    +-- SchedulesListView
          +-- Header (title, "New Schedule" button)
          +-- Search/Filter bar
          +-- Table/Cards (schedule list)
          |     +-- Row click opens edit dialog
          +-- ScheduleRunDialog (create/edit)
                +-- Suite selector
                +-- Environment selector
                +-- Frequency configuration
                +-- DatePicker (for one-time runs)
                +-- Enabled toggle
```

## Mock Data Structure

For initial implementation, use mock data:

```typescript
const mockSchedules: Schedule[] = [
  {
    id: "sched-1",
    account_id: "acc-1",
    suite_id: "suite-1",
    suite_name: "Auth Suite",
    environment_id: "env-1",
    name: "Daily Auth Tests",
    config: { frequency: "daily", hour: 9, minute: 0 },
    is_enabled: true,
    next_run_at: "2026-02-08T09:00:00Z",
    last_run_at: "2026-02-07T09:00:00Z",
    last_run_status: "success",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-02-07T09:00:00Z",
  },
  // ... more schedules
];
```

## Files Summary

| File | Action |
|------|--------|
| `src/components/ScheduleRunDialog.tsx` | Create |
| `src/components/SchedulesListView.tsx` | Create |
| `src/pages/Schedules.tsx` | Create |
| `src/components/LeftRail.tsx` | Modify |
| `src/App.tsx` | Modify |
| `src/lib/api/suites.ts` | Modify |
| `src/components/SuiteCanvas.tsx` | Modify (optional) |

## Technical Considerations

- **Date Picker**: Use the existing shadcn Calendar component with Popover, ensuring `pointer-events-auto` class is applied per project conventions
- **Time Selection**: Add hour/minute dropdowns or use a time input for scheduling specific times
- **Timezone**: Display times in user's local timezone with UTC storage
- **Validation**: Ensure schedule configuration is valid before submission
- **Mobile**: Responsive card layout for schedules list on mobile devices
