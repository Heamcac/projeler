import { expect, test, type Page } from "@playwright/test";

const initialPassword = "Test-start-password-2026!";
const nextPassword = "Test-rotated-password-2026!";
const firstPhone = "0555 000 11 10";

async function fillBooking(page: Page, phone: string, date?: string) {
  await page.goto("/randevu");
  await page.getByRole("button", { name: "Reddet", exact: true }).click({ timeout: 2000 }).catch(() => {});
  await page.getByRole("textbox", { name: "Marka", exact: true }).fill("Honda");
  await page.getByRole("textbox", { name: "Model", exact: true }).fill("CBF");
  await page.getByRole("spinbutton", { name: "Model yılı" }).fill("2021");
  await page.getByRole("combobox", { name: "CC grubu" }).selectOption("125-250");
  await page.getByRole("button", { name: "Devam et" }).click();
  await page.getByRole("checkbox", { name: /Yağ \+ yağ filtresi/ }).check();
  await page.getByRole("button", { name: "Devam et" }).click();
  const picker = page.getByRole("combobox", { name: "Tarih", exact: true });
  const [selected] = await picker.selectOption(date ?? { index: 2 });
  await page.getByText("08:30", { exact: true }).click();
  await page.getByRole("button", { name: "Devam et" }).click();
  await expect(page.getByRole("link", { name: "KVKK aydınlatma metni" })).toHaveAttribute("href", "/gizlilik-ve-kvkk");
  await expect(page.getByRole("link", { name: "Çerez politikası", exact: true }).first()).toHaveAttribute("href", "/cerez-politikasi");
  await page.getByLabel("Ad soyad", { exact: true }).fill("Deneme Sürücü");
  await page.getByLabel("Cep telefonu", { exact: true }).fill(phone);
  await page.getByRole("button", { name: "Devam et" }).click();
  await page.getByRole("button", { name: "Randevu isteği gönder" }).click();
  return selected;
}

async function login(page: Page, password: string) {
  await page.getByLabel("E-posta", { exact: true }).fill("test-admin@example.test");
  await page.getByLabel("Şifre", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Giriş yap", exact: true }).click();
}

test("müşteri ve yönetim rezervasyon akışı, fiyat önbelleği ve bildirim kaydı", async ({ page, request, context }) => {
  const date = await fillBooking(page, firstPhone);
  await expect(page.getByRole("heading", { name: "Randevu isteğiniz alındı" })).toBeVisible();
  const firstCode = ((await page.getByText(/^MW-[A-Z0-9]{5}$/).textContent()) ?? "").trim();

  await fillBooking(page, firstPhone, date);
  await expect(page.getByRole("alert").filter({ hasText: "aynı saatte zaten bir randevu" })).toBeVisible();
  await page.goto("/randevu-sorgula");
  await page.getByLabel("Rezervasyon kodu").fill(firstCode);
  await page.getByLabel("Cep telefonu").fill(firstPhone);
  await page.getByRole("button", { name: "Randevuyu sorgula" }).click();
  await expect(page.getByText("Beklemede", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Randevuyu iptal et" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Randevuyu iptal et" }).click();
  await expect(page.getByText("Randevu iptal edildi.", { exact: true })).toBeVisible();

  await fillBooking(page, "0555 000 11 11", date);
  await expect(page.getByRole("heading", { name: "Randevu isteğiniz alındı" })).toBeVisible();
  const secondCode = ((await page.getByText(/^MW-[A-Z0-9]{5}$/).textContent()) ?? "").trim();
  const anonymous = await request.post("/api/admin/prices");
  expect(anonymous.status()).toBe(401);
  await page.goto("/fiyatlar");
  await page.getByRole("tab", { name: "125-250 cc" }).click();
  await expect(page.getByRole("cell", { name: "1.800–3.200 ₺", exact: true })).toBeVisible();

  const detail = `/admin/rezervasyonlar/${secondCode}`;
  const bookingRedirect = (path: string) => (url: URL) =>
    url.pathname === path && url.searchParams.get("next") === detail;
  await page.goto(detail);
  await expect(page).toHaveURL(bookingRedirect("/admin/giris"));
  await login(page, initialPassword);
  await expect(page).toHaveURL(bookingRedirect("/admin/hesap"));
  const session = (await context.cookies()).find((record) => record.name === "motoworld-admin");
  expect(session).toMatchObject({ httpOnly: true, secure: true, sameSite: "Lax" });
  const forbidden = await request.post("/api/admin/prices", { headers: { Cookie: `motoworld-admin=${session?.value}`, Origin: "https://foreign.example" } });
  expect(forbidden.status()).toBe(403);
  const rotationRequired = await request.post("/api/admin/prices", { headers: { Cookie: `motoworld-admin=${session?.value}`, Origin: "http://127.0.0.1:3110" } });
  expect(rotationRequired.status()).toBe(403);
  await page.getByLabel("Mevcut şifre", { exact: true }).fill(initialPassword);
  await page.getByLabel("Yeni şifre", { exact: true }).fill(nextPassword);
  await page.getByLabel("Yeni şifre (tekrar)", { exact: true }).fill(nextPassword);
  await page.getByRole("button", { name: "Şifreyi değiştir" }).click();
  await expect(page).toHaveURL(bookingRedirect("/admin/giris"));
  await login(page, nextPassword);
  await expect(page).toHaveURL(new RegExp(`${detail}$`));
  await expect(page.getByText("Beklemede", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Onayla", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Randevu onaylandı", exact: true }).first()).toBeVisible();
  await page.goto("/admin/fiyatlar");
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.getByRole("textbox", { name: "Periyodik bakım, 125-250 cc, minimum fiyat", exact: true }).fill("1860");
  await page.getByRole("button", { name: "Fiyatları toplu kaydet" }).click();
  await expect(page.getByText("Fiyatlar kaydedildi.", { exact: true })).toBeVisible();
  await page.goto("/fiyatlar");
  await page.getByRole("tab", { name: "125-250 cc" }).click();
  await expect(page.getByRole("cell", { name: "1.860–3.200 ₺", exact: true })).toBeVisible();

  await page.goto("/");
  await page.goto("/admin/site-ayarlari");
  await page.getByRole("textbox", { name: "Hakkımızda", exact: true }).fill("Geçici SEO doğrulama açıklaması");
  await page.getByRole("button", { name: "Site ayarlarını kaydet" }).click();
  await expect(page.getByText("Site ayarları kaydedildi.", { exact: true })).toBeVisible();
  await page.goto("/");
  expect(JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? "{}").description)
    .toBe("Geçici SEO doğrulama açıklaması");
});

