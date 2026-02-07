import { useState, useEffect } from "react";
import { Loader2, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import type {
  Schedule,
  ScheduleFrequency,
  ScheduleConfig,
  CreateSchedulePayload,
  TestSuiteListItem,
  Environment,
} from "@/lib/api/suites";

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

type ScheduleRunDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateSchedulePayload) => Promise<void>;
  suites: TestSuiteListItem[];
  environments: Environment[];
  isSubmitting?: boolean;
  editSchedule?: Schedule | null;
  preselectedSuiteId?: string | null;
};

export function ScheduleRunDialog({
  open,
  onOpenChange,
  onSubmit,
  suites,
  environments,
  isSubmitting = false,
  editSchedule = null,
  preselectedSuiteId = null,
}: ScheduleRunDialogProps) {
  const [name, setName] = useState("");
  const [suiteId, setSuiteId] = useState<string>("");
  const [environmentId, setEnvironmentId] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<ScheduleFrequency>("daily");
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [cronExpression, setCronExpression] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (editSchedule) {
        setName(editSchedule.name);
        setSuiteId(editSchedule.suite_id);
        setEnvironmentId(editSchedule.environment_id);
        setFrequency(editSchedule.config.frequency);
        setHour(editSchedule.config.hour ?? 9);
        setMinute(editSchedule.config.minute ?? 0);
        setDaysOfWeek(editSchedule.config.days_of_week ?? [1, 2, 3, 4, 5]);
        setCronExpression(editSchedule.config.cron_expression ?? "");
        setIsEnabled(editSchedule.is_enabled);
        if (editSchedule.config.start_time) {
          setStartDate(new Date(editSchedule.config.start_time));
        }
      } else {
        resetState();
        if (preselectedSuiteId) {
          setSuiteId(preselectedSuiteId);
        }
      }
    }
  }, [open, editSchedule, preselectedSuiteId]);

  const resetState = () => {
    setName("");
    setSuiteId(preselectedSuiteId ?? "");
    setEnvironmentId(null);
    setFrequency("daily");
    setHour(9);
    setMinute(0);
    setDaysOfWeek([1, 2, 3, 4, 5]);
    setStartDate(undefined);
    setCronExpression("");
    setIsEnabled(true);
    setSubmitError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const buildConfig = (): ScheduleConfig => {
    const config: ScheduleConfig = { frequency };

    switch (frequency) {
      case "once":
        if (startDate) {
          const dt = new Date(startDate);
          dt.setHours(hour, minute, 0, 0);
          config.start_time = dt.toISOString();
        }
        break;
      case "hourly":
        config.minute = minute;
        break;
      case "daily":
        config.hour = hour;
        config.minute = minute;
        break;
      case "weekly":
        config.hour = hour;
        config.minute = minute;
        config.days_of_week = daysOfWeek;
        break;
      case "cron":
        config.cron_expression = cronExpression;
        break;
    }

    return config;
  };

  const canSubmit =
    !!name.trim() &&
    !!suiteId &&
    !isSubmitting &&
    (frequency !== "once" || !!startDate) &&
    (frequency !== "weekly" || daysOfWeek.length > 0) &&
    (frequency !== "cron" || !!cronExpression.trim());

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitError(null);

    try {
      await onSubmit({
        suite_id: suiteId,
        environment_id: environmentId,
        name: name.trim(),
        config: buildConfig(),
        is_enabled: isEnabled,
      });
      handleOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save schedule.";
      setSubmitError(message);
    }
  };

  const isEditing = !!editSchedule;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Schedule" : "Schedule Run"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the schedule configuration."
              : "Configure a scheduled run for a test suite."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="schedule-name">Name</Label>
            <Input
              id="schedule-name"
              placeholder="Daily Regression Tests"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSubmitError(null);
              }}
              disabled={isSubmitting}
            />
          </div>

          {/* Suite Selection */}
          <div className="grid gap-2">
            <Label htmlFor="schedule-suite">Suite</Label>
            <Select
              value={suiteId}
              onValueChange={(val) => {
                setSuiteId(val);
                setSubmitError(null);
              }}
              disabled={isSubmitting || !!preselectedSuiteId}
            >
              <SelectTrigger id="schedule-suite">
                <SelectValue placeholder="Select a suite" />
              </SelectTrigger>
              <SelectContent>
                {suites.map((suite) => (
                  <SelectItem key={suite.id} value={suite.id}>
                    {suite.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Environment */}
          <div className="grid gap-2">
            <Label htmlFor="schedule-env">Environment (optional)</Label>
            <Select
              value={environmentId ?? "none"}
              onValueChange={(val) =>
                setEnvironmentId(val === "none" ? null : val)
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="schedule-env">
                <SelectValue placeholder="No environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Environment</SelectItem>
                {environments.map((env) => (
                  <SelectItem key={env.id} value={env.id}>
                    {env.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frequency */}
          <div className="grid gap-2">
            <Label htmlFor="schedule-frequency">Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(val) => setFrequency(val as ScheduleFrequency)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="schedule-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">One-time</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="cron">Custom (Cron)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* One-time date picker */}
          {frequency === "once" && (
            <div className="grid gap-2">
              <Label>Date & Time</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                      disabled={isSubmitting}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <Select
                  value={`${hour}`}
                  onValueChange={(val) => setHour(parseInt(val, 10))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={`${h}`}>
                        {h.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="flex items-center">:</span>
                <Select
                  value={`${minute}`}
                  onValueChange={(val) => setMinute(parseInt(val, 10))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={`${m}`}>
                        {m.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Hourly - minute only */}
          {frequency === "hourly" && (
            <div className="grid gap-2">
              <Label>Run at minute</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={`${minute}`}
                  onValueChange={(val) => setMinute(parseInt(val, 10))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={`${m}`}>
                        :{m.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  past the hour
                </span>
              </div>
            </div>
          )}

          {/* Daily - hour and minute */}
          {frequency === "daily" && (
            <div className="grid gap-2">
              <Label>Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={`${hour}`}
                  onValueChange={(val) => setHour(parseInt(val, 10))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={`${h}`}>
                        {h.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>:</span>
                <Select
                  value={`${minute}`}
                  onValueChange={(val) => setMinute(parseInt(val, 10))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={`${m}`}>
                        {m.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Weekly - days + time */}
          {frequency === "weekly" && (
            <>
              <div className="grid gap-2">
                <Label>Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={
                        daysOfWeek.includes(day.value) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => toggleDay(day.value)}
                      disabled={isSubmitting}
                      className="w-11"
                    >
                      {day.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Time</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Select
                    value={`${hour}`}
                    onValueChange={(val) => setHour(parseInt(val, 10))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((h) => (
                        <SelectItem key={h} value={`${h}`}>
                          {h.toString().padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>:</span>
                  <Select
                    value={`${minute}`}
                    onValueChange={(val) => setMinute(parseInt(val, 10))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MINUTES.map((m) => (
                        <SelectItem key={m} value={`${m}`}>
                          {m.toString().padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Cron expression */}
          {frequency === "cron" && (
            <div className="grid gap-2">
              <Label htmlFor="schedule-cron">Cron Expression</Label>
              <Input
                id="schedule-cron"
                placeholder="0 9 * * 1-5"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Format: minute hour day-of-month month day-of-week
              </p>
            </div>
          )}

          {/* Enabled toggle */}
          <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
            <div>
              <Label htmlFor="schedule-enabled">Enabled</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Disabled schedules will not run.
              </p>
            </div>
            <Switch
              id="schedule-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              disabled={isSubmitting}
            />
          </div>

          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Update Schedule"
            ) : (
              "Create Schedule"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
