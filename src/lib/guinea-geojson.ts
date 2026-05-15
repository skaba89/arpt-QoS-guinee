// Simplified GeoJSON polygons for Guinea's 8 administrative regions
// Based on approximate real geographic boundaries

export interface RegionGeoJSON {
  type: "Feature";
  properties: {
    code: string;
    nom: string;
    centreLat: number;
    centreLng: number;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export const guineaRegionsGeoJSON: RegionGeoJSON[] = [
  {
    type: "Feature",
    properties: { code: "CON", nom: "Conakry", centreLat: 9.5092, centreLng: -13.7122 },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-13.72, 9.56], [-13.68, 9.56], [-13.64, 9.53], [-13.62, 9.50],
        [-13.63, 9.46], [-13.67, 9.44], [-13.72, 9.46], [-13.75, 9.49],
        [-13.76, 9.53], [-13.72, 9.56],
      ]],
    },
  },
  {
    type: "Feature",
    properties: { code: "KIN", nom: "Kindia", centreLat: 10.0569, centreLng: -12.8605 },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-13.62, 9.50], [-13.50, 9.60], [-13.20, 9.70], [-12.95, 9.80],
        [-12.70, 9.90], [-12.55, 10.10], [-12.50, 10.40], [-12.60, 10.70],
        [-12.80, 10.80], [-13.10, 10.75], [-13.40, 10.50], [-13.60, 10.20],
        [-13.72, 9.90], [-13.76, 9.65], [-13.72, 9.56], [-13.67, 9.46],
        [-13.63, 9.46], [-13.62, 9.50],
      ]],
    },
  },
  {
    type: "Feature",
    properties: { code: "BOK", nom: "Boké", centreLat: 11.1852, centreLng: -14.2941 },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-15.10, 12.00], [-14.80, 12.30], [-14.40, 12.60], [-14.00, 12.70],
        [-13.60, 12.50], [-13.30, 12.20], [-13.10, 11.80], [-13.00, 11.40],
        [-13.10, 11.00], [-13.20, 10.75], [-13.40, 10.50], [-13.60, 10.20],
        [-13.80, 10.30], [-14.20, 10.50], [-14.60, 10.80], [-15.00, 11.10],
        [-15.10, 11.50], [-15.10, 12.00],
      ]],
    },
  },
  {
    type: "Feature",
    properties: { code: "LAB", nom: "Labé", centreLat: 11.3170, centreLng: -12.2832 },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-13.10, 11.00], [-12.90, 11.50], [-12.60, 11.80], [-12.30, 12.10],
        [-11.90, 12.30], [-11.60, 12.10], [-11.40, 11.70], [-11.50, 11.30],
        [-11.70, 11.00], [-12.00, 10.80], [-12.40, 10.80], [-12.80, 10.80],
        [-13.00, 10.90], [-13.10, 11.00],
      ]],
    },
  },
  {
    type: "Feature",
    properties: { code: "MAM", nom: "Mamou", centreLat: 10.5167, centreLng: -12.0833 },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-12.80, 10.80], [-12.40, 10.80], [-12.00, 10.80], [-11.70, 11.00],
        [-11.50, 10.80], [-11.40, 10.50], [-11.50, 10.20], [-11.70, 10.00],
        [-12.00, 9.90], [-12.30, 9.90], [-12.55, 10.10], [-12.60, 10.40],
        [-12.60, 10.70], [-12.80, 10.80],
      ]],
    },
  },
  {
    type: "Feature",
    properties: { code: "FAR", nom: "Faranah", centreLat: 10.0333, centreLng: -10.7333 },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-11.40, 10.50], [-11.20, 10.80], [-10.90, 11.00], [-10.50, 11.10],
        [-10.10, 11.00], [-9.80, 10.80], [-9.70, 10.50], [-9.80, 10.10],
        [-10.00, 9.80], [-10.30, 9.70], [-10.70, 9.70], [-11.10, 9.80],
        [-11.40, 10.00], [-11.50, 10.20], [-11.40, 10.50],
      ]],
    },
  },
  {
    type: "Feature",
    properties: { code: "KAN", nom: "Kankan", centreLat: 10.3833, centreLng: -9.3000 },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-10.10, 11.00], [-9.80, 11.20], [-9.40, 11.50], [-9.00, 11.70],
        [-8.60, 11.60], [-8.40, 11.30], [-8.50, 10.90], [-8.70, 10.50],
        [-8.90, 10.20], [-9.20, 10.00], [-9.50, 9.90], [-9.80, 10.10],
        [-9.80, 10.50], [-9.70, 10.80], [-10.10, 11.00],
      ]],
    },
  },
  {
    type: "Feature",
    properties: { code: "NZE", nom: "N'Zérékoré", centreLat: 7.7500, centreLng: -8.8167 },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-10.30, 9.70], [-10.00, 9.80], [-9.50, 9.90], [-9.20, 9.80],
        [-8.90, 9.50], [-8.60, 9.10], [-8.40, 8.60], [-8.30, 8.10],
        [-8.40, 7.60], [-8.70, 7.20], [-9.10, 7.10], [-9.50, 7.20],
        [-9.90, 7.50], [-10.20, 7.90], [-10.40, 8.30], [-10.50, 8.80],
        [-10.40, 9.30], [-10.30, 9.70],
      ]],
    },
  },
];

export const guineaGeoJSONCollection = {
  type: "FeatureCollection" as const,
  features: guineaRegionsGeoJSON,
};
