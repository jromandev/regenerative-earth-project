// ============================================================
// Engine Orchestrator Unit Test
// Validates generateBlueprint assembles all modules correctly.
// ============================================================

import { describe, it, expect } from 'vitest';
import { generateBlueprint } from '@/lib/engine';
import type { EnvironmentalData } from '@/lib/adapters/types';

const tropicalEnv: EnvironmentalData = {
  coordinates: { latitude: -1.29, longitude: 36.82 },
  climate: {
    annual_rainfall_mm: 1050,
    avg_temperature_c: 19,
    min_temperature_c: 10,
    max_temperature_c: 28,
    dominant_wind_direction: 'S',
    avg_wind_speed_kmh: 12,
    humidity_percent: 70,
    sunshine_hours_annual: 2500,
    climate_zone: 'tropical',
    seasonal_variation: 'low',
  },
  terrain: { elevation_m: 1660, slope_assessment: 'gentle' },
  location: {
    display_name: 'Nairobi, Kenya',
    country: 'Kenya',
    country_code: 'ke',
    region: 'Nairobi County',
    is_coastal: false,
  },
  data_sources: [
    { source: 'open-meteo', endpoint: 'https://example.com', fetched_at: '2026-01-01T00:00:00Z', status: 'success' },
    { source: 'open-elevation', endpoint: 'https://example.com', fetched_at: '2026-01-01T00:00:00Z', status: 'success' },
    { source: 'nominatim', endpoint: 'https://example.com', fetched_at: '2026-01-01T00:00:00Z', status: 'success' },
  ],
};

describe('generateBlueprint', () => {
  it('produces a blueprint with all required fields', () => {
    const bp = generateBlueprint(tropicalEnv);
    expect(bp.metadata).toBeDefined();
    expect(bp.water_strategy).toBeDefined();
    expect(bp.food_strategy).toBeDefined();
    expect(bp.shelter_strategy).toBeDefined();
    expect(bp.energy_strategy).toBeDefined();
    expect(bp.risks).toBeDefined();
    expect(bp.reasoning_trace).toBeDefined();
  });

  it('metadata has correct version', () => {
    const bp = generateBlueprint(tropicalEnv);
    expect(bp.metadata.version).toBe('0.1.0');
  });

  it('metadata contains disclaimer', () => {
    const bp = generateBlueprint(tropicalEnv);
    expect(bp.metadata.disclaimer).toContain('decision support');
  });

  it('returns high confidence when all sources succeeded', () => {
    const bp = generateBlueprint(tropicalEnv);
    expect(bp.reasoning_trace.confidence_level).toBe('high');
  });

  it('returns low confidence when 2 sources failed', () => {
    const env: EnvironmentalData = {
      ...tropicalEnv,
      data_sources: [
        { source: 'open-meteo', endpoint: 'x', fetched_at: '2026-01-01T00:00:00Z', status: 'failed' },
        { source: 'open-elevation', endpoint: 'x', fetched_at: '2026-01-01T00:00:00Z', status: 'failed' },
        { source: 'nominatim', endpoint: 'x', fetched_at: '2026-01-01T00:00:00Z', status: 'success' },
      ],
    };
    const bp = generateBlueprint(env);
    expect(bp.reasoning_trace.confidence_level).toBe('low');
  });

  it('includes known V0.1 limitations', () => {
    const bp = generateBlueprint(tropicalEnv);
    const limitsJoined = bp.reasoning_trace.limitations.join(' ');
    expect(limitsJoined.toLowerCase()).toContain('seismic');
    expect(limitsJoined.toLowerCase()).toContain('soil');
  });

  it('location name from EnvironmentalData is in metadata', () => {
    const bp = generateBlueprint(tropicalEnv);
    expect(bp.metadata.location_name).toBe('Nairobi, Kenya');
  });

  it('coordinates match input', () => {
    const bp = generateBlueprint(tropicalEnv);
    expect(bp.metadata.coordinates.latitude).toBe(-1.29);
    expect(bp.metadata.coordinates.longitude).toBe(36.82);
  });

  it('warnings are added to limitations when provided', () => {
    const bp = generateBlueprint(tropicalEnv, ['Test warning message']);
    expect(bp.reasoning_trace.limitations).toContain('Test warning message');
  });
});
