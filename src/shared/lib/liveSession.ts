import type { BadgeTone } from '@/shared/ui';
import type { LiveSession, MeetingProvider } from '@/core/types/models';

/**
 * Онлайн-уроки идут во внешнем сервисе видеосвязи (Google Meet, Zoom, Telegram, Jitsi).
 * Платформа хранит ссылку, показывает расписание и кнопку «Подключиться»,
 * а после урока — запись (YouTube / Google Drive / Vimeo) прямо внутри урока.
 */

export const PROVIDER_LABEL: Record<MeetingProvider, string> = {
  google_meet: 'Google Meet',
  zoom: 'Zoom',
  telegram: 'Telegram',
  jitsi: 'Jitsi Meet',
  other: 'Видеосвязь',
};

/** Определяем сервис по ссылке */
export function detectProvider(url: string): MeetingProvider {
  let host = '';
  try {
    host = new URL(url.trim()).hostname.toLowerCase();
  } catch {
    return 'other';
  }
  if (host === 'meet.google.com') return 'google_meet';
  if (host === 'zoom.us' || host.endsWith('.zoom.us')) return 'zoom';
  if (host === 't.me' || host === 'telegram.me') return 'telegram';
  if (host === 'meet.jit.si' || host.endsWith('.jitsi.net') || host === '8x8.vc') return 'jitsi';
  return 'other';
}

/** Ссылка должна быть https:// — иначе не принимаем */
export function isValidHttpsUrl(url: string) {
  try {
    const u = new URL(url.trim());
    return u.protocol === 'https:' && !!u.hostname.includes('.');
  } catch {
    return false;
  }
}

/** Превращаем обычную ссылку на запись в ссылку для встраивания (iframe) */
export function toEmbedUrl(url: string | null | undefined): string | null {
  if (!url || !isValidHttpsUrl(url)) return null;
  const u = new URL(url.trim());
  const host = u.hostname.replace(/^www\.|^m\./, '');
  // YouTube: watch?v=ID, youtu.be/ID, /shorts/ID, /live/ID, /embed/ID
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const id =
      u.searchParams.get('v') ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  // Google Drive: /file/d/ID/view → /file/d/ID/preview
  if (host === 'drive.google.com') {
    const id = u.pathname.match(/\/file\/d\/([\w-]+)/)?.[1] ?? u.searchParams.get('id');
    return id ? `https://drive.google.com/file/d/${id}/preview` : null;
  }
  // Vimeo: vimeo.com/ID → player.vimeo.com/video/ID
  if (host === 'vimeo.com') {
    const id = u.pathname.match(/^\/(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (host === 'player.vimeo.com') return u.toString();
  return null;
}

export type SessionState = 'upcoming' | 'soon' | 'live' | 'ended' | 'cancelled';

/** Подключиться можно за 15 минут до начала и до конца урока */
export const JOIN_BEFORE_MIN = 15;

export function sessionState(s: LiveSession, now = Date.now()): SessionState {
  if (s.isCancelled) return 'cancelled';
  const start = new Date(s.startsAt).getTime();
  const end = start + s.durationMinutes * 60_000;
  if (now >= end) return 'ended';
  if (now >= start) return 'live';
  if (now >= start - JOIN_BEFORE_MIN * 60_000) return 'soon';
  return 'upcoming';
}

export const canJoin = (s: LiveSession, now = Date.now()) =>
  ['soon', 'live'].includes(sessionState(s, now));

export const sessionTone: Record<SessionState, BadgeTone> = {
  upcoming: 'blue',
  soon: 'amber',
  live: 'red',
  ended: 'gray',
  cancelled: 'gray',
};

/** Ближайший урок: идущий сейчас или следующий по времени */
export function nextSession(list: LiveSession[], now = Date.now()) {
  return (
    [...list]
      .filter((s) => ['live', 'soon', 'upcoming'].includes(sessionState(s, now)))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null
  );
}

/** «14:00–16:00» */
export const timeRange = (s: LiveSession) => {
  const start = new Date(s.startsAt);
  const end = new Date(start.getTime() + s.durationMinutes * 60_000);
  const hm = (d: Date) => d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${hm(start)}–${hm(end)}`;
};

// ---------- Выбор сервиса видеосвязи (ментор) ----------
/** Что выбирает ментор: три основных сервиса или любая другая ссылка (Jitsi и др.) */
export type PickProvider = 'google_meet' | 'zoom' | 'telegram' | 'other';
export const PICK_PROVIDERS: PickProvider[] = ['google_meet', 'zoom', 'telegram', 'other'];
export const pickOf = (p: MeetingProvider): PickProvider => (p === 'jitsi' ? 'other' : p);

/** Где создать новую встречу */
export const NEW_MEETING_URL: Record<Exclude<PickProvider, 'other'>, string> = {
  google_meet: 'https://meet.new',
  zoom: 'https://zoom.us/meeting/schedule',
  telegram: 'https://web.telegram.org/',
};

export const PROVIDER_PLACEHOLDER: Record<PickProvider, string> = {
  google_meet: 'https://meet.google.com/abc-defg-hij',
  zoom: 'https://us05web.zoom.us/j/123456789?pwd=…',
  telegram: 'https://t.me/+AbCdEf…?videochat',
  other: 'https://meet.jit.si/donish-fs01',
};

/** Ссылка подходит выбранному сервису */
export const matchesProvider = (url: string, pick: PickProvider) =>
  pick === 'other' || detectProvider(url) === pick;

/** Сервис, выбранный ментором в прошлый раз */
const PROVIDER_KEY = 'donish.liveProvider';
export function lastProvider(): PickProvider {
  try {
    const v = localStorage.getItem(PROVIDER_KEY) as PickProvider | null;
    return v && PICK_PROVIDERS.includes(v) ? v : 'google_meet';
  } catch {
    return 'google_meet';
  }
}
export function rememberProvider(p: PickProvider) {
  try {
    localStorage.setItem(PROVIDER_KEY, p);
  } catch {
    /* приватный режим — просто не запоминаем */
  }
}
