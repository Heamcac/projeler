import { describe, expect, it } from 'vitest';
import { buildUrl, buildText, buildWifi, buildEmail, buildPhone, buildSms, buildVCard, buildLocation, escapeWifi, escapeVCard, foldVCardLine, isEmpty, normalizeUrl } from './payloads';

describe('URL normalizasyonu', () => {
  it.each([
    ['ornek.com', 'https://ornek.com/'],
    ['  ornek.com/yol  ', 'https://ornek.com/yol'],
    ['HTTP://Ornek.COM/test', 'http://ornek.com/test'],
    ['https://ornek.com:8443/a;b,c:d?q=a%3Bb%2Cc%3Ad#not', 'https://ornek.com:8443/a;b,c:d?q=a%3Bb%2Cc%3Ad#not'],
    ['ornek.com/merhaba dünya?q=çay &kahve=1', 'https://ornek.com/merhaba%20d%C3%BCnya?q=%C3%A7ay%20&kahve=1'],
    ['örnek.com/İstanbul', 'https://xn--rnek-4qa.com/%C4%B0stanbul'],
    ['localhost:5173', 'https://localhost:5173/'],
    ['127.0.0.1:8080/a', 'https://127.0.0.1:8080/a'],
    ['https://[::1]/', 'https://[::1]/'],
  ])('%s adresini normalize eder', (input, output) => expect(normalizeUrl(input)).toBe(output));
  it.each(['', '   ', 'bir adres', 'merhaba', 'https://', 'javascript:alert(1)', 'ftp://ornek.com', 'data:text/html,test', 'https://user:pass@ornek.com', 'https://ornek.com\\yol', 'ornek.com\n/abc', 'https://-ornek.com', 'https://ornek..com'])('geçersiz adresi reddeder: %s', input => expect(() => normalizeUrl(input)).toThrow());
  it('ayrı payload builder kullanır', () => expect(buildUrl({ url: 'ornek.com' })).toBe('https://ornek.com/'));
});
describe('Wi-Fi', () => {
  it('WPA payload üretir', () => expect(buildWifi({ ssid: 'Ev Ağı', password: 'şifrem', encryption: 'WPA' })).toBe('WIFI:T:WPA;S:Ev Ağı;P:şifrem;;'));
  it('tüm ayırıcıları ve ters eğik çizgiyi bir kez kaçırır', () => {
    expect(escapeWifi('a;b,c:d\\e')).toBe('a\\;b\\,c\\:d\\\\e');
    expect(buildWifi({ ssid: 'A;B,C:D\\E', password: 'a;b,c:d\\e', encryption: 'WEP', hidden: 'true' })).toBe('WIFI:T:WEP;S:A\\;B\\,C\\:D\\\\E;P:a\\;b\\,c\\:d\\\\e;H:true;;');
  });
  it('boşlukları SSID ve şifrede korur', () => expect(buildWifi({ ssid: ' ağ ', password: ' parola ' })).toBe('WIFI:T:WPA;S: ağ ;P: parola ;;'));
  it('tırnakları kaçırır', () => expect(escapeWifi('"a\'b')).toBe('\\"a\\\'b'));
  it('açık ağda şifre eklemez', () => expect(buildWifi({ ssid: 'Misafir', encryption: 'nopass', password: 'gizli' })).toBe('WIFI:T:nopass;S:Misafir;;'));
  it.each<Record<string, string>>([{ ssid: '', password: 'test' }, { ssid: 'A' }, { ssid: 'A', password: 'x', encryption: 'BAD' }, { ssid: 'A\nP:injection', password: 'x' }])('geçersiz Wi-Fi bilgisini reddeder', fields => expect(() => buildWifi(fields)).toThrow());
});
describe('vCard 3.0', () => {
  it('özel karakterleri RFC kurallarıyla kaçırır, iki noktayı korur', () => expect(escapeVCard('Ad;Soyad, Ünvan: A\\B\nSatır')).toBe('Ad\\;Soyad\\, Ünvan: A\\\\B\\nSatır'));
  it('CR ve CRLF satır sonlarını kaçırır', () => expect(escapeVCard('A\rB\r\nC')).toBe('A\\nB\\nC'));
  it('tam kişi kartı oluşturur', () => expect(buildVCard({ name: 'Ada; Deniz, A:B\\C', phone: '+90 (555) 123-45-67', email: 'ada@ornek.com', company: 'A;B,C:D\\E', website: 'ornek.com/a;b,c:d' })).toBe([
    'BEGIN:VCARD', 'VERSION:3.0', 'N:;Ada\\; Deniz\\, A:B\\\\C;;;', 'FN:Ada\\; Deniz\\, A:B\\\\C', 'TEL;TYPE=CELL:+905551234567', 'EMAIL:ada@ornek.com', 'ORG:A\\;B\\,C:D\\\\E', 'URL:https://ornek.com/a;b,c:d', 'END:VCARD',
  ].join('\r\n')));
  it('isimdeki satır sonlarıyla alan enjekte edilmesini önler', () => expect(buildVCard({ name: 'Ada\nTEL:123' })).toContain('FN:Ada\\nTEL:123'));
  it('UTF-8 satırlarını 75 baytta katlar ve karakterleri bölmez', () => {
    const line = `FN:${'İş😊'.repeat(50)}`, folded = foldVCardLine(line);
    expect(folded.replace(/\r\n /g, '')).toBe(line);
    for (const part of folded.split('\r\n')) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
  });
  it('eksik adı reddeder', () => expect(() => buildVCard({ name: '' })).toThrow());
  it('iletişim alanlarına satır enjekte edilmesini reddeder', () => expect(() => buildVCard({ name: 'Ada', email: 'ada@ornek.com\nTEL:123' })).toThrow());
});
describe('Diğer payload türleri', () => {
  it('metindeki boşluk, emoji ve satır sonlarını korur', () => expect(buildText({ text: ' Merhaba 😊\nDünya ' })).toBe(' Merhaba 😊\nDünya '));
  it('boş metni reddeder', () => expect(() => buildText({ text: '  ' })).toThrow());
  it('mailto konu ve mesaj ayırıcılarını percent encode eder', () => expect(buildEmail({ email: 'ada+test@ornek.com', subject: 'A&B: ;,\\', message: 'İyi günler\n?test=1' })).toBe('mailto:ada%2Btest@ornek.com?subject=A%26B%3A%20%3B%2C%5C&body=%C4%B0yi%20g%C3%BCnler%0A%3Ftest%3D1'));
  it('boş e-posta alanlarını eklemez', () => expect(buildEmail({ email: 'a@ornek.com' })).toBe('mailto:a@ornek.com'));
  it.each(['a', 'a@b', 'a@b.com?subject=x', 'a@b.com\nBcc:x@y.com'])('geçersiz e-postayı reddeder', email => expect(() => buildEmail({ email })).toThrow());
  it('telefonu normalize eder', () => expect(buildPhone({ phone: '+90 (555) 123-45-67' })).toBe('tel:+905551234567'));
  it.each(['12', 'abc', '+90;123', '+'.repeat(2) + '12345', '1'.repeat(16)])('geçersiz telefonu reddeder', phone => expect(() => buildPhone({ phone })).toThrow());
  it('SMS mesajını olduğu gibi korur', () => expect(buildSms({ phone: '+90 555 123 45 67', message: 'Merhaba: A;B,C\\D' })).toBe('SMSTO:+905551234567:Merhaba: A;B,C\\D'));
  it('konumda virgüllü ondalık ve sıfırı kabul eder', () => { expect(buildLocation({ latitude: '41,0082', longitude: '28.9784' })).toBe('geo:41.0082,28.9784'); expect(buildLocation({ latitude: '0', longitude: '0' })).toBe('geo:0,0'); });
  it('konum sınırlarını kabul eder', () => expect(buildLocation({ latitude: '-90', longitude: '180' })).toBe('geo:-90,180'));
  it.each([{ latitude: '91', longitude: '0' }, { latitude: '0', longitude: '-181' }, { latitude: '', longitude: '0' }, { latitude: 'NaN', longitude: '0' }, { latitude: '0x10', longitude: '0' }])('geçersiz konumu reddeder', fields => expect(() => buildLocation(fields)).toThrow());
  it('yalnızca varsayılan Wi-Fi seçeneklerini boş kabul eder', () => { expect(isEmpty({ encryption: 'WPA', hidden: 'false' })).toBe(true); expect(isEmpty({ text: '0' })).toBe(false); });
});
