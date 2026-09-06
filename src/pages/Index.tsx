import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { QuickActions } from "@/components/home/QuickActions";
import { SearchBar } from "@/components/home/SearchBar";
import { CategoryCards } from "@/components/home/CategoryCards";
import { FeaturedHospitals } from "@/components/home/FeaturedHospitals";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Stethoscope, CalendarCheck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getTodayLocalDateString, formatDisplayDate } from "@/utils/dateUtils";

// Hook to fetch the authenticated user's profile name from the profiles table
const useProfileName = (userId: string | undefined) => {
  const { data } = useQuery({
    queryKey: ["profile-name", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .maybeSingle();
      return data?.full_name ?? null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  return data;
};

const PatientFollowUp = ({ userId }: { userId: string }) => {
  const { data: nextFollowUp } = useQuery({
    queryKey: ["patient-followup", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("follow_up_date, doctors:doctors(name)")
        .eq("user_id", userId)
        .not("follow_up_date", "is", null)
        .gte("follow_up_date", getTodayLocalDateString())
        .order("follow_up_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  if (!nextFollowUp) return null;

  return (
    <Card className="mx-4 mb-4 border-primary/20 bg-primary/5">
      <CardContent className="pt-4 pb-4 flex items-center gap-3">
        <CalendarCheck className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-medium">Next Follow-up Visit</p>
          <p className="text-xs text-muted-foreground">
            Dr. {(nextFollowUp.doctors as any)?.name} �{" "}
            {formatDisplayDate(nextFollowUp.follow_up_date!)}
          </p>
        </div>
        <Badge variant="outline">Upcoming</Badge>
      </CardContent>
    </Card>
  );
};

const Index = () => {
  useProfileCompletion();
  const { isAdmin, isDoctor, isHospital, user, loading } = useUserRole();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  // Always call hooks unconditionally (Rules of Hooks)
  const profileName = useProfileName(authUser?.id);

  useEffect(() => {
    if (!loading) {
      if (isHospital) {
        navigate("/hospital-dashboard", { replace: true });
      } else if (isDoctor) {
        navigate("/doctor-dashboard", { replace: true });
      }
    }
  }, [isDoctor, isHospital, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // Prefer profiles.full_name (user-editable), fallback to auth metadata, then "there"
  const rawDisplayName =
    profileName ||
    authUser?.user_metadata?.full_name ||
    "there";
  const nameMatch = rawDisplayName.match(/^[\p{L}\s.'-]+/u);
  const displayName = nameMatch ? nameMatch[0].trim() : rawDisplayName.trim();

  return (
    <MainLayout>
      <div className="bg-white min-h-screen max-w-7xl mx-auto">
        {/* Purple gradient greeting banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
          }}
          className="px-5 pt-5 pb-10 rounded-b-3xl"
        >
          <p className="text-white/80 text-sm font-medium">
            {greeting},
          </p>
          <h1 className="text-white text-2xl font-bold">{displayName}</h1>
          <p className="text-white/70 text-xs mt-1">
            Find doctors & hospitals near you
          </p>
        </div>

        {/* SearchBar overlapping the banner */}
        <div className="-mt-6 px-4 mb-2">
          <SearchBar />
        </div>

        {/* Role-based quick access */}
        {!loading && (isAdmin || isDoctor) && (
          <div className="flex gap-2 px-4 pt-2 pb-1">
            {isAdmin && (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-semibold"
              >
                <Shield className="h-4 w-4" /> Admin Dashboard
              </button>
            )}
            {isDoctor && (
              <button
                onClick={() => navigate("/doctor-dashboard")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-semibold"
              >
                <Stethoscope className="h-4 w-4" /> My Queue
              </button>
            )}
          </div>
        )}

        {/* Patient follow-up reminder */}
        {user && <PatientFollowUp userId={user.id} />}

        <QuickActions />
        <FeaturedHospitals />
        <CategoryCards />
      </div>
    </MainLayout>
  );
};

export default Index;
