import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SourceCard, type Source, type SourceType } from "./SourceCard";
import { ImportSourceDialog } from "./ImportSourceDialog";
import { MobileBottomSpacer } from "./LeftRail";
import { PageTitle } from "./PageTitle";
import { Plus, Database, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { fetchCollections, importOpenApi, type CollectionItem, type CollectionSourceType } from "@/lib/api/suites";

function mapSourceType(sourceType: CollectionSourceType): SourceType {
  switch (sourceType) {
    case "Postman": return "postman";
    case "OpenAPI": return "openapi";
    case "swagger": return "swagger";
    default: return "openapi";
  }
}

function mapCollectionToSource(item: CollectionItem): Source {
  const now = new Date();
  const updated = new Date(item.updated_at);
  const diffMs = now.getTime() - updated.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  let lastSync: string;
  if (diffMins < 1) lastSync = "Just now";
  else if (diffMins < 60) lastSync = `${diffMins} minutes ago`;
  else if (diffMins < 1440) lastSync = `${Math.floor(diffMins / 60)} hours ago`;
  else lastSync = `${Math.floor(diffMins / 1440)} days ago`;

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    type: mapSourceType(item.source_type),
    lastSync,
    requestCount: item.requests_count,
    status: "synced",
  };
}

export function SourcesView() {
  const navigate = useNavigate();
  const { token, currentUser } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const loadCollections = useCallback(async () => {
    const accountId = currentUser?.default_account_id;
    if (!token || !accountId) return;

    setIsLoading(true);
    try {
      const items = await fetchCollections(accountId, token);
      setSources(items.map(mapCollectionToSource));
    } catch (err) {
      console.error("Failed to fetch collections", err);
      toast.error("Failed to load sources");
    } finally {
      setIsLoading(false);
    }
  }, [token, currentUser?.default_account_id]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const handleImport = async (source: { name: string; type: "postman" | "openapi"; url?: string; file?: File }) => {
    const accountId = currentUser?.default_account_id;
    if (!token || !accountId) return;

    if (source.type === "openapi" && source.file) {
      try {
        await importOpenApi(accountId, source.file, token);
        toast.success("Source imported", {
          description: `${source.name} has been uploaded and is processing.`,
        });
        loadCollections(); // Refresh the list
      } catch (err) {
        console.error("Import failed", err);
        toast.error("Import failed");
      }
      return;
    }

    // Fallback for non-file imports (Postman or URL) - temporary mock behavior preserved
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-3">Loading sources…</p>
            </div>
          ) : sources.length === 0 ? (
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
              {sources.map((source) => (
                <SourceCard
                  key={source.id}
                  source={source}
                  onCreateSuite={handleCreateSuite}
                  onResync={handleResync}
                  onDelete={handleDelete}
                />
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
