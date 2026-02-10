import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
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

export type EditTestCaseFormValues = {
    name: string;
    description: string;
    tags: string[];
    isEnabled: boolean;
};

type EditTestCaseDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: EditTestCaseFormValues) => Promise<void>;
    isSubmitting?: boolean;
    initialValues?: {
        name: string;
        description?: string;
        tags?: string[];
        isEnabled?: boolean;
    } | null;
};

export function EditTestCaseDialog({
    open,
    onOpenChange,
    onSubmit,
    isSubmitting = false,
    initialValues,
}: EditTestCaseDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [tagsInput, setTagsInput] = useState("");
    const [isEnabled, setIsEnabled] = useState(true);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (open && initialValues) {
            setName(initialValues.name);
            setDescription(initialValues.description ?? "");
            setTagsInput((initialValues.tags ?? []).join(", "));
            setIsEnabled(initialValues.isEnabled ?? true);
            setSubmitError(null);
        }
    }, [open, initialValues]);

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
            onOpenChange(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to update test case.";
            setSubmitError(message);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Edit Test Case</DialogTitle>
                    <DialogDescription>
                        Update the details of this test case.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-1">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-test-case-name">Name</Label>
                        <Input
                            id="edit-test-case-name"
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
                        <Label htmlFor="edit-test-case-description">Description</Label>
                        <Textarea
                            id="edit-test-case-description"
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
                        <Label htmlFor="edit-test-case-tags">Tags (comma separated)</Label>
                        <Input
                            id="edit-test-case-tags"
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
                            <Label htmlFor="edit-test-case-enabled">Enabled</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Disabled test cases are skipped in runs.
                            </p>
                        </div>
                        <Switch
                            id="edit-test-case-enabled"
                            checked={isEnabled}
                            onCheckedChange={setIsEnabled}
                            disabled={isSubmitting}
                        />
                    </div>

                    {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
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
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
