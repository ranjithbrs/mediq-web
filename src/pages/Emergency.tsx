import { useState, useEffect, useCallback, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertTriangle, MapPin, Phone, Navigation, Loader2, CheckCircle2, Siren, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { EmergencyMap } from "@/components/emergency/EmergencyMap";
import { Geolocation } from "@capacitor/geolocation";

interface NearbyHospital {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  distance: number;
  latitude: number | null;
  longitude: number | null;
  type?: 'hospital' | 'pharmacy' | 'clinic';
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const Emergency = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [dbHospitals, setDbHospitals] = useState<NearbyHospital[]>([]);
  const [osmHospitals, setOsmHospitals] = useState<NearbyHospital[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [searchingManual, setSearchingManual] = useState(false);
  const [manualSearchUsed, setManualSearchUsed] = useState(false);

  const manualQueryRef = useRef(manualQuery);
  const manualSearchUsedRef = useRef(manualSearchUsed);

  useEffect(() => {
    manualQueryRef.current = manualQuery;
  }, [manualQuery]);

  useEffect(() => {
    manualSearchUsedRef.current = manualSearchUsed;
  }, [manualSearchUsed]);

  const searchByPincodeOrCity = async () => {
    const query = manualQuery.trim();
    if (!query) return;
    setSearchingManual(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const { lat, lon } = results[0];
        setLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
        setManualSearchUsed(true);
        toast({ title: "Location Found", description: `Using location for "${results[0].display_name.split(",")[0]}"` });
      } else {
        toast({ title: "Not Found", description: "Could not find that location. Try a different pincode or city name.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to search location. Check your internet connection.", variant: "destructive" });
    }
    setSearchingManual(false);
  };

  const getLocation = useCallback(async () => {
    setLocating(true);
    try {
      // First check permissions
      const permissions = await Geolocation.checkPermissions();
      if (permissions.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          throw new Error("Location permission denied");
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      if (manualSearchUsedRef.current || manualQueryRef.current.trim()) {
        console.log("Background location fetch ignored: user manually searched or is typing.");
        return;
      }

      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    } catch (error) {
      console.error("Location error:", error);
      
      // Fallback to web geolocation if capacitor fails
      try {
        if (!navigator.geolocation) throw new Error("No web geolocation");
        const pos: any = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 });
        });

        if (manualSearchUsedRef.current || manualQueryRef.current.trim()) return;

        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch (fallbackError) {
        console.error("Web location error:", fallbackError);

        // Fallback to IP geolocation if both web and capacitor geolocation fail
        try {
          if (manualSearchUsedRef.current || manualQueryRef.current.trim()) return;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
          clearTimeout(timeoutId);

          const ipData = await res.json();

          if (manualSearchUsedRef.current || manualQueryRef.current.trim()) return;

          if (ipData.latitude && ipData.longitude) {
            setLocation({ lat: ipData.latitude, lng: ipData.longitude });
            setManualSearchUsed(true);
            toast({
              title: "Approximate Location",
              description: "Using your approximate location based on your network. Results may not be exact."
            });
            return;
          }
          throw new Error("Invalid IP location response data");
        } catch (ipError) {
          console.error("IP location fallback failed:", ipError);
          
          if (manualSearchUsedRef.current || manualQueryRef.current.trim()) return;

          toast({ 
            title: "Location Error", 
            description: "Location unavailable. Please enter a city or pincode manually.", 
            variant: "destructive" 
          });
        }
      }
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // Fetch from DB on mount
  useEffect(() => {
    const fetchDBHospitals = async () => {
      setLoadingHospitals(true);
      const { data, error } = await supabase.rpc("search_hospitals", { limit_count: 50 });
      if (error) {
        toast({ title: "Error", description: "Failed to load hospitals from database.", variant: "destructive" });
      } else {
        setDbHospitals((data || []).map((h: any) => ({ ...h, distance: 0 })));
      }
      setLoadingHospitals(false);
    };
    fetchDBHospitals();
  }, []);

  // Fetch from OSM when location is found
  useEffect(() => {
    if (!location) return;
    const fetchOSMHospitals = async () => {
      setLoadingHospitals(true);
      const query = `
        [out:json];
        (
          node["amenity"="hospital"](around:10000,${location.lat},${location.lng});
          node["amenity"="clinic"](around:10000,${location.lat},${location.lng});
          node["amenity"="pharmacy"](around:10000,${location.lat},${location.lng});
        );
        out body;
      `;
      try {
        const res = await fetch(`https://overpass-api.de/api/interpreter`, {
          method: "POST",
          body: query
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
          type: el.tags.amenity as any
        }));
        setOsmHospitals(formatted);
      } catch (e) {
        console.error("OSM fetch error:", e);
      }
      setLoadingHospitals(false);
    };
    fetchOSMHospitals();
  }, [location?.lat, location?.lng]);

  // Combine and sort hospitals
  useEffect(() => {
    let allHospitals = [...dbHospitals, ...osmHospitals];
    
    if (location) {
      allHospitals = allHospitals.map(h => ({
        ...h,
        distance: h.latitude && h.longitude
          ? getDistanceKm(location.lat, location.lng, Number(h.latitude), Number(h.longitude))
          : 0,
      }));
      allHospitals.sort((a, b) => a.distance - b.distance);
    }
    setHospitals(allHospitals);
  }, [dbHospitals, osmHospitals, location?.lat, location?.lng]);

  // Auto-select nearest hospital
  useEffect(() => {
    if (hospitals.length > 0 && !selectedHospital) {
      setSelectedHospital(hospitals[0].id);
    }
  }, [hospitals, selectedHospital]);

  const sendAlert = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!selectedHospital || !location) return;
    setSending(true);
    const { error } = await supabase.from("emergency_alerts").insert({
      user_id: user.id,
      hospital_id: selectedHospital,
      latitude: location.lat,
      longitude: location.lng,
      message: message || "Emergency assistance needed",
      status: "pending",
    });
    if (error) {
      toast({ title: "Error", description: "Failed to send emergency alert.", variant: "destructive" });
    } else {
      setAlertSent(true);
      toast({ title: "Alert Sent!", description: "The hospital has been notified of your emergency." });
    }
    setSending(false);
  };

  if (alertSent) {
    const hospital = hospitals.find((h) => h.id === selectedHospital);
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-accent" />
          </div>
          <h1 className="text-2xl font-bold">Emergency Alert Sent</h1>
          <p className="text-muted-foreground">
            <strong>{hospital?.name}</strong> has been notified. They are preparing for your arrival.
          </p>
          {hospital?.phone && (
            <Button asChild variant="outline" className="gap-2">
              <a href={`tel:${hospital.phone}`}>
                <Phone className="h-4 w-4" /> Call Hospital: {hospital.phone}
              </a>
            </Button>
          )}
          <Button onClick={() => { setAlertSent(false); setSelectedHospital(null); setMessage(""); }}>
            Send Another Alert
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
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

        {/* Location Status */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            {locating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-destructive" />
                <span className="text-sm font-medium">Finding your location...</span>
              </>
            ) : location ? (
              <>
                <MapPin className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium">
                  Location detected: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </span>
                <Button variant="ghost" size="sm" onClick={getLocation} className="ml-auto text-xs">
                  <Navigation className="h-3 w-3 mr-1" /> Refresh
                </Button>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-warning" />
                <span className="text-sm">Location unavailable</span>
                <Button size="sm" variant="outline" onClick={getLocation} className="ml-auto">
                  Enable GPS
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Manual Location Search */}
        {!location || manualSearchUsed ? (
          <Card>
            <CardContent className="pt-4 pb-4 space-y-3">
              <p className="text-sm font-medium">
                {!location ? "Or enter your pincode/city to find hospitals:" : "Search a different location:"}
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
              {manualSearchUsed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setManualSearchUsed(false); getLocation(); }}
                  disabled={locating}
                  className="w-full gap-2"
                >
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                  Use my GPS
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Map */}
        <EmergencyMap
          userLocation={location}
          hospitals={hospitals}
          selectedHospitalId={selectedHospital}
          onSelectHospital={setSelectedHospital}
        />

        {/* Message */}
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
          <h2 className="text-lg font-semibold mb-3">
            {location ? "Nearby Hospitals & Medicals" : "All Hospitals & Medicals"}
          </h2>
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
              {hospitals.slice(0, 10).map((hospital) => (
                <Card
                  key={hospital.id}
                  className={`cursor-pointer transition-all ${
                    selectedHospital === hospital.id
                      ? "ring-2 ring-destructive border-destructive"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedHospital(hospital.id)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{hospital.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {hospital.address}, {hospital.city}
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

        {/* Send Alert Button */}
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] z-10">
          <Button
            size="lg"
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2 h-14 text-lg font-bold shadow-lg"
            disabled={!selectedHospital || !location || sending}
            onClick={sendAlert}
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Siren className="h-5 w-5" />
            )}
            {sending ? "Sending Alert..." : "Send Emergency Alert"}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Emergency;
