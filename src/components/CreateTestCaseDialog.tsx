import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export type CreateTestCaseFormValues = {
  name: string;
  description: string;
  tags: string[];
  isEnabled: boolean;
};

type CreateTestCaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateTestCaseFormValues) => Promise<void>;
  isSubmitting?: boolean;
};

const INITIAL_FORM_VALUES = {
  name: "",
  description: "",
  tags: "",
  isEnabled: true,
};

export function CreateTestCaseDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateTestCaseDialogProps) {
  const [name, setName] = useState(INITIAL_FORM_VALUES.name);
  const [description, setDescription] = useState(INITIAL_FORM_VALUES.description);
  const [tagsInput, setTagsInput] = useState(INITIAL_FORM_VALUES.tags);
  const [isEnabled, setIsEnabled] = useState(INITIAL_FORM_VALUES.isEnabled);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetState = () => {
    setName(INITIAL_FORM_VALUES.name);
    setDescription(INITIAL_FORM_VALUES.description);
    setTagsInput(INITIAL_FORM_VALUES.tags);
    setIsEnabled(INITIAL_FORM_VALUES.isEnabled);
    setSubmitError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const canSubmit = !!name.trim() && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setSubmitError(null);
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        tags,
        isEnabled,
      });
      resetState();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create test case.";
      setSubmitError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Test Case</DialogTitle>
          <DialogDescription>
            Add a new test case to this suite.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="grid gap-2">
            <Label htmlFor="create-test-case-name">Name</Label>
            <Input
              id="create-test-case-name"
              placeholder="Login Test"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSubmitError(null);
              }}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-test-case-description">Description</Label>
            <Textarea
              id="create-test-case-description"
              placeholder="Test user login functionality"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setSubmitError(null);
              }}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="create-test-case-tags">Tags (comma separated)</Label>
            <Input
              id="create-test-case-tags"
              placeholder="auth, login"
              value={tagsInput}
              onChange={(event) => {
                setTagsInput(event.target.value);
                setSubmitError(null);
              }}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
            <div>
              <Label htmlFor="create-test-case-enabled">Enabled</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Disabled test cases are skipped in runs.
              </p>
            </div>
            <Switch
              id="create-test-case-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              disabled={isSubmitting}
            />
          </div>

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
