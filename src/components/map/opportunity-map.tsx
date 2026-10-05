'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  subtitle: string;
  kind: 'PROVIDER' | 'VACANCY';
  distanceKm: number | null;
}

function pinIcon(kind: 'PROVIDER' | 'VACANCY') {
  const color = kind === 'PROVIDER' ? '#2563EB' : '#14B8A6';
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);transform:rotate(-45deg)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -16],
  });
}

export function OpportunityMap({ points, center }: { points: MapPoint[]; center: [number, number] }) {
  const providerIcon = useMemo(() => pinIcon('PROVIDER'), []);
  const vacancyIcon = useMemo(() => pinIcon('VACANCY'), []);

  if (points.length === 0) return null;

  return (
    <div className="h-80 overflow-hidden rounded-xl border border-slate-200">
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={p.kind === 'PROVIDER' ? providerIcon : vacancyIcon}>
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                <strong>{p.name}</strong>
                <br />
                {p.subtitle}
                {p.distanceKm != null ? <br /> : null}
                {p.distanceKm != null ? <span>{p.distanceKm} km away (approx.)</span> : null}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
