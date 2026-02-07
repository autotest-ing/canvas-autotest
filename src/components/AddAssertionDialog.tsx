import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  AssertionDetailResponse,
  CreateAssertionPayload,
  UpdateAssertionPayload,
} from "@/lib/api/suites";
import {
  assertionTypeOptions,
  type BuildAssertionPayloadResult,
  buildCreateAssertionPayload,
  buildUpdateAssertionPayload,
  getDefaultOperator,
  getOperatorOptions,
  mapAssertionToFormValues,
  type AddAssertionFormValues,
} from "@/lib/assertion-form";
import type { Assertion } from "@/components/TestCaseList";

type BaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepId: string;
  mode?: "add" | "edit";
  assertions?: Assertion[];
  onSubmit?: (stepId: string, payload: CreateAssertionPayload) => Promise<void>;
  assertionId?: string;
  onFetchAssertion?: (assertionId: string) => Promise<AssertionDetailResponse>;
  onUpdate?: (assertionId: string, payload: UpdateAssertionPayload) => Promise<void>;
  onDelete?: (assertionId: string) => Promise<void>;
  isSubmitting?: boolean;
  isDeleting?: boolean;
};
type AddAssertionDialogProps = BaseDialogProps;

const initialValues: AddAssertionFormValues = {
  name: "",
  assertionType: "status_code",
  operator: getDefaultOperator("status_code"),
  headerKey: "",
  jsonPath: "$.token_type",
  expectedText: "",
  expectedNumber: "",
  expectedJson: "",
  isEnabled: true,
};

