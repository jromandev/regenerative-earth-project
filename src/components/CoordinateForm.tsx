'use client';

import { useState, type FormEvent } from 'react';
import type { Blueprint } from '@/lib/schemas/blueprint';

interface CoordinateFormProps {
  onResult: (blueprint: Blueprint) => void;
}

interface ApiError {
  error: string;
  reason?: string;
  details?: unknown;
}

export function CoordinateForm({ onResult }: CoordinateFormProps) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client-side validation matching server-side Zod schema
  function validate(): string | null {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lon)) return 'Please enter valid numbers for both coordinates.';
    if (lat < -90 || lat > 90) return 'Latitude must be between -90 and 90.';
    if (lon < -180 || lon > 180) return 'Longitude must be between -180 and 180.';
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }),
      });

      const data = (await res.json()) as Blueprint | ApiError;

      if (!res.ok) {
        const apiErr = data as ApiError;
        setError(apiErr.reason ?? apiErr.error ?? `Request failed (HTTP ${res.status})`);
        return;
      }

      onResult(data as Blueprint);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Quick-fill example locations
  const examples = [
    { label: 'Nairobi, Kenya', lat: '-1.2921', lon: '36.8219' },
    { label: 'Riyadh, Saudi Arabia', lat: '24.7136', lon: '46.6753' },
    { label: 'London, UK', lat: '51.5074', lon: '-0.1278' },
    { label: 'Ulaanbaatar, Mongolia', lat: '47.8864', lon: '106.9057' },
  ];

  return (
    <div className="w-full max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
              Latitude <span className="text-gray-400 font-normal">(-90 to 90)</span>
            </label>
            <input
              id="latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="-1.2921"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
              Longitude <span className="text-gray-400 font-normal">(-180 to 180)</span>
            </label>
            <input
              id="longitude"
              type="number"
              step="any"
              min="-180"
              max="180"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="36.8219"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analysing environment…' : 'Generate Regenerative Blueprint'}
        </button>
      </form>

      {/* Example locations ────────────────────────────────── */}
      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-2">Quick examples:</p>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => {
                setLatitude(ex.lat);
                setLongitude(ex.lon);
                setError(null);
              }}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
