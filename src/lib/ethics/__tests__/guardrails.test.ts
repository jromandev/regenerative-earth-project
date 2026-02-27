// ============================================================
// Ethical Guardrails Unit Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { validateRequest } from '@/lib/ethics/guardrails';

describe('validateRequest', () => {
  it('allows valid coordinates', () => {
    const result = validateRequest({ latitude: -1.29, longitude: 36.82 });
    expect(result.allowed).toBe(true);
    expect(result.checks_passed.length).toBeGreaterThan(0);
    expect(result.rejection_reason).toBeUndefined();
  });

  it('rejects Null Island (0, 0)', () => {
    const result = validateRequest({ latitude: 0, longitude: 0 });
    expect(result.allowed).toBe(false);
    expect(result.rejection_reason).toContain('Null Island');
  });

  it('rejects coordinates near (0, 0) within 0.01°', () => {
    expect(validateRequest({ latitude: 0.005, longitude: 0 }).allowed).toBe(false);
    expect(validateRequest({ latitude: 0, longitude: 0.009 }).allowed).toBe(false);
  });

  it('allows valid coordinates near equator but not Null Island', () => {
    expect(validateRequest({ latitude: 0.02, longitude: 0 }).allowed).toBe(true);
  });

  it('rejects out-of-range latitude', () => {
    const result = validateRequest({ latitude: 91, longitude: 0 });
    expect(result.allowed).toBe(false);
  });

  it('rejects out-of-range longitude', () => {
    const result = validateRequest({ latitude: 0, longitude: 181 });
    expect(result.allowed).toBe(false);
  });

  it('allows boundary values', () => {
    expect(validateRequest({ latitude: 90, longitude: 180 }).allowed).toBe(true);
    expect(validateRequest({ latitude: -90, longitude: -180 }).allowed).toBe(true);
  });

  it('adds warning for Antarctic interior but still allows', () => {
    const result = validateRequest({ latitude: -70, longitude: 0 });
    expect(result.allowed).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Antarctica');
  });

  it('passes all named ethical checks on valid request', () => {
    const result = validateRequest({ latitude: 51.5, longitude: -0.13 });
    expect(result.allowed).toBe(true);
    const checksJoined = result.checks_passed.join(' ');
    expect(checksJoined).toContain('Null Island');
    expect(checksJoined).toContain('persisted');
    expect(checksJoined).toContain('disclaimer');
  });
});
