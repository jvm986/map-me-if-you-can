'use client';

import {
  AdvancedMarker,
  APIProvider,
  Map as GoogleMap,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import { useCallback } from 'react';
import { Location } from '@/types/game';

interface MapPickerProps {
  onLocationSelect: (location: Location) => void;
  selectedLocation: Location | null;
  initialCenter?: Location;
  zoom?: number;
}

export default function MapPicker({
  onLocationSelect,
  selectedLocation,
  initialCenter = { lat: 20, lng: 0 },
  zoom = 2,
}: MapPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      if (event.detail?.latLng) {
        const lat = event.detail.latLng.lat;
        const lng = event.detail.latLng.lng;
        onLocationSelect({ lat, lng });
      }
    },
    [onLocationSelect]
  );

  return (
    <APIProvider apiKey={apiKey}>
      <div style={{ width: '100%', height: '100%' }} className="[&_*]:!cursor-default">
        <GoogleMap
          mapId="map-picker"
          defaultCenter={initialCenter}
          defaultZoom={zoom}
          onClick={handleMapClick}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: '100%', height: '100%' }}
        >
          {selectedLocation && <AdvancedMarker position={selectedLocation} />}
        </GoogleMap>
      </div>
    </APIProvider>
  );
}
