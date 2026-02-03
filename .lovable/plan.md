
# Add Environment Tabs (Production, Development, Staging)

## Overview
Add a tabbed interface to the Environments page allowing users to switch between Production, Development, and Staging environments. Each environment will maintain its own separate configuration for base URL, variables, and secrets.

## Changes

### 1. Update EnvironmentsView Component
**File:** `src/components/EnvironmentsView.tsx`

**Data Structure Changes:**
- Create an `Environment` interface that contains all environment-specific data (baseUrl, variables, secrets)
- Create a state object that holds data for all three environments keyed by environment name
- Track the currently selected environment tab

**Mock Data:**
- Production: `https://api.example.com` with production-specific variables
- Development: `https://api.dev.example.com` with development-specific variables  
- Staging: `https://api.staging.example.com` (current data)

**UI Changes:**
- Add Tabs component below the header section
- Three tab triggers: "Production", "Development", "Staging"
- Default to "Development" as the selected tab
- When switching tabs, load the corresponding environment's data
- Track changes per environment so Save only affects the current environment

### Technical Details

```text
+------------------------------------------+
|  Environments.                  [Save]   |
|  Configure base URLs...                  |
+------------------------------------------+
|  [Production] [Development] [Staging]    |  <-- New tabs
+------------------------------------------+
|  AI Suggestions                          |
|  Base URL Card                           |
|  Variables Card                          |
|  Secrets Card                            |
+------------------------------------------+
```

**State Management:**
- `activeEnvironment`: Current tab ("production" | "development" | "staging")
- `environments`: Object storing all environment configs
- When tab changes, update the displayed data from the environments object
- Changes are tracked per environment

**Imports to add:**
- `Tabs, TabsList, TabsTrigger` from `@/components/ui/tabs`

This approach keeps all environment data in memory and allows seamless switching between environments without losing unsaved changes.
