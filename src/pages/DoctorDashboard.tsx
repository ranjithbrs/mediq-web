import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDoctorQueue,
  useUpdateConsultationStatus,
  useDoctorByEmail,
  useDoctorStatistics,
  useDoctorAppointmentsExtra,
  useCancelAppointmentByDoctor,
} from "@/hooks/useDoctorQueue";
import { useUserRole } from "@/hooks/useUserRole";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Play,
  CheckCircle,
  Crown,
  Ticket,
  Search,
  Clock,
  CreditCard,
  Phone,
  Mail,
  Droplets,
  AlertCircle,
  Star,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  XCircle,
  Stethoscope,
  TrendingUp,
  Activity,
  Bell,
  FileText,
  UserPlus,
  Download,
  RefreshCw,
  Clock3,
  Zap,
  Sparkles,
  HeartPulse,
  CalendarOff,
  Trash2,
  PlusCircle,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { toLocalDateString, parseLocalDateString, getTodayLocalDateString } from "@/utils/dateUtils";
import { useToast } from "@/hooks/use-toast";
import { useDoctorLeaves, useAddDoctorLeave, useDeleteDoctorLeave } from "@/hooks/useDoctorLeaves";
import { isBeforeToday } from "@/utils/dateUtils";

// --- Types ---

interface QueueItem {
  appointment_id: string;
  appointment_time: string;
  patient_name: string;
  queue_position: number;
  status: string;
  token_number: number;
  token_type: string;
}

// --- Helpers ---

