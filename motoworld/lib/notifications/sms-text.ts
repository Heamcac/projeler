const basic = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const extended = "^{}\\[~]|€";
const units = (character: string) => extended.includes(character) ? 2 : 1;

export function singleSms(text: string, limit = 160) {
  const plain = text.replace(/ı/g, "i").normalize("NFD").replace(/\p{M}/gu, "")
    .replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-");
  const characters = [...plain].map((character) => basic.includes(character) || extended.includes(character) ? character : " ");
  if (characters.reduce((total, character) => total + units(character), 0) <= limit) return characters.join("").trim();
  let remaining = limit - 3;
  let result = "";
  for (const character of characters) {
    remaining -= units(character);
    if (remaining < 0) break;
    result += character;
  }
  return `${result.trimEnd()}...`;
}

export function smsWithLink(text: string, link: string) {
  const limit = 159 - [...link].reduce((total, character) => total + units(character), 0);
  return [singleSms(text, limit < 8 ? 64 : limit), link].filter(Boolean).join("\n");
}
