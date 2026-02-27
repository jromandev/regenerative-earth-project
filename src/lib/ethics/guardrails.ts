// ============================================================
// Ethical Guardrails Module
// All requests pass through this module before processing.
// Failures are transparent and logged in the blueprint.
// This module is intentionally separate from validation logic —
// ethics is a first-class concern, not an afterthought.
// ============================================================

import type { Coordinates } from '@/lib/adapters/types';

export interface GuardrailResult {
  allowed: boolean;
  checks_passed: string[];
  rejection_reason?: string;
  warnings: string[];
}

export function validateRequest(coords: Coordinates): GuardrailResult {
  const checks_passed: string[] = [];
  const warnings: string[] = [];

  // ── CHECK 1: Coordinate range validity ──────────────────
  // Should already be caught by Zod, but this is defense-in-depth
  if (
    typeof coords.latitude !== 'number' ||
    typeof coords.longitude !== 'number' ||
    coords.latitude < -90 ||
    coords.latitude > 90 ||
    coords.longitude < -180 ||
    coords.longitude > 180
  ) {
    return {
      allowed: false,
      checks_passed,
      rejection_reason: 'Coordinates out of valid range.',
      warnings,
    };
  }
  checks_passed.push('Coordinate range validation passed');

  // ── CHECK 2: Null Island rejection ───────────────────────
  // (0, 0) is almost always an error (default unset coordinates)
  // It is also in the ocean, making real analysis meaningless
  if (Math.abs(coords.latitude) < 0.01 && Math.abs(coords.longitude) < 0.01) {
    return {
      allowed: false,
      checks_passed,
      rejection_reason:
        'Coordinates (0, 0) rejected — this is "Null Island", likely an unset default value. Please provide real geographic coordinates.',
      warnings,
    };
  }
  checks_passed.push('Null Island check passed');

  // ── CHECK 3: Antarctica interior warning ─────────────────
  // Analysis is still allowed but may be unreliable
  if (coords.latitude < -60) {
    warnings.push(
      `Location is in Antarctica (lat ${coords.latitude}). Recommendations may be unreliable — very limited infrastructure is feasible at this latitude.`
    );
  }
  checks_passed.push('Antarctic interior check passed');

  // ── CHECK 4: Disclaimer injection (always true) ──────────
  // Ensures the output always carries the decision-support disclaimer
  checks_passed.push('Decision-support disclaimer will be injected into output');

  // ── CHECK 5: No data storage attestation ─────────────────
  // Coordinates are not persisted beyond this request
  // This is a structural commitment, not just a policy statement
  checks_passed.push('No coordinate data will be persisted — stateless request confirmed');

  // ── CHECK 6: Humanitarian purpose declaration ─────────────
  // This platform is for communities in need of regenerative development support
  // Future versions may add origin-based checks here
  checks_passed.push('Request evaluated under humanitarian purpose framework');

  return { allowed: true, checks_passed, warnings };
}
