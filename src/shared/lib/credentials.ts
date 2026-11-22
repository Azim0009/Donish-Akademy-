/**
 * Логины и пароли. Сотрудники входят по логину вида name.surname@donish.tj,
 * их создаёт руководитель: SuperAdmin → директор → менторы и сотрудники.
 */
export const STAFF_DOMAIN = 'donish.tj';

const TR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', ғ: 'gh', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', ӣ: 'i', й: 'y', к: 'k', қ: 'q', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ӯ: 'u', ф: 'f', х: 'kh', ҳ: 'h', ц: 'ts', ч: 'ch', ҷ: 'j', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/** «Фаридун Рахимов» → «faridun.rakhimov» */
export function loginFromName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .split('')
    .map((ch) => TR[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 30);
}

/** Часть до @: латиница, цифры, точка, дефис, 3–30 символов */
export const LOGIN_RE = /^[a-z0-9][a-z0-9._-]{2,29}$/;
export const staffEmail = (login: string) => `${login.trim().toLowerCase()}@${STAFF_DOMAIN}`;

/** Пароль: от 8 символов, есть буква и цифра */
export const isStrongPassword = (p: string) => p.length >= 8 && /[a-zA-Z]/.test(p) && /\d/.test(p);

/** Случайный пароль без похожих символов (0/O, 1/l) */
export function generatePassword(len = 10) {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const all = letters + digits;
  const rnd = (n: number) => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  };
  const chars = [letters[rnd(letters.length)], digits[rnd(digits.length)], ...Array.from({ length: len - 2 }, () => all[rnd(all.length)])];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/** Ссылка WhatsApp с готовым текстом на номер (+992 90 000 00 00 → 992900000000) */
export function whatsappLink(phone: string, text: string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 9) digits = `992${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
