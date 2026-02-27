// ============================================================
// Food Strategy Unit Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { foodStrategy } from '@/lib/engine/food';
import type { StrategyInput } from '@/lib/engine/types';
import type { EnvironmentalData } from '@/lib/adapters/types';
import type { ClimateZone } from '@/lib/adapters/types';

function makeInput(zone: ClimateZone, tempOverrides: Partial<EnvironmentalData['climate']> = {}): StrategyInput {
  const defaults: Record<ClimateZone, Partial<EnvironmentalData['climate']>> = {
    tropical: { avg_temperature_c: 25, min_temperature_c: 18, max_temperature_c: 32, annual_rainfall_mm: 2000 },
    arid:     { avg_temperature_c: 28, min_temperature_c: 10, max_temperature_c: 45, annual_rainfall_mm: 100 },
    temperate:{ avg_temperature_c: 12, min_temperature_c: 2, max_temperature_c: 22, annual_rainfall_mm: 700 },
    continental: { avg_temperature_c: 5, min_temperature_c: -15, max_temperature_c: 25, annual_rainfall_mm: 500 },
    polar:    { avg_temperature_c: -5, min_temperature_c: -30, max_temperature_c: 5, annual_rainfall_mm: 200 },
  };

  return {
    env: {
      coordinates: { latitude: 0, longitude: 0 },
      climate: {
        dominant_wind_direction: 'N',
        avg_wind_speed_kmh: 10,
        humidity_percent: 60,
        sunshine_hours_annual: 2000,
        seasonal_variation: 'moderate',
        climate_zone: zone,
        ...(defaults[zone] ?? {}),
        ...tempOverrides,
      } as EnvironmentalData['climate'],
      terrain: { elevation_m: 200, slope_assessment: 'flat' },
      location: { display_name: 'Test', country: 'Test', country_code: 'xx', region: 'Test', is_coastal: false },
      data_sources: [],
    },
  };
}

describe('foodStrategy', () => {
  it('tropical: includes cassava and moringa', () => {
    const result = foodStrategy(makeInput('tropical'));
    expect(result.climate_zone).toBe('tropical');
    const cropsJoined = result.recommended_crops.join(' ').toLowerCase();
    expect(cropsJoined).toContain('cassava');
    expect(cropsJoined).toContain('moringa');
  });

  it('arid: includes date palm and millet', () => {
    const result = foodStrategy(makeInput('arid'));
    const cropsJoined = result.recommended_crops.join(' ').toLowerCase();
    expect(cropsJoined).toContain('date palm');
    expect(cropsJoined).toContain('millet');
  });

  it('arid: includes drip irrigation in techniques', () => {
    const result = foodStrategy(makeInput('arid'));
    expect(result.techniques.some((t) => t.toLowerCase().includes('drip'))).toBe(true);
  });

  it('temperate: includes potato and crop rotation', () => {
    const result = foodStrategy(makeInput('temperate'));
    const cropsJoined = result.recommended_crops.join(' ').toLowerCase();
    expect(cropsJoined).toContain('potato');
    expect(result.techniques.some((t) => t.toLowerCase().includes('rotation'))).toBe(true);
  });

  it('continental: includes cold frames', () => {
    const result = foodStrategy(makeInput('continental'));
    expect(result.techniques.some((t) => t.toLowerCase().includes('cold frame'))).toBe(true);
  });

  it('polar: requires greenhouse growing', () => {
    const result = foodStrategy(makeInput('polar'));
    expect(result.techniques.some((t) => t.toLowerCase().includes('greenhouse'))).toBe(true);
  });

  it('growing season is year-round for tropical', () => {
    const result = foodStrategy(makeInput('tropical'));
    expect(result.growing_seasons.toLowerCase()).toContain('year-round');
  });

  it('growing season is very short for polar', () => {
    const result = foodStrategy(makeInput('polar'));
    expect(result.growing_seasons.toLowerCase()).toContain('short') || 
    expect(result.growing_seasons.toLowerCase()).toContain('greenhouse');
  });

  it('always has non-empty reasoning trace', () => {
    for (const zone of ['tropical', 'arid', 'temperate', 'continental', 'polar'] as ClimateZone[]) {
      const result = foodStrategy(makeInput(zone));
      expect(result.reasoning_trace.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('always has at least 3 recommended crops', () => {
    for (const zone of ['tropical', 'arid', 'temperate', 'continental', 'polar'] as ClimateZone[]) {
      const result = foodStrategy(makeInput(zone));
      expect(result.recommended_crops.length).toBeGreaterThanOrEqual(3);
    }
  });
});
