// ============================================================
// Data Adapter Types
// All adapters conform to these interfaces.
// ============================================================

export interface Coordinates {
  latitude: number; // -90 to 90
  longitude: number; // -180 to 180
}

// -----------------------------------------------------------
// Climate (Open-Meteo)
// -----------------------------------------------------------

export type ClimateZone = 'tropical' | 'arid' | 'temperate' | 'continental' | 'polar';
export type SeasonalVariation = 'low' | 'moderate' | 'high';

export interface ClimateData {
  annual_rainfall_mm: number;
  avg_temperature_c: number;
  min_temperature_c: number;
  max_temperature_c: number;
  dominant_wind_direction: string;
  avg_wind_speed_kmh: number;
  humidity_percent: number;
  sunshine_hours_annual: number;
  climate_zone: ClimateZone;
  seasonal_variation: SeasonalVariation;
}

// -----------------------------------------------------------
// Terrain (Open Elevation)
// -----------------------------------------------------------

export type SlopeAssessment = 'flat' | 'gentle' | 'moderate' | 'steep';

export interface TerrainData {
  elevation_m: number;
  slope_assessment: SlopeAssessment;
}

// -----------------------------------------------------------
// Location (Nominatim / OpenStreetMap)
// -----------------------------------------------------------

export interface LocationData {
  display_name: string;
  country: string;
  country_code: string;
  region: string;
  is_coastal: boolean;
}

// -----------------------------------------------------------
// Aggregated environmental data passed to the rule engine
// -----------------------------------------------------------

export interface DataSourceRecord {
  source: string;
  endpoint: string;
  fetched_at: string; // ISO 8601
  status: 'success' | 'fallback' | 'failed';
  error?: string;
}

export interface EnvironmentalData {
  coordinates: Coordinates;
  climate: ClimateData;
  terrain: TerrainData;
  location: LocationData;
  data_sources: DataSourceRecord[];
}

// -----------------------------------------------------------
// Adapter contract
// -----------------------------------------------------------

export interface AdapterResult<T> {
  data: T | null;
  source: DataSourceRecord;
}

export interface DataAdapter<T> {
  name: string;
  fetch(coords: Coordinates): Promise<AdapterResult<T>>;
}
