import QRCode from 'qrcode';

export interface QrOptions {
  foreground: string; background: string; size: number; margin: number;
  level: 'L' | 'M' | 'Q' | 'H'; style: 'square' | 'rounded'; logo?: string;
}
export const defaults: QrOptions = { foreground: '#163e32', background: '#ffffff', size: 512, margin: 4, level: 'M', style: 'square' };

export function contrastRatio(a: string, b: string) {
  const luminance = (hex: string) => {
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}

export function createQrSvg(payload: string, options: QrOptions) {
  if (new TextEncoder().encode(payload).length > 12000) throw new Error('capacity');
  const qr = QRCode.create(payload, { errorCorrectionLevel: options.logo ? 'H' : options.level });
  const n = qr.modules.size;
  const total = n + options.margin * 2;
  const color = /^#[a-f\d]{6}$/i.test(options.foreground) ? options.foreground : defaults.foreground;
  const background = /^#[a-f\d]{6}$/i.test(options.background) ? options.background : defaults.background;
  let modules = '';
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
    if (!qr.modules.get(row, col)) continue;
    const x = col + options.margin, y = row + options.margin;
    const finder = (row < 7 && (col < 7 || col >= n - 7)) || (row >= n - 7 && col < 7);
    modules += options.style === 'rounded' && !finder
      ? `<rect x="${x}" y="${y}" width="1" height="1" rx="0.25"/>`
      : `<path d="M${x} ${y}h1v1h-1z"/>`;
  }
  let logo = '';
  if (options.logo && /^data:image\/png;base64,[a-z\d+/=]+$/i.test(options.logo)) {
    const size = Math.floor(n * .2), position = (total - size) / 2;
    logo = `<rect x="${position - .6}" y="${position - .6}" width="${size + 1.2}" height="${size + 1.2}" rx="0.6" fill="${background}"/><image href="${options.logo}" x="${position}" y="${position}" width="${size}" height="${size}"/>`;
  }
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${options.size}" height="${options.size}" viewBox="0 0 ${total} ${total}" role="img" aria-label="Oluşturulan QR kod"><rect width="${total}" height="${total}" fill="${background}"/><g fill="${color}" shape-rendering="${options.style === 'square' ? 'crispEdges' : 'geometricPrecision'}">${modules}</g>${logo}</svg>`, modules: n, version: qr.version };
}

export async function svgToPng(svg: string, size: number): Promise<Blob> {
  const source = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image(); image.src = source;
    await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    canvas.getContext('2d')!.drawImage(image, 0, 0, size, size);
    return await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Görsel oluşturulamadı.')), 'image/png'));
  } finally { URL.revokeObjectURL(source); }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob), anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Only raster files are accepted; re-encode locally so SVG/external references never enter exports. */
export async function readLogo(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('PNG, JPG veya WebP biçiminde bir görsel seçin.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Logo dosyası en fazla 5 MB olabilir.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url;
    try { await image.decode(); } catch { throw new Error('Görsel okunamadı. Geçerli bir PNG, JPG veya WebP dosyası seçin.'); }
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    const scale = Math.min(256 / image.width, 256 / image.height);
    canvas.getContext('2d')!.drawImage(image, (256 - image.width * scale) / 2, (256 - image.height * scale) / 2, image.width * scale, image.height * scale);
    return canvas.toDataURL('image/png');
  } finally { URL.revokeObjectURL(url); }
}
