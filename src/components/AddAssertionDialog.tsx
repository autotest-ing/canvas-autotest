import { useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CreateAssertionPayload } from "@/lib/api/suites";
import {
  assertionTypeOptions,
  buildCreateAssertionPayload,
  getDefaultOperator,
  getOperatorOptions,
  type AddAssertionFormValues,
} from "@/lib/assertion-form";
import type { Assertion } from "@/components/TestCaseList";

type AddAssertionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepId: string;
  assertions: Assertion[];
  isSubmitting?: boolean;
  onSubmit: (stepId: string, payload: CreateAssertionPayload) => Promise<void>;
};

const initialValues: AddAssertionFormValues = {
  name: "",
  assertionType: "status_code",
  operator: getDefaultOperator("status_code"),
  headerKey: "",
  jsonPath: "$.token_type",
  expectedText: "",
  expectedNumber: "",
  expectedJson: "",
};

export function AddAssertionDialog({
  open,
  onOpenChange,
  stepId,
  assertions,
  isSubmitting = false,
  onSubmit,
}: AddAssertionDialogProps) {
  const [formValues, setFormValues] = useState<AddAssertionFormValues>(initialValues);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const operatorOptions = useMemo(
    () => getOperatorOptions(formValues.assertionType),
    [formValues.assertionType]
  );

  const buildResult = useMemo(
    () => buildCreateAssertionPayload({ testStepId: stepId, formValues, existingAssertions: assertions.map((a) => ({ sortOrder: a.sortOrder })) }),
    [assertions, formValues, stepId]
  );

  const isJsonExpected =
    formValues.assertionType === "body_equals" ||
    formValues.assertionType === "schema" ||
    (formValues.assertionType === "jsonpath" && formValues.operator === "is_in");

  const isNumberExpected = formValues.assertionType === "status_code" || formValues.assertionType === "response_time";

  const resetForm = () => {
    setFormValues(initialValues);
    setSubmitError(null);
  };

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
    const result = buildCreateAssertionPayload({
      testStepId: stepId,
      formValues,
      existingAssertions: assertions.map((assertion) => ({ sortOrder: assertion.sortOrder })),
    });

    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }

    try {
      await onSubmit(stepId, result.payload);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create assertion.";
      setSubmitError(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Assertion</DialogTitle>
          <DialogDescription>Create an assertion and save it to this test step.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="grid gap-2">
            <Label htmlFor={`assertion-name-${stepId}`}>Name</Label>
            <Input
              id={`assertion-name-${stepId}`}
              placeholder="Status code is 200"
              value={formValues.name}
              onChange={(event) => updateForm("name", event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Assertion Type</Label>
              <Select value={formValues.assertionType} onValueChange={handleAssertionTypeChange}>
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

          {formValues.assertionType === "header" && (
            <div className="grid gap-2">
              <Label htmlFor={`assertion-header-${stepId}`}>Header Name</Label>
              <Input
                id={`assertion-header-${stepId}`}
                placeholder="content-type"
                value={formValues.headerKey}
                onChange={(event) => updateForm("headerKey", event.target.value)}
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
              />
            </div>
          )}

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !buildResult.ok}>
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
      </DialogContent>
    </Dialog>
  );
}
