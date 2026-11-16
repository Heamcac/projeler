import { describe, it, expect } from 'vitest';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { createQrSvg, contrastRatio, defaults } from './qr';
import { builders, type ContentType } from './payloads';

describe('QR üretimi', () => {
  it('sekiz payload türünü okuyucu ile geri çözer', () => {
    const cases: [ContentType, Record<string, string>][] = [['url', { url: 'ornek.com/çay?q=1' }], ['text', { text: 'Merhaba dünya 😊' }], ['wifi', { ssid: 'A;B,C:D\\E', password: 'şifre;123' }], ['email', { email: 'ada@ornek.com', subject: 'Merhaba & hoş geldin' }], ['phone', { phone: '+905551234567' }], ['sms', { phone: '+905551234567', message: 'Merhaba: dünya' }], ['vcard', { name: 'Deniz Yılmaz', company: 'A;B,C:D' }], ['location', { latitude: '41.0082', longitude: '28.9784' }]];
    for (const [type, fields] of cases) {
      const payload = builders[type](fields);
      const qr = QRCode.create(payload, { errorCorrectionLevel: 'M' });
      const scale = 6, margin = 4, size = (qr.modules.size + margin * 2) * scale;
      const pixels = new Uint8ClampedArray(size * size * 4).fill(255);
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const row = Math.floor(y / scale) - margin, col = Math.floor(x / scale) - margin;
        if (row >= 0 && col >= 0 && row < qr.modules.size && col < qr.modules.size && qr.modules.get(row, col)) {
          const i = (y * size + x) * 4; pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
        }
      }
      expect(jsQR(pixels, size, size)?.data, type).toBe(payload);
    }
  });
  it('kapasite aşımını yakalar', () => expect(() => createQrSvg('x'.repeat(10000), defaults)).toThrow());
  it('SVG içine metin veya harici logo adresi enjekte etmez', () => {
    const result = createQrSvg('<script>alert(1)</script>', { ...defaults, logo: 'https://external.example/logo.svg' });
    expect(result.svg).not.toContain('<script>'); expect(result.svg).not.toContain('external.example');
  });
  it('kontrast oranını hesaplar', () => { expect(contrastRatio('#000000','#ffffff')).toBe(21); expect(contrastRatio('#ffffff','#ffffff')).toBe(1); expect(contrastRatio(defaults.foreground,defaults.background)).toBeGreaterThan(10); });
});
