import type { BodyInput } from '../fit/engine.js';
import type { AvatarParameters } from './types.js';
import { validateBody } from '../fit/engine.js';

export function bodyToAvatar(body: BodyInput): AvatarParameters {
  validateBody(body);
  return { units: 'meters', model: 'parametric-v1', height: body.height / 100,
    chestCircumference: body.chest / 100, waistCircumference: body.waist / 100,
    hipCircumference: body.hips / 100, inseam: body.inseam / 100, outseam: body.outseam / 100,
    shoulderWidth: body.shoulderWidth / 100, bodyShapeType: body.bodyShapeType, massKg: body.weight,
    requiresCalibration: true, smplxBetas: null };
}
const baselines = [
  { id: 'athletic-medium', height: 178, chest: 100, waist: 82, hips: 100 },
  { id: 'pear-medium', height: 165, chest: 90, waist: 76, hips: 108 },
  { id: 'hourglass-medium', height: 168, chest: 96, waist: 72, hips: 100 },
  { id: 'rectangle-medium', height: 172, chest: 94, waist: 88, hips: 96 },
];
export function nearestBaseline(body: BodyInput): string {
  return baselines.map(b => ({ id: b.id, distance: (b.height - body.height) ** 2 / 100
    + (b.chest - body.chest) ** 2 / 144 + (b.waist - body.waist) ** 2 / 144 + (b.hips - body.hips) ** 2 / 144 }))
    .sort((a, b) => a.distance - b.distance)[0]!.id;
}
