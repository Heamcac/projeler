import './style.css';
import { builders, isEmpty, type ContentType, type Fields } from './payloads';
import { createQrSvg, contrastRatio, defaults, downloadBlob, readLogo, svgToPng, type QrOptions } from './qr';
import { preference, readHistory, setPreference, writeHistory, MAX_HISTORY, type HistoryItem } from './storage';
import { icon } from './icons';

const labels: Record<ContentType, string> = { url: 'Link / URL', text: 'Düz metin', wifi: 'Wi-Fi', email: 'E-posta', phone: 'Telefon', sms: 'SMS', vcard: 'Kişi kartı', location: 'Konum' };
let type: ContentType = 'url';
const drafts = Object.fromEntries(Object.keys(labels).map(key => [key, {}])) as Record<ContentType, Fields>;
let options: QrOptions = { ...defaults }, history = readHistory(), currentSvg = '', currentPayload = '', example = true, valid = false, pending = false;
let timer = 0, historyTimer = 0;
let sessionId: string = crypto.randomUUID();
let remember = preference('remember', 'true') === 'true';
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
let theme = preference('theme', 'system');
if (!['system','light','dark'].includes(theme)) theme = 'system';
const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

$('#app').innerHTML = `
  <a class="skip-link" href="#creator">İçeriğe atla</a>
  <header class="site-header"><div class="header-inner">
    <a class="brand" href="#" aria-label="QR Atölyesi ana sayfa"><span class="brand-mark">${icon('qr')}</span><span>QR<span class="brand-light"> atölyesi</span><span class="brand-dot">.</span></span></a>
    <nav aria-label="Ana gezinme"><a class="nav-active" href="#creator">Oluşturucu</a><a href="#guide">Nasıl çalışır?</a></nav>
    <button id="theme" class="theme-button" title="Tema değiştir"></button>
  </div></header>
  <main>
    <section class="intro" aria-labelledby="title"><div><div class="eyebrow"><span></span> KÜÇÜK BİR KOD, BÜYÜK OLASILIKLAR</div><h1 id="title">Bir taramayla <span>paylaşın.</span></h1><p>Bir link, bir fikir ya da bağlantı kurmanın yeni bir yolu.<br class="desktop-break"> QR kodunuzu oluşturun, size özel hale getirin ve paylaşın.</p></div><div class="privacy-badge">${icon('shield')}<div><strong>Verileriniz sizde kalır.</strong><span>%100 tarayıcıda. Ücretsiz. Sınırsız.</span></div></div></section>
    <div class="workspace" id="creator">
      <section class="editor card" aria-label="QR kod düzenleyici">
        <div class="section-heading"><div class="heading-title"><span class="step">01</span><h2>İçeriğinizi ekleyin</h2></div><span class="small-tag">8 içerik türü</span></div>
        <div class="tabs" role="tablist" aria-label="İçerik türü">${Object.entries(labels).map(([key, label], i) => `<button type="button" role="tab" id="tab-${key}" aria-controls="content-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-type="${key}">${icon(key)}<span>${label}</span></button>`).join('')}</div>
        <div id="content-panel" role="tabpanel" aria-labelledby="tab-url" tabindex="0"></div>
        <p id="input-error" class="error-message" aria-live="polite" aria-atomic="true"></p>
        <div class="customization">
          <div class="section-heading"><div class="heading-title"><span class="step">02</span><h2>Kendinize göre tasarlayın</h2></div><button id="reset-style" class="icon-button" title="Tasarımı sıfırla" aria-label="Tasarımı sıfırla">${icon('reset')}</button></div>
          <div class="color-grid"><label>QR rengi<span class="color-control"><input id="foreground" type="color" value="${options.foreground}" aria-label="QR ön plan rengi"><span id="foreground-value">${options.foreground.toUpperCase()}</span></span></label><label>Arka plan<span class="color-control"><input id="background" type="color" value="${options.background}" aria-label="QR arka plan rengi"><span id="background-value">${options.background.toUpperCase()}</span></span></label></div>
          <div class="preset-row"><span>Hızlı renkler</span>${['#163e32','#111827','#2b4e9b','#744aa0','#a23546'].map(color => `<button class="swatch" data-color="${color}" style="--swatch:${color}" aria-label="QR rengini ${color} yap" aria-pressed="${color === options.foreground}"></button>`).join('')}</div>
          <div class="size-label"><label for="size">Görsel boyutu</label><span><input id="size-number" type="number" min="128" max="1024" step="1" value="512" aria-label="Görsel boyutu, piksel"> <span>px</span></span></div>
          <input id="size" class="range" type="range" min="128" max="1024" step="1" value="512"><div class="range-labels"><span>128 px</span><span>1024 px</span></div>
          <div class="style-row"><span>Nokta stili</span><div class="segmented" role="group" aria-label="QR nokta stili"><button data-style="square" aria-pressed="true"><span class="dot-icon square"></span>Kare</button><button data-style="rounded" aria-pressed="false"><span class="dot-icon rounded"></span>Yuvarlak</button></div></div>
          <details class="advanced"><summary>${icon('sliders')}Gelişmiş ayarlar${icon('chevron', 'chevron')}</summary><div class="advanced-body"><div class="two-columns"><label for="margin">Kenar boşluğu (modül)<input id="margin" type="number" min="0" max="12" value="4"></label><label for="level">Hata düzeltme<select id="level"><option value="L">L · %7</option><option value="M" selected>M · %15</option><option value="Q">Q · %25</option><option value="H">H · %30</option></select></label></div><p class="hint">Okunabilirlik için en az 4 modül kenar boşluğu önerilir.</p><label class="upload-label" for="logo">${icon('upload')}<span><strong id="logo-label">Ortaya bir logo ekleyin</strong><small>PNG, JPG veya WebP · En fazla 5 MB</small></span><input id="logo" type="file" accept="image/png,image/jpeg,image/webp"></label><div id="logo-info" class="logo-info" hidden><span>Logo eklendi. Hata düzeltme: H</span><button id="remove-logo" class="text-button">Kaldır</button></div><p id="logo-error" class="error-message" aria-live="polite"></p></div></details>
          <p id="design-warning" class="warning-message" aria-live="polite"></p>
        </div>
      </section>
      <aside class="preview-column" aria-label="QR kod önizleme ve indirme"><section class="preview card">
        <div class="preview-heading"><h2>QR kodunuz</h2><span class="live-badge"><span></span>Canlı önizleme</span></div>
        <div class="qr-stage"><span class="corner corner-tl"></span><span class="corner corner-tr"></span><span class="corner corner-bl"></span><span class="corner corner-br"></span><div id="qr-image"></div><div id="qr-unavailable" hidden>${icon('qr')}<strong>Bir adım kaldı</strong><span>QR kodunuz için alanları kontrol edin.</span></div></div>
        <div class="preview-caption"><span id="qr-status">${icon('check')}Örnek QR kod</span><span id="qr-dimensions">512 × 512 px</span></div>
        <div class="export-actions"><button id="download-png" class="primary-button" data-export>${icon('download')}<span>PNG indir</span>${icon('arrow')}</button><button id="download-svg" class="secondary-button" data-export>${icon('download')}SVG indir<span class="file-tag">VEKTÖR</span></button><div class="utility-actions"><button id="copy" data-export>${icon('copy')}Görseli kopyala</button><button id="print" data-export>${icon('print')}Yazdır</button></div></div>
        <p class="scan-tip">${icon('info')}İndirmeden önce telefonunuzla tarayarak deneyin.</p>
      </section><div class="local-note">${icon('shield')}<p>Hesap açmanız gerekmez.<br>İçeriğiniz hiçbir sunucuya gönderilmez.</p></div></aside>
    </div>
    <section class="history-section" aria-labelledby="history-title"><div class="history-header"><div><div class="heading-title">${icon('clock')}<h2 id="history-title">Son oluşturduklarınız</h2><span id="history-count" class="count">0</span></div><p>Yalnızca bu tarayıcıda saklanır. Wi-Fi şifreleri dahil içerikler cihazda açık metin olarak tutulur.</p></div><button id="clear-history" class="text-button">${icon('trash')}Geçmişi temizle</button></div><label class="remember-label"><input type="checkbox" id="remember" ${remember ? 'checked' : ''}> Oluşturduğum kodları bu cihazda hatırla</label><div id="history-list"></div><p id="storage-error" class="error-message" aria-live="polite"></p></section>
    <section id="guide" class="guide" aria-label="Nasıl çalışır"><div><span class="guide-number">01</span><h3>İçeriğinizi seçin</h3><p>Bir web adresinden Wi-Fi bilgilerine, paylaşmak istediğinizi ekleyin.</p></div><div><span class="guide-number">02</span><h3>İzinizi bırakın</h3><p>Rengini, boyutunu ve stilini seçerek QR kodunuzu kişiselleştirin.</p></div><div><span class="guide-number">03</span><h3>İndirin, paylaşın</h3><p>Dijitalde PNG, baskıda SVG. Kodunuz kullanıma hazır.</p></div></section>
  </main>
  <footer><a class="footer-brand" href="#">QR atölyesi.</a><p>Bağlantı kurmanın küçük ve güzel bir yolu.</p><span>${icon('shield')}Gizlilik, tasarımın bir parçası.</span></footer>
  <div id="toast" role="status" aria-live="polite" aria-atomic="true"></div>
  <div id="print-area" aria-hidden="true"></div>