const getDisplayName = (name: string) =>
  name.startsWith("Dr.") ? name : `Dr. ${name}`;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const getDoctorInitials = (name: string) => {
  const clean = name.replace(/^Dr\.\s*/i, "");
  return clean.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
};

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "scheduled", label: "Pending" },
  { key: "in_consultation", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  scheduled:       { label: "Scheduled",   className: "bg-blue-100 text-blue-800 border-blue-200" },
  confirmed:       { label: "Confirmed",   className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  in_consultation: { label: "In Progress", className: "bg-amber-100 text-amber-800 border-amber-200" },
  completed:       { label: "Completed",   className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled:       { label: "Cancelled",   className: "bg-red-100 text-red-800 border-red-200" },
};

const PAYMENT_CONFIG: Record<string, { label: string; className: string }> = {
  paid:    { label: "Paid",    className: "bg-green-100 text-green-700 border-green-200" },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  failed:  { label: "Failed",  className: "bg-red-100 text-red-700 border-red-200" },
};

const getPaymentCfg = (status: string) =>
  PAYMENT_CONFIG[status?.toLowerCase()] ?? { label: status ?? "--", className: "bg-gray-100 text-gray-600 border-gray-200" };

const getStatusCfg = (status: string) =>
  STATUS_CONFIG[status] ?? { label: status, className: "bg-gray-100 text-gray-700 border-gray-200" };

// --- Stat Card with Lift & Shadow Hover Effects ---

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}

const StatCard = ({ icon, label, value, sub, accent }: StatCardProps) => (
  <Card className="border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ease-in-out bg-white select-none cursor-pointer">
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${accent}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
        <p className="text-xl font-bold leading-none mt-0.5 text-gray-900">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

// --- Notification Bell Dropdown ---

const NotificationBell = ({ queue }: { queue: QueueItem[] }) => {
  const notifications = useMemo(() => {
    const items: { type: "booking" | "cancelled"; label: string; time: string }[] = [];
    queue.forEach((q) => {
      if (q.status === "scheduled" || q.status === "confirmed") {
        items.push({ type: "booking", label: `New booking: ${q.patient_name}`, time: formatTime(q.appointment_time) });
      } else if (q.status === "cancelled") {
        items.push({ type: "cancelled", label: `Cancelled: ${q.patient_name}`, time: formatTime(q.appointment_time) });
      }
    });
    return items.slice(0, 10);
  }, [queue]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-indigo-600 animate-pulse">
              {notifications.length > 9 ? "9+" : notifications.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-100">
          <p className="font-semibold text-sm text-indigo-900">Notifications</p>
          <p className="text-xs text-indigo-600">Today&apos;s activity update</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                <Bell className="h-6 w-6 text-indigo-300" />
              </div>
              <p className="text-sm font-semibold text-gray-700">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-0.5">No patient actions today yet.</p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-indigo-50/30 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${n.type === "booking" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                  {n.type === "booking"
                    ? <CalendarCheck className="h-4 w-4" />
                    : <XCircle className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800 leading-snug">{n.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// --- Queue Progress ---

const QueueProgress = ({ queue }: { queue: QueueItem[] }) => {
  const total     = queue.length;
  const completed = queue.filter((q) => q.status === "completed").length;
  const cancelled = queue.filter((q) => q.status === "cancelled").length;
  const remaining = total - completed - cancelled;
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="border border-gray-100 shadow-sm bg-white rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shadow-inner">
              <Activity className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-xs font-bold text-gray-800">Queue Completion</p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{pct}%</span>
        </div>
        <Progress value={pct} className="h-2 mb-3 bg-gray-100" />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
          <span><span className="font-semibold text-emerald-600">{completed}</span> completed</span>
          <span><span className="font-semibold text-amber-600">{remaining}</span> remaining</span>
          <span><span className="font-semibold text-gray-700">{total}</span> total</span>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Next Patient Card ---

const NextPatientCard = ({ queue, onStart }: { queue: QueueItem[]; onStart: (id: string) => void }) => {
  const next = useMemo(
    () => queue.find((q) => q.status === "scheduled" || q.status === "confirmed"),
    [queue]
  );

  if (!next) return null;

  return (
    <Card className="border border-indigo-100 shadow-sm bg-gradient-to-r from-indigo-50/50 to-violet-50/50 border-l-4 border-l-indigo-600 rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 shadow flex items-center justify-center shrink-0">
              <span className="text-white font-extrabold text-sm">{next.token_number}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Next in Line</p>
              <p className="text-sm font-bold text-gray-800 leading-snug truncate">{next.patient_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock3 className="h-3 w-3 text-gray-400" />
                  {formatTime(next.appointment_time)}
                </p>
                {next.token_type === "priority" && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white rounded text-[9px] font-extrabold py-0 px-1.5 h-4">Priority</Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold h-8 px-4 gap-1.5 shrink-0 shadow active:scale-95 transition-all"
            onClick={() => onStart(next.appointment_id)}
          >
            <Play className="h-3 w-3 fill-current" />
            Start Consultation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Quick Actions with Interactive Polished Layout ---

const QuickActions = ({ onRefresh }: { onRefresh: () => void }) => {
  const { toast } = useToast();

  const actions = [
    {
      icon: <UserPlus className="h-5 w-5 text-violet-600" />,
      label: "Walk-in Patient",
      accent: "bg-violet-50 border-violet-100",
      onClick: () => toast({ title: "Walk-in Registration", description: "Walk-in patient registration is coming soon." }),
    },
    {
      icon: <CalendarCheck className="h-5 w-5 text-indigo-600" />,
      label: "Appointments",
      accent: "bg-indigo-50 border-indigo-100",
      onClick: () => document.getElementById("queue-list")?.scrollIntoView({ behavior: "smooth" }),
    },
    {
      icon: <Download className="h-5 w-5 text-emerald-600" />,
      label: "Export CSV",
      accent: "bg-emerald-50 border-emerald-100",
      onClick: () => toast({ title: "Report Download", description: "CSV report generation is coming soon." }),
    },
    {
      icon: <RefreshCw className="h-5 w-5 text-sky-600" />,
      label: "Refresh Queue",
      accent: "bg-sky-50 border-sky-100",
      onClick: onRefresh,
    },
  ];

  return (
    <Card className="border border-gray-100 shadow-sm bg-white rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-in-out cursor-pointer">
      <CardContent className="p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5 select-none">
          <Zap className="h-3.5 w-3.5 text-violet-500 fill-violet-500" />
          Quick Actions
        </p>
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-3">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-gray-100 hover:border-violet-200 hover:bg-violet-50/20 hover:shadow-sm active:scale-95 transition-all text-center group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm group-hover:scale-105 transition-transform ${a.accent}`}>
                {a.icon}
              </div>
              <span className="text-[11px] font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// --- Recent Activity ---

const RecentActivity = ({ queue }: { queue: QueueItem[] }) => {
  const activities = useMemo(() => {
    const acts: { label: string; color: string; time: string }[] = [];
    queue.forEach((q) => {
      if (q.status === "completed") {
        acts.push({ label: `Completed consultation - ${q.patient_name}`, color: "bg-emerald-400", time: formatTime(q.appointment_time) });
      } else if (q.status === "cancelled") {
        acts.push({ label: `Cancelled booking - ${q.patient_name}`, color: "bg-red-400", time: formatTime(q.appointment_time) });
      }
    });
    return acts.slice(0, 5);
  }, [queue]);

  return (
    <Card className="border border-gray-100 shadow-sm bg-white rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
      <CardContent className="p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5 select-none">
          <Activity className="h-3.5 w-3.5 text-gray-400" />
          Recent Activity
        </p>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 text-gray-400 shadow-inner">
              <Activity className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-xs font-semibold text-gray-600">No activity yet</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Completed/cancelled appointments will list here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((a, i) => (
              <div key={i} className="flex items-start gap-2.5 pb-2.5 last:pb-0 border-b last:border-0 border-gray-50">
                <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${a.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-700 font-medium leading-snug">{a.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- Appointment Card ---

interface AppointmentCardProps {
  item: QueueItem;
  extra?: {
    payment_status: string;
    special_instructions: string | null;
    consultation_notes: string | null;
    diagnosis: string | null;
    prescription: string | null;
    doctor_notes: string | null;
    patient_phone: string | null;
    patient_email: string | null;
    patient_blood_group: string | null;
    patient_allergies: string | null;
    patient_current_medications: string | null;
  };
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  isUpdating: boolean;
}

const AppointmentCard = ({ item, extra, onStart, onComplete, onCancel, isUpdating }: AppointmentCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const statusCfg        = getStatusCfg(item.status);
  const paymentCfg       = getPaymentCfg(extra?.payment_status ?? "pending");
  const isPriority       = item.token_type === "priority";
  const isInConsultation = item.status === "in_consultation";

  const canStart    = item.status === "scheduled" || item.status === "confirmed";
  const canComplete = item.status === "in_consultation";
  const canCancel   = item.status !== "completed" && item.status !== "cancelled";

  return (
    <Card className={`border shadow-sm bg-white hover:shadow-md transition-all duration-300 ease-in-out overflow-hidden rounded-xl cursor-pointer ${isInConsultation ? "border-amber-400 ring-1 ring-amber-400/20" : "border-gray-100"}`}>
      <CardContent className="p-0">
        {isInConsultation && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Active Consultation In Progress</span>
          </div>
        )}

        <div className="flex items-stretch">
          <div className={`flex flex-col items-center justify-center px-4 py-4 rounded-l-xl min-w-[72px] ${isPriority ? "bg-gradient-to-b from-amber-400 to-amber-500" : "bg-gradient-to-b from-indigo-600 to-violet-600"}`}>
            <span className="text-white/80 text-[10px] font-medium uppercase tracking-wide">Token</span>
            <span className="text-white text-2xl font-black leading-none">{item.token_number}</span>
            {isPriority && <Crown className="h-3 w-3 text-white/80 mt-1" />}
          </div>

          <div className="flex-1 px-4 py-3 flex flex-col justify-between min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gray-900 leading-snug truncate">{item.patient_name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  {formatTime(item.appointment_time)}
                  <span className="text-gray-300 mx-0.5">·</span>
                  <Ticket className="h-3.5 w-3.5 text-gray-400" />
                  Queue #{item.queue_position}
                </p>
              </div>
              <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 h-5 shrink-0 ${statusCfg.className}`}>
                {statusCfg.label}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {canStart && (
                <Button size="sm" className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 rounded-lg gap-1 font-semibold transition-colors shadow-sm animate-fade-in" onClick={() => onStart(item.appointment_id)} disabled={isUpdating}>
                  <Play className="h-3 w-3 fill-current" /> Start
                </Button>
              )}
              {canComplete && (
                <Button size="sm" className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 rounded-lg gap-1 font-semibold transition-colors shadow-sm animate-fade-in" onClick={() => onComplete(item.appointment_id)} disabled={isUpdating}>
                  <CheckCircle className="h-3 w-3" /> Complete
                </Button>
              )}
              {canCancel && (
                <Button size="sm" variant="outline" className="h-7 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-lg gap-1 font-semibold transition-colors" onClick={() => onCancel(item.appointment_id)} disabled={isUpdating}>
                  <XCircle className="h-3 w-3" /> Cancel
                </Button>
              )}
              <button className="ml-auto text-xs text-muted-foreground font-semibold flex items-center gap-0.5 hover:text-indigo-600 transition-colors py-1 px-2 hover:bg-gray-50 rounded-md" onClick={() => setExpanded((v) => !v)}>
                Details
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50/50 rounded-b-xl">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">Payment:</span>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ml-auto ${paymentCfg.className}`}>{paymentCfg.label}</Badge>
              </div>
              {extra?.patient_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">{extra.patient_phone}</span>
                </div>
              )}
              {extra?.patient_email && (
                <div className="flex items-center gap-2 col-span-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">{extra.patient_email}</span>
                </div>
              )}
              {extra?.patient_blood_group && (
                <div className="flex items-center gap-2">
                  <Droplets className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">Blood:</span>
                  <span className="text-xs font-semibold">{extra.patient_blood_group}</span>
                </div>
              )}
            </div>
            {extra?.patient_allergies && (
              <div className="flex items-start gap-2 bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Allergies</p>
                  <p className="text-xs text-red-700 font-medium">{extra.patient_allergies}</p>
                </div>
              </div>
            )}
            {extra?.patient_current_medications && (
              <div className="bg-blue-50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-0.5">Current Medications</p>
                <p className="text-xs text-blue-700 font-medium">{extra.patient_current_medications}</p>
              </div>
            )}
            {extra?.special_instructions && (
              <div className="bg-amber-50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">Special Instructions</p>
                <p className="text-xs text-amber-700 font-medium">{extra.special_instructions}</p>
              </div>
            )}
            {extra?.consultation_notes && (
              <div className="bg-emerald-50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-0.5">Consultation Notes / Instructions</p>
                <p className="text-xs text-emerald-700 font-medium">{extra.consultation_notes}</p>
              </div>
            )}
            {extra?.diagnosis && (
              <div className="bg-indigo-50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-0.5">Diagnosis</p>
                <p className="text-xs text-indigo-700 font-medium">{extra.diagnosis}</p>
              </div>
            )}
            {extra?.prescription && (
              <div className="bg-purple-50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wide mb-0.5">Prescription</p>
                <p className="text-xs text-purple-700 font-medium whitespace-pre-wrap">{extra.prescription}</p>
              </div>
            )}
            {extra?.doctor_notes && (
              <div className="bg-teal-50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wide mb-0.5">Doctor Notes</p>
                <p className="text-xs text-teal-700 font-medium whitespace-pre-wrap">{extra.doctor_notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- Main Dashboard ---

const DoctorDashboard = () => {
  const { user }      = useUserRole();
  const queryClient   = useQueryClient();
  const { data: doctorProfile, isLoading: doctorLoading } = useDoctorByEmail(user?.email || undefined);

  const [selectedDate, setSelectedDate]           = useState<string>(toLocalDateString(new Date()));
  const [searchQuery, setSearchQuery]             = useState("");
  const [activeTab, setActiveTab]                 = useState("all");
  const [completeDialog, setCompleteDialog]       = useState<string | null>(null);
  const [cancelDialog, setCancelDialog]           = useState<string | null>(null);
  const [followUpDate, setFollowUpDate]           = useState("");
  const [consultationNotes, setConsultationNotes] = useState("");
  const [diagnosis, setDiagnosis]                 = useState("");
  const [prescription, setPrescription]           = useState("");
  const [doctorNotes, setDoctorNotes]             = useState("");
  const [diagnosisTouched, setDiagnosisTouched]   = useState(false);
  const [prescriptionTouched, setPrescriptionTouched] = useState(false);

  const { data: queue = [], isLoading: queueLoading } = useDoctorQueue(doctorProfile?.id, selectedDate);
  const { data: statistics }    = useDoctorStatistics(doctorProfile?.id);
  const { data: extraMap = {} } = useDoctorAppointmentsExtra(doctorProfile?.id, selectedDate);

  const updateStatus      = useUpdateConsultationStatus();
  const cancelAppointment = useCancelAppointmentByDoctor();

  // ─── Leave management ───────────────────────────────────────────────────────
  const { data: doctorLeaves = [] } = useDoctorLeaves(doctorProfile?.id);
  const addLeave    = useAddDoctorLeave();
  const deleteLeave = useDeleteDoctorLeave();
  const [leaveReason, setLeaveReason] = useState("");

  const todayString = getTodayLocalDateString();
  const isOnLeaveToday = doctorLeaves.some((l) => l.leave_date === todayString);

  // Build set of leave dates for calendar highlighting
  const leaveDateSet = useMemo(() => {
    const s = new Set<string>();
    doctorLeaves.forEach((l) => s.add(l.leave_date));
    return s;
  }, [doctorLeaves]);

  // Find leave for the currently selected date (if any)
  const selectedDateLeave = doctorLeaves.find((l) => l.leave_date === selectedDate);
  const isSelectedDatePast = isBeforeToday(parseLocalDateString(selectedDate));

  const handleMarkLeave = () => {
    if (!doctorProfile?.id || isSelectedDatePast) return;
    addLeave.mutate(
      { doctorId: doctorProfile.id, leaveDate: selectedDate, reason: leaveReason.trim() || undefined },
      { onSuccess: () => setLeaveReason("") }
    );
  };

  const handleRemoveLeave = (leaveId: string) => {
    deleteLeave.mutate(leaveId);
  };

  const todayStats = useMemo(() => {
    const total      = queue.length;
    const completed  = queue.filter((q: QueueItem) => q.status === "completed").length;
    const inProgress = queue.filter((q: QueueItem) => q.status === "in_consultation").length;
    const pending    = queue.filter((q: QueueItem) => q.status === "scheduled" || q.status === "confirmed").length;
    return { total, completed, inProgress, pending };
  }, [queue]);

  const nextAppointmentTime = useMemo(() => {
    const next = (queue as QueueItem[]).find((q) => q.status === "scheduled" || q.status === "confirmed");
    return next ? formatTime(next.appointment_time) : null;
  }, [queue]);

  const filteredQueue = useMemo(() => {
    let result = queue as QueueItem[];
    if (activeTab !== "all") {
      if (activeTab === "scheduled") {
        result = result.filter((q) => q.status === "scheduled" || q.status === "confirmed");
      } else {
        result = result.filter((q) => q.status === activeTab);
      }
    }
    const sq = searchQuery.trim().toLowerCase();
    if (sq) {
      result = result.filter(
        (item) => item.patient_name?.toLowerCase().includes(sq) || String(item.token_number).includes(sq)
      );
    }
    return result;
  }, [queue, activeTab, searchQuery]);

  const handleStart = (id: string) => updateStatus.mutate({ appointmentId: id, status: "in_consultation" });

  const handleOpenComplete = (id: string) => {
    setCompleteDialog(id);
    setFollowUpDate("");
    setConsultationNotes("");
    setDiagnosis("");
    setPrescription("");
    setDoctorNotes("");
    setDiagnosisTouched(false);
    setPrescriptionTouched(false);

    // Initialize notes from extraMap if they exist
    const extra = extraMap[id] || {};
    setConsultationNotes(extra.consultation_notes || "");
    setDiagnosis(extra.diagnosis || "");
    setPrescription(extra.prescription || "");
    setDoctorNotes(extra.doctor_notes || "");
  };

  const handleCompleteConsultation = () => {
    if (!completeDialog) return;
    // Client-side validation: diagnosis and prescription are required
    setDiagnosisTouched(true);
    setPrescriptionTouched(true);
    if (!diagnosis.trim() || !prescription.trim()) return;
    updateStatus.mutate(
      { 
        appointmentId: completeDialog, 
        status: "completed", 
        followUpDate: followUpDate || undefined, 
        consultationNotes: consultationNotes || undefined,
        diagnosis: diagnosis.trim(),
        prescription: prescription.trim(),
        doctorNotes: doctorNotes || undefined
      },
      { onSuccess: () => setCompleteDialog(null) }
    );
  };

  const handleConfirmCancel = () => {
    if (!cancelDialog) return;
    cancelAppointment.mutate(cancelDialog, { onSuccess: () => setCancelDialog(null) });
  };

  const handleRefreshQueue = () => {
    queryClient.invalidateQueries({ queryKey: ["doctor-queue"] });
    queryClient.invalidateQueries({ queryKey: ["doctor-appointments-extra"] });
  };

  if (doctorLoading) {
    return (
      <MainLayout>
        <div className="container py-6 max-w-3xl space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          <Skeleton className="h-14 rounded-xl" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </MainLayout>
    );
  }

  if (!doctorProfile) {
    return (
      <MainLayout>
        <div className="container py-12 max-w-3xl text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="h-8 w-8 text-indigo-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">No Doctor Profile Found</h2>
          <p className="text-sm text-muted-foreground">No doctor profile is linked to your account. Please contact the administrator.</p>
        </div>
      </MainLayout>
    );
  }

  const displayName = getDisplayName(doctorProfile.name);
  const isMutating  = updateStatus.isPending || cancelAppointment.isPending;
  const rating      = statistics?.average_rating ? Number(statistics.average_rating).toFixed(1) : null;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-6">

        {/* Hero Banner (Height slightly reduced by 10-15% via padding adjustments) */}
        <div style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }} className="px-5 pt-3.5 pb-7 rounded-b-3xl shadow-lg border-b border-indigo-500/20 select-none">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Medical Portal</p>
              <p className="text-white text-base font-bold flex items-center gap-1.5 mt-0.5">
                <Sparkles className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                {getGreeting()}, {doctorProfile.name.split(" ").slice(-1)[0]}
              </p>
            </div>
            <NotificationBell queue={queue as QueueItem[]} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-center">
            {/* Left Column: Avatar + Profile Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white/30 shadow-md shrink-0">
                {doctorProfile.photo && <AvatarImage src={doctorProfile.photo} alt={displayName} />}
                <AvatarFallback className="bg-indigo-700 text-white text-xl font-extrabold">{getDoctorInitials(doctorProfile.name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1 min-w-0">
                <h1 className="text-white text-xl font-extrabold leading-tight truncate">{displayName}</h1>
                <p className="text-indigo-100 text-xs font-medium flex items-center gap-1">
                  <HeartPulse className="h-3.5 w-3.5 text-indigo-300 shrink-0" />
                  {doctorProfile.specialization}
                  {doctorProfile.qualification && <span className="text-indigo-200/80"> · {doctorProfile.qualification}</span>}
                </p>

                {/* Sub banner data metrics (Working hours and Next Appt included with larger icons) */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {/* Working Hours */}
                  <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-lg px-2.5 py-1 text-white text-[11px] font-semibold border border-white/5">
                    <Clock className="h-3.5 w-3.5 text-indigo-200" />
                    Hours: 9:00 AM – 5:00 PM
                  </div>
                  {/* Rating */}
                  <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-lg px-2.5 py-1 text-white text-[11px] font-semibold border border-white/5">
                    <Star className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" />
                    Rating: {rating ?? "None"}
                  </div>
                  {/* Availability Status */}
                  {isOnLeaveToday ? (
                    <div className="flex items-center gap-1 bg-red-500/30 backdrop-blur-md rounded-lg px-2.5 py-1 text-white text-[11px] font-semibold border border-red-300/30">
                      <CalendarOff className="h-3.5 w-3.5 text-red-300" />
                      🔴 On Leave Today
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-emerald-500/30 backdrop-blur-md rounded-lg px-2.5 py-1 text-white text-[11px] font-semibold border border-emerald-300/30">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-300" />
                      🟢 Available Today
                    </div>
                  )}
                  {/* Next Appointment */}
                  {nextAppointmentTime ? (
                    <div className="flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-lg px-2.5 py-1 text-white text-[11px] font-semibold border border-indigo-300/30">
                      <Clock3 className="h-3.5 w-3.5 text-emerald-300" />
                      Next: {nextAppointmentTime}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-lg px-2.5 py-1 text-white/60 text-[11px] font-semibold border border-white/5">
                      <Clock3 className="h-3.5 w-3.5 text-white/40" />
                      Next: None
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Calendar component + Selection Info summary below */}
            <Card className="shrink-0 w-full sm:w-72 bg-white rounded-2xl shadow-xl overflow-hidden self-center mx-auto lg:mx-0">
              <CardContent className="p-1 pb-0">
                <Calendar
                  mode="single"
                  selected={parseLocalDateString(selectedDate)}
                  onSelect={(date) => { if (date) setSelectedDate(toLocalDateString(date)); }}
                  className="rounded-md"
                  modifiers={{ leave: doctorLeaves.map((l) => parseLocalDateString(l.leave_date)) }}
                  modifiersClassNames={{ leave: "relative after:content-[''] after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:bg-red-500 after:rounded-full" }}
                />
              </CardContent>
              {/* Selected date & summary info displayed compactly below the calendar */}
              <div className="px-4 py-2.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-600 rounded-b-2xl select-none">
                <div className="flex items-center gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{new Date(parseLocalDateString(selectedDate)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-extrabold text-[10px] border border-indigo-100">
                  {queue.length} Appt{queue.length !== 1 ? "s" : ""}
                </span>
              </div>
            </Card>

            {/* Availability & Leave Management Card */}
            <Card className="shrink-0 w-full sm:w-72 bg-white rounded-2xl shadow-xl overflow-hidden self-center mx-auto lg:mx-0">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarOff className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-gray-800">Availability & Leave</h3>
                </div>

                {/* Selected date status */}
                <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <span className="font-semibold">{new Date(parseLocalDateString(selectedDate)).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  {selectedDateLeave ? (
                    <span className="ml-2 text-red-600 font-bold">🔴 On Leave</span>
                  ) : (
                    <span className="ml-2 text-emerald-600 font-bold">🟢 Available</span>
                  )}
                </div>

                {isSelectedDatePast ? (
                  <p className="text-xs text-muted-foreground italic">Past dates cannot be edited.</p>
                ) : selectedDateLeave ? (
                  <div className="space-y-2">
                    {selectedDateLeave.reason && (
                      <p className="text-xs text-gray-600"><span className="font-semibold">Reason:</span> {selectedDateLeave.reason}</p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 rounded-lg gap-1.5 font-semibold"
                      onClick={() => handleRemoveLeave(selectedDateLeave.id)}
                      disabled={deleteLeave.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                      {deleteLeave.isPending ? "Removing..." : "Remove Leave"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="Reason for leave (optional)"
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      className="h-8 text-xs rounded-lg border-gray-200"
                    />
                    <Button
                      size="sm"
                      className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700 rounded-lg gap-1.5 font-semibold"
                      onClick={handleMarkLeave}
                      disabled={addLeave.isPending}
                    >
                      <PlusCircle className="h-3 w-3" />
                      {addLeave.isPending ? "Marking..." : "Mark as Leave"}
                    </Button>
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center gap-3 text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                  <span>🔴 Leave</span>
                  <span>🟢 Available</span>
                  <span>📅 Selected</span>
                </div>

                {/* Upcoming Leaves */}
                {doctorLeaves.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Upcoming Leave</p>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                      {doctorLeaves.map((leave) => (
                        <div key={leave.id} className="flex items-center justify-between bg-red-50 rounded-lg px-2.5 py-1.5 border border-red-100">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-red-800">
                              {new Date(parseLocalDateString(leave.leave_date)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </p>
                            {leave.reason && (
                              <p className="text-[10px] text-red-600 truncate">{leave.reason}</p>
                            )}
                          </div>
                          <button
                            className="shrink-0 p-1 hover:bg-red-100 rounded-md transition-colors"
                            onClick={() => handleRemoveLeave(leave.id)}
                            title="Remove leave"
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="-mt-6 space-y-6 pb-12">
          
          {/* Quick Stats Banner Row */}
          <div className="grid grid-cols-3 gap-3 px-1">
            <StatCard icon={<Clock className="h-4 w-4 text-amber-600" />} label="Pending Today" value={todayStats.pending} accent="bg-amber-50 border-amber-100" />
            <StatCard icon={<Activity className="h-4 w-4 text-indigo-600" />} label="In Progress" value={todayStats.inProgress} accent="bg-indigo-50 border-indigo-100" />
            <StatCard icon={<CheckCircle className="h-4 w-4 text-emerald-600" />} label="Done Today" value={todayStats.completed} accent="bg-emerald-50 border-emerald-100" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Wide Left Column: Queue & Patient Actions (Col span 2) */}
            <div className="lg:col-span-2 space-y-4">
              
              {todayStats.total > 0 && <QueueProgress queue={queue as QueueItem[]} />}

              <NextPatientCard queue={queue as QueueItem[]} onStart={handleStart} />

              {/* Patient list panel */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm" id="queue-list">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9 bg-gray-50 border-gray-100 rounded-xl h-10 text-sm focus-visible:bg-white transition-colors"
                      placeholder="Search patient name or token number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Filter Status tabs */}
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
                    {STATUS_TABS.map((tab) => {
                      const count =
                        tab.key === "all" ? queue.length
                        : tab.key === "scheduled"
                          ? (queue as QueueItem[]).filter((q) => q.status === "scheduled" || q.status === "confirmed").length
                          : (queue as QueueItem[]).filter((q) => q.status === tab.key).length;
                      
                      const isActive = activeTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                            isActive
                              ? "bg-indigo-600 text-white shadow"
                              : "bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 hover:text-indigo-600"
                          }`}
                        >
                          {tab.label}
                          {count > 0 && (
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Queue list content with refined Empty State */}
                {queueLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
                  </div>
                ) : filteredQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-gray-100 rounded-xl shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4 text-indigo-400 shadow-inner">
                      <Users className="h-8 w-8 text-indigo-300" />
                    </div>
                    <p className="text-base font-bold text-gray-800">No Patients Scheduled</p>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1">
                      {searchQuery ? "No matching records found for the search query." : "No consultations are scheduled on the selected date."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredQueue.map((item: QueueItem) => (
                      <AppointmentCard
                        key={item.appointment_id}
                        item={item}
                        extra={extraMap[item.appointment_id]}
                        onStart={handleStart}
                        onComplete={handleOpenComplete}
                        onCancel={(id) => setCancelDialog(id)}
                        isUpdating={isMutating}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Narrow Right Column: Metrics, Actions, & Logging (Col span 1) */}
            <div className="space-y-4">
              
              <QuickActions onRefresh={handleRefreshQueue} />

              {statistics && (
                <div className="grid grid-cols-2 gap-3">
                  <StatCard icon={<CalendarCheck className="h-4 w-4 text-indigo-600" />} label="Total Booking" value={statistics.total_appointments ?? 0} accent="bg-indigo-50 border-indigo-100" />
                  <StatCard icon={<TrendingUp className="h-4 w-4 text-emerald-600" />} label="Completed" value={statistics.completed_appointments ?? 0} accent="bg-emerald-50 border-emerald-100" />
                  <StatCard icon={<XCircle className="h-4 w-4 text-red-500" />} label="Cancelled" value={statistics.cancelled_appointments ?? 0} accent="bg-red-50 border-red-100" />
                  <StatCard icon={<Star className="h-4 w-4 text-yellow-500" />} label="Avg Reviews" value={rating ?? "None"} accent="bg-yellow-50 border-yellow-100" />
                </div>
              )}

              <RecentActivity queue={queue as QueueItem[]} />

            </div>

          </div>
        </div>
      </div>

      {/* Complete dialog */}
      <Dialog open={!!completeDialog} onOpenChange={(open) => !open && setCompleteDialog(null)}>
        <DialogContent className="max-w-sm rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              Complete Consultation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1 max-h-[60vh] overflow-y-auto px-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Diagnosis <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                onBlur={() => setDiagnosisTouched(true)}
                placeholder="Enter diagnosis details..."
                rows={2}
                className={`resize-none rounded-xl text-sm border-gray-200 focus-visible:ring-indigo-500 ${diagnosisTouched && !diagnosis.trim() ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              {diagnosisTouched && !diagnosis.trim() && (
                <p className="text-xs text-red-500 font-medium">Diagnosis is required.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Prescription <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={prescription}
                onChange={(e) => setPrescription(e.target.value)}
                onBlur={() => setPrescriptionTouched(true)}
                placeholder="Enter prescribed medicines, dosage, instructions..."
                rows={3}
                className={`rounded-xl text-sm border-gray-200 focus-visible:ring-indigo-500 ${prescriptionTouched && !prescription.trim() ? "border-red-400 focus-visible:ring-red-400" : ""}`}
              />
              {prescriptionTouched && !prescription.trim() && (
                <p className="text-xs text-red-500 font-medium">Prescription is required.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Doctor Notes</Label>
              <Textarea value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} placeholder="Any additional internal/private notes..." rows={2} className="resize-none rounded-xl text-sm border-gray-200 focus-visible:ring-indigo-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Consultation Notes / Instructions</Label>
              <Textarea value={consultationNotes} onChange={(e) => setConsultationNotes(e.target.value)} placeholder="General notes or patient-facing instructions..." rows={2} className="resize-none rounded-xl text-sm border-gray-200 focus-visible:ring-indigo-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Follow-up Date <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} min={getTodayLocalDateString()} className="rounded-xl text-sm border-gray-200 focus-visible:ring-indigo-500" />
            </div>
            
            {/* Patient Documents empty state refined */}
            <div className="space-y-1.5 pb-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-gray-400" />
                Patient Documents
              </Label>
              <div className="flex flex-col items-center justify-center py-6 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-center px-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm border border-gray-100 mb-2">
                  <FileText className="h-5 w-5 text-gray-300" />
                </div>
                <p className="text-xs font-bold text-gray-700">No documents uploaded.</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">The patient has not attached records to this appointment.</p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" className="rounded-xl font-semibold border-gray-200" onClick={() => setCompleteDialog(null)}>Cancel</Button>
            <Button
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold shadow-sm disabled:opacity-50"
              onClick={handleCompleteConsultation}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? "Saving..." : "Confirm & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <AlertDialog open={!!cancelDialog} onOpenChange={(open) => !open && setCancelDialog(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
              <XCircle className="h-5 w-5 text-red-500" />
              Cancel Appointment?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This action will mark the appointment as cancelled. The patient will lose their queue position. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-semibold border-gray-200">Keep Appointment</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm" onClick={handleConfirmCancel} disabled={cancelAppointment.isPending}>
              {cancelAppointment.isPending ? "Cancelling..." : "Cancel Appointment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};

export default DoctorDashboard;
