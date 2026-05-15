'use client';

import { useEffect, useRef } from 'react';
import { guineaRegionsGeoJSON } from '@/lib/guinea-geojson';

interface RegionMapData {
  code: string;
  nom: string;
  centreLat: number;
  centreLng: number;
  population: number;
  coverage: number;
  qos: number;
  color: string;
  whiteZones: number;
}

interface MapPointData {
  lat: number;
  lng: number;
  operator: string;
  operatorColor: string;
  rssi: number | null;
  scoreQoE: number | null;
}

interface OperatorData {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface GuineaMapLeafletInnerProps {
  metric?: 'coverage' | 'qos';
  onRegionClick?: (region: string) => void;
  selectedRegion?: string | null;
  regionData?: RegionMapData[];
  measurementPoints?: MapPointData[];
  operators?: OperatorData[];
  selectedOperator?: string;
  showWhiteZones?: boolean;
  showDriveTests?: boolean;
}

export function GuineaMapLeafletInner({
  metric = 'coverage',
  onRegionClick,
  selectedRegion,
  regionData = [],
  measurementPoints = [],
  selectedOperator = 'all',
  showWhiteZones = true,
}: GuineaMapLeafletInnerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      // Fix default marker icon
      const iconDefault = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      L.Marker.prototype.options.icon = iconDefault;

      const map = L.map(mapRef.current!, {
        center: [10.0, -10.5],
        zoom: 7,
        zoomControl: false,
        attributionControl: false,
      });

      // Dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Zoom control
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Add regions as GeoJSON
      guineaRegionsGeoJSON.forEach((feature) => {
        const regionInfo = regionData.find((r) => r.code === feature.properties.code);
        const metricValue = regionInfo
          ? (metric === 'coverage' ? regionInfo.coverage : regionInfo.qos)
          : 50;

        const fillColor = regionInfo?.color || (metricValue >= 80 ? '#10B981' : metricValue >= 65 ? '#3B82F6' : metricValue >= 50 ? '#F59E0B' : '#EF4444');
        const isSelected = selectedRegion === feature.properties.nom;

        const layer = L.geoJSON(feature, {
          style: {
            fillColor,
            fillOpacity: isSelected ? 0.65 : 0.4,
            color: isSelected ? '#D4A843' : 'rgba(255,255,255,0.3)',
            weight: isSelected ? 3 : 1.5,
          },
          onEachFeature: (_feature, layer) => {
            // Popup
            const popupContent = regionInfo
              ? `<div style="font-family: system-ui; color: #F1F5F9; min-width: 180px;">
                  <h3 style="margin:0 0 8px; color: #D4A843; font-size: 14px;">${regionInfo.nom}</h3>
                  <div style="font-size: 12px; line-height: 1.8;">
                    <div style="display:flex;justify-content:space-between;"><span style="color:#94A3B8">Couverture</span><span style="font-weight:600">${regionInfo.coverage}%</span></div>
                    <div style="display:flex;justify-content:space-between;"><span style="color:#94A3B8">Score QoS</span><span style="font-weight:600">${regionInfo.qos}/100</span></div>
                    <div style="display:flex;justify-content:space-between;"><span style="color:#94A3B8">Population</span><span style="font-weight:600">${(regionInfo.population / 1000000).toFixed(1)}M</span></div>
                    <div style="display:flex;justify-content:space-between;"><span style="color:#94A3B8">Zones Blanches</span><span style="font-weight:600">${regionInfo.whiteZones}</span></div>
                  </div>
                </div>`
              : `<div style="color: #F1F5F9;">${feature.properties.nom}</div>`;

            layer.bindPopup(popupContent, {
              className: 'dark-popup',
            });

            layer.on('click', () => {
              onRegionClick?.(feature.properties.nom);
            });

            layer.on('mouseover', () => {
              layer.setStyle({ fillOpacity: 0.7, weight: 2, color: '#F1F5F9' });
            });

            layer.on('mouseout', () => {
              const isStillSelected = selectedRegion === feature.properties.nom;
              layer.setStyle({
                fillOpacity: isStillSelected ? 0.65 : 0.4,
                weight: isStillSelected ? 3 : 1.5,
                color: isStillSelected ? '#D4A843' : 'rgba(255,255,255,0.3)',
              });
            });
          },
        }).addTo(map);

        // Add region label
        const center = [feature.properties.centreLat, feature.properties.centreLng] as L.LatLngExpression;
        L.marker(center, {
          icon: L.divIcon({
            className: 'region-label',
            html: `<span style="color:rgba(255,255,255,0.8);font-size:10px;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,0.8);white-space:nowrap;">${feature.properties.nom}</span>`,
            iconSize: [80, 20],
            iconAnchor: [40, 10],
          }),
          interactive: false,
        }).addTo(map);
      });

      // Add measurement points
      const filteredPoints = selectedOperator === 'all'
        ? measurementPoints
        : measurementPoints.filter((p) => p.operator.toLowerCase() === selectedOperator);

      filteredPoints.forEach((point) => {
        L.circleMarker([point.lat, point.lng], {
          radius: 4,
          fillColor: point.operatorColor,
          fillOpacity: 0.7,
          color: 'rgba(255,255,255,0.3)',
          weight: 1,
        }).addTo(map);
      });

      // Show white zones as red shaded areas
      if (showWhiteZones) {
        const whiteZoneRegions = regionData.filter((r) => r.coverage < 60);
        whiteZoneRegions.forEach((region) => {
          const feature = guineaRegionsGeoJSON.find((f) => f.properties.code === region.code);
          if (feature) {
            L.geoJSON(feature, {
              style: {
                fillColor: '#EF4444',
                fillOpacity: 0.15,
                color: '#EF4444',
                weight: 2,
                dashArray: '5, 5',
              },
            }).addTo(map);
          }
        });
      }

      mapInstanceRef.current = map;

      // Force a resize after mount
      setTimeout(() => map.invalidateSize(), 100);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update region styles when selection changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Re-render is handled by key changes in parent
  }, [selectedRegion, metric, selectedOperator, regionData, showWhiteZones]);

  return (
    <div
      ref={mapRef}
      className="w-full h-[400px] rounded-lg overflow-hidden"
      style={{ background: '#0A0F1E' }}
    />
  );
}
