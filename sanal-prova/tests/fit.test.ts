import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateFitScore, FitInputError, type MeasurementInput } from '../src/fit/engine.js';
import { DEMO_BODY } from '../src/seed.js';
import { bodyToAvatar } from '../src/tryon/avatar.js';

const m: MeasurementInput = { variantId: 'medium', size: 'M', stock: 10, waist: 78, hips: 104,
  chest: 100, inseam: 78, outseam: 104, totalLength: 105, hemWidth: 18, shoulderWidth: 40 };
test('regular ease yields full score and available size', () => {
  const fit = calculateFitScore(DEMO_BODY, m, 0);
  assert.equal(fit.overallScore, 100);
  assert.equal(fit.fitVerdict, 'Mükemmel');
  assert.equal(fit.recommendedSize, 'M');
});
test('hip mismatch is not hidden by waist and leg scores', () => {
  const fit = calculateFitScore(DEMO_BODY, { ...m, hips: 90 }, 0, [m]);
  assert.ok(fit.overallScore <= 69);
  assert.equal(fit.fitVerdict, 'Basenden Dar Gelebilir');
  assert.equal(fit.recommendedSize, 'M');
});
test('stretch improves tight circumferences but never stretches leg length', () => {
  const tight = { ...m, waist: 74, hips: 98, inseam: 68 };
  const rigid = calculateFitScore(DEMO_BODY, tight, 0);
  const elastic = calculateFitScore(DEMO_BODY, tight, 0.1);
  assert.ok(elastic.dimensions[0]!.score > rigid.dimensions[0]!.score);
  assert.equal(elastic.dimensions[2]!.score, rigid.dimensions[2]!.score);
  assert.equal(elastic.fitVerdict, 'Bacak Boyu Kısa');
});
test('long legs produce alteration advice; unavailable and incomplete variants are excluded', () => {
  const fit = calculateFitScore(DEMO_BODY, { ...m, inseam: 88, stock: 0 }, 0,
    [{ ...m, variantId: 'large', size: 'L', stock: 0 }, { ...m, variantId: 'bad', waist: null }]);
  assert.equal(fit.fitVerdict, 'Paça Tadilat İster');
  assert.equal(fit.recommendedSize, null);
});
test('missing measurements and nonfinite inputs fail instead of generating a score', () => {
  assert.throws(() => calculateFitScore(DEMO_BODY, { ...m, hips: null }, 0), FitInputError);
  assert.throws(() => calculateFitScore({ ...DEMO_BODY, waist: NaN }, m, 0), FitInputError);
  assert.throws(() => calculateFitScore(DEMO_BODY, m, 2), FitInputError);
  assert.throws(() => calculateFitScore({ ...DEMO_BODY, outseam: 70 }, m, 0), FitInputError);
});
test('tops ignore trouser dimensions and avatar conversion preserves units', () => {
  assert.equal(calculateFitScore(DEMO_BODY, { ...m, waist: null, hips: null, inseam: null }, 0, [], 'top').overallScore, 100);
  const avatar = bodyToAvatar(DEMO_BODY);
  assert.equal(avatar.height, 1.72);
  assert.equal(avatar.inseam, 0.78);
  assert.equal(avatar.smplxBetas, null);
});
