// ============================================================
// Open-Meteo Climate Data Adapter
// Endpoint: https://api.open-meteo.com/v1/forecast
// Free, no API key required.
// ============================================================

import type { ClimateData, ClimateZone, Coordinates, DataAdapter, AdapterResult, SeasonalVariation } from './types';

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

// Simplified Köppen-based classification
// Thresholds are approximate and sufficient for rule-based V0.1
function deriveClimateZone(avgTemp: number, minTemp: number, maxTemp: number, rainfall: number): ClimateZone {
  if (maxTemp < 10) return 'polar';
  if (minTemp < -3 && maxTemp >= 10) return 'continental';
  if (avgTemp > 18 && rainfall > 1500) return 'tropical';
  if (rainfall < 250) return 'arid';
  return 'temperate';
}

function deriveSeasonalVariation(minTemp: number, maxTemp: number): SeasonalVariation {
  const range = maxTemp - minTemp;
  if (range < 10) return 'low';
  if (range <= 25) return 'moderate';
  return 'high';
}

function deriveDominantWindDirection(degrees: number | undefined): string {
  if (degrees === undefined) return 'unknown';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return dirs[index] ?? 'N';
}

interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
    wind_direction_10m_dominant: number[];
    sunshine_duration: number[]; // seconds per day
    relative_humidity_2m_max?: number[];
  };
}

export const openMeteoAdapter: DataAdapter<ClimateData> = {
  name: 'open-meteo',

  async fetch(coords: Coordinates): Promise<AdapterResult<ClimateData>> {
    const fetchedAt = new Date().toISOString();
    const url = new URL(ENDPOINT);
    url.searchParams.set('latitude', String(coords.latitude));
    url.searchParams.set('longitude', String(coords.longitude));
    url.searchParams.set(
      'daily',
      'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant,sunshine_duration'
    );
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('past_days', '365');
    url.searchParams.set('forecast_days', '1');

    const endpoint = url.toString();

    try {
      const response = await fetch(endpoint, {
        headers: { 'User-Agent': 'RegenerativeEarthProject/0.1' },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = (await response.json()) as OpenMeteoResponse;
      const d = json.daily;

      const count = d.time.length;
      if (count === 0) throw new Error('Empty daily data returned');

      // Aggregate daily → annual values
      const totalRainfall = d.precipitation_sum.reduce((s, v) => s + (v ?? 0), 0);
      const avgTempMax = d.temperature_2m_max.reduce((s, v) => s + (v ?? 0), 0) / count;
      const avgTempMin = d.temperature_2m_min.reduce((s, v) => s + (v ?? 0), 0) / count;
      const avgTemp = (avgTempMax + avgTempMin) / 2;
      const maxTempOverall = Math.max(...d.temperature_2m_max.filter((v): v is number => v !== null));
      const minTempOverall = Math.min(...d.temperature_2m_min.filter((v): v is number => v !== null));
      const avgWindSpeed = d.wind_speed_10m_max.reduce((s, v) => s + (v ?? 0), 0) / count;
      const totalSunshineSeconds = d.sunshine_duration.reduce((s, v) => s + (v ?? 0), 0);
      const sunshineHoursAnnual = totalSunshineSeconds / 3600;

      // Dominant wind: use the most frequent cardinal direction
      const windDirCounts: Record<string, number> = {};
      for (const deg of d.wind_direction_10m_dominant) {
        const dir = deriveDominantWindDirection(deg);
        windDirCounts[dir] = (windDirCounts[dir] ?? 0) + 1;
      }
      const dominantWind = Object.entries(windDirCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';

      const data: ClimateData = {
        annual_rainfall_mm: Math.round(totalRainfall),
        avg_temperature_c: Math.round(avgTemp * 10) / 10,
        min_temperature_c: Math.round(minTempOverall * 10) / 10,
        max_temperature_c: Math.round(maxTempOverall * 10) / 10,
        dominant_wind_direction: dominantWind,
        avg_wind_speed_kmh: Math.round(avgWindSpeed * 10) / 10,
        humidity_percent: 60, // Open-Meteo free tier doesn't include humidity in daily; use 60% as conservative default
        sunshine_hours_annual: Math.round(sunshineHoursAnnual),
        climate_zone: deriveClimateZone(avgTemp, minTempOverall, maxTempOverall, totalRainfall),
        seasonal_variation: deriveSeasonalVariation(minTempOverall, maxTempOverall),
      };

      return {
        data,
        source: { source: 'open-meteo', endpoint, fetched_at: fetchedAt, status: 'success' },
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return {
        data: null,
        source: { source: 'open-meteo', endpoint, fetched_at: fetchedAt, status: 'failed', error },
      };
    }
  },
};
