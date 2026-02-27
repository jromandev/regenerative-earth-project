// ============================================================
// Input Validation Schema
// Validated at the API boundary before any processing.
// ============================================================

import { z } from 'zod';

export const CoordinateInputSchema = z.object({
  latitude: z
    .number({ error: 'latitude must be a number' })
    .min(-90, 'latitude must be >= -90')
    .max(90, 'latitude must be <= 90'),
  longitude: z
    .number({ error: 'longitude must be a number' })
    .min(-180, 'longitude must be >= -180')
    .max(180, 'longitude must be <= 180'),
});

export type CoordinateInput = z.infer<typeof CoordinateInputSchema>;
