import { PageTitle } from "@/components/PageTitle";
import { IntegrationCard } from "@/components/IntegrationCard";
import { MobileBottomSpacer } from "@/components/LeftRail";

interface Integration {
  id: string;
  name: string;
  icon: string;
  isConnected: boolean;
  category: "cicd" | "chat" | "issue-tracking" | "monitoring";
}

const integrations: Integration[] = [
  // CI/CD
  { id: "github-actions", name: "GitHub Actions", icon: "🐙", isConnected: true, category: "cicd" },
  { id: "gitlab-ci", name: "GitLab CI", icon: "🦊", isConnected: false, category: "cicd" },
  { id: "bitbucket", name: "Bitbucket", icon: "🪣", isConnected: false, category: "cicd" },
  { id: "jenkins", name: "Jenkins", icon: "🤖", isConnected: false, category: "cicd" },
  // Chat
  { id: "slack", name: "Slack", icon: "💬", isConnected: true, category: "chat" },
  { id: "teams", name: "Microsoft Teams", icon: "👥", isConnected: false, category: "chat" },
  // Issue Tracking
  { id: "jira", name: "Jira", icon: "📋", isConnected: true, category: "issue-tracking" },
  { id: "linear", name: "Linear", icon: "📐", isConnected: false, category: "issue-tracking" },
  // Monitoring
  { id: "sentry", name: "Sentry", icon: "🔍", isConnected: false, category: "monitoring" },
  { id: "datadog", name: "Datadog", icon: "🐶", isConnected: false, category: "monitoring" },
  { id: "pagerduty", name: "PagerDuty", icon: "📟", isConnected: true, category: "monitoring" },
];

const categories = [
  { id: "cicd", label: "CI/CD" },
  { id: "chat", label: "Chat" },
  { id: "issue-tracking", label: "Issue Tracking" },
  { id: "monitoring", label: "Monitoring" },
] as const;

export function IntegrationsView() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <PageTitle>Integrations</PageTitle>
        <p className="text-muted-foreground text-sm mt-1">
          Connect your tools to Autotest.ing
        </p>
      </div>

      {/* Category sections */}
      <div className="space-y-8">
        {categories.map((category) => {
          const categoryIntegrations = integrations.filter(
            (i) => i.category === category.id
          );

          return (
            <section key={category.id}>
              <h2 className="text-sm font-semibold text-foreground mb-4">
                {category.label}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {categoryIntegrations.map((integration) => (
                  <IntegrationCard
                    key={integration.id}
                    id={integration.id}
                    name={integration.name}
                    icon={integration.icon}
                    isConnected={integration.isConnected}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <MobileBottomSpacer />
    </div>
  );
}
