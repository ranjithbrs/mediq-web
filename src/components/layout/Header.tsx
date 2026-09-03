import { Bell, Menu, Siren } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

export const Header = () => {
  const { user } = useAuth();
  const { unreadCount } = useUnreadNotifications();

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-gray-100 -ml-2">
                <Menu className="h-5 w-5 text-gray-700" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-white">
              <nav className="flex flex-col gap-4 mt-8">
                <Link to="/settings" className="text-lg font-medium text-gray-800 hover:text-primary transition-colors">
                  Settings
                </Link>
                <Link to="/settings" className="text-lg font-medium text-gray-800 hover:text-primary transition-colors">
                  Help & Support
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold text-lg shadow-sm">
              M
            </div>
            <span className="text-xl font-black text-primary tracking-tight">MediQ</span>
          </Link>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-1">
          {user ? (
            <>
              {/* Emergency */}
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:bg-red-50 active:scale-90 transition-all"
                asChild
              >
                <Link to="/emergency">
                  <Siren className="h-5 w-5" />
                </Link>
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-gray-100"
                asChild
              >
                <Link to="/notifications">
                  <Bell className="h-5 w-5 text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </Link>
              </Button>

              {/* Avatar */}
              <Link to="/profile" className="ml-1">
                <Avatar className="h-9 w-9 cursor-pointer border-2 border-primary shadow-sm">
                  <AvatarImage src={user.user_metadata?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary text-white font-bold text-sm">
                    {user.user_metadata?.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <Button asChild size="sm" className="bg-primary text-white">
              <Link to="/auth">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
