import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileJson, FileCode, Upload, Link, Loader2, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (source: { name: string; type: "postman" | "openapi"; url?: string; file?: File }) => void;
}

export function ImportSourceDialog({ open, onOpenChange, onImport }: ImportSourceDialogProps) {
  const [activeTab, setActiveTab] = useState<"postman" | "openapi">("postman");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    if (!name) return;
    setIsImporting(true);
    setTimeout(() => {
      onImport({ name, type: activeTab, url: url || undefined, file: selectedFile || undefined });
      setIsImporting(false);
      setName("");
      setUrl("");
      setSelectedFile(null);
      onOpenChange(false);
    }, 1500);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      if (!name) {
        setName(file.name.replace(/\.(json|yaml|yml)$/, ""));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!name) {
        setName(file.name.replace(/\.(json|yaml|yml)$/, ""));
      }
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const getAcceptTypes = () => {
    return activeTab === "postman"
      ? ".json"
      : ".json,.yaml,.yml";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Source</DialogTitle>
          <DialogDescription>
            Import a Postman collection or OpenAPI specification to generate tests.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="postman" className="gap-2">
              <FileJson className="w-4 h-4" />
              Postman
            </TabsTrigger>
            <TabsTrigger value="openapi" className="gap-2">
              <FileCode className="w-4 h-4" />
              OpenAPI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="postman" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="postman-name">Collection Name</Label>
              <Input
                id="postman-name"
                placeholder="My API Collection"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={getAcceptTypes()}
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={handleDropZoneClick}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              {selectedFile ? (
                <>
                  <File className="w-8 h-8 mx-auto text-primary mb-3" />
                  <p className="text-sm text-foreground font-medium">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to change file
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-foreground font-medium">
                    Drop your Postman collection here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse (.json)
                  </p>
                </>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postman-url">Import from URL</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="postman-url"
                    placeholder="https://api.postman.com/collections/..."
                    className="pl-9"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="openapi" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="openapi-name">Specification Name</Label>
              <Input
                id="openapi-name"
                placeholder="My API Spec"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={handleDropZoneClick}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              {selectedFile ? (
                <>
                  <File className="w-8 h-8 mx-auto text-primary mb-3" />
                  <p className="text-sm text-foreground font-medium">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click to change file
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-foreground font-medium">
                    Drop your OpenAPI spec here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports JSON or YAML (.json, .yaml, .yml)
                  </p>
                </>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openapi-url">Import from URL</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="openapi-url"
                    placeholder="https://api.example.com/openapi.json"
                    className="pl-9"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!name || isImporting}>
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
