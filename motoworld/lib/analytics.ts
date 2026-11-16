export const preferenceCookie = "motoworld-analytics";
export const preferenceLifetime = 180 * 24 * 60 * 60;

export function analyticsDomain() {
  const domain = process.env.PLAUSIBLE_DOMAIN?.trim().toLowerCase();
  return domain && /^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,}$/.test(domain) ? domain : null;
}
