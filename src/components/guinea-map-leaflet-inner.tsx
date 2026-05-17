'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type L from 'leaflet';
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
  const layersRef = useRef<L.LayerGroup | null>(null);
  const [leafletLib, setLeafletLib] = useState<typeof L | null>(null);
  const [containerReady, setContainerReady] = useState(false);

  // Check if container is visible and has dimensions
  const checkContainer = useCallback(() => {
    if (!mapRef.current) return false;
    const rect = mapRef.current.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && document.contains(mapRef.current);
  }, []);

  // Wait for container to be ready
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 50;

    const trySetup = () => {
      attempts++;
      if (checkContainer()) {
        setContainerReady(true);
        return true;
      }
      if (attempts >= maxAttempts) {
        console.warn('[Map] Container never became ready');
        return true;
      }
      return false;
    };

    if (!trySetup()) {
      intervalId = setInterval(() => {
        if (trySetup()) clearInterval(intervalId);
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkContainer]);

  // Load Leaflet library once
  useEffect(() => {
    import('leaflet').then((mod) => {
      setLeafletLib(mod.default);
    });
  }, []);

  // Initialize base map (tiles only) once when container + lib ready
  useEffect(() => {
    if (!containerReady || !mapRef.current || !leafletLib) return;
    if (mapInstanceRef.current) return;

    const L = leafletLib;
    const rect = mapRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

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

    const map = L.map(mapRef.current, {
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

    // Layer group for dynamic content
    const dynamicLayers = L.layerGroup().addTo(map);
    layersRef.current = dynamicLayers;

    mapInstanceRef.current = map;

    // Force resize after mount
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layersRef.current = null;
    };
  }, [containerReady, leafletLib]);

  // Update dynamic layers (regions, markers, zones) when props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layersRef.current;
    const L = leafletLib;
    if (!map || !layerGroup || !L) return;

    // Clear previous dynamic layers
    layerGroup.clearLayers();

    // Add regions as GeoJSON
    guineaRegionsGeoJSON.forEach((feature) => {
      const regionInfo = regionData.find((r) => r.code === feature.properties.code);
      const metricValue = regionInfo
        ? (metric === 'coverage' ? regionInfo.coverage : regionInfo.qos)
        : 50;

      const fillColor = regionInfo?.color || (metricValue >= 80 ? '#10B981' : metricValue >= 65 ? '#3B82F6' : metricValue >= 50 ? '#F59E0B' : '#EF4444');
      const isSelected = selectedRegion === feature.properties.nom;

      const geoJsonLayer = L.geoJSON(feature, {
        style: {
          fillColor,
          fillOpacity: isSelected ? 0.65 : 0.4,
          color: isSelected ? '#D4A843' : 'rgba(255,255,255,0.3)',
          weight: isSelected ? 3 : 1.5,
        },
        onEachFeature: (_feature, layer) => {
          const popupContent = regionInfo
            ? `<div style="font-family: system-ui; color: #F1F5F9; min-width: 200px;">
                <h3 style="margin:0 0 10px; color: #D4A843; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">${regionInfo.nom}</h3>
                <div style="font-size: 12px; line-height: 2;">
                  <div style="display:flex;justify-content:space-between;"><span style="color:#94A3B8">Couverture</span><span style="font-weight:600;color:${regionInfo.coverage >= 80 ? '#10B981' : regionInfo.coverage >= 65 ? '#3B82F6' : regionInfo.coverage >= 50 ? '#F59E0B' : '#EF4444'}">${regionInfo.coverage}%</span></div>
                  <div style="display:flex;justify-content:space-between;"><span style="color:#94A3B8">Score QoS</span><span style="font-weight:600">${regionInfo.qos}/100</span></div>
                  <div style="display:flex;justify-content:space-between;"><span style="color:#94A3B8">Population</span><span style="font-weight:600">${(regionInfo.population / 1000000).toFixed(1)}M</span></div>
                  <div style="display:flex;justify-content:space-between;"><span style="color:#94A3B8">Zones Blanches</span><span style="font-weight:600;color:${regionInfo.whiteZones > 30 ? '#EF4444' : '#F59E0B'}">${regionInfo.whiteZones}</span></div>
                </div>
              </div>`
            : `<div style="color: #F1F5F9; font-family: system-ui;">${feature.properties.nom}</div>`;

          layer.bindPopup(popupContent, {
            className: 'dark-popup',
            maxWidth: 250,
          });

          layer.on('click', () => {
            onRegionClick?.(feature.properties.nom);
          });

          layer.on('mouseover', () => {
            layer.setStyle({ fillOpacity: 0.7, weight: 2.5, color: '#F1F5F9' });
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
      });
      layerGroup.addLayer(geoJsonLayer);

      // Add region label
      const center: L.LatLngExpression = [feature.properties.centreLat, feature.properties.centreLng];
      const labelMarker = L.marker(center, {
        icon: L.divIcon({
          className: 'region-label',
          html: `<span style="color:rgba(255,255,255,0.85);font-size:11px;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,0.9),0 0 8px rgba(0,0,0,0.5);white-space:nowrap;letter-spacing:0.5px;">${feature.properties.nom}</span>`,
          iconSize: [100, 24],
          iconAnchor: [50, 12],
        }),
        interactive: false,
      });
      layerGroup.addLayer(labelMarker);
    });

    // Add measurement points
    const filteredPoints = selectedOperator === 'all'
      ? measurementPoints
      : measurementPoints.filter((p) => p.operator.toLowerCase() === selectedOperator.toLowerCase());

    filteredPoints.forEach((point) => {
      const circleMarker = L.circleMarker([point.lat, point.lng], {
        radius: 5,
        fillColor: point.operatorColor,
        fillOpacity: 0.8,
        color: 'rgba(255,255,255,0.4)',
        weight: 1,
      });
      circleMarker.bindPopup(
        `<div style="font-family:system-ui;color:#F1F5F9;font-size:12px;">
          <div style="font-weight:600;color:#D4A843;margin-bottom:4px;">${point.operator}</div>
          ${point.rssi !== null ? `<div>RSSI: <b>${point.rssi} dBm</b></div>` : ''}
          ${point.scoreQoE !== null ? `<div>QoE: <b>${point.scoreQoE}/100</b></div>` : ''}
        </div>`,
        { className: 'dark-popup' }
      );
      layerGroup.addLayer(circleMarker);
    });

    // Show white zones overlay
    if (showWhiteZones) {
      const whiteZoneRegions = regionData.filter((r) => r.coverage < 60);
      whiteZoneRegions.forEach((region) => {
        const feature = guineaRegionsGeoJSON.find((f) => f.properties.code === region.code);
        if (feature) {
          const whiteZoneLayer = L.geoJSON(feature, {
            style: {
              fillColor: '#EF4444',
              fillOpacity: 0.12,
              color: '#EF4444',
              weight: 2,
              dashArray: '6, 4',
            },
          });
          layerGroup.addLayer(whiteZoneLayer);
        }
      });
    }

    // Force map to recalculate bounds
    setTimeout(() => map.invalidateSize(), 100);
  }, [leafletLib, regionData, metric, selectedRegion, selectedOperator, measurementPoints, showWhiteZones, onRegionClick]);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-lg overflow-hidden"
      style={{ background: '#0A0F1E', minHeight: '450px', height: '450px', position: 'relative' }}
    />
  );
}
