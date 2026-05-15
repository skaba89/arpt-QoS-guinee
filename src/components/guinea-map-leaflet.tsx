'use client';

import { useEffect, useState, useCallback } from 'react';

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

interface GuineaMapLeafletProps {
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

export function GuineaMapLeaflet({
  metric = 'coverage',
  onRegionClick,
  selectedRegion,
  regionData = [],
  measurementPoints = [],
  operators = [],
  selectedOperator = 'all',
  showWhiteZones = true,
  showDriveTests = false,
}: GuineaMapLeafletProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<GuineaMapLeafletProps> | null>(null);

  useEffect(() => {
    import('./guinea-map-leaflet-inner').then((mod) => {
      setMapComponent(() => mod.GuineaMapLeafletInner);
    });
  }, []);

  if (!MapComponent) {
    return (
      <div className="w-full h-[400px] rounded-lg bg-[#0A0F1E] border border-white/5 flex items-center justify-center">
        <div className="text-xs text-slate-500 animate-pulse">Chargement de la carte...</div>
      </div>
    );
  }

  return (
    <MapComponent
      metric={metric}
      onRegionClick={onRegionClick}
      selectedRegion={selectedRegion}
      regionData={regionData}
      measurementPoints={measurementPoints}
      operators={operators}
      selectedOperator={selectedOperator}
      showWhiteZones={showWhiteZones}
      showDriveTests={showDriveTests}
    />
  );
}