`;

function input(name: string, label: string, placeholder: string, inputType = 'text', extra = '') {
  return `<label for="field-${name}">${label}<input id="field-${name}" name="${name}" type="${inputType}" value="${escape(drafts[type][name] || '')}" placeholder="${placeholder}" ${extra} aria-describedby="input-error"></label>`;
}
function textarea(name: string, label: string, placeholder: string) {
  return `<label for="field-${name}">${label}<textarea id="field-${name}" name="${name}" placeholder="${placeholder}" rows="4" aria-describedby="input-error">${escape(drafts[type][name] || '')}</textarea></label>`;
}
function renderFields() {
  const panels: Record<ContentType, () => string> = {
    url: () => `${input('url', 'Web sitesi adresi', 'ornek.com', 'text', 'inputmode="url" autocapitalize="off" spellcheck="false"')}<p class="hint">${icon('link')}https:// sizin için otomatik eklenir.</p>`,
    text: () => `${textarea('text', 'Paylaşmak istediğiniz metin', 'Bir not, bir mesaj, bir fikir…')}<p class="hint">Dilediğiniz metni yazın. Türkçe karakterler ve emojiler desteklenir.</p>`,
    wifi: () => `${input('ssid', 'Ağ adı (SSID)', 'Wi-Fi ağınızın adı', 'text', 'autocomplete="off"')}${input('password', 'Şifre', 'Ağ şifresi', 'password', 'autocomplete="off"')}<label for="field-encryption">Şifreleme<select id="field-encryption" name="encryption"><option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">Yok (açık ağ)</option></select></label><label class="checkbox-label"><input id="field-hidden" name="hidden" type="checkbox" ${drafts[type].hidden === 'true' ? 'checked' : ''}>Gizli ağ</label><p class="hint">Ağ adını ve şifresini, büyük/küçük harf ve boşlukları koruyarak yazın.</p>`,
    email: () => `${input('email', 'E-posta adresi', 'merhaba@ornek.com', 'email')}${input('subject', 'Konu (isteğe bağlı)', 'Bir merhaba demek istedim')}${textarea('message', 'Mesaj (isteğe bağlı)', 'Mesajınızı yazın…')}`,
    phone: () => `${input('phone', 'Telefon numarası', '+90 555 123 45 67', 'tel')}<p class="hint">Ülke koduyla birlikte yazmanız önerilir. Tarandığında arama ekranı açılır.</p>`,
    sms: () => `${input('phone', 'Telefon numarası', '+90 555 123 45 67', 'tel')}${textarea('message', 'Mesaj (isteğe bağlı)', 'SMS mesajınızı yazın…')}`,
    vcard: () => `${input('name', 'Ad soyad', 'Deniz Yılmaz')}${input('phone', 'Telefon (isteğe bağlı)', '+90 555 123 45 67', 'tel')}${input('email', 'E-posta (isteğe bağlı)', 'deniz@ornek.com', 'email')}${input('company', 'Şirket (isteğe bağlı)', 'Şirket adı')}${input('website', 'Web sitesi (isteğe bağlı)', 'ornek.com', 'text', 'inputmode="url"')}`,
    location: () => `<div class="two-columns">${input('latitude', 'Enlem', '41.0082', 'text', 'inputmode="decimal"')}${input('longitude', 'Boylam', '28.9784', 'text', 'inputmode="decimal"')}</div><p class="hint">Enlem: −90 ile 90 · Boylam: −180 ile 180.<br>Örnek: İstanbul için 41.0082, 28.9784.</p>`,
  };
  $('#content-panel').innerHTML = panels[type]();
  $('#content-panel').setAttribute('aria-labelledby', `tab-${type}`);
  if (type === 'wifi') {
    $('#field-encryption').setAttribute('value', drafts.wifi.encryption || 'WPA');
    $<HTMLSelectElement>('#field-encryption').value = drafts.wifi.encryption || 'WPA';
    $<HTMLInputElement>('#field-password').disabled = drafts.wifi.encryption === 'nopass';
  }
}
function updateTheme() {
  document.documentElement.dataset.theme = theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : theme;
  const names: Record<string, string> = { system: 'Sistem', light: 'Aydınlık', dark: 'Karanlık' };
  $('#theme').innerHTML = `${icon(theme === 'system' ? 'monitor' : theme === 'light' ? 'sun' : 'moon')}<span>${names[theme]}</span>`;
  $('#theme').setAttribute('aria-label', `Tema: ${names[theme]}. Değiştirmek için tıklayın.`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', document.documentElement.dataset.theme === 'dark' ? '#131c18' : '#f8f9f6');
}
$('#theme').addEventListener('click', () => { theme = { system: 'light', light: 'dark', dark: 'system' }[theme]!; setPreference('theme', theme); updateTheme(); });
systemTheme.addEventListener('change', updateTheme);

function collectFields() {
  const fields: Fields = {};
  $('#content-panel').querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('[name]').forEach(el => {
    fields[el.name] = el instanceof HTMLInputElement && el.type === 'checkbox' ? String(el.checked) : el.value;
  });
  drafts[type] = fields;
  if (type === 'wifi') $<HTMLInputElement>('#field-password').disabled = fields.encryption === 'nopass';
}
function setExportDisabled(disabled: boolean) { document.querySelectorAll<HTMLButtonElement>('[data-export]').forEach(button => button.disabled = disabled); }
function schedule() {
  pending = true; valid = false; setExportDisabled(true);
  clearTimeout(timer); clearTimeout(historyTimer);
  timer = window.setTimeout(generate, 220);
}
$('#content-panel').addEventListener('input', () => { collectFields(); schedule(); });
function selectTab(next: ContentType, focus = false) {
  clearTimeout(timer); clearTimeout(historyTimer);
  type = next; sessionId = crypto.randomUUID();
  document.querySelectorAll<HTMLButtonElement>('[data-type]').forEach(button => {
    const active = button.dataset.type === type;
    button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
    if (active && focus) button.focus();
  });
  renderFields(); generate();
}
$('.tabs').addEventListener('click', event => { const tab = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-type]'); if (tab) selectTab(tab.dataset.type as ContentType); });
$('.tabs').addEventListener('keydown', event => {
  const keys = Object.keys(labels) as ContentType[], index = keys.indexOf(type);
  let next = index;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % keys.length;
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + keys.length - 1) % keys.length;
  else if (event.key === 'Home') next = 0; else if (event.key === 'End') next = keys.length - 1; else return;
  event.preventDefault(); selectTab(keys[next], true);
});

function updateWarnings(moduleCount = 21) {
  const warnings = [];
  if (contrastRatio(options.foreground, options.background) < 4.5) warnings.push('Renklerin kontrastı düşük. Daha koyu bir QR rengi ve açık bir arka plan seçin.');
  if (contrastRatio(options.foreground, '#ffffff') < contrastRatio(options.background, '#ffffff')) warnings.push('Açık renkli QR kodlar bazı telefonlarda okunmayabilir. Koyu ön plan önerilir.');
  if (options.margin < 4) warnings.push('Kenar boşluğu 4 modülden az; tarayıcılar kodu algılamakta zorlanabilir.');
  if (options.size / (moduleCount + options.margin * 2) < 3) warnings.push('Bu içerik için daha büyük bir görsel seçmeniz önerilir.');
  if (options.logo) warnings.push('Logo kodun bir bölümünü kapatır. Paylaşmadan önce tarayarak doğrulayın.');
  $('#design-warning').textContent = warnings.join(' ');
}
function generate() {
  pending = false;
  $('#input-error').textContent = '';
  $('#content-panel').querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  example = isEmpty(drafts[type]);
  try {
    if (['size-number', 'margin'].some(id => { const el = $<HTMLInputElement>(`#${id}`); return el.value === '' || !el.checkValidity(); })) throw new Error('Boyut için 128–1024, kenar boşluğu için 0–12 arasında tam sayı girin.');
    const payload = example ? 'https://ornek.com' : builders[type](drafts[type]);
    let result;
    try { result = createQrSvg(payload, options); } catch { throw new Error('İçerik QR kod kapasitesini aşıyor. Metni kısaltın, logoyu kaldırın veya hata düzeltme seviyesini düşürün.'); }
    currentPayload = payload; currentSvg = result.svg; valid = true;
    $('#qr-image').innerHTML = currentSvg; $('#qr-image').hidden = false; $('#qr-unavailable').hidden = true;
    $('#qr-status').innerHTML = `${icon('check')}${example ? 'Örnek QR kod' : 'Paylaşmaya hazır'}`;
    $('#qr-dimensions').textContent = `${options.size} × ${options.size} px`;
    updateWarnings(result.modules); setExportDisabled(false);
    clearTimeout(historyTimer);
    if (!example && remember) historyTimer = window.setTimeout(saveCurrent, 1200);
  } catch (error) {
    valid = false; currentSvg = ''; currentPayload = '';
    $('#input-error').textContent = (error as Error).message;
    $('#content-panel').querySelectorAll('[name]').forEach(el => el.setAttribute('aria-invalid', 'true'));
    $('#qr-image').innerHTML = ''; $('#qr-image').hidden = true; $('#qr-unavailable').hidden = false;
    $('#qr-status').textContent = 'İçeriği kontrol edin'; setExportDisabled(true); updateWarnings();
  }
}

function syncOptions() {
  for (const key of ['foreground','background'] as const) { $<HTMLInputElement>(`#${key}`).value = options[key]; $(`#${key}-value`).textContent = options[key].toUpperCase(); }
  $<HTMLInputElement>('#size').value = $<HTMLInputElement>('#size-number').value = String(options.size);
  $<HTMLInputElement>('#margin').value = String(options.margin);
  $<HTMLSelectElement>('#level').value = options.logo ? 'H' : options.level;
  $<HTMLSelectElement>('#level').disabled = !!options.logo;
  $('#logo-info').hidden = !options.logo;
  $('#logo-label').textContent = options.logo ? 'Logoyu değiştirin' : 'Ortaya bir logo ekleyin';
  document.querySelectorAll<HTMLButtonElement>('[data-style]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.style === options.style)));
  document.querySelectorAll<HTMLButtonElement>('[data-color]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.color === options.foreground)));
}
for (const key of ['foreground', 'background'] as const) $(`#${key}`).addEventListener('input', () => { options[key] = $<HTMLInputElement>(`#${key}`).value; syncOptions(); schedule(); });
for (const id of ['size', 'size-number', 'margin']) {
  $<HTMLInputElement>(`#${id}`).addEventListener('input', () => {
    const el = $<HTMLInputElement>(`#${id}`), value = el.valueAsNumber;
    if (!Number.isInteger(value) || value < Number(el.min) || value > Number(el.max)) { el.setCustomValidity(`${el.min}–${el.max} arasında tam sayı girin.`); pending = true; valid = false; clearTimeout(timer); clearTimeout(historyTimer); setExportDisabled(true); return; }
    el.setCustomValidity(''); if (id === 'margin') options.margin = value; else options.size = value;
    if (id === 'size') $<HTMLInputElement>('#size-number').value = String(value);
    if (id === 'size-number') $<HTMLInputElement>('#size').value = String(value);
    schedule();
  });
  $(`#${id}`).addEventListener('change', () => { const el = $<HTMLInputElement>(`#${id}`); if (!el.checkValidity()) el.reportValidity(); });
}
$('#level').addEventListener('change', () => { options.level = $<HTMLSelectElement>('#level').value as QrOptions['level']; schedule(); });
$('.preset-row').addEventListener('click', event => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-color]'); if (button) { options.foreground = button.dataset.color!; syncOptions(); schedule(); } });
$('.segmented').addEventListener('click', event => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-style]'); if (button) { options.style = button.dataset.style as QrOptions['style']; syncOptions(); schedule(); } });
$('#reset-style').addEventListener('click', () => { logoRequest++; options = { ...defaults }; $<HTMLInputElement>('#logo').value = ''; ['size-number','margin'].forEach(id => $<HTMLInputElement>(`#${id}`).setCustomValidity('')); syncOptions(); schedule(); toast('Tasarım ayarları sıfırlandı.'); });
let logoRequest = 0;
$('#logo').addEventListener('change', async () => {
  const file = $<HTMLInputElement>('#logo').files?.[0]; if (!file) return;
  const request = ++logoRequest; $('#logo-error').textContent = '';
  try { const logo = await readLogo(file); if (request !== logoRequest) return; options.logo = logo; syncOptions(); schedule(); } catch (error) { $('#logo-error').textContent = (error as Error).message || 'Görsel okunamadı. Başka bir dosya deneyin.'; }
});
$('#remove-logo').addEventListener('click', () => { logoRequest++; delete options.logo; $<HTMLInputElement>('#logo').value = ''; syncOptions(); schedule(); });

function saveCurrent() {
  if (!valid || pending || example || !remember) return;
  const item: HistoryItem = { id: sessionId, type, fields: { ...drafts[type] }, options: { ...options }, date: new Date().toISOString() };
  // Do not add duplicates when revisiting an identical code in another editing session.
  const equal = (x: HistoryItem) => x.type === type && JSON.stringify(x.fields) === JSON.stringify(item.fields) && JSON.stringify(x.options) === JSON.stringify(item.options);
  history = [item, ...history.filter(x => x.id !== sessionId && !equal(x))].slice(0, MAX_HISTORY);
  $('#storage-error').textContent = writeHistory(history) ? '' : 'Geçmiş cihazınıza kaydedilemedi. Tarayıcı depolaması dolu veya kapalı olabilir.';
  renderHistory();
}
function renderHistory() {
  $('#history-count').textContent = String(history.length);
  $<HTMLButtonElement>('#clear-history').disabled = history.length === 0;
  if (!history.length) { $('#history-list').innerHTML = `<div class="empty-history">${icon('qr')}<span>İlk QR kodunuzla başlayın.<small>Oluşturduğunuz kodlar burada sizi bekleyecek.</small></span></div>`; return; }
  $('#history-list').innerHTML = history.map(item => {
    let thumb = ''; try { thumb = createQrSvg(builders[item.type](item.fields), { ...item.options, size: 64, margin: Math.max(4, item.options.margin), logo: undefined }).svg; } catch { /* Corrupt entries can still be removed. */ }
    const title = item.type === 'wifi' ? item.fields.ssid : item.type === 'vcard' ? item.fields.name : item.type === 'email' ? item.fields.email : item.type === 'location' ? `${item.fields.latitude}, ${item.fields.longitude}` : item.fields.url || item.fields.text || item.fields.phone || labels[item.type];
    return `<article class="history-item"><button class="history-restore" data-restore="${escape(item.id)}" aria-label="${escape(title)} QR kodunu yeniden aç"><span class="history-thumb">${thumb}</span><span class="history-text"><strong>${escape(title)}</strong><span>${labels[item.type]}<span class="separator">·</span>${new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(item.date))}</span></span>${icon('arrow')}</button><button class="icon-button" data-delete="${escape(item.id)}" aria-label="${escape(title)} kaydını sil">${icon('trash')}</button></article>`;
  }).join('');
}
$('#history-list').addEventListener('click', event => {
  const el = event.target as HTMLElement, remove = el.closest<HTMLButtonElement>('[data-delete]'), restore = el.closest<HTMLButtonElement>('[data-restore]');
  if (remove) { history = history.filter(x => x.id !== remove.dataset.delete); if (!writeHistory(history)) toast('Kayıt kalıcı olarak silinemedi; tarayıcı depolamasını kontrol edin.'); renderHistory(); }
  if (restore) {
    const item = history.find(x => x.id === restore.dataset.restore); if (!item) return;
    drafts[item.type] = { ...item.fields }; options = { ...item.options }; selectTab(item.type); sessionId = item.id; syncOptions(); generate();
    $('#creator').scrollIntoView({ behavior: 'instant', block: 'start' }); $<HTMLInputElement>('#content-panel [name]').focus({ preventScroll: true }); toast('QR kodunuz yeniden açıldı.');
  }
});
$('#clear-history').addEventListener('click', () => { clearTimeout(historyTimer); history = []; if (!writeHistory(history)) toast('Geçmiş kalıcı olarak silinemedi; tarayıcı depolamasını kontrol edin.'); else toast('Geçmiş temizlendi.'); sessionId = crypto.randomUUID(); renderHistory(); });
$('#remember').addEventListener('change', () => { remember = $<HTMLInputElement>('#remember').checked; setPreference('remember', String(remember)); clearTimeout(historyTimer); if (remember) saveCurrent(); });

let toastTimer = 0;
function toast(message: string) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = window.setTimeout(() => $('#toast').classList.remove('visible'), 4000); }
async function exportImage(format: 'png' | 'svg') {
  if (!valid || pending) return;
  const svg = currentSvg, size = options.size;
  try { const blob = format === 'svg' ? new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }) : await svgToPng(svg, size); downloadBlob(blob, `qr-atolyesi-${size}.${format}`); saveCurrent(); toast(`${format.toUpperCase()} dosyanız indirildi.`); } catch { toast('Dosya oluşturulamadı. Lütfen tekrar deneyin.'); }
}
$('#download-png').addEventListener('click', () => void exportImage('png'));
$('#download-svg').addEventListener('click', () => void exportImage('svg'));
$('#copy').addEventListener('click', async () => {
  if (!valid || pending) return;
  if (!window.isSecureContext || !navigator.clipboard?.write || !('ClipboardItem' in window)) { toast('Bu tarayıcıda görsel kopyalama desteklenmiyor. PNG indir seçeneğini kullanın.'); return; }
  try {
    // Promise is passed immediately to retain the user gesture in Safari as well.
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': svgToPng(currentSvg, options.size) })]); saveCurrent(); toast('QR kod görsel olarak panoya kopyalandı.');
  } catch { toast('Panoya erişilemedi. Tarayıcı iznini kontrol edin veya PNG indirin.'); }
});
$('#print').addEventListener('click', () => { if (!valid || pending) return; $('#print-area').innerHTML = `${currentSvg}<p>QR Atölyesi${example ? ' · Örnek QR kod' : ''}</p>`; saveCurrent(); window.print(); });

renderFields(); syncOptions(); updateTheme(); renderHistory(); generate();
