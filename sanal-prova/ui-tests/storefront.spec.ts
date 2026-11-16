import { test, expect, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const artifacts = resolve('../../work/ui-checks');
const loginDemo = async (page: Page) => {
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click();
  await page.getByRole('button', { name: 'Demo hesabıyla keşfet' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Aktif ölçü profili')).toBeVisible();
};
async function checkLayout(page: Page) {
  const sizes = await page.evaluate(() => ({ width: window.innerWidth, scroll: document.documentElement.scrollWidth }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.width);
  const overlapping = await page.locator('.header-actions .icon-button').evaluateAll(elements => {
    const rects = elements.map(el => el.getBoundingClientRect());
    return rects.some((rect, i) => rects.some((other, j) => j > i && Math.min(rect.right, other.right) - Math.max(rect.left, other.left) > 2));
  });
  expect(overlapping).toBe(false);
}
async function checkCanvas(page: Page) {
  const canvas = page.locator('.canvas-host canvas');
  await expect(canvas).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.canvas-error')).toHaveCount(0);
  const pixels = await canvas.evaluate(element => {
    const source = element as HTMLCanvasElement;
    const copy = document.createElement('canvas'); copy.width = source.width; copy.height = source.height;
    const ctx = copy.getContext('2d')!; ctx.drawImage(source, 0, 0);
    const data = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let nonBackground = 0; let minX = copy.width, maxX = 0, minY = copy.height, maxY = 0;
    for (let y = 0; y < copy.height; y += 3) for (let x = 0; x < copy.width; x += 3) {
      const i = (y * copy.width + x) * 4;
      if (data[i]! < 160 && data[i + 1]! < 175 && data[i + 2]! < 180) {
        nonBackground++; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    return { nonBackground, minX, maxX, minY, maxY, width: copy.width, height: copy.height };
  });
  expect(pixels.nonBackground).toBeGreaterThan(100);
  expect(pixels.minX).toBeGreaterThan(5); expect(pixels.maxX).toBeLessThan(pixels.width - 5);
  expect(pixels.minY).toBeGreaterThan(5); expect(pixels.maxY).toBeLessThan(pixels.height - 5);
  const first = await canvas.screenshot();
  await page.getByRole('button', { name: 'Yakınlaştır', exact: true }).click();
  const second = await canvas.screenshot();
  expect(first.equals(second)).toBe(false);
  await page.getByRole('button', { name: 'Görünümü sıfırla', exact: true }).click();
  const dialogBox = await page.locator('.fitting-room').boundingBox();
  expect(dialogBox!.y).toBe(0);
}

test('desktop shopping, measurements, live fit and fitting room', async ({ page }) => {
  await mkdir(artifacts, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Sana uyan parçalar.' })).toBeVisible();
  await expect(page.locator('.product-card')).toHaveCount(4);
  await expect.poll(() => page.locator('.product-image-area img').evaluateAll(images => images.every(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)), { timeout: 20000 }).toBe(true);
  await expect(page.locator('.product-image-area img')).toHaveCount(4);
  await checkLayout(page);
  await page.screenshot({ path: resolve(artifacts, 'desktop-collection.png'), fullPage: true });
  await page.getByRole('tab', { name: 'Gömlek', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.getByRole('tab', { name: 'Tümü', exact: true }).click();
  await page.getByRole('button', { name: 'Favorilere ekle' }).first().click();
  await page.getByRole('link', { name: 'Favorilerim', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.getByRole('link', { name: 'Koleksiyon', exact: true }).first().click();
  await loginDemo(page);
  await expect(page.locator('.fit-badge')).toHaveCount(4);
  await page.getByRole('link', { name: 'Bana uyanlar', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.getByRole('link', { name: 'Regular denim', exact: true }).last().click();
  await expect(page.locator('.fit-panel')).toContainText('%100');
  await page.getByRole('button', { name: 'S', exact: true }).click();
  await expect(page.locator('.fit-panel')).not.toContainText('%100');
  await page.getByRole('button', { name: 'M bedeni seç' }).click();
  await expect(page.locator('.fit-panel')).toContainText('%100');
  await page.screenshot({ path: resolve(artifacts, 'desktop-product.png'), fullPage: true });
  await page.getByRole('button', { name: 'Prova odasına gir' }).click();
  await checkCanvas(page);
  await page.screenshot({ path: resolve(artifacts, 'desktop-3d.png') });
  await page.getByRole('button', { name: '2D', exact: true }).click();
  await expect(page.locator('.fitting-image')).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: resolve(artifacts, 'desktop-2d.png') });
  await page.getByRole('button', { name: 'Prova odasını kapat' }).click();
  await page.getByRole('button', { name: 'Sepete ekle', exact: true }).click();
  await page.getByRole('link', { name: /Sepetim/ }).click();
  await expect(page.locator('.cart-item')).toHaveCount(1);
  await page.getByRole('textbox', { name: 'Ad soyad', exact: true }).fill('Arayüz Test');
  await page.getByRole('textbox', { name: 'Adres', exact: true }).fill('Test adresi sokak 12');
  await page.getByRole('textbox', { name: 'Şehir', exact: true }).fill('Istanbul');
  await page.getByRole('textbox', { name: 'Posta kodu', exact: true }).fill('34000');
  await page.getByRole('button', { name: 'Sipariş oluştur', exact: true }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.locator('.order-status').first()).toHaveText('Ödeme bekleniyor');
  await page.getByRole('button', { name: 'Siparişi iptal et' }).first().click();
  await expect(page.locator('.order-status').first()).toHaveText('İptal edildi');
  await page.goto('/measurements');
  await page.getByRole('button', { name: 'Yeni profil' }).click();
  await page.getByRole('textbox', { name: 'Profil adı', exact: true }).fill('UI test profili');
  for (const [label, value] of [['Boy', '172'], ['Kilo', '68'], ['Göğüs çevresi', '94'], ['Bel çevresi', '76'], ['Basen çevresi', '100'], ['İç bacak boyu', '78'], ['Dış bacak boyu', '102'], ['Omuz genişliği', '40']])
    await page.getByRole('spinbutton', { name: label, exact: true }).fill(value!);
  await page.getByRole('button', { name: 'Ölçülerimi kaydet' }).click();
  await expect(page.locator('.section-heading h2')).toHaveText('UI test profili');
  await page.getByRole('button', { name: 'Profili sil' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Profili sil' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await checkLayout(page);
  expect(errors).toEqual([]);
});

test('mobile catalog and 3D avatar remain framed and usable', async ({ page }) => {
  await mkdir(artifacts, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.product-card')).toHaveCount(4);
  await expect.poll(() => page.locator('.product-image-area img').evaluateAll(images => images.every(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)), { timeout: 20000 }).toBe(true);
  await checkLayout(page);
  await page.screenshot({ path: resolve(artifacts, 'mobile-collection.png'), fullPage: true });
  await loginDemo(page);
  await page.getByRole('link', { name: 'Regular denim', exact: true }).last().click();
  await expect(page.locator('.fit-panel')).toContainText('%100');
  await page.screenshot({ path: resolve(artifacts, 'mobile-product.png'), fullPage: true });
  await page.getByRole('button', { name: 'Prova odasına gir' }).click();
  await checkCanvas(page);
  await page.screenshot({ path: resolve(artifacts, 'mobile-3d.png') });
  await checkLayout(page);
  await page.getByRole('button', { name: 'Prova odasını kapat' }).click();
  await page.goto('/measurements');
  await expect(page.locator('.measurements-fields')).toBeVisible();
  await checkLayout(page);
  await page.screenshot({ path: resolve(artifacts, 'mobile-measurements.png'), fullPage: true });
});

test('compact, tablet and wide layouts retain visible controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.product-card')).toHaveCount(4);
  await expect(page.locator('.product-image-area img')).toHaveCount(4);
  await expect.poll(() => page.locator('.product-image-area img').evaluateAll(images => images.every(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0)), { timeout: 20000 }).toBe(true);
  for (const width of [320, 768, 1920]) {
    await page.setViewportSize({ width, height: width === 1920 ? 1080 : 900 });
    await checkLayout(page);
    const clipped = await page.locator('.wordmark, .product-card h3, .button, .category-tabs button').evaluateAll(elements =>
      elements.filter(element => element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 2).map(element => element.textContent));
    expect(clipped).toEqual([]);
    await page.screenshot({ path: resolve(artifacts, `collection-${width}.png`), fullPage: true });
  }
});
