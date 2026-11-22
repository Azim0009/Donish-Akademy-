import {
  FiBarChart2,
  FiBookOpen,
  FiCheckSquare,
  FiClipboard,
  FiCpu,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiShoppingBag,
  FiUsers,
  FiVideo,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';

/**
 * Функции филиала: SuperAdmin включает их при создании филиала.
 * Выключенная функция скрывает свои разделы у ВСЕХ сотрудников и учеников этого филиала.
 * soon — раздел ещё делается (задачи 17–30), но галочку можно поставить заранее.
 */
export interface BranchFeature {
  key: string;
  labelKey: string;
  icon: IconType;
  /** разделы меню, которые включает эта функция (ключи из core/navigation/menus.ts) */
  sections: string[];
  soon?: boolean;
}

export const BRANCH_FEATURES: BranchFeature[] = [
  {
    key: 'courses',
    labelKey: 'features.courses',
    icon: FiBookOpen,
    sections: ['director.tracks', 'student.tracks'],
  },
  {
    key: 'groups',
    labelKey: 'features.groups',
    icon: FiGrid,
    sections: ['director.groups', 'mentor.groups'],
  },
  {
    key: 'live',
    labelKey: 'features.live',
    icon: FiVideo,
    sections: ['mentor.live', 'student.live'],
  },
  {
    key: 'homework',
    labelKey: 'features.homework',
    icon: FiCheckSquare,
    sections: ['mentor.reviewQueue'],
  },
  {
    key: 'reception',
    labelKey: 'features.reception',
    icon: FiUsers,
    sections: ['administrator.students'],
  },
  {
    key: 'statistics',
    labelKey: 'features.statistics',
    icon: FiBarChart2,
    sections: ['director.statistics'],
  },
  { key: 'finance', labelKey: 'features.finance', icon: FiDollarSign, sections: [], soon: true },
  { key: 'tasks', labelKey: 'features.tasks', icon: FiClipboard, sections: [], soon: true },
  { key: 'sales', labelKey: 'features.sales', icon: FiShoppingBag, sections: [], soon: true },
  {
    key: 'contracts',
    labelKey: 'features.contracts',
    icon: FiFileText,
    sections: ['director.contracts'],
  },
  { key: 'aiMentor', labelKey: 'features.aiMentor', icon: FiCpu, sections: [], soon: true },
];

export const ALL_FEATURES = BRANCH_FEATURES.map((f) => f.key);

/** Разделы, которые скрыты, потому что их функция выключена в филиале */
export function sectionsOffByBranch(features?: string[] | null) {
  if (!features) return new Set<string>(); // не задано — всё включено
  return new Set(
    BRANCH_FEATURES.filter((f) => !features.includes(f.key)).flatMap((f) => f.sections),
  );
}
