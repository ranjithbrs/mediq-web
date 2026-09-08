import { Home, Calendar, Search, User, Shield, Stethoscope, Building2 } from "lucide-react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

export const BottomNavigation = () => {
  const { isAdmin, isDoctor, isHospital, loading } = useUserRole();

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    ...(isAdmin ? [{ to: "/admin", icon: Shield, label: "Admin" }] : []),
    ...(isDoctor ? [{ to: "/doctor-dashboard", icon: Stethoscope, label: "Queue" }] : []),
    ...(isHospital ? [{ to: "/hospital-dashboard", icon: Building2, label: "Hospital" }] : []),
    { to: "/appointments", icon: Calendar, label: "Appointments" },
    { to: "/search", icon: Search, label: "Search" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-primary/10 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center justify-around h-16 relative">
        {navItems.map((item) => (
          <RouterNavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-300 relative z-10",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-primary/70"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center -z-10">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl blur-md animate-pulse" />
                  </div>
                )}
                <item.icon className={cn("h-5 w-5 transition-transform", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", isActive ? "opacity-100" : "opacity-60")}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 h-1 w-1 bg-primary rounded-full shadow-[0_0_8px_v--primary]" />
                )}
              </>
            )}
          </RouterNavLink>
        ))}
      </div>
    </nav>
  );
};