test("375, 768 ve 1280 pikselde taşma yok; CSP, SEO ve tercihe bağlı analitik çalışır", async ({ page, request }) => {
  const seen: string[] = [];
  await page.route("https://plausible.io/api/event", async (route) => {
    seen.push(route.request().postData() ?? "");
    await route.fulfill({ status: 202, headers: { "access-control-allow-origin": "*" } });
  });
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/?example=remove");
    expect((await response?.allHeaders())?.["content-security-policy"]).toContain("'strict-dynamic'");
    await expect(page.getByRole("heading", { name: "MOTOWORLD", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  const canonical = await page.locator("link[rel=canonical]").getAttribute("href");
  expect(new URL(canonical ?? "").href).toBe("http://127.0.0.1:3110/");
  expect(JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? "{}").name).toBe("MOTOWORLD");
  expect(seen).toHaveLength(0);
  await page.getByRole("button", { name: "Kabul et", exact: true }).click();
  await expect.poll(() => seen.length).toBe(1);
  expect(seen[0]).not.toContain("example=remove");
  await page.getByRole("button", { name: "Çerez tercihleri", exact: true }).click();
  await page.getByRole("button", { name: "Reddet", exact: true }).click();
  await page.goto("/gizlilik-ve-kvkk");
  await expect(page.getByRole("heading", { name: "KVKK aydınlatma metni", exact: true })).toBeVisible();
  expect(seen).toHaveLength(1);
  await page.goto("/randevu");
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("button", { name: "Devam et" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("http://127.0.0.1:3110/gizlilik-ve-kvkk");
  expect(await (await request.get("/robots.txt")).text()).toContain("http://127.0.0.1:3110/sitemap.xml");
  expect((await request.get("/api/health")).status()).toBe(200);
  expect((await request.get("/api/cron/privacy")).status()).toBe(401);
  expect((await request.get("/api/cron/privacy", { headers: { Authorization: "Bearer motoworld-test-cron-secret" } })).status()).toBe(200);
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual(["192x192", "512x512"]);
  const missing = await page.goto("/bu-sayfa-yok");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Sayfa bulunamadı" })).toBeVisible();
});
