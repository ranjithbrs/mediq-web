import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons for Leaflet + bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createColorIcon = (color: string, letter?: string) => {
  return L.divIcon({
    html: `<svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 2C9.82 2 4 7.82 4 15C4 25.5 17 42 17 42C17 42 30 25.5 30 15C30 7.82 24.18 2 17 2Z" fill="${color}" stroke="white" stroke-width="2.5"/>
            ${letter
              ? `<text x="17" y="19" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="11" font-family="Arial,sans-serif" font-weight="bold">${letter}</text>`
              : `<circle cx="17" cy="15" r="5" fill="white"/>`}
          </svg>`,
    className: "custom-marker-icon",
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -44],
  });
};

// User location icon — pulsing blue circle style
const createUserIcon = () =>
  L.divIcon({
    html: `<div style="
      width: 20px; height: 20px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(59,130,246,0.35);
    "></div>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -14],
  });

const hospitalIcon = createColorIcon("#ef4444", "H");
const pharmacyIcon = createColorIcon("#22c55e", "P");

interface Hospital {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  distance: number;
  phone?: string;
  type?: "hospital" | "pharmacy" | "clinic";
}

interface EmergencyMapProps {
  userLocation: { lat: number; lng: number } | null;
  hospitals: Hospital[];
  selectedHospitalId: string | null;
  onSelectHospital: (id: string | null) => void;
  selectCount?: number;
}

export const EmergencyMap = ({
  userLocation,
  hospitals,
  selectedHospitalId,
  onSelectHospital,
  selectCount = 0,
}: EmergencyMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const routeLayerRef = useRef<L.GeoJSON | null>(null);
  const isProgrammaticOpenRef = useRef(false);
  const onSelectHospitalRef = useRef(onSelectHospital);
  const selectedHospitalIdRef = useRef<string | null>(selectedHospitalId);

  // Keep callback and selection refs fresh for map event handlers
  useEffect(() => {
    onSelectHospitalRef.current = onSelectHospital;
  }, [onSelectHospital]);

  useEffect(() => {
    selectedHospitalIdRef.current = selectedHospitalId;
  }, [selectedHospitalId]);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Default center = India (only used if location never arrives)
    const map = L.map(containerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 4,
      scrollWheelZoom: false,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Listen to popupclose: clear selected hospital in parent state when user closes popup
    map.on("popupclose", (e) => {
      if (isProgrammaticOpenRef.current) return;
      const currentSelectedId = selectedHospitalIdRef.current;
      if (currentSelectedId) {
        const marker = markersRef.current.get(currentSelectedId);
        if (marker && e.popup === marker.getPopup()) {
          onSelectHospitalRef.current(null);
        }
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      userMarkerRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    const { lat, lng } = userLocation;
    map.setView([lat, lng], 14, { animate: true });

    const userIcon = createUserIcon();
    const popupText = `<div style="font-size:12px"><strong>📍 Your Location</strong><br/>${lat.toFixed(6)}, ${lng.toFixed(6)}</div>`;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
      userMarkerRef.current.setIcon(userIcon);
      userMarkerRef.current.getPopup()?.setContent(popupText);
    } else {
      userMarkerRef.current = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(popupText);
    }
  }, [userLocation?.lat, userLocation?.lng]);

  // Update hospital markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    hospitals.forEach((h) => {
      if (!h.latitude || !h.longitude) return;

      const icon =
        h.type === "pharmacy" ? pharmacyIcon :
        h.type === "clinic"   ? pharmacyIcon :
        hospitalIcon;

      const marker = L.marker([Number(h.latitude), Number(h.longitude)], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-size:13px">
            <strong>${h.name}</strong><br/>
            ${h.distance > 0 ? `${h.distance.toFixed(1)} km away` : ""}
            ${h.phone ? `<br/><a href="tel:${h.phone}">${h.phone}</a>` : ""}
          </div>`
        )
        .on("click", () => {
          onSelectHospitalRef.current(h.id);
        });
      markersRef.current.set(h.id, marker);
    });
  }, [hospitals]);

  // Fly to selected hospital + draw route (or clear route when deselected)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!selectedHospitalId) {
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
      return;
    }

    const hospital = hospitals.find((h) => h.id === selectedHospitalId);
    if (!hospital?.latitude || !hospital?.longitude) return;

    isProgrammaticOpenRef.current = true;

    if (userLocation) {
      const bounds = L.latLngBounds(
        [userLocation.lat, userLocation.lng],
        [hospital.latitude, hospital.longitude]
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });

      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }

      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${hospital.longitude},${hospital.latitude}?overview=full&geometries=geojson`;
      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (data.routes?.[0]) {
            routeLayerRef.current = L.geoJSON(data.routes[0].geometry, {
              style: { color: "#3b82f6", weight: 5, opacity: 0.8 },
            }).addTo(map);
          }
        })
        .catch(console.error);
    } else {
      map.setView([hospital.latitude, hospital.longitude], 14);
    }

    const targetMarker = markersRef.current.get(selectedHospitalId);
    if (targetMarker) {
      targetMarker.openPopup();
    }

    setTimeout(() => {
      isProgrammaticOpenRef.current = false;
    }, 100);
  }, [selectedHospitalId, selectCount, hospitals, userLocation]);

  return (
    <div className="relative rounded-lg overflow-hidden border border-border shadow-sm">
      <div ref={containerRef} style={{ height: 300 }} className="relative z-0" />
    </div>
  );
};
