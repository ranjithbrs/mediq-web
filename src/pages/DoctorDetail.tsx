import { useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { RatingStars } from "@/components/search/RatingStars";
import { useDoctorById } from "@/hooks/useDoctors";
import { useReviewsByDoctor } from "@/hooks/useReviews";
import {
  MapPin,
  GraduationCap,
  Calendar,
  Clock,
  IndianRupee,
  Star,
  ArrowLeft,
  Languages,
} from "lucide-react";

const DoctorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: doctorData, isLoading: doctorLoading } = useDoctorById(id);
  const { data: reviews = [], isLoading: reviewsLoading } = useReviewsByDoctor(id);

  const doctor = doctorData;
  const hospital = doctorData?.hospitals;
  const loading = doctorLoading || reviewsLoading;

  const statusConfig = useMemo(
    () => ({
      available: { label: "Available", color: "bg-success" },
      busy: { label: "Busy", color: "bg-warning" },
      offline: { label: "Offline", color: "bg-muted" },
    }),
    []
  );

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

  if (!doctor) {
    return (
      <MainLayout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">Doctor not found</p>
          <Button asChild className="mt-4">
            <Link to="/search">Back to Search</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const status =
    statusConfig[(doctor.availability_status ?? "offline") as keyof typeof statusConfig] ??
    statusConfig.offline;

  return (
    <MainLayout>
      <div className="container py-6 space-y-6">
        <Button asChild variant="ghost" className="gap-2">
          <Link to="/search">
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Doctor Profile Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="relative">
                    <img
                      src={doctor.photo || "/placeholder.svg"}
                      alt={doctor.name}
                      className="w-32 h-32 md:w-40 md:h-40 rounded-lg object-cover"
                    />
                    <div className={`absolute -bottom-2 -right-2 ${status.color} text-white text-sm px-3 py-1 rounded-full`}>
                      {status.label}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{doctor.name}</h1>
                      <p className="text-muted-foreground mb-2">{doctor.qualification}</p>
                      <Badge variant="secondary" className="text-base">
                        {doctor.specialization}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-warning text-warning" />
                        <span className="font-bold text-lg">{(doctor.rating ?? 0).toFixed(1)}</span>
                        <span className="text-muted-foreground">({doctor.total_reviews ?? 0} reviews)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{doctor.experience} years experience</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold text-primary">₹{doctor.consultation_fee}</span>
                      <span className="text-muted-foreground">consultation fee</span>
                    </div>

                    {hospital && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <Link to={`/hospital/${hospital.id}`} className="hover:underline">
                          {hospital.name}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{doctor.about}</p>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Education & Qualification</h3>
                  </div>
                  <p className="text-sm text-muted-foreground ml-7">{doctor.education}</p>
                </div>

                {doctor.languages && doctor.languages.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Languages className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Languages</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-7">
                      {doctor.languages.map((language: string) => (
                        <Badge key={language} variant="outline">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Patient Reviews</span>
                  <Badge variant="secondary">{reviews.length} reviews</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Average Rating Summary */}
                {reviews.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-primary">
                        {(doctor.rating ?? 0).toFixed(1)}
                      </div>
                      <RatingStars rating={doctor.rating ?? 0} size="md" />
                      <p className="text-sm text-muted-foreground mt-1">
                        Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                    <Separator orientation="vertical" className="hidden sm:block h-20" />
                    <div className="flex-1 space-y-2 w-full">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter((r) => r.rating === star).length;
                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-sm w-3">{star}</span>
                            <Star className="h-4 w-4 fill-warning text-warning" />
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-warning rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-8">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No reviews yet. Be the first to leave a review after your appointment!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review, index) => (
                      <div key={review.id}>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Star className="h-5 w-5 fill-primary text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <RatingStars rating={review.rating} size="sm" />
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            {review.review && (
                              <p className="text-sm text-foreground">{review.review}</p>
                            )}
                          </div>
                        </div>
                        {index < reviews.length - 1 && <Separator className="my-4" />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Booking */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Book Appointment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select a convenient time slot to book your appointment with {doctor.name}
                </p>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => navigate(`/booking?doctor=${id}`)}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Appointment
                </Button>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Consultation Fee</span>
                    <span className="font-semibold">₹{doctor.consultation_fee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={doctor.availability_status === 'available' ? 'default' : 'secondary'}>
                      {status.label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {hospital && (
              <Card>
                <CardHeader>
                  <CardTitle>Hospital Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{hospital.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {hospital.address}, {hospital.city}
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/hospital/${hospital.id}`}>View Hospital Details</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DoctorDetail;