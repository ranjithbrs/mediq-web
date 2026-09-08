import { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  MapPin,
  Phone,
  Navigation,
  Loader2,
  CheckCircle2,
  Siren,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { EmergencyMap } from "@/components/emergency/EmergencyMap";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NearbyHospital {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  distance: number;
  latitude: number | null;
  longitude: number | null;
  type?: "hospital" | "pharmacy" | "clinic";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Component ────────────────────────────────────────────────────────────────

const Emergency = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Location state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Hospital data
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [dbHospitals, setDbHospitals] = useState<NearbyHospital[]>([]);
  const [osmHospitals, setOsmHospitals] = useState<NearbyHospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);
  const [selectCount, setSelectCount] = useState(0);

  const mapSectionRef = useRef<HTMLDivElement>(null);

  const handleSelectHospital = useCallback((id: string | null) => {
    setSelectedHospital(id);
    setSelectCount((prev) => prev + 1);
  }, []);

  const handleHospitalCardClick = (id: string) => {
    handleSelectHospital(id);
    const el = mapSectionRef.current || document.getElementById("emergency-map-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Alert
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<"success" | "failed" | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  const isOsmHospital = Boolean(selectedHospital && selectedHospital.startsWith("osm-"));

  // Manual search
  const [manualQuery, setManualQuery] = useState("");
  const [searchingManual, setSearchingManual] = useState(false);

  const manualSearchActiveRef = useRef(false);

  // ── Location acquisition ──────────────────────────────────────────────────

  const getLocation = useCallback(async () => {
    if (manualSearchActiveRef.current) return;
    setLocating(true);
    setLocationError(null);

    // Native Capacitor platform flow (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      try {
        const { Geolocation } = await import("@capacitor/geolocation");
        const permStatus = await Geolocation.checkPermissions();
        if (permStatus.location !== "granted") {
          const reqStatus = await Geolocation.requestPermissions();
          if (reqStatus.location !== "granted") {
            if (manualSearchActiveRef.current) return;
            setLocationError("Location permission denied on device.");
            setLocating(false);
            return;
          }
        }
        const capPos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
        if (manualSearchActiveRef.current) return;
        setLocation({ lat: capPos.coords.latitude, lng: capPos.coords.longitude });
        setLocationLabel(null);
        setLocationError(null);
        setLocating(false);
      } catch (err: any) {
        if (manualSearchActiveRef.current) return;
        const errMsg = err?.message || "Unable to acquire location fix on device.";
        setLocationError(errMsg);
        setLocating(false);
      }
      return;
    }

    // Web platform flow
    if (typeof window !== "undefined" && window.isSecureContext === false) {
      setLocationError(
        "Precise location requires HTTPS. Please open MediQ using a secure HTTPS connection."
      );
      setLocating(false);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (manualSearchActiveRef.current) return;
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationLabel(null);
          setLocationError(null);
          setLocating(false);
        },
        (gpsErr) => {
          if (manualSearchActiveRef.current) return;
          let errMsg = gpsErr.message || "Unable to acquire location fix.";
          if (gpsErr.code === 1) {
            errMsg = "Location permission denied. Please allow location access in your browser settings.";
          }
          setLocationError(errMsg);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
      setLocating(false);
    }
  }, []);

  const searchByPincodeOrCity = async () => {
    const query = manualQuery.trim();
    if (!query) return;
    setSearchingManual(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=1&countrycodes=in`
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const { lat, lon } = results[0];
        const label = results[0].display_name.split(",")[0];

        manualSearchActiveRef.current = true;
        setLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
        setLocationLabel(label);
        setLocationError(null);
        toast({
          title: "Location Found",
          description: `Using location for "${label}"`,
        });
      } else {
        toast({
          title: "Not Found",
          description: "Could not find that location. Try a different pincode or city name.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to search location. Check your internet connection.",
        variant: "destructive",
      });
    }
    setSearchingManual(false);
  };

  const resetToGPS = () => {
    manualSearchActiveRef.current = false;
    lastOsmCoordsRef.current = null;
    setLocation(null);
    setLocationLabel(null);
    setManualQuery("");
    setLocationError(null);
    getLocation();
  };

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // ── DB hospitals ──────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchDBHospitals = async () => {
      setLoadingHospitals(true);
      const { data, error } = await supabase.rpc("search_hospitals", {
        limit_count: 50,
      });
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load hospitals from database.",
          variant: "destructive",
        });
      } else {
        setDbHospitals(
          (data || []).map((h: any) => ({ ...h, distance: 0 }))
        );
      }
      setLoadingHospitals(false);
    };
    fetchDBHospitals();
  }, []);

  const lastOsmCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!location) return;
    const { lat, lng } = location;

    // Avoid refetching Overpass API if user hasn't moved more than 1 km
    if (lastOsmCoordsRef.current) {
      const movedKm = getDistanceKm(
        lastOsmCoordsRef.current.lat,
        lastOsmCoordsRef.current.lng,
        lat,
        lng
      );
      if (movedKm < 1) return;
    }
    lastOsmCoordsRef.current = { lat, lng };

    const fetchOSMHospitals = async () => {
      setLoadingHospitals(true);
      const query = `
        [out:json];
        (
          node["amenity"="hospital"](around:10000,${lat},${lng});
          node["amenity"="clinic"](around:10000,${lat},${lng});
          node["amenity"="pharmacy"](around:10000,${lat},${lng});
        );
        out body;
      `;
      try {
        const res = await fetch(`https://overpass-api.de/api/interpreter`, {
          method: "POST",
          body: query,
        });
        const data = await res.json();
        const formatted = (data.elements || []).map((el: any) => ({
          id: `osm-${el.id}`,
          name: el.tags.name || el.tags.amenity || "Medical Center",
          address: el.tags["addr:street"] || "",
          city: el.tags["addr:city"] || "",
          phone: el.tags.phone || "",
          latitude: Number(el.lat),
          longitude: Number(el.lon),
          distance: 0,
          type: el.tags.amenity as any,
        }));
        setOsmHospitals(formatted);
      } catch (e) {
        console.error("[Emergency] OSM fetch error:", e);
      }
      setLoadingHospitals(false);
    };
    fetchOSMHospitals();
  }, [location?.lat, location?.lng]);

  // ── Combine & sort by distance ─────────────────────────────────────────────

  useEffect(() => {
    let allHospitals = [...dbHospitals, ...osmHospitals];
    if (location) {
      allHospitals = allHospitals.map((h) => ({
        ...h,
        distance:
          h.latitude && h.longitude
            ? getDistanceKm(
                location.lat,
                location.lng,
                Number(h.latitude),
                Number(h.longitude)
              )
            : 0,
      }));
      allHospitals.sort((a, b) => a.distance - b.distance);
    }
    setHospitals(allHospitals);
  }, [dbHospitals, osmHospitals, location?.lat, location?.lng]);


  // ── Send alert ─────────────────────────────────────────────────────────────

  const sendAlert = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!selectedHospital || !location) return;

    if (isOsmHospital) {
      toast({
        title: "Cannot Send Alert",
        description: "Emergency alerts can only be sent to registered MediQ partner hospitals. Please call this medical center directly.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    setNotificationStatus(null);
    setNotificationError(null);

    // 1. Insert alert record into database
    const { data: newAlert, error: insertError } = await supabase
      .from("emergency_alerts")
      .insert({
        user_id: user.id,
        hospital_id: selectedHospital,
        latitude: location.lat,
        longitude: location.lng,
        message: message || "Emergency assistance needed",
        status: "pending",
        email_status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !newAlert) {
      console.error("[Emergency] Insert alert error:", insertError);
      toast({
        title: "Error",
        description: "Failed to send emergency alert.",
        variant: "destructive",
      });
      setSending(false);
      return;
    }

    // 2. Invoke Edge Function to securely dispatch email notification to the hospital
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        "send-emergency-alert",
        {
          body: { emergency_alert_id: newAlert.id },
        }
      );

      if (fnError || (fnData && !fnData.success)) {
        const errorMsg =
          fnData?.error || fnError?.message || "Hospital email delivery failed";
        console.warn("[Emergency] Notification dispatch warning:", errorMsg);
        setNotificationStatus("failed");
        setNotificationError(errorMsg);
        setAlertSent(true);
        toast({
          title: "Alert Saved (Notification Warning)",
          description: `Emergency alert saved, but hospital email notification could not be delivered: ${errorMsg}. Please call the hospital immediately.`,
          variant: "destructive",
        });
      } else {
        setNotificationStatus("success");
        setNotificationError(null);
        setAlertSent(true);
        toast({
          title: "Alert Sent!",
          description: "The hospital has been notified of your emergency via email.",
        });
      }
    } catch (err: any) {
      console.error("[Emergency] Edge Function invoke error:", err);
      const errorMsg = err?.message || "Could not dispatch email notification";
      setNotificationStatus("failed");
      setNotificationError(errorMsg);
      setAlertSent(true);
      toast({
        title: "Alert Saved (Notification Warning)",
        description: `Emergency alert saved, but hospital email notification failed: ${errorMsg}. Please call the hospital immediately.`,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // ── Alert sent screen ──────────────────────────────────────────────────────

  if (alertSent) {
    const hospital = hospitals.find((h) => h.id === selectedHospital);
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-accent" />
          </div>
          <h1 className="text-2xl font-bold">Emergency Alert Saved</h1>

          {notificationStatus === "success" ? (
            <p className="text-muted-foreground">
              <strong>{hospital?.name}</strong> has been notified via emergency email. They are preparing for your arrival.
            </p>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-900 dark:text-amber-200 text-left space-y-2">
              <p className="font-semibold">⚠️ Hospital Email Notification Warning</p>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Your emergency alert record was created in the system, but the hospital email notification could not be confirmed ({notificationError || "provider unavailable"}).
              </p>
              <p className="text-xs font-semibold">
                Please call the hospital directly using the button below to confirm immediate readiness.
              </p>
            </div>
          )}

          {hospital?.phone && (
            <Button asChild variant="outline" className="gap-2 w-full sm:w-auto">
              <a href={`tel:${hospital.phone}`}>
                <Phone className="h-4 w-4" /> Call Hospital: {hospital.phone}
              </a>
            </Button>
          )}
          <Button
            onClick={() => {
              setAlertSent(false);
              setSelectedHospital(null);
              setMessage("");
              setNotificationStatus(null);
              setNotificationError(null);
            }}
          >
            Send Another Alert
          </Button>
        </div>
      </MainLayout>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto w-full px-4 pt-6 pb-44 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Siren className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Emergency Assist</h1>
            <p className="text-sm text-muted-foreground">Get help from the nearest hospital instantly</p>
          </div>
        </div>

        {/* Location Status Card */}
        <Card className={`border ${location ? "border-green-500/40 bg-green-50/50 dark:bg-green-950/20" : "border-border"}`}>
          <CardContent className="pt-4 pb-4 space-y-2">
            {locating ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium">Acquiring location…</span>
              </div>
            ) : location ? (
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-semibold">
                  {locationLabel ? `Location: ${locationLabel}` : "Location acquired"}
                </span>
                <Button variant="ghost" size="sm" onClick={getLocation} className="ml-auto text-xs">
                  <Navigation className="h-3 w-3 mr-1" /> Refresh
                </Button>
              </div>
            ) : locationError ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-destructive">Location Access Failed</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{locationError}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={getLocation} disabled={locating} className="gap-2 w-full">
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  Retry GPS
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Waiting for location…</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual location search */}
        {(!location || locationLabel) && (
          <Card>
            <CardContent className="pt-4 pb-4 space-y-3">
              <p className="text-sm font-medium">
                {locationLabel ? "Search a different location:" : "Enter your city or pincode:"}
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter pincode or city name..."
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchByPincodeOrCity()}
                />
                <Button
                  size="sm"
                  onClick={searchByPincodeOrCity}
                  disabled={searchingManual || !manualQuery.trim()}
                  className="shrink-0"
                >
                  {searchingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
              {locationLabel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToGPS}
                  disabled={locating}
                  className="w-full gap-2"
                >
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  Use my GPS location
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Map */}
        <div ref={mapSectionRef} id="emergency-map-section" className="scroll-mt-4">
          <EmergencyMap
            userLocation={location}
            hospitals={hospitals}
            selectedHospitalId={selectedHospital}
            onSelectHospital={handleSelectHospital}
            selectCount={selectCount}
          />
        </div>

        {/* Emergency Details */}
        <div>
          <label className="text-sm font-medium mb-2 block">Emergency Details (optional)</label>
          <Textarea
            placeholder="Describe your emergency situation..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
          />
        </div>

        {/* Nearby Hospitals */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold">
              {location ? "Nearby Hospitals & Medicals" : "All Hospitals & Medicals"}
            </h2>
            {selectedHospital && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground gap-1 h-7 px-2"
                onClick={() => handleSelectHospital(null)}
              >
                ✕ Clear selection
              </Button>
            )}
          </div>
          {loadingHospitals ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : hospitals.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hospitals found. Please try again later.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {hospitals.map((hospital) => (
                <Card
                  key={hospital.id}
                  className={`cursor-pointer transition-all ${
                    selectedHospital === hospital.id
                      ? "ring-2 ring-destructive border-destructive"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => handleHospitalCardClick(hospital.id)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{hospital.name}</h3>
                          {hospital.id.startsWith("osm-") ? (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground py-0 h-4">
                              Map Facility
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30 py-0 h-4">
                              MediQ Partner
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {hospital.address}{hospital.city ? `, ${hospital.city}` : ""}
                        </p>
                        {hospital.phone && (
                          <a
                            href={`tel:${hospital.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm text-primary flex items-center gap-1 mt-1 hover:underline"
                          >
                            <Phone className="h-3 w-3" /> {hospital.phone}
                          </a>
                        )}
                      </div>
                      {location && hospital.distance > 0 && (
                        <Badge variant="secondary" className="shrink-0 ml-3">
                          {hospital.distance.toFixed(1)} km
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Fixed Send Alert Button CTA */}
        <div className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 z-40 p-4 md:pb-[calc(1rem+env(safe-area-inset-bottom))] bg-background/80 backdrop-blur-md border-t border-border/40">
          <div className="max-w-2xl mx-auto w-full">
            {isOsmHospital && (
              <p className="text-xs text-center text-amber-600 dark:text-amber-400 mb-2 font-medium">
                Emergency alerts can only be sent to registered MediQ partner hospitals. Please call this facility directly.
              </p>
            )}
            <Button
              size="lg"
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 h-14 text-lg font-bold shadow-lg disabled:opacity-50"
              disabled={!selectedHospital || isOsmHospital || !location || sending}
              onClick={sendAlert}
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Siren className="h-5 w-5" />
              )}
              {sending
                ? "Sending Alert..."
                : isOsmHospital
                ? "Alert Unavailable for External Facility"
                : "Send Emergency Alert"}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Emergency;
