/** Фото паспорта: JPG / PNG / WEBP до 5 МБ */
export const PASSPORT_MAX_MB = 5;
export const PASSPORT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface PassportFiles {
  front: File | null;
  back: File | null;
}

/** Проверка файла: тип и размер. Возвращает ключ ошибки или null */
export function checkPassportFile(f: File) {
  if (!PASSPORT_TYPES.includes(f.type)) return 'passport.typeError';
  if (f.size > PASSPORT_MAX_MB * 1024 * 1024) return 'passport.sizeError';
  return null;
}

/** Файл → data URL (для моков; настоящий backend получит файл через multipart/form-data) */
export const fileToDataUrl = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(f);
  });

/** То же для любых фото (филиал и т.д.) */
export const checkImageFile = checkPassportFile;
