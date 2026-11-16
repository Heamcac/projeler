import assert from "node:assert/strict";
import { test } from "node:test";
import { readAdminForm, validOrigin } from "../lib/security";

test("Yönetim yazma işlemleri yalnızca ayarlı kökeni kabul eder", () => {
  const previous = process.env.SITE_URL;
  process.env.SITE_URL = "https://motoworld.example";
  try {
    assert.equal(validOrigin("https://motoworld.example"), true);
    assert.equal(validOrigin("https://other.example", "https://other.example/local"), false);
    assert.equal(validOrigin("http://motoworld.example"), false);
    assert.equal(validOrigin(null), false);
  } finally {
    if (previous === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = previous;
  }
});

test("Yönetim formlarında dosya ve büyük gövde reddedilir", async () => {
  const url = "https://motoworld.example/api/admin/settings";
  const regular = await readAdminForm(new Request(url, { method: "POST", body: new URLSearchParams({ value: "deneme" }) }));
  assert.equal(regular.form?.get("value"), "deneme");
  const large = await readAdminForm(new Request(url, { method: "POST", body: new URLSearchParams({ value: "a".repeat(128 * 1024) }) }));
  assert.equal(large.status, 413);
  const upload = new FormData();
  upload.set("value", new Blob(["test"]), "deneme.txt");
  assert.equal((await readAdminForm(new Request(url, { method: "POST", body: upload }))).status, 400);
});
