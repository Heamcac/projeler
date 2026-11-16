export type ContentType = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms' | 'vcard' | 'location';
export type Fields = Record<string, string>;

export class ValidationError extends Error {}

const required = (value: string | undefined, message: string) => {
  if (!value?.trim()) throw new ValidationError(message);
  return value.trim();
};
const noLineBreaks = (value: string) => {
  if (/[\r\n\u0000]/.test(value)) throw new ValidationError('Bu alanda satır sonu veya boş kontrol karakteri kullanılamaz.');
  return value;
};

export function normalizeUrl(input: string): string {
  const value = noLineBreaks(required(input, 'Bir web adresi girin.'));
  if (value.includes('\\')) throw new ValidationError('Web adresinde ters eğik çizgi yerine / kullanın.');
  // A host:port pair is not a URI scheme.
  const withScheme = /^https?:\/\//i.test(value) ? value :
    /^[a-z][a-z\d+.-]*:/i.test(value) && !/^[^/:]+:\d+(?:\/|$)/.test(value)
      ? value : `https://${value}`;
  let url: URL;
  try { url = new URL(withScheme); } catch { throw new ValidationError('Geçerli bir web adresi girin. Örnek: ornek.com'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      (!url.hostname.includes('.') && url.hostname !== 'localhost' && !url.hostname.startsWith('[')) ||
      url.hostname.split('.').some(part => !part || part.startsWith('-') || part.endsWith('-')) ||
      /[<>"^`{|}]/.test(url.hostname)) {
    throw new ValidationError('Geçerli bir http veya https adresi girin. Örnek: ornek.com');
  }
  return url.href;
}

export const escapeWifi = (value: string) => noLineBreaks(value).replace(/[\\;,:"']/g, '\\$&');
// vCard TEXT values escape backslashes, newlines, commas and semicolons. Colons are literal.
export const escapeVCard = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/[;,]/g, '\\$&');

export function buildUrl(fields: Fields) { return normalizeUrl(fields.url); }
export function buildText(fields: Fields) {
  required(fields.text, 'QR koda dönüştürmek için bir metin girin.');
  return fields.text;
}
export function buildWifi(fields: Fields) {
  required(fields.ssid, 'Ağ adını (SSID) girin.');
  const encryption = fields.encryption || 'WPA';
  if (!['WPA', 'WEP', 'nopass'].includes(encryption)) throw new ValidationError('Geçerli bir şifreleme türü seçin.');
  if (encryption !== 'nopass' && !fields.password) throw new ValidationError('Ağ şifresini girin veya şifrelemeyi Yok olarak seçin.');
  return `WIFI:T:${encryption};S:${escapeWifi(fields.ssid)};${encryption !== 'nopass' ? `P:${escapeWifi(fields.password)};` : ''}${fields.hidden === 'true' ? 'H:true;' : ''};`;
}
function emailAddress(value: string) {
  const address = noLineBreaks(required(value, 'E-posta adresini girin.'));
  if (!/^[^\s@?&#:;]+@[^\s@?&#:;]+\.[^\s@?&#:;]+$/.test(address)) throw new ValidationError('Geçerli bir e-posta adresi girin.');
  return address;
}
export function buildEmail(fields: Fields) {
  const address = emailAddress(fields.email);
  const query = [fields.subject ? `subject=${encodeURIComponent(noLineBreaks(fields.subject))}` : '', fields.message ? `body=${encodeURIComponent(fields.message)}` : ''].filter(Boolean).join('&');
  return `mailto:${encodeURIComponent(address).replace('%40', '@')}${query ? `?${query}` : ''}`;
}
function phoneNumber(value: string) {
  const number = required(value, 'Telefon numarasını girin.').replace(/[\s().-]/g, '');
  if (!/^\+?\d{3,15}$/.test(number)) throw new ValidationError('Geçerli bir telefon numarası girin. Örnek: +90 555 123 45 67');
  return number;
}
export function buildPhone(fields: Fields) { return `tel:${phoneNumber(fields.phone)}`; }
export function buildSms(fields: Fields) { return `SMSTO:${phoneNumber(fields.phone)}:${fields.message || ''}`; }

/** Fold at 75 UTF-8 octets without splitting a code point (vCard 3.0 / MIME-DIR). */
export function foldVCardLine(line: string): string {
  const encoder = new TextEncoder();
  let result = '', count = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (count + bytes > 75) { result += '\r\n '; count = 1; }
    result += char; count += bytes;
  }
  return result;
}
export function buildVCard(fields: Fields) {
  const name = required(fields.name, 'Kişinin adını girin.');
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:;${escapeVCard(name)};;;`, `FN:${escapeVCard(name)}`];
  if (fields.phone?.trim()) lines.push(`TEL;TYPE=CELL:${phoneNumber(fields.phone)}`);
  if (fields.email?.trim()) lines.push(`EMAIL:${emailAddress(fields.email)}`);
  if (fields.company?.trim()) lines.push(`ORG:${escapeVCard(fields.company.trim())}`);
  if (fields.website?.trim()) lines.push(`URL:${normalizeUrl(fields.website)}`);
  return [...lines, 'END:VCARD'].map(foldVCardLine).join('\r\n');
}
export function buildLocation(fields: Fields) {
  const parse = (value: string, max: number, label: string) => {
    const normalized = required(value, `${label} değerini girin.`).replace(',', '.');
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) || Math.abs(Number(normalized)) > max) throw new ValidationError(`${label}, -${max} ile ${max} arasında olmalı.`);
    return Number(normalized);
  };
  return `geo:${parse(fields.latitude, 90, 'Enlem')},${parse(fields.longitude, 180, 'Boylam')}`;
}

export const builders: Record<ContentType, (fields: Fields) => string> = {
  url: buildUrl, text: buildText, wifi: buildWifi, email: buildEmail,
  phone: buildPhone, sms: buildSms, vcard: buildVCard, location: buildLocation,
};
export function isEmpty(fields: Fields): boolean {
  return !Object.entries(fields).some(([key, value]) => !['encryption', 'hidden'].includes(key) && value.trim());
}
