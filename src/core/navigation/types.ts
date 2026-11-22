import type { IconType } from 'react-icons';

/** Пункт меню панели. labelKey — ключ i18n */
export interface MenuItem {
  to: string;
  labelKey: string;
  icon: IconType;
  /** true — активен только при точном совпадении пути (для главной панели) */
  end?: boolean;
  /** Ключ раздела для мульти-доступа, например 'director.groups'. Его можно выключить сотруднику */
  section: string;
  /** Общий раздел (уведомления, настройки) — есть у всех, выключить нельзя */
  common?: boolean;
}
