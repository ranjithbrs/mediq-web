import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useAppointments } from "@/hooks/useAppointments";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";
import { AppointmentEmptyState } from "@/components/appointments/AppointmentEmptyState";
import { Plus } from "lucide-react";
import { parseLocalDateString, getTodayLocalMidnight } from "@/utils/dateUtils";

const Appointments = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: appointments = [], isLoading } = useAppointments(user?.id);

  const filteredAppointments = useMemo(() => {
    const today = getTodayLocalMidnight();

    const upcoming = appointments.filter((apt) => {
      const aptDate = parseLocalDateString(apt.appointment_date);
      return (
        (apt.status === "scheduled" || apt.status === "confirmed") &&
        aptDate >= today
      );
    });

    const past = appointments.filter((apt) => {
      const aptDate = parseLocalDateString(apt.appointment_date);
      return (
        apt.status === "completed" ||
        ((apt.status === "scheduled" || apt.status === "confirmed") &&
          aptDate < today)
      );
    });

    const cancelled = appointments.filter((apt) => apt.status === "cancelled");

    return { upcoming, past, cancelled };
  }, [appointments]);

  if (authLoading) {
    return (
      <MainLayout>
        <div className="container py-6">
          <div className="text-center">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <MainLayout>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Appointments</h1>
          <Button onClick={() => navigate("/search")}>
            <Plus className="h-4 w-4 mr-2" />
            Book New
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming" className="relative">
              Upcoming
              {filteredAppointments.upcoming.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {filteredAppointments.upcoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="space-y-4 mt-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="upcoming" className="space-y-4 mt-6">
                {filteredAppointments.upcoming.length > 0 ? (
                  filteredAppointments.upcoming.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))
                ) : (
                  <AppointmentEmptyState type="upcoming" />
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4 mt-6">
                {filteredAppointments.past.length > 0 ? (
                  filteredAppointments.past.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))
                ) : (
                  <AppointmentEmptyState type="past" />
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="space-y-4 mt-6">
                {filteredAppointments.cancelled.length > 0 ? (
                  filteredAppointments.cancelled.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))
                ) : (
                  <AppointmentEmptyState type="cancelled" />
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Appointments;
