import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleBasedRoute } from "@/components/auth/RoleBasedRoute";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/contexts/AuthContext";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Back button handler component
const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Configure status bar for immersive look
    const setupStatusBar = async () => {
  // StatusBar is only available on native Android/iOS
      if (!Capacitor.isNativePlatform()) return;

      try {
        await StatusBar.show();
        await StatusBar.setStyle({ style: Style.Default });
        await StatusBar.setBackgroundColor({ color: "#ffffff" });
        await StatusBar.setOverlaysWebView({ overlay: true });
      } catch (e) {
        console.warn("StatusBar setup failed:", e);
      }
    };

    setupStatusBar();
    const handler = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (location.pathname === '/') {
        // Exit app if on home page
        CapacitorApp.exitApp();
      } else {
        // Otherwise go back
        navigate(-1);
      }
    });

    // Handle deep links for payment redirects
    const urlHandler = CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      console.log('App opened with URL:', url);
      // The URL will be something like com.mediq.app://payment-success?...
      if (url.includes('payment-success')) {
        navigate('/appointments');
      } else if (url.includes('payment-failure')) {
        navigate('/payment');
      }
    });

    return () => {
      handler.then(h => h.remove());
      urlHandler.then(h => h.remove());
    };
  }, [location, navigate]);

  return null;
};


// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load non-critical pages for better performance
const Appointments = lazy(() => import("./pages/Appointments"));
const Search = lazy(() => import("./pages/Search"));
const Profile = lazy(() => import("./pages/Profile"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const Settings = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const HospitalDetail = lazy(() => import("./pages/HospitalDetail"));
const DoctorDetail = lazy(() => import("./pages/DoctorDetail"));
const Booking = lazy(() => import("./pages/Booking"));
const Payment = lazy(() => import("./pages/Payment"));
const PaymentHistory = lazy(() => import("./pages/PaymentHistory"));
const AppointmentDetail = lazy(() => import("./pages/AppointmentDetail"));
const Pharmacy = lazy(() => import("./pages/Pharmacy"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const HospitalDashboard = lazy(() => import("./pages/HospitalDashboard"));
const Emergency = lazy(() => import("./pages/Emergency"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <NotificationProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AuthProvider>
            <BackButtonHandler />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
                <Route path="/hospital/:id" element={<ProtectedRoute><HospitalDetail /></ProtectedRoute>} />
                <Route path="/doctor/:id" element={<ProtectedRoute><DoctorDetail /></ProtectedRoute>} />
                <Route path="/pharmacy" element={<ProtectedRoute><Pharmacy /></ProtectedRoute>} />
                <Route path="/emergency" element={<ProtectedRoute><Emergency /></ProtectedRoute>} />
                
                {/* Protected Routes */}
                <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
                <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
                <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                <Route path="/payment-history" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
                <Route path="/appointment/:id" element={<ProtectedRoute><AppointmentDetail /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                
                {/* Role-Based Routes */}
                <Route path="/admin" element={<RoleBasedRoute allowedRoles={["admin"]}><AdminDashboard /></RoleBasedRoute>} />
                <Route path="/doctor-dashboard" element={<RoleBasedRoute allowedRoles={["doctor"]}><DoctorDashboard /></RoleBasedRoute>} />
                <Route path="/hospital-dashboard" element={<RoleBasedRoute allowedRoles={["hospital"]}><HospitalDashboard /></RoleBasedRoute>} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </NotificationProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
