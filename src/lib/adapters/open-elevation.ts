// ============================================================
// Open Elevation Terrain Data Adapter
// Endpoint: https://api.open-elevation.com/api/v1/lookup
// Free, no API key required.
// Slope estimated from a 5-point cross (±0.01°) around the target.
// ============================================================

import type { Coordinates, DataAdapter, AdapterResult, SlopeAssessment, TerrainData } from './types';

const ENDPOINT = 'https://api.open-elevation.com/api/v1/lookup';

interface ElevationResult {
  latitude: number;
  longitude: number;
  elevation: number;
}

interface ElevationResponse {
  results: ElevationResult[];
}

// Approx metres per degree at equator:
//   1° lat ≈ 111,000 m   |   1° lon ≈ 111,000 * cos(lat) m
// We offset ±0.01° → ±1,110 m in each direction
const OFFSET_DEG = 0.01;

function classifySlope(elevations: number[]): SlopeAssessment {
  if (elevations.length !== 5) return 'flat';

  const center = elevations[0] ?? 0;
  const dists = elevations.slice(1).map((e) => Math.abs((e ?? 0) - center));
  const maxRise = Math.max(...dists);

  // Horizontal distance = OFFSET_DEG * 111,000 m ≈ 1,110 m
  const horizontalDist = OFFSET_DEG * 111_000;
  const slopePercent = (maxRise / horizontalDist) * 100;

  if (slopePercent < 2) return 'flat';
  if (slopePercent < 8) return 'gentle';
  if (slopePercent < 15) return 'moderate';
  return 'steep';
}

export const openElevationAdapter: DataAdapter<TerrainData> = {
  name: 'open-elevation',

  async fetch(coords: Coordinates): Promise<AdapterResult<TerrainData>> {
    const fetchedAt = new Date().toISOString();

    // 5-point cross: center, N, S, E, W
    const points = [
      { latitude: coords.latitude, longitude: coords.longitude },
      { latitude: coords.latitude + OFFSET_DEG, longitude: coords.longitude },
      { latitude: coords.latitude - OFFSET_DEG, longitude: coords.longitude },
      { latitude: coords.latitude, longitude: coords.longitude + OFFSET_DEG },
      { latitude: coords.latitude, longitude: coords.longitude - OFFSET_DEG },
    ];

    const locationsParam = points.map((p) => `${p.latitude},${p.longitude}`).join('|');
    const endpoint = `${ENDPOINT}?locations=${locationsParam}`;

    try {
      const response = await fetch(endpoint, {
        headers: { 'User-Agent': 'RegenerativeEarthProject/0.1' },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = (await response.json()) as ElevationResponse;
      const results = json.results;

      if (!results || results.length === 0) {
        throw new Error('No elevation results returned');
      }

      const elevations = results.map((r) => r.elevation ?? 0);
      const centerElevation = elevations[0] ?? 0;

      const data: TerrainData = {
        elevation_m: Math.round(centerElevation),
        slope_assessment: classifySlope(elevations),
      };

      return {
        data,
        source: { source: 'open-elevation', endpoint, fetched_at: fetchedAt, status: 'success' },
      };
    } catch (err) {
      // Fallback: attempt single-point query
      const singleEndpoint = `${ENDPOINT}?locations=${coords.latitude},${coords.longitude}`;
      try {
        const fallbackRes = await fetch(singleEndpoint, {
          headers: { 'User-Agent': 'RegenerativeEarthProject/0.1' },
          signal: AbortSignal.timeout(10000),
        });
        if (fallbackRes.ok) {
          const fallbackJson = (await fallbackRes.json()) as ElevationResponse;
          const elevation = fallbackJson.results[0]?.elevation ?? 0;
          return {
            data: { elevation_m: Math.round(elevation), slope_assessment: 'flat' },
            source: {
              source: 'open-elevation',
              endpoint: singleEndpoint,
              fetched_at: fetchedAt,
              status: 'fallback',
              error: 'Multi-point slope query failed; slope defaulted to flat',
            },
          };
        }
      } catch {
        // Both failed — fall through
      }

      const error = err instanceof Error ? err.message : String(err);
      return {
        data: null,
        source: { source: 'open-elevation', endpoint, fetched_at: fetchedAt, status: 'failed', error },
      };
    }
  },
};
