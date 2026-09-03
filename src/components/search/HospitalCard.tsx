import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface HospitalCardProps {
  id: string;
  name: string;
  address: string;
  city: string;
  specialties: string[];
  rating: number | null;
  totalReviews: number;
  image: string;
}

export const HospitalCard = ({
  id,
  name,
  address,
  city,
  specialties,
  rating,
  totalReviews,
  image,
}: HospitalCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-48 h-48 sm:h-auto">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none"
            />
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-xl font-bold mb-1">{name}</h3>
                <div className="flex items-center text-sm text-muted-foreground gap-1 mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>{address}, {city}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-success/10 px-2 py-1 rounded">
                <Star className="h-4 w-4 fill-success text-success" />
                <span className="font-semibold text-success">
                  {rating !== null && rating !== undefined ? rating.toFixed(1) : "0.0"}
                </span>
                <span className="text-xs text-muted-foreground">({totalReviews})</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {specialties.slice(0, 3).map((specialty) => (
                <Badge key={specialty} variant="secondary" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {specialties.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{specialties.length - 3} more
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild className="flex-1">
                <Link to={`/hospital/${id}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to={`/hospital/${id}#doctors`}>Book Appointment</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};