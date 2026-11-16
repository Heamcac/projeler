export function normalizeMobile(value: string) {
  if (!/^\+?[\d ()-]+$/.test(value.trim())) return null;
  const digits = value.replace(/\D/g, "");
  const local = digits.replace(/^(?:0090|90|0)(?=5\d{9}$)/, "");
  return /^5\d{9}$/.test(local) ? `90${local}` : null;
}

export function whatsappLink(phone: string, message: string) {
  const number = normalizeMobile(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}
