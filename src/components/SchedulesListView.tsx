import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Calendar,
  MoreHorizontal,
  Pencil,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ScheduleRunDialog } from "./ScheduleRunDialog";
import type {
  Schedule,
  ScheduleConfig,
  CreateSchedulePayload,
  TestSuiteListItem,
  Environment,
} from "@/lib/api/suites";
import {
  fetchSchedules,
  fetchSuites,
  fetchEnvironments,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleScheduleEnabled,
} from "@/lib/api/suites";

function formatFrequency(config: ScheduleConfig): string {
  switch (config.frequency) {
    case "once":
      return config.start_time
        ? `Once on ${format(new Date(config.start_time), "MMM d, yyyy 'at' h:mm a")}`
        : "One-time";
    case "hourly":
      return `Hourly at :${(config.minute ?? 0).toString().padStart(2, "0")}`;
    case "daily":
      return `Daily at ${(config.hour ?? 0).toString().padStart(2, "0")}:${(config.minute ?? 0).toString().padStart(2, "0")}`;
    case "weekly": {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const selectedDays = (config.days_of_week ?? []).map((d) => days[d]).join(", ");
      return `Weekly on ${selectedDays} at ${(config.hour ?? 0).toString().padStart(2, "0")}:${(config.minute ?? 0).toString().padStart(2, "0")}`;
    }
    case "cron":
      return `Cron: ${config.cron_expression ?? ""}`;
    default:
      return "Unknown";
  }
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground text-sm">—</span>;

  switch (status) {
    case "success":
      return (
        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Passed
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    case "running":
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Running
        </Badge>
      );
    default:
      return <span className="text-muted-foreground text-sm">{status}</span>;
  }
}

export function SchedulesListView() {
  const { token, currentUser } = useAuth();
  const isMobile = useIsMobile();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [suites, setSuites] = useState<TestSuiteListItem[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token || !currentUser?.default_account_id) return;
    const accountId = currentUser.default_account_id;
    setIsLoading(true);
    try {
      const [schedulesData, suitesData, envsData] = await Promise.all([
        fetchSchedules(accountId, token),
        fetchSuites(accountId, token),
        fetchEnvironments(accountId, token),
      ]);
      setSchedules(schedulesData);
      setSuites(suitesData);
      setEnvironments(envsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load schedules.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, currentUser?.default_account_id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateOrUpdate = async (payload: CreateSchedulePayload) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      if (editingSchedule) {
        const updated = await updateSchedule(editingSchedule.id, payload, token);
        setSchedules((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
        toast({ title: "Schedule updated" });
      } else {
        const created = await createSchedule(payload, token);
        setSchedules((prev) => [...prev, created]);
        toast({ title: "Schedule created" });
      }
      setDialogOpen(false);
      setEditingSchedule(null);
    } catch (error) {
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !deletingSchedule) return;
    setIsDeleting(true);
    try {
      await deleteSchedule(deletingSchedule.id, token);
      setSchedules((prev) => prev.filter((s) => s.id !== deletingSchedule.id));
      toast({ title: "Schedule deleted" });
      setDeleteDialogOpen(false);
      setDeletingSchedule(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete schedule.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleEnabled = async (schedule: Schedule) => {
    if (!token) return;
    setTogglingId(schedule.id);
    try {
      const updated = await toggleScheduleEnabled(
        schedule.id,
        !schedule.is_enabled,
        token
      );
      setSchedules((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle schedule.",
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const openEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setDialogOpen(true);
  };

  const openDelete = (schedule: Schedule) => {
    setDeletingSchedule(schedule);
    setDeleteDialogOpen(true);
  };

  const filteredSchedules = schedules.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.suite_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-foreground">
              Schedules
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {schedules.length} schedule{schedules.length !== 1 ? "s" : ""} configured
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingSchedule(null);
              setDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Schedule
          </Button>
        </div>

        {/* Search */}
        <div className="mt-4 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search schedules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredSchedules.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                No schedules found
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {searchQuery
                  ? "Try a different search term."
                  : "Create your first schedule to automate test runs."}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => {
                    setEditingSchedule(null);
                    setDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Schedule
                </Button>
              )}
            </CardContent>
          </Card>
        ) : isMobile ? (
          /* Mobile Cards */
          <div className="space-y-3">
            {filteredSchedules.map((schedule) => (
              <Card key={schedule.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {schedule.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {schedule.suite_name}
                      </p>
                    </div>
                    <Switch
                      checked={schedule.is_enabled}
                      onCheckedChange={() => void handleToggleEnabled(schedule)}
                      disabled={togglingId === schedule.id}
                    />
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatFrequency(schedule.config)}</span>
                    </div>
                    {schedule.next_run_at && schedule.is_enabled && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Next: {format(new Date(schedule.next_run_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Last run:</span>
                      <StatusBadge status={schedule.last_run_status} />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEdit(schedule)}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openDelete(schedule)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* Desktop Table */
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Name</TableHead>
                  <TableHead>Suite</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Last Status</TableHead>
                  <TableHead className="text-center">Enabled</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.map((schedule) => (
                  <TableRow
                    key={schedule.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => openEdit(schedule)}
                  >
                    <TableCell className="font-medium">
                      {schedule.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {schedule.suite_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFrequency(schedule.config)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {schedule.next_run_at && schedule.is_enabled
                        ? format(new Date(schedule.next_run_at), "MMM d, h:mm a")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={schedule.last_run_status} />
                    </TableCell>
                    <TableCell
                      className="text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Switch
                        checked={schedule.is_enabled}
                        onCheckedChange={() => void handleToggleEnabled(schedule)}
                        disabled={togglingId === schedule.id}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(schedule)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => void handleToggleEnabled(schedule)}
                          >
                            {schedule.is_enabled ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Disable
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Enable
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => openDelete(schedule)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <ScheduleRunDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingSchedule(null);
        }}
        onSubmit={handleCreateOrUpdate}
        suites={suites}
        environments={environments}
        isSubmitting={isSubmitting}
        editSchedule={editingSchedule}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSchedule?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
