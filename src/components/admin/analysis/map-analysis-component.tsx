// src/components/admin/analysis/map-analysis-component.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { type LatLngBounds } from 'leaflet';
import { Skeleton } from '@/components/ui/skeleton';

// Fix Leaflet's default icon path issue with bundlers like Webpack
if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface MapPoint {
    id: string;
    lat: number;
    lng: number;
    popupContent: string;
    value: number; // For scaling the marker size
}

interface MapAnalysisComponentProps {
  points: MapPoint[];
}

// Function to scale radius based on value. Adjust the formula as needed.
const calculateRadius = (value: number, minRadius: number, maxRadius: number, maxValue: number) => {
    if (maxValue === 0) return minRadius;
    const scale = Math.sqrt(value / maxValue); // Using sqrt for better visual scaling
    return minRadius + (maxRadius - minRadius) * scale;
};


export default function MapAnalysisComponent({ points }: MapAnalysisComponentProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const bounds = useMemo(() => {
        if (!points || points.length === 0) {
        // Default bounds over Brazil
        return L.latLngBounds(L.latLng(-33.75, -73.99), L.latLng(5.27, -34.79));
        }
        return L.latLngBounds(points.map(p => [p.lat, p.lng]));
    }, [points]);
    
    const maxValue = useMemo(() => Math.max(...points.map(p => p.value), 0), [points]);

    if (!isClient) {
        return <Skeleton className="w-full h-full bg-muted" />;
    }

    return (
        <MapContainer
            bounds={bounds}
            scrollWheelZoom={true}
            className="w-full h-full rounded-lg z-0"
            style={{ backgroundColor: '#f0f0f0' }}
            whenCreated={ mapInstance => { 
                if (points && points.length > 0) {
                    mapInstance.fitBounds(bounds, { padding: [40, 40] });
                }
            }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.map(point => (
                <CircleMarker
                    key={point.id}
                    center={[point.lat, point.lng]}
                    radius={calculateRadius(point.value, 5, 25, maxValue)}
                    pathOptions={{ 
                        color: 'hsl(var(--primary))', 
                        fillColor: 'hsl(var(--primary))',
                        fillOpacity: 0.6 
                    }}
                >
                <Popup>
                    <div dangerouslySetInnerHTML={{ __html: point.popupContent }} />
                </Popup>
                </CircleMarker>
            ))}
        </MapContainer>
    );
}