export function AddAssertionDialog({
  open,
  onOpenChange,
  stepId,
  mode = "add",
  assertions = [],
  onSubmit,
  assertionId,
  onFetchAssertion,
  onUpdate,
  onDelete,
  isSubmitting = false,
  isDeleting = false,
}: AddAssertionDialogProps) {
  const isEditMode = mode === "edit";

  const [formValues, setFormValues] = useState<AddAssertionFormValues>(initialValues);
  const [loadedAssertion, setLoadedAssertion] = useState<AssertionDetailResponse | null>(null);
  const [isLoadingAssertion, setIsLoadingAssertion] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingInternal, setIsDeletingInternal] = useState(false);

  const operatorOptions = useMemo(
    () => getOperatorOptions(formValues.assertionType),
    [formValues.assertionType]
  );

  const addBuildResult: BuildAssertionPayloadResult = mode === "add"
    ? buildCreateAssertionPayload({
        testStepId: stepId,
        formValues,
        existingAssertions: assertions.map((assertion) => ({ sortOrder: assertion.sortOrder })),
      })
    : { ok: false, error: "Edit mode." };

  const editBuildResult = useMemo(() => {
    if (!isEditMode || !loadedAssertion) {
      return null;
    }
    return buildUpdateAssertionPayload({
      originalAssertion: loadedAssertion,
      formValues,
    });
  }, [formValues, isEditMode, loadedAssertion]);

  const isJsonExpected =
    formValues.assertionType === "body_equals" ||
    formValues.assertionType === "schema" ||
    (formValues.assertionType === "jsonpath" && formValues.operator === "is_in");

  const isNumberExpected = formValues.assertionType === "status_code" || formValues.assertionType === "response_time";
  const isDeleteInProgress = isDeleting || isDeletingInternal;
  const isBusy = isSubmitting || isLoadingAssertion || isDeleteInProgress;

  const fetchAssertionDetails = useCallback(async () => {
    if (!isEditMode || !assertionId || !onFetchAssertion) {
      return;
    }

    setIsLoadingAssertion(true);
    setLoadError(null);
    setSubmitError(null);

    try {
      const assertion = await onFetchAssertion(assertionId);
      setLoadedAssertion(assertion);
      setFormValues(mapAssertionToFormValues(assertion));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load assertion details.";
      setLoadedAssertion(null);
      setLoadError(errorMessage);
    } finally {
      setIsLoadingAssertion(false);
    }
  }, [assertionId, isEditMode, onFetchAssertion]);

  const resetForm = () => {
    setFormValues(initialValues);
    setLoadedAssertion(null);
    setIsLoadingAssertion(false);
    setLoadError(null);
    setSubmitError(null);
    setIsDeleteConfirmOpen(false);
    setIsDeletingInternal(false);
  };

  useEffect(() => {
    if (!open || !isEditMode) {
      return;
    }

    void fetchAssertionDetails();
  }, [fetchAssertionDetails, isEditMode, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const updateForm = <K extends keyof AddAssertionFormValues>(key: K, value: AddAssertionFormValues[K]) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setSubmitError(null);
  };

  const handleAssertionTypeChange = (value: string) => {
    const assertionType = value as AddAssertionFormValues["assertionType"];
    updateForm("assertionType", assertionType);
    updateForm("operator", getDefaultOperator(assertionType));
  };

  const handleSubmit = async () => {
    try {
      if (mode === "add") {
        const result = buildCreateAssertionPayload({
          testStepId: stepId,
          formValues,
          existingAssertions: assertions.map((assertion) => ({ sortOrder: assertion.sortOrder })),
        });

        if ("error" in result) {
          setSubmitError(result.error);
          return;
        }

        if (!onSubmit) {
          setSubmitError("Missing add assertion handler.");
          return;
        }

        await onSubmit(stepId, result.payload);
      } else {
        if (!assertionId || !onUpdate) {
          setSubmitError("Missing edit assertion handler.");
          return;
        }

        if (!editBuildResult) {
          setSubmitError("Assertion details are still loading.");
          return;
        }

        if ("error" in editBuildResult) {
          setSubmitError(editBuildResult.error);
          return;
        }

        if (!editBuildResult.hasChanges) {
          return;
        }

        await onUpdate(assertionId, editBuildResult.payload);
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : mode === "add"
        ? "Failed to create assertion."
        : "Failed to update assertion.";
      setSubmitError(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !assertionId || !onDelete) {
      return;
    }

    setSubmitError(null);
    setIsDeletingInternal(true);

    try {
      await onDelete(assertionId);
      setIsDeleteConfirmOpen(false);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete assertion.";
      setSubmitError(errorMessage);
    } finally {
      setIsDeletingInternal(false);
    }
  };

  const saveButtonDisabled = mode === "add"
    ? isBusy || !addBuildResult.ok
    : isBusy ||
      !!loadError ||
      !editBuildResult ||
      !editBuildResult.ok ||
      !editBuildResult.hasChanges;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add New Assertion" : "Edit Assertion"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Create an assertion and save it to this test step."
              : "Update this assertion or delete it."}
          </DialogDescription>
        </DialogHeader>

        {isEditMode && isLoadingAssertion ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading assertion details...</span>
          </div>
        ) : isEditMode && loadError ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-destructive">{loadError}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void fetchAssertionDetails()}
              disabled={isBusy}
              className="w-fit"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 py-1">
            <div className="grid gap-2">
              <Label htmlFor={`assertion-name-${stepId}`}>Name</Label>
              <Input
                id={`assertion-name-${stepId}`}
                placeholder="Status code is 200"
                value={formValues.name}
                onChange={(event) => updateForm("name", event.target.value)}
                disabled={isBusy}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Assertion Type</Label>
                <Select
                  value={formValues.assertionType}
                  onValueChange={handleAssertionTypeChange}
                  disabled={isBusy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assertion type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assertionTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Operator</Label>
                <Select
                  value={formValues.operator}
                  onValueChange={(value) => updateForm("operator", value)}
                  disabled={isBusy}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {operatorOptions.map((operator) => (
                      <SelectItem key={operator} value={operator}>
                        {operator}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {mode === "edit" && (
              <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                <div className="space-y-0.5">
                  <Label htmlFor={`assertion-enabled-${stepId}`}>Enabled</Label>
                  <p className="text-xs text-muted-foreground">Disable to skip this assertion during execution.</p>
                </div>
                <Switch
                  id={`assertion-enabled-${stepId}`}
                  checked={formValues.isEnabled}
                  onCheckedChange={(checked) => updateForm("isEnabled", checked)}
                  disabled={isBusy}
                />
              </div>
            )}

            {formValues.assertionType === "header" && (
              <div className="grid gap-2">
                <Label htmlFor={`assertion-header-${stepId}`}>Header Name</Label>
                <Input
                  id={`assertion-header-${stepId}`}
                  placeholder="content-type"
                  value={formValues.headerKey}
                  onChange={(event) => updateForm("headerKey", event.target.value)}
                  disabled={isBusy}
                />
              </div>
            )}

            {formValues.assertionType === "jsonpath" && (
              <div className="grid gap-2">
                <Label htmlFor={`assertion-jsonpath-${stepId}`}>JSONPath</Label>
                <Input
                  id={`assertion-jsonpath-${stepId}`}
                  placeholder="$.token_type"
                  value={formValues.jsonPath}
                  onChange={(event) => updateForm("jsonPath", event.target.value)}
                  disabled={isBusy}
                />
              </div>
            )}

            {isNumberExpected && (
              <div className="grid gap-2">
                <Label htmlFor={`assertion-number-${stepId}`}>
                  {formValues.assertionType === "response_time" ? "Expected (ms)" : "Expected Value"}
                </Label>
                <Input
                  id={`assertion-number-${stepId}`}
                  type="number"
                  placeholder={formValues.assertionType === "response_time" ? "300" : "200"}
                  value={formValues.expectedNumber}
                  onChange={(event) => updateForm("expectedNumber", event.target.value)}
                  disabled={isBusy}
                />
              </div>
            )}

            {!isNumberExpected && !isJsonExpected && (
              <div className="grid gap-2">
                <Label htmlFor={`assertion-expected-${stepId}`}>Expected Value</Label>
                <Input
                  id={`assertion-expected-${stepId}`}
                  placeholder='application/json or bearer'
                  value={formValues.expectedText}
                  onChange={(event) => updateForm("expectedText", event.target.value)}
                  disabled={isBusy}
                />
              </div>
            )}

            {isJsonExpected && (
              <div className="grid gap-2">
                <Label htmlFor={`assertion-expected-json-${stepId}`}>
                  {formValues.assertionType === "schema" ? "Schema JSON" : "Expected JSON"}
                </Label>
                <Textarea
                  id={`assertion-expected-json-${stepId}`}
                  placeholder={
                    formValues.assertionType === "schema"
                      ? '{ "type": "object", "required": ["access_token"] }'
                      : '[ "microsaas", "microsaas.farm", "farm" ]'
                  }
                  className="min-h-[120px] font-mono text-xs"
                  value={formValues.expectedJson}
                  onChange={(event) => updateForm("expectedJson", event.target.value)}
                  disabled={isBusy}
                />
              </div>
            )}

            {mode === "edit" && editBuildResult?.ok && !editBuildResult.hasChanges && (
              <p className="text-xs text-muted-foreground">No changes to save.</p>
            )}

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
          </div>
        )}

        {mode === "add" ? (
          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saveButtonDisabled}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Assertion
                </>
              )}
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter className="sm:justify-between">
            <div>
              {!loadError && (
                <Button
                  variant="destructive"
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  disabled={isBusy}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isBusy}>
                Cancel
              </Button>
              {loadError ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void fetchAssertionDetails()}
                  disabled={isBusy}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={saveButtonDisabled}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>

      {mode === "edit" && (
        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete assertion?</AlertDialogTitle>
              <AlertDialogDescription>
                This action is irreversible. The assertion will be removed from this test step.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleteInProgress}>Cancel</AlertDialogCancel>
              <Button variant="destructive" onClick={() => void handleDelete()} disabled={isDeleteInProgress}>
                {isDeleteInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Assertion"
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Dialog>
  );
}
