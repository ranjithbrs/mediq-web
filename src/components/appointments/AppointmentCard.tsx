import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { parseLocalDateString } from "@/utils/dateUtils";

interface AppointmentCardProps {
  appointment: {
    id: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    token_number: number | null;
    doctors?: {
      name: string;
      specialization: string;
      photo: string | null;
    };
    hospitals?: {
      name: string;
    };
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "scheduled":
      return "bg-blue-500";
    case "confirmed":
      return "bg-emerald-500";
    case "completed":
      return "bg-green-500";
    case "cancelled":
      return "bg-red-500";
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
    default:
      return status;
  }
};

export const AppointmentCard = ({ appointment }: AppointmentCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:border-primary transition-colors"
      onClick={() => navigate(`/appointment/${appointment.id}`)}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            {appointment.doctors?.photo && (
              <img
                src={appointment.doctors.photo}
                alt={appointment.doctors.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {appointment.doctors?.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {appointment.doctors?.specialization}
              </p>
              <p className="text-sm text-muted-foreground">
                {appointment.hospitals?.name}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Badge className={getStatusColor(appointment.status)}>
              {getStatusLabel(appointment.status)}
            </Badge>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{format(parseLocalDateString(appointment.appointment_date), "PP")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{appointment.appointment_time}</span>
          </div>
        </div>

        {appointment.token_number && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm">
              <span className="font-medium">Token: </span>
              <span className="text-primary font-semibold">
                #{appointment.token_number}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
