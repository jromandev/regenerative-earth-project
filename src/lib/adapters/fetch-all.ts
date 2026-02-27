// ============================================================
// Environmental Data Orchestrator
// Calls all three adapters in parallel.
// Gracefully degrades if any adapter fails — the engine
// will use fallback defaults and record limitations.
// ============================================================

import type { Coordinates, EnvironmentalData, ClimateData, TerrainData, LocationData } from './types';
import { openMeteoAdapter } from './open-meteo';
import { openElevationAdapter } from './open-elevation';
import { nominatimAdapter } from './nominatim';

export interface FetchAllResult {
  data: EnvironmentalData;
  warnings: string[];
  allFailed: boolean;
}

// Fallback values used when adapters fail.
// These represent global averages — always flagged in reasoning trace.
const CLIMATE_FALLBACK: ClimateData = {
  annual_rainfall_mm: 700,
  avg_temperature_c: 15,
  min_temperature_c: 0,
  max_temperature_c: 30,
  dominant_wind_direction: 'unknown',
  avg_wind_speed_kmh: 10,
  humidity_percent: 60,
  sunshine_hours_annual: 2000,
  climate_zone: 'temperate',
  seasonal_variation: 'moderate',
};

const TERRAIN_FALLBACK: TerrainData = {
  elevation_m: 200,
  slope_assessment: 'flat',
};

const LOCATION_FALLBACK: LocationData = {
  display_name: 'Unknown location',
  country: 'Unknown',
  country_code: 'xx',
  region: 'Unknown',
  is_coastal: false,
};

export async function fetchAllEnvironmentalData(coords: Coordinates): Promise<FetchAllResult> {
  const [climateResult, terrainResult, locationResult] = await Promise.allSettled([
    openMeteoAdapter.fetch(coords),
    openElevationAdapter.fetch(coords),
    nominatimAdapter.fetch(coords),
  ]);

  const warnings: string[] = [];
  const dataSources = [];

  // Climate
  let climate = CLIMATE_FALLBACK;
  if (climateResult.status === 'fulfilled' && climateResult.value.data) {
    climate = climateResult.value.data;
    dataSources.push(climateResult.value.source);
  } else {
    const err =
      climateResult.status === 'rejected'
        ? String(climateResult.reason)
        : (climateResult.value.source.error ?? 'unknown error');
    warnings.push(`Climate data unavailable: ${err}. Using global average fallback values.`);
    if (climateResult.status === 'fulfilled') dataSources.push(climateResult.value.source);
  }

  // Terrain
  let terrain = TERRAIN_FALLBACK;
  if (terrainResult.status === 'fulfilled' && terrainResult.value.data) {
    terrain = terrainResult.value.data;
    dataSources.push(terrainResult.value.source);
  } else {
    const err =
      terrainResult.status === 'rejected'
        ? String(terrainResult.reason)
        : (terrainResult.value.source.error ?? 'unknown error');
    warnings.push(`Terrain data unavailable: ${err}. Using flat/200m fallback.`);
    if (terrainResult.status === 'fulfilled') dataSources.push(terrainResult.value.source);
  }

  // Location
  let location: LocationData = {
    ...LOCATION_FALLBACK,
    display_name: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
  };
  if (locationResult.status === 'fulfilled' && locationResult.value.data) {
    location = locationResult.value.data;
    dataSources.push(locationResult.value.source);
  } else {
    const err =
      locationResult.status === 'rejected'
        ? String(locationResult.reason)
        : (locationResult.value.source.error ?? 'unknown error');
    warnings.push(`Location data unavailable: ${err}. Using coordinate string as location name.`);
    if (locationResult.status === 'fulfilled') dataSources.push(locationResult.value.source);
  }

  const allFailed = warnings.length === 3;

  return {
    data: { coordinates: coords, climate, terrain, location, data_sources: dataSources },
    warnings,
    allFailed,
  };
}
