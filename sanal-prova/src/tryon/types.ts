import type { BodyInput, GarmentType, MeasurementInput } from '../fit/engine.js';
export interface TryOnInput {
  body: BodyInput; profileRevision: number; mode: 'ai' | '3d'; garmentType: GarmentType;
  measurement: MeasurementInput; elasticityRatio: number;
  assets: Array<{ type: string; url: string; sha256: string; revision: number }>;
  modelVersion: string;
}
export interface AvatarParameters {
  units: 'meters'; model: 'parametric-v1'; height: number; chestCircumference: number;
  waistCircumference: number; hipCircumference: number; inseam: number; outseam: number; shoulderWidth: number;
  bodyShapeType: BodyInput['bodyShapeType']; massKg: number;
  requiresCalibration: true; smplxBetas: null;
}
export type TryOnResult = {
  kind: 'demo'; previewUrl: string; isSimulation: true; baselineId: string; notice: string;
} | {
  kind: 'ai'; imageUrl: string; modelVersion: string; isSimulation: false;
} | {
  kind: '3d'; avatar: AvatarParameters; garmentAssetUrl: string | null; simulationStatus: 'parameters_only';
};
