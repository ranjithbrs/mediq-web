import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRevenueSummary, useUpcomingFollowups } from "@/hooks/useAdminDashboard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Ticket, DollarSign, TrendingUp, CalendarCheck, Crown, Siren, MapPin, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { getTodayLocalDateString } from "@/utils/dateUtils";

const AdminDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(
    getTodayLocalDateString()
  );
  const { data: revenue, isLoading: revenueLoading } = useRevenueSummary(selectedDate);
  const { data: followups = [], isLoading: followupsLoading } = useUpcomingFollowups(14);
  const queryClient = useQueryClient();

  // Fetch emergency alerts
  const { data: emergencyAlerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["emergency-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_alerts")
        .select("*, profiles:user_id(full_name, phone), hospitals:hospital_id(name)")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000, // poll every 10s for new alerts
  });

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("emergency_alerts")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-alerts"] });
      toast({ title: "Alert resolved" });
    },
  });

  const pendingAlerts = emergencyAlerts.filter((a: any) => a.status === "pending");

  const stats = [
    {
      label: "Total Patients",
      value: revenue?.total_patients ?? 0,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Normal Tokens",
      value: revenue?.normal_tokens ?? 0,
      icon: Ticket,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Priority Tokens",
      value: revenue?.priority_tokens ?? 0,
      icon: Crown,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Consultation Income",
      value: `₹${revenue?.total_consultation_income ?? 0}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Priority Income",
      value: `₹${revenue?.total_priority_income ?? 0}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Overall Revenue",
      value: `₹${revenue?.overall_revenue ?? 0}`,
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <MainLayout>
      <div className="container py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-2">
            <Label htmlFor="date" className="text-sm">Date:</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>

        {/* Revenue Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold">
                      {revenueLoading ? "..." : stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Emergency Alerts */}
        <Card className={pendingAlerts.length > 0 ? "border-destructive mb-6" : "mb-6"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-destructive" />
              Emergency Alerts
              {pendingAlerts.length > 0 && (
                <Badge variant="destructive">{pendingAlerts.length} pending</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : emergencyAlerts.length === 0 ? (
              <p className="text-muted-foreground">No emergency alerts</p>
            ) : (
              <div className="space-y-3">
                {emergencyAlerts.map((alert: any) => (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      alert.status === "pending" ? "border-destructive bg-destructive/5" : ""
                    }`}
                  >
                    <div>
                      <p className="font-medium">
                        {alert.profiles?.full_name || "Unknown Patient"}
                        {alert.profiles?.phone && (
                          <span className="text-sm text-muted-foreground ml-2">{alert.profiles.phone}</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {alert.hospitals?.name || "Unknown Hospital"} • {Number(alert.latitude).toFixed(4)}, {Number(alert.longitude).toFixed(4)}
                      </p>
                      {alert.message && (
                        <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.created_at), "MMM dd, yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.status === "pending" ? "destructive" : "secondary"}>
                        {alert.status}
                      </Badge>
                      {alert.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveAlert.mutate(alert.id)}
                          disabled={resolveAlert.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Follow-ups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Upcoming Follow-ups (Next 14 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {followupsLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : followups.length === 0 ? (
              <p className="text-muted-foreground">No upcoming follow-ups</p>
            ) : (
              <div className="space-y-3">
                {followups.map((f: any) => (
                  <div
                    key={f.appointment_id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{f.patient_name || "Unknown Patient"}</p>
                      <p className="text-sm text-muted-foreground">
                        Dr. {f.doctor_name}
                      </p>
                      {f.consultation_notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {f.consultation_notes}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {format(new Date(f.follow_up_date), "MMM dd, yyyy")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
