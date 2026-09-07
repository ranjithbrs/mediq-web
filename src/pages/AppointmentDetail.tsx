import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Hash,
  Users,
  AlertCircle,
  Edit,
  Trash2,
  Download,
  Stethoscope,
} from "lucide-react";
import { generateAppointmentPDF } from "@/components/appointments/AppointmentReceiptPDF";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { parseLocalDateString } from "@/utils/dateUtils";
import { getEffectiveAppointmentStatus } from "@/utils/appointmentUtils";

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState<any>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [hospital, setHospital] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchAppointmentDetails();
    }
  }, [id, user]);

  const fetchAppointmentDetails = async () => {
    try {
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", id)
        .single();

      if (appointmentError) throw appointmentError;
      setAppointment(appointmentData);

      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", appointmentData.doctor_id)
        .single();

      if (doctorError) throw doctorError;
      setDoctor(doctorData);

      const { data: hospitalData, error: hospitalError } = await supabase
        .from("hospitals")
        .select("*")
        .eq("id", appointmentData.hospital_id)
        .single();

      if (hospitalError) throw hospitalError;
      setHospital(hospitalData);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      toast({
        title: "Error",
        description: "Failed to load appointment details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Appointment cancelled successfully",
      });
      navigate("/appointments");
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to cancel appointment",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const effectiveStatus = getEffectiveAppointmentStatus(appointment);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
      case "confirmed":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      case "missed":
        return "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Scheduled";
      case "confirmed":
        return "Confirmed";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      case "missed":
        return "Missed";
      default:
        return status;
    }
  };

  const handleDownloadPDF = () => {
    if (appointment && doctor && hospital) {
      generateAppointmentPDF(appointment, doctor, hospital);
      toast({
        title: "Downloaded",
        description: "Appointment confirmation saved as PDF",
      });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-6">
          <div className="text-center">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!appointment || !doctor || !hospital) {
    return (
      <MainLayout>
        <div className="container py-6">
          <div className="text-center">Appointment not found</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Appointment Details</h1>
          <Badge className={getStatusColor(effectiveStatus)}>
            {getStatusLabel(effectiveStatus)}
          </Badge>
        </div>

        {/* Token Card */}
        {appointment.token_number && (
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Hash className="h-5 w-5" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Token Number
                  </span>
                </div>
                <div className="text-5xl font-bold text-primary mb-2">
                  {appointment.token_number}
                </div>
                {appointment.queue_position && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Position in queue: {appointment.queue_position}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appointment Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Appointment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(parseLocalDateString(appointment.appointment_date), "PPP")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Time</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.appointment_time}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Type</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {appointment.appointment_type}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Doctor Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Doctor Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              {doctor.photo && (
                <img
                  src={doctor.photo}
                  alt={doctor.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{doctor.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {doctor.qualification}
                </p>
                <p className="text-sm text-muted-foreground">
                  {doctor.specialization}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {doctor.experience} years experience
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hospital Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Hospital Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">{hospital.name}</h3>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm">{hospital.address}</p>
                <p className="text-sm text-muted-foreground">
                  {hospital.city}, {hospital.state} - {hospital.pincode}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm">{hospital.phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Special Instructions */}
        {appointment.special_instructions && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Special Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{appointment.special_instructions}</p>
            </CardContent>
          </Card>
        )}

        {/* Consultation Summary (read-only, shown only after completion) */}
        {appointment.status === "completed" && (appointment.diagnosis || appointment.prescription || appointment.doctor_notes) && (
          <Card className="mb-6 border-emerald-100 bg-emerald-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <Stethoscope className="h-5 w-5 text-emerald-600" />
                Consultation Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointment.diagnosis && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Diagnosis</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{appointment.diagnosis}</p>
                </div>
              )}
              {appointment.prescription && (
                <div className="border-t border-emerald-100 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Prescription</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{appointment.prescription}</p>
                </div>
              )}
              {appointment.doctor_notes && (
                <div className="border-t border-emerald-100 pt-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Doctor Notes</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{appointment.doctor_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownloadPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        </div>

        {(effectiveStatus === "scheduled" || effectiveStatus === "confirmed") && (
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => toast({ title: "Reschedule feature coming soon!" })}
            >
              <Edit className="h-4 w-4 mr-2" />
              Reschedule
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel Appointment
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this appointment? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, Keep It</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelAppointment}
                    disabled={cancelling}
                  >
                    {cancelling ? "Cancelling..." : "Yes, Cancel"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AppointmentDetail;