
# Integrations Page Implementation Plan

## Overview
Create a new dedicated Integrations page that displays third-party service connections organized by category (CI/CD, Chat, Issue Tracking, Monitoring). Each integration will show as a card with an icon, name, and connection status.

## Visual Design (based on references)
- Page header with "Integrations" title (with green dot) and subtitle "Connect your tools to Autotest.ing"
- Category sections with section headers
- Grid of integration cards per category (4 columns on desktop, 2 on tablet, 1 on mobile)
- Each card shows: icon, integration name, connection status badge
- Connected items show a green dot indicator in the top-right corner
- Status badge: "Connected" (green) or "Not connected" (outline/gray)

## Files to Create

### 1. `src/components/IntegrationsView.tsx`
Main view component containing:
- Page header with PageTitle and subtitle
- Four category sections: CI/CD, Chat, Issue Tracking, Monitoring
- Responsive grid layout for cards
- Mock data for integrations

### 2. `src/components/IntegrationCard.tsx`
Reusable card component for each integration:
- Centered content with icon (using emoji for simplicity)
- Integration name
- Status badge (Connected/Not connected)
- Green dot indicator for connected items
- Click handler for future connection flow

### 3. `src/pages/Integrations.tsx`
Page wrapper with LeftRail and IntegrationsView

## Files to Modify

### 4. `src/App.tsx`
- Import Integrations page
- Add route: `/integrations`

### 5. `src/components/LeftRail.tsx`
- Add Integrations nav item to topItems (using Plug icon from lucide-react)
- Add to mobileNavItems or mobile menu

## Integration Data Structure

```text
interface Integration {
  id: string
  name: string
  icon: string (emoji)
  isConnected: boolean
  category: 'cicd' | 'chat' | 'issue-tracking' | 'monitoring'
}
```

## Mock Integrations
- **CI/CD**: GitHub Actions (connected), GitLab CI, Bitbucket, Jenkins
- **Chat**: Slack (connected), Microsoft Teams
- **Issue Tracking**: Jira (connected), Linear
- **Monitoring**: Sentry, Datadog, PagerDuty (connected)

## Layout Specifications
- Centered container: `max-w-3xl mx-auto px-4 md:px-6`
- Card grid: `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`
- Card style: rounded border, centered content, hover effect
- Category spacing: `space-y-8` between sections

---

## Technical Details

### IntegrationCard Component
```text
- Container: rounded-xl border, padding, hover:shadow transition
- Icon: centered, text-3xl emoji display
- Name: font-medium, text-sm
- Badge: "Connected" (bg-primary text-white) or "Not connected" (outline)
- Green dot: absolute positioned top-right for connected items
- onClick handler with toast placeholder
```

### Category Section Pattern
```text
<section>
  <h2 className="text-sm font-semibold mb-4">Category Name</h2>
  <div className="grid ...">
    {integrations.map(integration => <IntegrationCard />)}
  </div>
</section>
```

### Navigation Addition
- Icon: `Plug` from lucide-react
- Label: "Integrations"
- Path: `/integrations`
- Position: After Environments in topItems
