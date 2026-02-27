// ============================================================
// Risk Assessment Module
// Identifies environmental and climate hazards relevant to
// the given location based on available data.
// V0.1 limitation: seismic data not available — flagged.
// ============================================================

import type { StrategyModule, RiskAssessment } from './types';

export const risksAssessment: StrategyModule<RiskAssessment> = ({ env }) => {
  const { annual_rainfall_mm, min_temperature_c, max_temperature_c, avg_wind_speed_kmh, climate_zone } = env.climate;
  const { elevation_m, slope_assessment } = env.terrain;
  const { is_coastal } = env.location;
  const trace: string[] = [];

  const naturalHazards: string[] = [];
  const climateRisks: string[] = [];
  const terrainRisks: string[] = [];
  const mitigations: string[] = [];

  trace.push(`Assessing risks for ${climate_zone} zone, ${elevation_m}m elevation, ${slope_assessment} slope.`);

  // ── FLOOD RISK ────────────────────────────────────────────
  if (elevation_m < 50 && annual_rainfall_mm > 1000) {
    naturalHazards.push('High flood risk — low elevation combined with high annual rainfall');
    mitigations.push('Build on elevated ground (>2m above surrounding terrain); raised foundations or stilts');
    mitigations.push('Install swales and check dams upstream to slow runoff');
    trace.push(`Flood risk: elevation ${elevation_m}m + ${annual_rainfall_mm}mm rainfall.`);
  } else if (elevation_m < 100 && annual_rainfall_mm > 700) {
    naturalHazards.push('Moderate flood risk — relatively low elevation with significant rainfall');
    mitigations.push('Monitor seasonal water levels; maintain clear drainage channels');
    trace.push(`Moderate flood risk: elevation ${elevation_m}m + ${annual_rainfall_mm}mm rainfall.`);
  }

  // ── COASTAL STORM SURGE ───────────────────────────────────
  if (is_coastal) {
    naturalHazards.push('Coastal storm surge and tsunami risk — verify with local historical records');
    mitigations.push('Build at least 30m from high-tide line; elevate floor level above storm surge estimate');
    trace.push('Coastal location: storm surge risk flagged.');
  }

  // ── DROUGHT RISK ──────────────────────────────────────────
  if (annual_rainfall_mm < 300) {
    climateRisks.push('Severe drought risk — annual rainfall critically low for rain-fed agriculture');
    mitigations.push('Establish water storage capacity for minimum 6-month supply before occupying site');
    mitigations.push('Plant drought-tolerant windbreaks and ground cover to reduce evaporation');
    trace.push(`Drought risk: only ${annual_rainfall_mm}mm annual rainfall.`);
  } else if (annual_rainfall_mm < 500) {
    climateRisks.push('Drought-prone — seasonal water scarcity likely during dry months');
    mitigations.push('Maintain 3-month water reserve at all times; implement greywater recycling');
    trace.push(`Drought-prone: ${annual_rainfall_mm}mm annual rainfall.`);
  }

  // ── EXTREME HEAT ──────────────────────────────────────────
  if (max_temperature_c > 45) {
    climateRisks.push(`Extreme heat risk — temperatures exceeding 45°C (recorded max: ${max_temperature_c}°C)`);
    mitigations.push('Shade all outdoor work areas; restrict heavy labor to early morning and evening');
    mitigations.push('Ensure access to sufficient water (>3L/person/day during extreme heat)');
    mitigations.push('Passive cooling: thermal mass building, underground/semi-buried rooms');
    trace.push(`Extreme heat: max temp ${max_temperature_c}°C.`);
  } else if (max_temperature_c > 38) {
    climateRisks.push(`High heat risk — temperatures above 38°C (max: ${max_temperature_c}°C)`);
    mitigations.push('Passive cooling and shade structures essential; cross-ventilation in all buildings');
    trace.push(`High heat: max temp ${max_temperature_c}°C.`);
  }

  // ── EXTREME COLD ──────────────────────────────────────────
  if (min_temperature_c < -25) {
    climateRisks.push(`Extreme cold risk — temperatures below -25°C (min: ${min_temperature_c}°C)`);
    mitigations.push('All water pipes must be buried below frost depth or insulated from freezing');
    mitigations.push('Emergency thermal shelter capacity for human survival during cold snaps');
    mitigations.push('Sufficient fuel or energy storage for multi-week heating without resupply');
    trace.push(`Extreme cold: min temp ${min_temperature_c}°C.`);
  } else if (min_temperature_c < -10) {
    climateRisks.push(`Severe cold risk — regular deep frost (min: ${min_temperature_c}°C)`);
    mitigations.push('Insulate all water infrastructure; ensure reliable heating system before winter');
    trace.push(`Severe cold: min temp ${min_temperature_c}°C.`);
  }

  // ── HIGH WIND / STORM ─────────────────────────────────────
  if (avg_wind_speed_kmh > 40) {
    climateRisks.push(`High wind and storm risk — average wind speed ${avg_wind_speed_kmh} km/h indicates frequent storms`);
    mitigations.push('All structures require engineered wind bracing and secured roof connections');
    mitigations.push('Plant dense windbreaks on prevailing wind side before construction');
    trace.push(`High wind risk: avg ${avg_wind_speed_kmh} km/h.`);
  } else if (avg_wind_speed_kmh > 25) {
    climateRisks.push(`Elevated wind exposure — average ${avg_wind_speed_kmh} km/h`);
    mitigations.push('Use wind-resistant roof design; create windbreaks with fast-growing trees');
    trace.push(`Elevated wind: avg ${avg_wind_speed_kmh} km/h.`);
  }

  // ── TERRAIN: EROSION ──────────────────────────────────────
  if ((slope_assessment === 'steep' || slope_assessment === 'moderate') && annual_rainfall_mm > 800) {
    terrainRisks.push('Soil erosion risk — steep or moderate slope with high rainfall is a severe erosion combination');
    mitigations.push('Implement contour swales immediately to slow runoff velocity');
    mitigations.push('Plant perennial ground cover and pioneer species on bare slopes before first rains');
    mitigations.push('No bare soil: mulch all disturbed areas within 48 hours');
    trace.push(`Erosion risk: ${slope_assessment} slope + ${annual_rainfall_mm}mm rainfall.`);
  }

  // ── TERRAIN: LANDSLIDE ────────────────────────────────────
  if (slope_assessment === 'steep' && annual_rainfall_mm > 1200) {
    terrainRisks.push('Landslide risk — steep terrain with very high rainfall; do not build on or directly below steep slopes');
    mitigations.push('Conduct thorough site assessment; build only on geologically stable ground');
    mitigations.push('Maintain >50m buffer below all steep unstable slopes');
    trace.push('Landslide risk: steep slope + very high rainfall.');
  }

  // ── SEISMIC (LIMITATION) ──────────────────────────────────
  naturalHazards.push('Seismic risk: not assessed — no seismic data source integrated in V0.1');
  mitigations.push('Verify seismic zone with local geological survey before construction');
  trace.push('Seismic: V0.1 limitation — flagged for V0.2 integration with USGS seismic data.');

  // ── ENSURE MINIMUM OUTPUT ────────────────────────────────
  if (naturalHazards.length === 1 && climateRisks.length === 0 && terrainRisks.length === 0) {
    climateRisks.push('No major climate or terrain risks identified for this location');
    trace.push('No significant hazards detected. Conditions appear relatively stable.');
  }

  return {
    natural_hazards: naturalHazards,
    climate_risks: climateRisks,
    terrain_risks: terrainRisks,
    mitigation_strategies: mitigations,
    reasoning_trace: trace,
  };
};
