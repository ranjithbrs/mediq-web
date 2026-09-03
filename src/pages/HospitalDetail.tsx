import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DoctorCard } from "@/components/search/DoctorCard";
import { RatingStars } from "@/components/search/RatingStars";
import { MapPin, Phone, Mail, Clock, Star, ArrowLeft } from "lucide-react";
import { useHospitalById } from "@/hooks/useHospitals";
import { useDoctorsByHospital } from "@/hooks/useDoctors";
import { useReviewsByHospital } from "@/hooks/useReviews";

const HospitalDetail = () => {
  const { id } = useParams();
  
  const { data: hospital, isLoading: hospitalLoading } = useHospitalById(id);
  const { data: doctors = [], isLoading: doctorsLoading } = useDoctorsByHospital(id);
  const { data: reviews = [], isLoading: reviewsLoading } = useReviewsByHospital(id);

  const loading = hospitalLoading || doctorsLoading || reviewsLoading;

  useEffect(() => {
    if (!loading && window.location.hash === "#doctors") {
      const element = document.getElementById("doctors");
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [loading]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container py-6 space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!hospital) {
    return (
      <MainLayout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">Hospital not found</p>
          <Button asChild className="mt-4">
            <Link to="/search">Back to Search</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-6 space-y-6">
        <Button asChild variant="ghost" className="gap-2">
          <Link to="/search">
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </Link>
        </Button>

        {/* Hospital Header */}
        <div className="relative rounded-lg overflow-hidden">
          <img
            src={(hospital.images && hospital.images[0]) || "/placeholder.svg"}
            alt={hospital.name}
            className="w-full h-64 md:h-96 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end">
            <div className="p-6 w-full">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{hospital.name}</h1>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-warning text-warning" />
                  <span className="font-bold text-lg">{hospital.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({hospital.total_reviews} reviews)</span>
                </div>
                <Badge variant="secondary">{hospital.status}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{hospital.description}</p>
                
                <div>
                  <h3 className="font-semibold mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {hospital.specialties.map((specialty: string) => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Facilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {hospital.facilities.map((facility: string) => (
                      <Badge key={facility} variant="outline">
                        {facility}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Doctors Section */}
            <Card id="doctors">
              <CardHeader>
                <CardTitle>Our Doctors ({doctors.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {doctors.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No doctors available at this hospital
                  </p>
                ) : (
                  doctors.map((doctor) => (
                    <DoctorCard
                      key={doctor.id}
                      id={doctor.id}
                      name={doctor.name}
                      photo={doctor.photo || "/placeholder.svg"}
                      specialization={doctor.specialization}
                      qualification={doctor.qualification}
                      experience={doctor.experience}
                      consultationFee={doctor.consultation_fee}
                      rating={doctor.rating}
                      totalReviews={doctor.total_reviews}
                      availabilityStatus={doctor.availability_status as "available" | "busy" | "offline"}
                      hospitalName={hospital.name}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <CardTitle>Patient Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No reviews yet
                  </p>
                ) : (
                  reviews.map((review, index) => (
                    <div key={review.id}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <RatingStars rating={review.rating} size="sm" />
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{review.review}</p>
                        </div>
                      </div>
                      {index < reviews.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {hospital.address}, {hospital.city}, {hospital.state} - {hospital.pincode}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{hospital.phone}</p>
                  </div>
                </div>

{/* Email removed for security - only shown to authenticated users if needed */}

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Hours</p>
                    <p className="text-sm text-muted-foreground">24/7 Emergency Services</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" size="lg" asChild>
              <a href="#doctors">Book Appointment</a>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default HospitalDetail;