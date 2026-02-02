import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SourceCard, type Source } from "./SourceCard";
import { ImportSourceDialog } from "./ImportSourceDialog";
import { MobileBottomSpacer } from "./LeftRail";
import { PageTitle } from "./PageTitle";
import { Plus, Database } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const mockSources: Source[] = [
  {
    id: "1",
    name: "E-Commerce API",
    type: "postman",
    lastSync: "2 hours ago",
    requestCount: 45,
    status: "synced",
  },
  {
    id: "2",
    name: "Payment Gateway",
    type: "openapi",
    lastSync: "1 day ago",
    requestCount: 28,
    status: "synced",
  },
  {
    id: "3",
    name: "User Management API",
    type: "openapi",
    lastSync: "3 days ago",
    requestCount: 15,
    status: "pending",
  },
  {
    id: "4",
    name: "Legacy Auth Service",
    type: "postman",
    lastSync: "1 week ago",
    requestCount: 8,
    status: "error",
  },
];

export function SourcesView() {
  const navigate = useNavigate();
  const [sources, setSources] = useState<Source[]>(mockSources);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleImport = (source: { name: string; type: "postman" | "openapi"; url?: string }) => {
    const newSource: Source = {
      id: String(Date.now()),
      name: source.name,
      type: source.type,
      lastSync: "Just now",
      requestCount: 0,
      status: "pending",
    };
    setSources([newSource, ...sources]);
    toast.success("Source imported", {
      description: `${source.name} has been added and is syncing.`,
    });
  };

  const handleCreateSuite = (id: string) => {
    const source = sources.find(s => s.id === id);
    toast.success("Creating suite...", {
      description: `Generating test suite from ${source?.name}`,
    });
    setTimeout(() => {
      navigate("/suites");
    }, 1000);
  };

  const handleResync = (id: string) => {
    const source = sources.find(s => s.id === id);
    setSources(sources.map(s => 
      s.id === id ? { ...s, status: "pending" as const } : s
    ));
    toast.info("Re-syncing source...", {
      description: `Updating ${source?.name}`,
    });
    setTimeout(() => {
      setSources(sources.map(s => 
        s.id === id ? { ...s, status: "synced" as const, lastSync: "Just now" } : s
      ));
      toast.success("Sync complete", {
        description: `${source?.name} has been updated.`,
      });
    }, 2000);
  };

  const handleDelete = (id: string) => {
    const source = sources.find(s => s.id === id);
    setSources(sources.filter(s => s.id !== id));
    toast.success("Source deleted", {
      description: `${source?.name} has been removed.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      <ScrollArea className="flex-1">
        <div className="w-full max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border/50 mb-6">
            <div>
              <PageTitle>Sources</PageTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Import and manage your API specifications
              </p>
            </div>
            <Button onClick={() => setImportDialogOpen(true)} className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Import Source
            </Button>
          </div>

          {/* Content */}
          {sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
                <Database className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No sources yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Import a Postman collection or OpenAPI specification to start generating tests.
              </p>
              <Button onClick={() => setImportDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Import your first source
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sources.map((source, index) => (
                <div
                  key={source.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
                >
                  <SourceCard
                    source={source}
                    onCreateSuite={handleCreateSuite}
                    onResync={handleResync}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
          <MobileBottomSpacer />
        </div>
      </ScrollArea>

      {/* Import Dialog */}
      <ImportSourceDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImport}
      />
    </div>
  );
}
