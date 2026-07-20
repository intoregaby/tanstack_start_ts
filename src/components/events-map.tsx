import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "@tanstack/react-router";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function EventsMap({ events }: { events: any[] }) {
  const withCoords = events.filter(
    (e) => typeof e.latitude === "number" && typeof e.longitude === "number"
  );
  return (
    <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {withCoords.map((e) => (
        <Marker key={e.id} position={[e.latitude, e.longitude]}>
          <Popup>
            <div className="font-medium">{e.title}</div>
            {e.location_name && <div className="text-xs text-muted-foreground">{e.location_name}</div>}
            <Link to="/events/$eventId" params={{ eventId: e.id }} className="text-xs text-primary underline">
              View →
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
