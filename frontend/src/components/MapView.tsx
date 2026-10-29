import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Clock } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

// Custom Leaflet Markers
const customerIcon = L.divIcon({
  className: 'custom-customer-icon',
  html: `<div style="background-color: #0284c7; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; color: white;">🏠</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const providerIcon = L.divIcon({
  className: 'custom-provider-icon',
  html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.5); display: flex; align-items: center; justify-content: center; color: white;">🛵</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface MapViewProps {
  customerLat: number;
  customerLng: number;
  providerLat?: number;
  providerLng?: number;
  providerName?: string;
  etaMinutes?: number;
  bookingId?: number;
}

export const MapView: React.FC<MapViewProps> = ({
  customerLat,
  customerLng,
  providerLat: initialProvLat,
  providerLng: initialProvLng,
  providerName = 'Provider',
  etaMinutes = 8,
  bookingId,
}) => {
  const { socket } = useSocket();
  const safeCustomerLat = Number.isFinite(customerLat) ? customerLat : 12.9716;
  const safeCustomerLng = Number.isFinite(customerLng) ? customerLng : 77.5946;
  const [provLat, setProvLat] = useState<number | undefined>(
    Number.isFinite(initialProvLat) ? initialProvLat : undefined
  );
  const [provLng, setProvLng] = useState<number | undefined>(
    Number.isFinite(initialProvLng) ? initialProvLng : undefined
  );
  const [mapLayer, setMapLayer] = useState<'standard' | 'satellite'>('standard');

  useEffect(() => {
    setProvLat(Number.isFinite(initialProvLat) ? initialProvLat : undefined);
    setProvLng(Number.isFinite(initialProvLng) ? initialProvLng : undefined);
  }, [initialProvLat, initialProvLng]);

  useEffect(() => {
    if (!socket || !bookingId) return;

    socket.emit('join_booking_room', { booking_id: bookingId });

    const handleLocationUpdate = (data: { latitude: number; longitude: number; booking_id: number }) => {
      if (data.booking_id === bookingId && data.latitude && data.longitude) {
        setProvLat(data.latitude);
        setProvLng(data.longitude);
      }
    };

    socket.on('location_update', handleLocationUpdate);

    return () => {
      socket.off('location_update', handleLocationUpdate);
    };
  }, [socket, bookingId]);

  const pLat: number = Number.isFinite(provLat) ? (provLat as number) : safeCustomerLat + 0.008;
  const pLng: number = Number.isFinite(provLng) ? (provLng as number) : safeCustomerLng + 0.008;

  const centerLat = (safeCustomerLat + pLat) / 2;
  const centerLng = (safeCustomerLng + pLng) / 2;

  if (!Number.isFinite(safeCustomerLat) || !Number.isFinite(safeCustomerLng)) {
    return (
      <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-sm text-slate-500">
        Map location is unavailable right now.
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-lg border border-slate-200">
      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur px-3.5 py-2 rounded-xl shadow-md border border-slate-200 flex items-center gap-2 text-xs font-semibold text-slate-800">
        <Navigation className="w-4 h-4 text-sky-600 animate-pulse" />
        <span>Live Provider Tracking (Interactive Map)</span>
      </div>

      <div className="absolute top-3 left-[calc(50%-80px)] z-[1000] flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-md backdrop-blur">
        <button
          type="button"
          onClick={() => setMapLayer('standard')}
          className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-colors ${
            mapLayer === 'standard'
              ? 'bg-sky-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Standard
        </button>
        <button
          type="button"
          onClick={() => setMapLayer('satellite')}
          className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-colors ${
            mapLayer === 'satellite'
              ? 'bg-sky-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Satellite
        </button>
      </div>

      {/* ETA Badge */}
      <div className="absolute top-3 right-3 z-[1000] bg-emerald-600 text-white px-3.5 py-2 rounded-xl shadow-md flex items-center gap-1.5 text-xs font-bold">
        <Clock className="w-4 h-4" />
        <span>ETA: ~{etaMinutes} mins</span>
      </div>

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        {mapLayer === 'standard' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {/* Customer Marker */}
        <Marker position={[safeCustomerLat, safeCustomerLng]} icon={customerIcon}>
          <Popup>
            <div className="text-xs font-semibold">Your Service Location</div>
          </Popup>
        </Marker>

        {/* Provider Marker */}
        <Marker position={[pLat, pLng]} icon={providerIcon}>
          <Popup>
            <div className="text-xs font-semibold">{providerName} is on the way!</div>
          </Popup>
        </Marker>

        {/* Route Line */}
        <Polyline
          positions={[
            [safeCustomerLat, safeCustomerLng],
            [pLat, pLng],
          ]}
          color="#0284c7"
          weight={4}
          dashArray="6, 8"
        />
      </MapContainer>
    </div>
  );
};
