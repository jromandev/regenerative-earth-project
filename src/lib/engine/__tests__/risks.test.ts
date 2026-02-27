// ============================================================
// Risk Assessment Unit Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { risksAssessment } from '@/lib/engine/risks';
import type { StrategyInput } from '@/lib/engine/types';
import type { EnvironmentalData } from '@/lib/adapters/types';

function makeInput(overrides: Partial<EnvironmentalData['climate']> = {}, terrain: Partial<EnvironmentalData['terrain']> = {}): StrategyInput {
  return {
    env: {
      coordinates: { latitude: 0, longitude: 0 },
      climate: {
        annual_rainfall_mm: 700,
        avg_temperature_c: 20,
        min_temperature_c: 5,
        max_temperature_c: 30,
        dominant_wind_direction: 'N',
        avg_wind_speed_kmh: 10,
        humidity_percent: 60,
        sunshine_hours_annual: 2000,
        climate_zone: 'temperate',
        seasonal_variation: 'moderate',
        ...overrides,
      },
      terrain: { elevation_m: 200, slope_assessment: 'flat', ...terrain },
      location: { display_name: 'Test', country: 'Test', country_code: 'xx', region: 'Test', is_coastal: false },
      data_sources: [],
    },
  };
}

describe('risksAssessment', () => {
  it('always flags seismic as V0.1 limitation', () => {
    const result = risksAssessment(makeInput());
    expect(result.natural_hazards.some((h) => h.toLowerCase().includes('seismic'))).toBe(true);
  });

  it('detects high flood risk (low elevation + high rainfall)', () => {
    const result = risksAssessment(makeInput({ annual_rainfall_mm: 1500 }, { elevation_m: 20 }));
    expect(result.natural_hazards.some((h) => h.toLowerCase().includes('flood'))).toBe(true);
    expect(result.mitigation_strategies.some((m) => m.toLowerCase().includes('elevated'))).toBe(true);
  });

  it('does not flag high flood for high elevation + high rainfall', () => {
    const result = risksAssessment(makeInput({ annual_rainfall_mm: 1500 }, { elevation_m: 800 }));
    expect(result.natural_hazards.some((h) => h.toLowerCase().includes('high flood'))).toBe(false);
  });

  it('detects severe drought risk (<300mm)', () => {
    const result = risksAssessment(makeInput({ annual_rainfall_mm: 150 }));
    expect(result.climate_risks.some((r) => r.toLowerCase().includes('drought'))).toBe(true);
  });

  it('detects extreme heat (>45°C)', () => {
    const result = risksAssessment(makeInput({ max_temperature_c: 48 }));
    expect(result.climate_risks.some((r) => r.toLowerCase().includes('extreme heat'))).toBe(true);
  });

  it('detects extreme cold (<-25°C)', () => {
    const result = risksAssessment(makeInput({ min_temperature_c: -30 }));
    expect(result.climate_risks.some((r) => r.toLowerCase().includes('extreme cold'))).toBe(true);
    expect(result.mitigation_strategies.some((m) => m.toLowerCase().includes('frost'))).toBe(true);
  });

  it('detects erosion risk (steep + high rainfall)', () => {
    const result = risksAssessment(makeInput({ annual_rainfall_mm: 1200 }, { slope_assessment: 'steep', elevation_m: 400 }));
    expect(result.terrain_risks.some((r) => r.toLowerCase().includes('erosion'))).toBe(true);
  });

  it('detects landslide risk (steep + very high rainfall)', () => {
    const result = risksAssessment(makeInput({ annual_rainfall_mm: 1500 }, { slope_assessment: 'steep', elevation_m: 400 }));
    expect(result.terrain_risks.some((r) => r.toLowerCase().includes('landslide'))).toBe(true);
  });

  it('adds coastal storm surge for coastal location', () => {
    const input = makeInput();
    input.env.location.is_coastal = true;
    const result = risksAssessment(input);
    expect(result.natural_hazards.some((h) => h.toLowerCase().includes('coastal'))).toBe(true);
  });

  it('always provides mitigation strategies', () => {
    const result = risksAssessment(makeInput());
    expect(result.mitigation_strategies.length).toBeGreaterThan(0);
  });

  it('reasoning trace is non-empty', () => {
    const result = risksAssessment(makeInput());
    expect(result.reasoning_trace.length).toBeGreaterThanOrEqual(1);
  });
});
