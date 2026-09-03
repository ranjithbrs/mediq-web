import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface DoctorCardProps {
  id: string;
  name: string;
  photo: string;
  specialization: string;
  qualification: string;
  experience: number;
  consultationFee: number;
  rating: number | null;
  totalReviews: number;
  availabilityStatus: "available" | "busy" | "offline";
  hospitalName?: string;
}

const statusConfig = {
  available: { label: "Available", color: "bg-success" },
  busy: { label: "Busy", color: "bg-warning" },
  offline: { label: "Offline", color: "bg-muted" },
};

export const DoctorCard = ({
  id,
  name,
  photo,
  specialization,
  qualification,
  experience,
  consultationFee,
  rating,
  totalReviews,
  availabilityStatus,
  hospitalName,
}: DoctorCardProps) => {
  const status = statusConfig[availabilityStatus];
  
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative">
            <img
              src={photo}
              alt={name}
              className="w-24 h-24 rounded-lg object-cover"
            />
            <div className={`absolute -bottom-1 -right-1 ${status.color} text-white text-xs px-2 py-0.5 rounded-full`}>
              {status.label}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-bold text-lg">{name}</h3>
                <p className="text-sm text-muted-foreground">{qualification}</p>
              </div>
              <div className="flex items-center gap-1 bg-success/10 px-2 py-1 rounded">
                <Star className="h-3 w-3 fill-success text-success" />
                <span className="font-semibold text-success text-sm">
                  {rating !== null && rating !== undefined ? rating.toFixed(1) : "0.0"}
                </span>
              </div>
            </div>
            
            <Badge variant="secondary" className="mb-2">{specialization}</Badge>
            
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{experience} yrs exp</span>
              </div>
              <div className="font-semibold text-foreground">
                ₹{consultationFee}
              </div>
              {hospitalName && (
                <div className="text-xs">{hospitalName}</div>
              )}
            </div>

            <div className="flex gap-2">
              <Button asChild size="sm" className="flex-1">
                <Link to={`/doctor/${id}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to={`/doctor/${id}`}>View Profile</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};