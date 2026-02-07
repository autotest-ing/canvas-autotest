import { useCallback, useEffect, useMemo, useState, type UIEvent } from "react";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { fetchRequests, type RequestListItem } from "@/lib/api/suites";

const DEFAULT_TIMEOUT = 5000;
const DEFAULT_RETRIES = 0;
const REQUEST_PAGE_SIZE = 20;
const SCROLL_THRESHOLD = 24;

type NumberField = "timeout" | "retries";

export type AddTestStepFormValues = {
  name: string;
  requestId: string;
  timeout: number;
  retries: number;
  selectedRequest: RequestListItem;
};

type AddTestStepDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token?: string | null;
  accountId?: string | null;
  onSubmit: (values: AddTestStepFormValues) => Promise<void>;
  isSubmitting?: boolean;
};

function formatRequestLabel(item: RequestListItem): string {
  const method = (item.request.method ?? "GET").toUpperCase();
  const endpoint = item.request.url ?? item.request.full_url ?? "/";
  return `${method} ${endpoint}`;
}

export function AddTestStepDialog({
  open,
  onOpenChange,
  token,
  accountId,
  onSubmit,
  isSubmitting = false,
}: AddTestStepDialogProps) {
  const [name, setName] = useState("");
  const [timeoutValue, setTimeoutValue] = useState(String(DEFAULT_TIMEOUT));
  const [retriesValue, setRetriesValue] = useState(String(DEFAULT_RETRIES));
  const [requestSearch, setRequestSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [requestPickerOpen, setRequestPickerOpen] = useState(false);
  const [requestItems, setRequestItems] = useState<RequestListItem[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestListItem | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const timeout = Number(timeoutValue);
  const retries = Number(retriesValue);
  const isTimeoutValid = Number.isInteger(timeout) && timeout >= 0;
  const isRetriesValid = Number.isInteger(retries) && retries >= 0;

  const selectedRequestLabel = useMemo(
    () => (selectedRequest ? formatRequestLabel(selectedRequest) : "Select request"),
    [selectedRequest]
  );

  const resetState = () => {
    setName("");
    setTimeoutValue(String(DEFAULT_TIMEOUT));
    setRetriesValue(String(DEFAULT_RETRIES));
    setRequestSearch("");
    setDebouncedSearch("");
    setRequestPickerOpen(false);
    setRequestItems([]);
    setSelectedRequest(null);
    setNextCursor(null);
    setLoadError(null);
    setSubmitError(null);
    setIsLoadingInitial(false);
    setIsLoadingMore(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const loadRequestsPage = useCallback(
    async (cursor: string | null, reset: boolean) => {
      if (!token || !accountId) {
        setLoadError("Missing authentication context.");
        return;
      }

      setLoadError(null);
      if (reset) {
        setIsLoadingInitial(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const response = await fetchRequests(accountId, token, {
          limit: REQUEST_PAGE_SIZE,
          search: debouncedSearch || undefined,
          cursor: cursor ?? undefined,
        });

        setRequestItems((currentItems) => {
          if (reset) {
            return response.items;
          }

          const existingIds = new Set(currentItems.map((item) => item.id));
          const nextItems = response.items.filter((item) => !existingIds.has(item.id));
          return [...currentItems, ...nextItems];
        });
        setNextCursor(response.next_cursor);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load requests.";
        setLoadError(message);
      } finally {
        setIsLoadingInitial(false);
        setIsLoadingMore(false);
      }
    },
    [accountId, debouncedSearch, token]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(requestSearch.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, requestSearch]);

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadRequestsPage(null, true);
  }, [debouncedSearch, loadRequestsPage, open]);

  const handleLoadMore = () => {
    if (!nextCursor || isLoadingInitial || isLoadingMore || loadError) {
      return;
    }

    void loadRequestsPage(nextCursor, false);
  };

  const handleScroll = (event: UIEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const remainingDistance = target.scrollHeight - target.scrollTop - target.clientHeight;

    if (remainingDistance <= SCROLL_THRESHOLD) {
      handleLoadMore();
    }
  };

  const handleNumberFieldChange = (field: NumberField, value: string) => {
    if (field === "timeout") {
      setTimeoutValue(value);
      setSubmitError(null);
      return;
    }

    setRetriesValue(value);
    setSubmitError(null);
  };

  const canSubmit =
    !isSubmitting &&
    !!name.trim() &&
    !!selectedRequest &&
    isTimeoutValid &&
    isRetriesValid &&
    !isLoadingInitial;

  const handleSubmit = async () => {
    if (!selectedRequest || !canSubmit) {
      return;
    }

    setSubmitError(null);

    try {
      await onSubmit({
        name: name.trim(),
        requestId: selectedRequest.id,
        timeout,
        retries,
        selectedRequest,
      });

      resetState();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create test step.";
      setSubmitError(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Test Step</DialogTitle>
          <DialogDescription>
            Create a request step and append it to this test case.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          <div className="grid gap-2">
            <Label htmlFor="test-step-name">Name</Label>
            <Input
              id="test-step-name"
              placeholder="Get current user"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSubmitError(null);
              }}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label>Request</Label>
            <Popover open={requestPickerOpen} onOpenChange={setRequestPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={requestPickerOpen}
                  className="w-full justify-between"
                  disabled={isSubmitting || (!accountId || !token)}
                >
                  <span className="truncate">{selectedRequestLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search requests..."
                    value={requestSearch}
                    onValueChange={setRequestSearch}
                  />
                  <CommandList data-testid="request-command-list" onScroll={handleScroll}>
                    {isLoadingInitial ? (
                      <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading requests...
                      </div>
                    ) : loadError ? (
                      <div className="px-3 py-4 text-sm text-destructive">{loadError}</div>
                    ) : requestItems.length === 0 ? (
                      <CommandEmpty>No requests found.</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {requestItems.map((item) => {
                          const isSelected = selectedRequest?.id === item.id;
                          return (
                            <CommandItem
                              key={item.id}
                              value={item.id}
                              onSelect={() => {
                                setSelectedRequest(item);
                                setRequestPickerOpen(false);
                                setSubmitError(null);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                              <span className="truncate">{formatRequestLabel(item)}</span>
                            </CommandItem>
                          );
                        })}
                        {isLoadingMore && (
                          <div className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Loading more...
                          </div>
                        )}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="test-step-timeout">Timeout (ms)</Label>
              <Input
                id="test-step-timeout"
                type="number"
                min={0}
                step={1}
                value={timeoutValue}
                onChange={(event) => handleNumberFieldChange("timeout", event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="test-step-retries">Retries</Label>
              <Input
                id="test-step-retries"
                type="number"
                min={0}
                step={1}
                value={retriesValue}
                onChange={(event) => handleNumberFieldChange("retries", event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {!isTimeoutValid && <p className="text-sm text-destructive">Timeout must be a non-negative integer.</p>}
          {!isRetriesValid && <p className="text-sm text-destructive">Retries must be a non-negative integer.</p>}
          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add Test Step
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
