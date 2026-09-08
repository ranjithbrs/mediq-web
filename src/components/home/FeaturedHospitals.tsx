import { MapPin, Star, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useHospitals } from "@/hooks/useHospitals";
import { Link } from "react-router-dom";

export const FeaturedHospitals = () => {
  const { data: hospitals, isLoading } = useHospitals();

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Featured Hospitals</h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2].map((i) => (
            <div key={i} className="min-w-[260px]">
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!hospitals || hospitals.length === 0) return null;

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">Featured Hospitals</h2>
        <Link to="/search" className="text-sm font-medium text-primary hover:underline">
          View All
        </Link>
      </div>

      {/* Horizontal scroll list */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-0 scrollbar-hide">
        {hospitals.slice(0, 6).map((hospital) => (
          <Link
            key={hospital.id}
            to={`/hospital/${hospital.id}`}
            className="flex-none w-[260px] group"
          >
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 h-44 shadow-sm">
              {/* Image */}
              {hospital.images && hospital.images.length > 0 ? (
                <img
                  src={hospital.images[0]}
                  alt={hospital.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove("hidden");
                  }}
                />
              ) : null}

              {/* Fallback icon */}
              <div
                className={`w-full h-full flex items-center justify-center bg-gray-100 ${
                  hospital.images && hospital.images.length > 0 ? "hidden" : ""
                }`}
              >
                <Building2 className="h-14 w-14 text-gray-300" />
              </div>

              {/* Rating badge top-right */}
              {hospital.rating && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-white rounded-full px-2.5 py-1 shadow-md">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-gray-800">
                    {hospital.rating.toFixed(1)}
                  </span>
                </div>
              )}

              {/* Bottom gradient overlay with name & location */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-3">
                <h3 className="font-bold text-white text-sm line-clamp-1">{hospital.name}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-white/80" />
                  <span className="text-xs text-white/80 line-clamp-1">
                    {hospital.city}, {hospital.state}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};