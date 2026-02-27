// ============================================================
// Water Strategy Unit Tests
// Pure function — no mocking required.
// ============================================================

import { describe, it, expect } from 'vitest';
import { waterStrategy } from '@/lib/engine/water';
import type { StrategyInput } from '@/lib/engine/types';
import type { EnvironmentalData } from '@/lib/adapters/types';

function makeInput(overrides: Partial<EnvironmentalData['climate']> = {}, terrainOverrides: Partial<EnvironmentalData['terrain']> = {}): StrategyInput {
  return {
    env: {
      coordinates: { latitude: 0, longitude: 0 },
      climate: {
        annual_rainfall_mm: 700,
        avg_temperature_c: 20,
        min_temperature_c: 10,
        max_temperature_c: 30,
        dominant_wind_direction: 'N',
        avg_wind_speed_kmh: 10,
        humidity_percent: 60,
        sunshine_hours_annual: 2000,
        climate_zone: 'temperate',
        seasonal_variation: 'moderate',
        ...overrides,
      },
      terrain: {
        elevation_m: 200,
        slope_assessment: 'flat',
        ...terrainOverrides,
      },
      location: {
        display_name: 'Test location',
        country: 'Test',
        country_code: 'xx',
        region: 'Test',
        is_coastal: false,
      },
      data_sources: [],
    },
  };
}

describe('waterStrategy', () => {
  describe('high rainfall (>1000mm)', () => {
    it('recommends rainwater harvesting', () => {
      const result = waterStrategy(makeInput({ annual_rainfall_mm: 1200 }));
      expect(result.primary_method).toBe('Rainwater harvesting');
      expect(result.techniques.length).toBeGreaterThan(0);
      expect(result.reasoning_trace.length).toBeGreaterThan(0);
    });

    it('includes ferro-cement tanks in techniques', () => {
      const result = waterStrategy(makeInput({ annual_rainfall_mm: 1500 }));
      expect(result.techniques.some((t) => t.toLowerCase().includes('ferro-cement'))).toBe(true);
    });
  });

  describe('moderate rainfall (500–1000mm)', () => {
    it('recommends combined harvesting + groundwater', () => {
      const result = waterStrategy(makeInput({ annual_rainfall_mm: 750 }));
      expect(result.primary_method).toContain('Combined');
      expect(result.techniques.some((t) => t.toLowerCase().includes('well'))).toBe(true);
    });
  });

  describe('low rainfall (250–500mm)', () => {
    it('recommends groundwater + fog collection', () => {
      const result = waterStrategy(makeInput({ annual_rainfall_mm: 350 }));
      expect(result.primary_method).toContain('Groundwater');
      expect(result.techniques.some((t) => t.toLowerCase().includes('fog'))).toBe(true);
    });
  });

  describe('arid (<250mm)', () => {
    it('recommends deep groundwater + recycling', () => {
      const result = waterStrategy(makeInput({ annual_rainfall_mm: 100 }));
      expect(result.primary_method).toContain('Deep groundwater');
      expect(result.techniques.some((t) => t.toLowerCase().includes('borehole'))).toBe(true);
    });
  });

  describe('coastal modifier', () => {
    it('adds solar desalination for coastal + arid', () => {
      const input = makeInput({ annual_rainfall_mm: 150 });
      input.env.location.is_coastal = true;
      const result = waterStrategy(input);
      expect(result.techniques.some((t) => t.toLowerCase().includes('solar still') || t.toLowerCase().includes('desalin'))).toBe(true);
    });

    it('does not add desalination for coastal + high rainfall', () => {
      const input = makeInput({ annual_rainfall_mm: 1500 });
      input.env.location.is_coastal = true;
      const result = waterStrategy(input);
      expect(result.techniques.some((t) => t.toLowerCase().includes('solar still'))).toBe(false);
    });
  });

  describe('elevation modifier', () => {
    it('adds spring capture for high elevation + adequate rainfall', () => {
      const result = waterStrategy(makeInput({ annual_rainfall_mm: 800 }, { elevation_m: 800 }));
      expect(result.techniques.some((t) => t.toLowerCase().includes('spring'))).toBe(true);
    });
  });

  describe('reasoning trace', () => {
    it('always has at least one step', () => {
      const result = waterStrategy(makeInput({ annual_rainfall_mm: 50 }));
      expect(result.reasoning_trace.length).toBeGreaterThanOrEqual(2);
    });

    it('includes rainfall figure in trace', () => {
      const result = waterStrategy(makeInput({ annual_rainfall_mm: 1234 }));
      expect(result.reasoning_trace.some((s) => s.includes('1234'))).toBe(true);
    });
  });
});
