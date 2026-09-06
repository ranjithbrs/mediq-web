import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHospitalStaff } from "@/hooks/useHospitalStaff";
import {
  useHospitalEmergencyAlerts,
  useUpdateEmergencyAlertStatus,
  EmergencyAlertItem,
  EmergencyAlertStatus,
} from "@/hooks/useHospitalEmergencyAlerts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  LogOut,
  Siren,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Loader2,
  AlertTriangle,
  Radio,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Truck,
  Check,
  Activity,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type FilterTab = "all" | "pending" | "in_progress" | "resolved";

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { staff, hospital, profile, isActiveStaff, isLoading: staffLoading, error: staffError } = useHospitalStaff();

  const {
    data: emergencyAlerts = [],
    isLoading: alertsLoading,
    isRefetching: alertsRefetching,
    refetch: refetchAlerts,
  } = useHospitalEmergencyAlerts(staff?.hospital_id);

  const updateStatusMutation = useUpdateEmergencyAlertStatus();

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [updatingAlertId, setUpdatingAlertId] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to log out");
    }
  };

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await refetchAlerts();
      toast.success("Emergency alert feed refreshed");
    } catch {
      toast.error("Failed to refresh emergency alerts");
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const handleUpdateStatus = async (
    alertId: string,
    newStatus: EmergencyAlertStatus,
    currentStatus?: string
  ) => {
    setUpdatingAlertId(alertId);
    try {
      await updateStatusMutation.mutateAsync({ alertId, status: newStatus, currentStatus });
      const statusLabels: Record<string, string> = {
        acknowledged: "Alert Acknowledged by Emergency Desk",
        dispatched: "Ambulance & Medical Team Dispatched",
        resolved: "Emergency Alert Marked as Resolved",
      };
      toast.success(statusLabels[newStatus] || "Status updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update alert status");
    } finally {
      setUpdatingAlertId(null);
    }
  };

  if (staffLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading Hospital Emergency Desk...
          </p>
        </div>
      </div>
    );
  }

  // If user does not have an active staff association
  if (!isActiveStaff || !hospital || staffError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full border-destructive/20 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">Unauthorized or Inactive</CardTitle>
            <CardDescription>
              Your account is not actively associated with any registered hospital emergency desk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <p className="text-xs text-muted-foreground text-center">
              Please contact your hospital administrator or MediQ support to activate your account.
            </p>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const staffDisplayName =
    profile?.full_name || user?.user_metadata?.full_name || "Emergency Desk Operator";

  // Summary counts
  const pendingCount = emergencyAlerts.filter((a) => a.status === "pending").length;
  const inProgressCount = emergencyAlerts.filter(
    (a) => a.status === "acknowledged" || a.status === "dispatched"
  ).length;
  const resolvedCount = emergencyAlerts.filter((a) => a.status === "resolved").length;

  // Filtered alerts
  const filteredAlerts = emergencyAlerts.filter((alert) => {
    if (activeTab === "pending") return alert.status === "pending";
    if (activeTab === "in_progress")
      return alert.status === "acknowledged" || alert.status === "dispatched";
    if (activeTab === "resolved") return alert.status === "resolved";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-zinc-950 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Brand & Hospital Info */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center shadow-md shadow-red-500/20 text-white">
              <Siren className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-foreground">MediQ</span>
                <span className="text-xs text-muted-foreground">|</span>
                <span className="text-sm font-semibold text-primary">{hospital.name}</span>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Hospital Emergency Portal
              </p>
            </div>
          </div>

          {/* Staff Info, Refresh & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-foreground leading-none">
                {staffDisplayName}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{user?.email}</p>
            </div>

            <Badge
              variant="secondary"
              className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300 font-medium px-2.5 py-0.5 text-xs flex items-center gap-1.5"
            >
              <Radio className="w-3 h-3 text-red-600 animate-pulse" />
              Emergency Desk
            </Badge>

            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isManualRefreshing || alertsRefetching}
              className="h-8 px-2.5 gap-1.5 text-xs"
              title="Refresh alerts"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  isManualRefreshing || alertsRefetching ? "animate-spin text-primary" : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 h-8 px-2.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline text-xs font-medium">Log Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Hospital Summary Header Card */}
        <Card className="border-border/60 shadow-sm bg-gradient-to-r from-card via-card to-primary/5">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary mt-0.5">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      {hospital.name}
                    </h1>
                    <Badge variant="outline" className="text-xs font-medium">
                      <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                      Verified Facility
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-muted-foreground">
                    {hospital.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {hospital.address}
                        {hospital.city ? `, ${hospital.city}` : ""}
                      </span>
                    )}
                    {hospital.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {hospital.phone}
                      </span>
                    )}
                    {hospital.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {hospital.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Stats Summary */}
              <div className="flex items-center gap-2 flex-wrap border-t md:border-t-0 pt-3 md:pt-0 border-border/40">
                <div className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200/60 dark:border-red-800/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  {pendingCount} Pending
                </div>
                <div className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium">
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                  {inProgressCount} In Progress
                </div>
                <div className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {resolvedCount} Resolved
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Alert Feed Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                <Siren className="w-4 h-4 text-red-600" />
                Live Emergency Dispatches ({filteredAlerts.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Incoming distress alerts and ambulance dispatch requests directed to this facility.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/40 text-xs self-start sm:self-auto overflow-x-auto">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({emergencyAlerts.length})
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === "pending"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    activeTab === "pending" ? "bg-white" : "bg-red-500"
                  }`}
                />
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setActiveTab("in_progress")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === "in_progress"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                In Progress ({inProgressCount})
              </button>
              <button
                onClick={() => setActiveTab("resolved")}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  activeTab === "resolved"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Resolved ({resolvedCount})
              </button>
            </div>
          </div>

          {alertsLoading ? (
            <Card className="border-border/60">
              <CardContent className="py-12 flex flex-col items-center justify-center gap-2 text-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading emergency dispatches...</p>
              </CardContent>
            </Card>
          ) : filteredAlerts.length === 0 ? (
            /* Clean Empty-State Container */
            <Card className="border-dashed border-2 border-border/80 shadow-none bg-background/50">
              <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-800/60 flex items-center justify-center mb-4 text-muted-foreground">
                  <Siren className="w-8 h-8 text-slate-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {activeTab === "all"
                    ? "No Emergency Alerts at This Time"
                    : `No ${activeTab.replace("_", " ")} alerts found`}
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mt-1 mb-4">
                  {activeTab === "all"
                    ? `The emergency desk is active and connected. Incoming patient distress alerts for ${hospital.name} will appear here in real time.`
                    : `There are currently no alerts matching the selected filter.`}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-[11px] text-muted-foreground font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Monitoring channel active
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Alert Cards List */
            <div className="space-y-4">
              {filteredAlerts.map((alert: EmergencyAlertItem) => {
                const isPending = alert.status === "pending";
                const isAcknowledged = alert.status === "acknowledged";
                const isDispatched = alert.status === "dispatched";
                const isResolved = alert.status === "resolved";

                const isUpdatingThisAlert = updatingAlertId === alert.id;

                const hasGPS = alert.latitude !== null && alert.longitude !== null;
                const googleMapsUrl = hasGPS
                  ? `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`
                  : null;

                const alertDate = alert.created_at ? new Date(alert.created_at) : null;
                const formattedTime = alertDate ? format(alertDate, "PPpp") : "Unknown time";
                const relativeTime = alertDate
                  ? formatDistanceToNow(alertDate, { addSuffix: true })
                  : "";

                const resolvedDate = alert.resolved_at ? new Date(alert.resolved_at) : null;

                return (
                  <Card
                    key={alert.id}
                    className={`border transition-all shadow-sm ${
                      isPending
                        ? "border-red-300 dark:border-red-900/60 bg-white dark:bg-zinc-900 hover:shadow-md ring-1 ring-red-200/50 dark:ring-red-900/20"
                        : isAcknowledged || isDispatched
                        ? "border-amber-300 dark:border-amber-900/60 bg-white dark:bg-zinc-900 hover:shadow-md"
                        : "border-border/60 bg-card/60 opacity-90"
                    }`}
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Alert Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                              isPending
                                ? "bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400"
                                : isAcknowledged
                                ? "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                                : isDispatched
                                ? "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                            }`}
                          >
                            {isDispatched ? (
                              <Truck className="w-5 h-5" />
                            ) : isResolved ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Siren className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base font-bold text-foreground">
                                {alert.patient_name || "Emergency Patient"}
                              </h3>
                              <span className="text-xs text-muted-foreground">
                                • ID: {alert.id.slice(0, 8)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formattedTime}</span>
                              <span className="text-[11px] font-medium text-primary">
                                ({relativeTime})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Visual Badges: Alert Status + Email Notification Status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Alert Status Badge */}
                          {isPending ? (
                            <Badge
                              variant="secondary"
                              className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 font-semibold text-xs px-2.5 py-0.5 flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                              New / Pending
                            </Badge>
                          ) : isAcknowledged ? (
                            <Badge
                              variant="secondary"
                              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 font-semibold text-xs px-2.5 py-0.5 flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                              Acknowledged
                            </Badge>
                          ) : isDispatched ? (
                            <Badge
                              variant="secondary"
                              className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 font-semibold text-xs px-2.5 py-0.5 flex items-center gap-1.5"
                            >
                              <Truck className="w-3.5 h-3.5 text-amber-600" />
                              Ambulance Dispatched
                            </Badge>
                          ) : isResolved ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium text-xs px-2.5 py-0.5 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs px-2.5 py-0.5 capitalize">
                              {alert.status}
                            </Badge>
                          )}

                          {/* Email Notification Status Badge */}
                          {alert.email_status === "sent" ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 text-xs px-2.5 py-0.5 flex items-center gap-1"
                              title={
                                alert.email_sent_at
                                  ? `Email dispatched at ${new Date(
                                      alert.email_sent_at
                                    ).toLocaleTimeString()}`
                                  : "Email delivered"
                              }
                            >
                              <Mail className="w-3.5 h-3.5 text-blue-600" />
                              Email Sent
                            </Badge>
                          ) : alert.email_status === "failed" ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 text-xs px-2.5 py-0.5 flex items-center gap-1"
                              title={alert.email_error || "Email delivery failed"}
                            >
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              Email Failed
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 text-xs px-2.5 py-0.5 flex items-center gap-1"
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              Email Pending
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Alert Message / Distress Note */}
                      <div
                        className={`rounded-lg p-3 text-xs border ${
                          isPending
                            ? "bg-red-50/60 dark:bg-red-950/30 border-red-200/80 dark:border-red-900/40"
                            : isDispatched
                            ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/40"
                            : "bg-muted/40 border-border/40"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <MessageSquare
                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                              isPending
                                ? "text-red-600"
                                : isDispatched
                                ? "text-amber-600"
                                : "text-muted-foreground"
                            }`}
                          />
                          <div>
                            <span className="font-semibold text-foreground">
                              Emergency Note:{" "}
                            </span>
                            <span className="text-muted-foreground">
                              {alert.message || "Emergency assistance requested"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Patient & Location Information Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {/* Patient Phone / Contact */}
                        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border/40">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                              Patient Contact
                            </p>
                            {alert.patient_phone ? (
                              <a
                                href={`tel:${alert.patient_phone}`}
                                className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 truncate"
                              >
                                {alert.patient_phone}
                              </a>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Contact phone not available
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Location Coordinates & Maps Button */}
                        <div className="flex items-center justify-between gap-2 p-3 bg-muted/40 rounded-lg border border-border/40">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-red-500/10 rounded-lg text-red-600">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                Incident Coordinates
                              </p>
                              {hasGPS ? (
                                <p className="text-xs font-mono font-medium text-foreground truncate">
                                  {alert.latitude?.toFixed(5)}, {alert.longitude?.toFixed(5)}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">No GPS coordinates</p>
                              )}
                            </div>
                          </div>

                          {hasGPS && googleMapsUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="h-8 text-xs shrink-0 gap-1 text-primary hover:text-primary"
                            >
                              <a
                                href={googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Google Maps</span>
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Desk Action Controls Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
                        <div className="text-xs text-muted-foreground">
                          {isResolved && resolvedDate ? (
                            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Resolved on {format(resolvedDate, "PPp")}
                            </span>
                          ) : isDispatched ? (
                            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
                              <Truck className="w-3.5 h-3.5" />
                              Ambulance en route to patient location
                            </span>
                          ) : isAcknowledged ? (
                            <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400 font-medium">
                              <Check className="w-3.5 h-3.5" />
                              Desk operator assessing incident
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-700 dark:text-red-400 font-medium">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Action required immediately
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(alert.id, "acknowledged", alert.status)}
                                disabled={isUpdatingThisAlert}
                                className="h-8 text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              >
                                {isUpdatingThisAlert ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                Acknowledge
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(alert.id, "dispatched", alert.status)}
                                disabled={isUpdatingThisAlert}
                                className="h-8 text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-sm"
                              >
                                {isUpdatingThisAlert ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Truck className="w-3.5 h-3.5" />
                                )}
                                Dispatch Ambulance
                              </Button>
                            </>
                          )}

                          {isAcknowledged && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(alert.id, "dispatched", alert.status)}
                                disabled={isUpdatingThisAlert}
                                className="h-8 text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-sm"
                              >
                                {isUpdatingThisAlert ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Truck className="w-3.5 h-3.5" />
                                )}
                                Dispatch Ambulance
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(alert.id, "resolved", alert.status)}
                                disabled={isUpdatingThisAlert}
                                className="h-8 text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              >
                                {isUpdatingThisAlert ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                )}
                                Mark Resolved
                              </Button>
                            </>
                          )}

                          {isDispatched && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(alert.id, "resolved", alert.status)}
                              disabled={isUpdatingThisAlert}
                              className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            >
                              {isUpdatingThisAlert ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              Mark Resolved
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default HospitalDashboard;
