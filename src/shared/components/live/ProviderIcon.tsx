import { FiLink } from 'react-icons/fi';
import { SiGooglemeet, SiTelegram, SiZoom } from 'react-icons/si';
import type { MeetingProvider } from '@/core/types/models';

const ICONS = { google_meet: SiGooglemeet, zoom: SiZoom, telegram: SiTelegram } as const;
const COLORS = { google_meet: '#00897B', zoom: '#2D8CFF', telegram: '#26A5E4' } as const;

/** Логотип сервиса видеосвязи */
export function ProviderIcon({
  provider,
  size = 18,
}: {
  provider: MeetingProvider;
  size?: number;
}) {
  if (provider in ICONS) {
    const k = provider as keyof typeof ICONS;
    const Icon = ICONS[k];
    return <Icon size={size} color={COLORS[k]} aria-hidden />;
  }
  return <FiLink size={size} aria-hidden />;
}
