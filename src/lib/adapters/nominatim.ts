// ============================================================
// Nominatim (OpenStreetMap) Reverse Geocoding Adapter
// Endpoint: https://nominatim.openstreetmap.org/reverse
// Free, no API key. Must include User-Agent per usage policy.
// Rate limit: max 1 request/second — enforced by caller.
// ============================================================

import type { Coordinates, DataAdapter, AdapterResult, LocationData } from './types';

const ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'RegenerativeEarthProject/0.1 (open-source humanitarian project; https://github.com/regenerative-earth-project)';

interface NominatimAddress {
  country?: string;
  country_code?: string;
  state?: string;
  region?: string;
  county?: string;
  city?: string;
  suburb?: string;
  coastline?: string;
  natural?: string;
  water?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
  type?: string;
  category?: string;
}

// Very simple coastal detection — not definitive in V0.1
// Will be improved with a proper GIS dataset in V0.2
function detectCoastal(address: NominatimAddress | undefined, type: string | undefined): boolean {
  if (!address) return false;
  const fields = [address.natural, address.coastline, address.water, type].join(' ').toLowerCase();
  return fields.includes('coast') || fields.includes('sea') || fields.includes('ocean') || fields.includes('bay');
}

export const nominatimAdapter: DataAdapter<LocationData> = {
  name: 'nominatim',

  async fetch(coords: Coordinates): Promise<AdapterResult<LocationData>> {
    const fetchedAt = new Date().toISOString();
    const url = new URL(ENDPOINT);
    url.searchParams.set('lat', String(coords.latitude));
    url.searchParams.set('lon', String(coords.longitude));
    url.searchParams.set('format', 'json');
    url.searchParams.set('zoom', '10');

    const endpoint = url.toString();

    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = (await response.json()) as NominatimResponse;
      const addr = json.address;

      const data: LocationData = {
        display_name: json.display_name ?? `${coords.latitude}, ${coords.longitude}`,
        country: addr?.country ?? 'Unknown',
        country_code: (addr?.country_code ?? 'xx').toLowerCase(),
        region: addr?.state ?? addr?.region ?? addr?.county ?? 'Unknown',
        is_coastal: detectCoastal(addr, json.type),
      };

      return {
        data,
        source: { source: 'nominatim', endpoint, fetched_at: fetchedAt, status: 'success' },
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return {
        data: null,
        source: { source: 'nominatim', endpoint, fetched_at: fetchedAt, status: 'failed', error },
      };
    }
  },
};
