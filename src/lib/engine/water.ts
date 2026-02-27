// ============================================================
// Water Strategy Module
// Rule-based water access recommendations based on climate data.
// All thresholds documented inline for explainability.
// ============================================================

import type { StrategyModule, WaterStrategy } from './types';

export const waterStrategy: StrategyModule<WaterStrategy> = ({ env }) => {
  const { annual_rainfall_mm, climate_zone } = env.climate;
  const { elevation_m } = env.terrain;
  const { is_coastal } = env.location;
  const trace: string[] = [];

  trace.push(`Annual rainfall: ${annual_rainfall_mm}mm. Climate zone: ${climate_zone}.`);

  let primary_method: string;
  let techniques: string[];
  let storage_recommendation: string;

  // ── HIGH RAINFALL (> 1000 mm) ──────────────────────────────
  if (annual_rainfall_mm > 1000) {
    trace.push('Rainfall >1000mm: primary strategy is rainwater harvesting.');
    primary_method = 'Rainwater harvesting';
    techniques = [
      'Roof-fed catchment systems with guttering',
      'Ferro-cement storage tanks (5,000–20,000 L)',
      'Underground cisterns with sealed covers',
      'First-flush diverters to remove contaminants',
      'Slow-sand filtration before consumption',
    ];
    // Storage: 4-person household × 5 L/day × 90-day dry buffer = ~1,800 L minimum
    storage_recommendation =
      'Minimum 5,000 L per household. Target 20,000 L for 3-month dry season buffer. Elevated tank preferred for gravity-fed distribution.';
    trace.push('Recommendation: roof catchment + ferro-cement tanks + first-flush diverter.');

  // ── MODERATE RAINFALL (500 – 1000 mm) ─────────────────────
  } else if (annual_rainfall_mm >= 500) {
    trace.push('Rainfall 500–1000mm: combined rainwater harvesting and groundwater recommended.');
    primary_method = 'Combined rainwater harvesting + groundwater';
    techniques = [
      'Roof catchment and storage tanks',
      'Shallow well installation (3–15m depth)',
      'Check dams and swales to recharge groundwater',
      'Keyline water design for landscape water retention',
      'Ceramic pot filtration for drinking water',
    ];
    storage_recommendation =
      'Minimum 10,000 L per household. Pair with shallow well as backup. Swales and check dams to extend groundwater availability into dry season.';
    trace.push('Recommendation: roof catchment + shallow wells + landscape water retention.');

  // ── LOW RAINFALL (250 – 500 mm) ────────────────────────────
  } else if (annual_rainfall_mm >= 250) {
    trace.push('Rainfall 250–500mm (semi-arid): groundwater and supplemental collection recommended.');
    primary_method = 'Groundwater extraction + supplemental fog/dew collection';
    techniques = [
      'Deep wells (15–60m) with hand pumps',
      'Fog collection nets (polypropylene mesh) on ridges',
      'Dew collection sheets on cool surfaces overnight',
      'Underground infiltration galleries',
      'Drip irrigation to minimize water loss',
      'Mulching at 10–15cm depth to suppress evaporation',
    ];
    storage_recommendation =
      'Minimum 15,000 L per household. Deep well required as primary. Fog nets effective if elevation >400m with coastal or highland humidity.';
    trace.push('Recommendation: deep wells + fog nets + aggressive mulching + drip irrigation.');

  // ── ARID (< 250 mm) ──────────────────────────────────────
  } else {
    trace.push('Rainfall <250mm (arid): deep groundwater and water recycling are essential.');
    primary_method = 'Deep groundwater + closed-loop water recycling';
    techniques = [
      'Borehole drilling to deep aquifers (60–200m)',
      'Solar-powered submersible pumps',
      'Greywater recycling for irrigation',
      'Atmospheric water generation (in humid desert zones)',
      'Wicking bed irrigation systems',
      'Minimal-water composting toilets',
    ];
    storage_recommendation =
      'Minimum 20,000 L per household. Borehole essential. Greywater recycling mandatory. Target near-zero water wastage.';
    trace.push('Recommendation: deep borehole + solar pump + greywater recycling system.');
  }

  // ── COASTAL MODIFIER ──────────────────────────────────────
  if (is_coastal && annual_rainfall_mm < 500) {
    techniques.push('Small-scale solar still for supplemental fresh water from seawater');
    trace.push('Coastal location with low rainfall: added solar desalination as supplemental source.');
  }

  // ── ELEVATION MODIFIER ────────────────────────────────────
  if (elevation_m > 500 && annual_rainfall_mm > 500) {
    techniques.push('Spring capture from upland sources with gravity-fed pipe systems');
    trace.push(`Elevation ${elevation_m}m with adequate rainfall: spring capture viable.`);
  }

  return {
    primary_method,
    techniques,
    estimated_annual_rainfall_mm: annual_rainfall_mm,
    storage_recommendation,
    reasoning_trace: trace,
  };
};
