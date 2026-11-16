export const bookingReturnHeader = "x-motoworld-booking-return";

export function bookingReturnPath(value: unknown) {
  return typeof value === "string" && /^\/admin\/rezervasyonlar\/MW-[A-Z0-9]{5}$/.test(value) ? value : undefined;
}

export function adminEntry(path: "/admin/giris" | "/admin/hesap", next: unknown) {
  const booking = bookingReturnPath(next);
  return booking ? `${path}?${new URLSearchParams({ next: booking })}` : path;
}
