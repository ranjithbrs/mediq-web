import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchFilters } from "@/components/search/SearchFilters";
import { HospitalCard } from "@/components/search/HospitalCard";
import { DoctorCard } from "@/components/search/DoctorCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "react-router-dom";
import { useHospitals } from "@/hooks/useHospitals";
import { useDoctors } from "@/hooks/useDoctors";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const specialtyParam = searchParams.get("specialty");
  const queryParam = searchParams.get("q");
  
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    specialtyParam ? [specialtyParam] : []
  );
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("rating");
  const [searchQuery, setSearchQuery] = useState(queryParam || "");
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search query to prevent duplicate network calls on every key press
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync search query from URL params
  useEffect(() => {
    if (queryParam !== null) {
      setSearchQuery(queryParam);
      setDebouncedQuery(queryParam);
    }
  }, [queryParam]);

  // Sync specialty param from URL
  useEffect(() => {
    setSelectedSpecialties(specialtyParam ? [specialtyParam] : []);
  }, [specialtyParam]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setDebouncedQuery(query);
    setSearchParams((prev) => {
      if (query) {
        prev.set("q", query);
      } else {
        prev.delete("q");
      }
      return prev;
    });
  };

  const { data: hospitals = [], isLoading: hospitalsLoading } = useHospitals({
    searchText: debouncedQuery,
    city: selectedCities[0],
    specialty: selectedSpecialties[0],
  });

  const { data: doctors = [], isLoading: doctorsLoading } = useDoctors({
    searchText: debouncedQuery,
    specialization: selectedSpecialties[0],
  });

  // Query all hospital names to resolve doctor.hospital_id to hospital name in results
  const { data: allHospitals = [] } = useQuery({
    queryKey: ["all-hospitals-names"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospitals")
        .select("id, name");
      if (error) throw error;
      return data;
    }
  });

  const hospitalMap = useMemo(() => {
    return new Map(allHospitals.map((h) => [h.id, h.name]));
  }, [allHospitals]);

  const loading = hospitalsLoading || doctorsLoading;

  // Make filters behave as single-select since RPC filters only handle single values
  const handleSpecialtyToggle = (specialty: string) => {
    setSelectedSpecialties((prev) => {
      const isAlreadySelected = prev.includes(specialty);
      const newSpecialties = isAlreadySelected ? [] : [specialty];
      
      setSearchParams((prevParams) => {
        if (newSpecialties.length > 0) {
          prevParams.set("specialty", newSpecialties[0]);
        } else {
          prevParams.delete("specialty");
        }
        return prevParams;
      });

      return newSpecialties;
    });
  };

  const handleCityToggle = (city: string) => {
    setSelectedCities((prev) => {
      const isAlreadySelected = prev.includes(city);
      return isAlreadySelected ? [] : [city];
    });
  };

  const handleClearFilters = () => {
    setSelectedSpecialties([]);
    setSelectedCities([]);
    setSearchParams((prevParams) => {
      prevParams.delete("specialty");
      return prevParams;
    });
  };

  // Perform sorting in frontend
  const sortedHospitals = useMemo(() => {
    const list = [...hospitals];
    if (sortBy === "rating") {
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "name") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [hospitals, sortBy]);

  const sortedDoctors = useMemo(() => {
    const list = [...doctors];
    if (sortBy === "rating") {
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "name") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [doctors, sortBy]);

  return (
    <MainLayout>
      <div className="container py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Search Hospitals & Doctors</h1>
          <p className="text-muted-foreground">Find the best healthcare providers near you</p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }} className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctors, hospitals, or specialties"
              className="pl-10 h-12"
            />
          </form>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <SearchFilters
            selectedSpecialties={selectedSpecialties}
            selectedCities={selectedCities}
            onSpecialtyToggle={handleSpecialtyToggle}
            onCityToggle={handleCityToggle}
            onClearFilters={handleClearFilters}
          />

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="hospitals" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hospitals">Hospitals ({sortedHospitals.length})</TabsTrigger>
            <TabsTrigger value="doctors">Doctors ({sortedDoctors.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="hospitals" className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))
            ) : sortedHospitals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No hospitals found matching your criteria</p>
              </div>
            ) : (
              sortedHospitals.map((hospital) => (
                <HospitalCard
                  key={hospital.id}
                  id={hospital.id}
                  name={hospital.name}
                  address={hospital.address}
                  city={hospital.city}
                  specialties={hospital.specialties || []}
                  rating={hospital.rating}
                  totalReviews={hospital.total_reviews || 0}
                  image={(hospital.images && hospital.images[0]) || "/placeholder.svg"}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="doctors" className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))
            ) : sortedDoctors.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No doctors found matching your criteria</p>
              </div>
            ) : (
              sortedDoctors.map((doctor) => (
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
                  totalReviews={doctor.total_reviews || 0}
                  availabilityStatus={doctor.availability_status as "available" | "busy" | "offline"}
                  hospitalName={hospitalMap.get(doctor.hospital_id)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Search;
