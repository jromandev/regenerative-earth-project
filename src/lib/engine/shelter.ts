// ============================================================
// Shelter Strategy Module
// Recommends locally-sourceable building materials and
// construction techniques suited to climate and terrain.
// "Local materials only" is a core project principle.
// ============================================================

import type { StrategyModule, ShelterStrategy } from './types';

export const shelterStrategy: StrategyModule<ShelterStrategy> = ({ env }) => {
  const { climate_zone, annual_rainfall_mm, avg_wind_speed_kmh } = env.climate;
  const { elevation_m, slope_assessment } = env.terrain;
  const { is_coastal } = env.location;
  const trace: string[] = [];

  trace.push(`Climate zone: ${climate_zone}. Slope: ${slope_assessment}. Elevation: ${elevation_m}m.`);

  let materials: string[];
  let techniques: string[];
  let considerations: string[];

  switch (climate_zone) {
    // ── TROPICAL ──────────────────────────────────────────────
    case 'tropical':
      trace.push('Tropical zone: prioritizing ventilation, rain shedding, and moisture-resistant materials.');
      materials = [
        'Bamboo (fast-growing, high tensile strength, locally abundant)',
        'Timber from sustainably managed local hardwoods',
        'Clay bricks (sun-dried adobe or fired)',
        'Thatch from local grasses (alang-alang, palm frond, sago)',
        'Split bamboo for flooring and wall screens',
        'Lime plaster from locally burned limestone',
      ];
      techniques = [
        'Raised platform foundation (0.5–1m off ground) for ventilation and flood protection',
        'Steep roof pitch (>35°) for rapid rain shedding',
        'Wide eaves (>1m overhang) to protect walls from rain',
        'Cross-ventilation: openings on opposing walls',
        'Screen walls (woven bamboo) for airflow without rain entry',
        'Covered outdoor spaces to expand usable area in rain',
      ];
      considerations = [
        'Humidity: treat bamboo with borax-boric acid solution to prevent mold and insects',
        'Termites: raise all wood off soil, use termite-resistant species',
        'Cyclone zones: use tie-downs and triangulated bracing on all roof structures',
      ];
      trace.push('Selected raised bamboo/timber construction with steep thatch roof.');
      break;

    // ── ARID ──────────────────────────────────────────────────
    case 'arid':
      trace.push('Arid zone: thermal mass materials to moderate extreme diurnal temperature swings.');
      materials = [
        'Adobe (sun-dried mud brick) — primary walling material',
        'Rammed earth (pisé) for load-bearing walls',
        'Stone (locally quarried granite, sandstone, or limestone)',
        'Lime plaster for waterproofing exterior surfaces',
        'Stabilized compressed earth blocks (SCEB) where equipment available',
        'Palm timber or desert hardwoods for roof structure',
      ];
      techniques = [
        'Thick walls (40–60cm) for thermal mass — absorbs heat by day, releases at night',
        'Small, deeply-recessed windows on sun-facing walls to reduce solar gain',
        'Flat or low-pitch roof with high parapet for shade',
        'Courtyard design — central shaded outdoor space creates microclimate',
        'Barrel-vaulted roof (no timber needed) from adobe or fired brick',
        'Buried or semi-buried rooms for natural cooling',
      ];
      considerations = [
        'Waterproofing: lime or clay render must be maintained annually',
        'Wind: seal all gaps to prevent dust/sand infiltration',
        'Flash flood risk at valley floor: build on slightly elevated ground',
      ];
      trace.push('Selected thick adobe/rammed earth construction with thermal mass courtyard design.');
      break;

    // ── TEMPERATE ─────────────────────────────────────────────
    case 'temperate':
      trace.push('Temperate zone: balanced insulation and weather resistance.');
      materials = [
        'Timber framing from locally milled softwood or hardwood',
        'Cob (clay, sand, straw mix) for thick insulating walls',
        'Stone masonry for foundations and ground-level walls',
        'Fired clay brick where kiln resources available',
        'Straw bale for super-insulated alternative walls',
        'Reed or thatch for roof (good insulation, 30+ year lifespan)',
      ];
      techniques = [
        'Insulated walls (R-value equivalent to modern standards)',
        'Moderate roof pitch (25–35°) for rain shedding and snow load',
        'South-facing main windows (northern hemisphere) for passive solar gain',
        'Thermal buffer zones: unheated porch or attached greenhouse',
        'Root cellar integrated into north side of structure',
        'Timber mortise-and-tenon joinery without metal fasteners',
      ];
      considerations = [
        'Moisture: ensure cob and straw bale have raised stone foundation',
        'Fire: wood-burning stove with proper chimney and spark protection',
        'Maintenance: external lime wash or clay render annually',
      ];
      trace.push('Selected timber-frame or cob construction with passive solar orientation.');
      break;

    // ── CONTINENTAL ───────────────────────────────────────────
    case 'continental':
      trace.push('Continental zone: maximum insulation and structural resilience for extreme cold and snow load.');
      materials = [
        'Log construction from local timber (pine, spruce, fir)',
        'Stone for foundations and lower walls',
        'Earth-sheltered construction (high insulation, frost protection)',
        'Wool, straw, or wood fiber for wall insulation',
        'Clay tile or metal (salvaged) for steep snow-shedding roof',
        'Lime mortar for stone and log chinking',
      ];
      techniques = [
        'Steep roof pitch (>45°) to shed heavy snow loads',
        'Earth berming on north-facing walls for insulation',
        'Triple-glazed or shuttered windows on all sides',
        'Vestibule/airlock entry to prevent heat loss on entry',
        'South-facing glazing maximized for winter solar gain',
        'Compact floor plan to minimize heat loss surface area',
      ];
      considerations = [
        'Foundation frost: footings must extend below frost line depth',
        'Snow load: roof structure engineered for 200–400 kg/m² snow accumulation',
        'Ice dam prevention: continuous insulation at roof-wall junction',
      ];
      trace.push('Selected log or earth-sheltered construction with south-facing passive solar design.');
      break;

    // ── POLAR ─────────────────────────────────────────────────
    case 'polar':
    default:
      trace.push('Polar zone: extreme insulation and minimal thermal bridging are critical for survival.');
      materials = [
        'Insulated structural panels (if prefabricated materials accessible)',
        'Stone masonry for outer windbreak walls',
        'Earth-sheltering with turf roof (traditional arctic technique)',
        'Dense wool, animal hide, or cork for insulation',
        'Timber (where available) for interior structure',
      ];
      techniques = [
        'Earth-sheltered or semi-buried structure to use geothermal stability',
        'Entrance tunnel (tunnel airlock) facing away from prevailing wind',
        'Minimal window area with triple or quadruple glazing',
        'Compact dome or barrel form to minimize surface-to-volume ratio',
        'Interior thermal mass with wood or masonry stove centrally located',
        'Insulated floor slab critical: ground contact is primary heat loss path',
      ];
      considerations = [
        'Permafrost: if present, build on piles or gravel pad to prevent frost heave',
        'Wind: all penetrations heavily sealed; structure must resist 150+ km/h gusts',
        'Condensation: ventilation-heat exchanger (HRV) to prevent moisture buildup',
      ];
      trace.push('Selected earth-sheltered polar construction with maximum insulation and airlock entry.');
      break;
  }

  // ── TERRAIN MODIFIERS ─────────────────────────────────────
  if (slope_assessment === 'steep' || slope_assessment === 'moderate') {
    techniques.push('Terraced foundation on sloped ground to create level building platform');
    techniques.push('Retaining walls from local stone or gabion baskets to stabilize slope');
    considerations.push('Landslide risk on steep slopes: vegetate all disturbed soil immediately');
    trace.push(`Slope (${slope_assessment}): added terracing and retaining wall guidance.`);
  }

  // ── FLOOD RISK MODIFIER ───────────────────────────────────
  if (elevation_m < 50 && annual_rainfall_mm > 1000) {
    techniques.push('Raised platform foundation or stilts to clear potential flood level');
    considerations.push('Flood risk: site building on slightly elevated ground; avoid valley floors');
    trace.push('Low elevation + high rainfall: raised platform recommended as flood precaution.');
  }

  // ── COASTAL MODIFIER ──────────────────────────────────────
  if (is_coastal) {
    materials.push('Salt-resistant lime render for external finishes');
    considerations.push('Coastal salt air: avoid uncoated steel; use galvanized or stainless fixings only');
    considerations.push('Storm surge: site above historical flood line; verify with local knowledge');
    trace.push('Coastal location: added corrosion and storm surge guidance.');
  }

  // ── HIGH WIND MODIFIER ────────────────────────────────────
  if (avg_wind_speed_kmh > 30) {
    techniques.push('Roof tie-down straps anchored through walls to foundation');
    techniques.push('Windbreak walls or dense hedgerow on prevailing wind side');
    trace.push(`High average wind (${avg_wind_speed_kmh} km/h): added structural wind resistance measures.`);
  }

  return {
    recommended_materials: materials,
    construction_techniques: techniques,
    climate_considerations: considerations,
    reasoning_trace: trace,
  };
};
