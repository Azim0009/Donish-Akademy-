import {
  FiArchive,
  FiAward,
  FiBarChart2,
  FiBell,
  FiDollarSign,
  FiInbox,
  FiCreditCard,
  FiPhoneCall,
  FiBriefcase,
  FiSend,
  FiList,
  FiBookOpen,
  FiCheckSquare,
  FiFileText,
  FiGrid,
  FiHome,
  FiMapPin,
  FiSettings,
  FiShield,
  FiSliders,
  FiUser,
  FiUserCheck,
  FiUsers,
  FiVideo,
} from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import type { Role } from '@/core/auth/roles';
import type { MenuItem } from './types';

/**
 * Все разделы всех ролей в одном месте.
 * Сайдбар собирает меню из ролей пользователя (мульти-роль) и убирает выключенные разделы.
 * Ключ section = `${роль}.${раздел}` — по нему SuperAdmin / директор включают и выключают доступ.
 */
const common = (role: string, p: { notifications: string; settings: string }): MenuItem[] => [
  {
    to: p.notifications,
    labelKey: 'pages.common.notifications',
    icon: FiBell,
    section: `${role}.notifications`,
    common: true,
  },
  {
    to: p.settings,
    labelKey: 'pages.common.settings',
    icon: FiSettings,
    section: `${role}.settings`,
    common: true,
  },
];

export const MENUS: Record<Role, MenuItem[]> = {
  super_admin: [
    {
      to: PATHS.superAdmin.root,
      labelKey: 'pages.superAdmin.dashboard',
      icon: FiHome,
      end: true,
      section: 'super_admin.dashboard',
    },
    {
      to: PATHS.superAdmin.branches,
      labelKey: 'pages.superAdmin.branches',
      icon: FiMapPin,
      section: 'super_admin.branches',
    },
    {
      to: PATHS.superAdmin.users,
      labelKey: 'pages.superAdmin.users',
      icon: FiUsers,
      section: 'super_admin.users',
    },
    {
      to: PATHS.superAdmin.courses,
      labelKey: 'pages.superAdmin.courses',
      icon: FiBookOpen,
      section: 'super_admin.courses',
    },
    {
      to: PATHS.superAdmin.partners,
      labelKey: 'pages.superAdmin.partners',
      icon: FiUserCheck,
      section: 'super_admin.partners',
    },
    {
      to: PATHS.superAdmin.requests,
      labelKey: 'pages.superAdmin.requests',
      icon: FiInbox,
      section: 'super_admin.requests',
    },
    {
      to: PATHS.superAdmin.finance,
      labelKey: 'pages.superAdmin.finance',
      icon: FiDollarSign,
      section: 'super_admin.finance',
    },
    {
      to: PATHS.superAdmin.reports,
      labelKey: 'pages.superAdmin.reports',
      icon: FiSend,
      section: 'super_admin.reports',
    },
    {
      to: PATHS.superAdmin.tasks,
      labelKey: 'pages.common.tasks',
      icon: FiCheckSquare,
      section: 'super_admin.tasks',
    },
    {
      to: PATHS.superAdmin.statistics,
      labelKey: 'pages.superAdmin.statistics',
      icon: FiBarChart2,
      section: 'super_admin.statistics',
    },
    {
      to: PATHS.superAdmin.branchDirectors,
      labelKey: 'pages.superAdmin.branchDirectors',
      icon: FiShield,
      section: 'super_admin.directors',
    },
    {
      to: PATHS.superAdmin.contracts,
      labelKey: 'pages.common.contracts',
      icon: FiFileText,
      section: 'super_admin.contracts',
    },
    {
      to: PATHS.superAdmin.auditLog,
      labelKey: 'pages.superAdmin.auditLog',
      icon: FiList,
      section: 'super_admin.audit',
    },
    {
      to: PATHS.superAdmin.globalSettings,
      labelKey: 'pages.superAdmin.globalSettings',
      icon: FiSliders,
      section: 'super_admin.globalSettings',
    },
    ...common('super_admin', PATHS.superAdmin),
  ],
  director: [
    {
      to: PATHS.director.root,
      labelKey: 'pages.director.dashboard',
      icon: FiHome,
      end: true,
      section: 'director.dashboard',
    },
    {
      to: PATHS.director.tracks,
      labelKey: 'pages.director.tracks',
      icon: FiBookOpen,
      section: 'director.tracks',
    },
    {
      to: PATHS.director.groups,
      labelKey: 'pages.director.groups',
      icon: FiGrid,
      section: 'director.groups',
    },
    {
      to: PATHS.director.staff,
      labelKey: 'pages.director.staff',
      icon: FiBriefcase,
      section: 'director.staff',
    },
    {
      to: PATHS.director.students,
      labelKey: 'pages.director.students',
      icon: FiUsers,
      section: 'director.students',
    },
    {
      to: PATHS.director.mentors,
      labelKey: 'pages.director.mentors',
      icon: FiUserCheck,
      section: 'director.mentors',
    },
    {
      to: PATHS.director.leads,
      labelKey: 'pages.common.leads',
      icon: FiPhoneCall,
      section: 'director.leads',
    },
    {
      to: PATHS.director.reports,
      labelKey: 'pages.director.reports',
      icon: FiSend,
      section: 'director.reports',
    },
    {
      to: PATHS.director.tasks,
      labelKey: 'pages.common.tasks',
      icon: FiCheckSquare,
      section: 'director.tasks',
    },
    {
      to: PATHS.director.statistics,
      labelKey: 'pages.director.statistics',
      icon: FiBarChart2,
      section: 'director.statistics',
    },
    {
      to: PATHS.director.contracts,
      labelKey: 'pages.common.contracts',
      icon: FiFileText,
      section: 'director.contracts',
    },
    ...common('director', PATHS.director),
  ],
  administrator: [
    {
      to: PATHS.administrator.root,
      labelKey: 'pages.administrator.dashboard',
      icon: FiHome,
      end: true,
      section: 'administrator.dashboard',
    },
    {
      to: PATHS.administrator.students,
      labelKey: 'pages.administrator.students',
      icon: FiUsers,
      section: 'administrator.students',
    },
    {
      to: PATHS.administrator.payments,
      labelKey: 'pages.administrator.payments',
      icon: FiCreditCard,
      section: 'administrator.payments',
    },
    {
      to: PATHS.administrator.leads,
      labelKey: 'pages.common.leads',
      icon: FiPhoneCall,
      section: 'administrator.leads',
    },
    {
      to: PATHS.administrator.tasks,
      labelKey: 'pages.common.tasks',
      icon: FiCheckSquare,
      section: 'administrator.tasks',
    },
    ...common('administrator', PATHS.administrator),
  ],
  mentor: [
    {
      to: PATHS.mentor.root,
      labelKey: 'pages.mentor.dashboard',
      icon: FiHome,
      end: true,
      section: 'mentor.dashboard',
    },
    { to: PATHS.mentor.live, labelKey: 'pages.mentor.live', icon: FiVideo, section: 'mentor.live' },
    {
      to: PATHS.mentor.groups,
      labelKey: 'pages.mentor.groups',
      icon: FiGrid,
      section: 'mentor.groups',
    },
    {
      to: PATHS.mentor.reviewQueue,
      labelKey: 'pages.mentor.reviewQueue',
      icon: FiCheckSquare,
      section: 'mentor.reviewQueue',
    },
    {
      to: PATHS.mentor.tasks,
      labelKey: 'pages.common.tasks',
      icon: FiCheckSquare,
      section: 'mentor.tasks',
    },
    ...common('mentor', PATHS.mentor),
  ],
  student: [
    {
      to: PATHS.student.root,
      labelKey: 'pages.student.dashboard',
      icon: FiHome,
      end: true,
      section: 'student.dashboard',
    },
    {
      to: PATHS.student.live,
      labelKey: 'pages.student.live',
      icon: FiVideo,
      section: 'student.live',
    },
    {
      to: PATHS.student.scores,
      labelKey: 'pages.student.scores',
      icon: FiAward,
      section: 'student.scores',
    },
    {
      to: PATHS.student.tracks,
      labelKey: 'pages.student.tracks',
      icon: FiBookOpen,
      section: 'student.tracks',
    },
    {
      to: PATHS.student.profile,
      labelKey: 'pages.student.profile',
      icon: FiUser,
      section: 'student.profile',
    },
    ...common('student', PATHS.student),
  ],
  accountant: [
    {
      to: PATHS.accountant.root,
      labelKey: 'pages.staff.home',
      icon: FiHome,
      end: true,
      section: 'accountant.home',
    },
    {
      to: PATHS.accountant.expenses,
      labelKey: 'pages.accountant.expenses',
      icon: FiCreditCard,
      section: 'accountant.expenses',
    },
    {
      to: PATHS.accountant.reports,
      labelKey: 'pages.accountant.reports',
      icon: FiFileText,
      section: 'accountant.reports',
    },
    {
      to: PATHS.accountant.inventory,
      labelKey: 'pages.accountant.inventory',
      icon: FiArchive,
      section: 'accountant.inventory',
    },
    {
      to: PATHS.accountant.tasks,
      labelKey: 'pages.common.tasks',
      icon: FiCheckSquare,
      section: 'accountant.tasks',
    },
    ...common('accountant', PATHS.accountant),
  ],
  cleaner: [
    {
      to: PATHS.cleaner.root,
      labelKey: 'pages.staff.home',
      icon: FiHome,
      end: true,
      section: 'cleaner.home',
    },
    {
      to: PATHS.cleaner.tasks,
      labelKey: 'pages.common.tasks',
      icon: FiCheckSquare,
      section: 'cleaner.tasks',
    },
    ...common('cleaner', PATHS.cleaner),
  ],
  sales: [
    {
      to: PATHS.sales.root,
      labelKey: 'pages.staff.home',
      icon: FiHome,
      end: true,
      section: 'sales.home',
    },
    {
      to: PATHS.sales.leads,
      labelKey: 'pages.common.leads',
      icon: FiPhoneCall,
      section: 'sales.leads',
    },
    {
      to: PATHS.sales.tasks,
      labelKey: 'pages.common.tasks',
      icon: FiCheckSquare,
      section: 'sales.tasks',
    },
    ...common('sales', PATHS.sales),
  ],
  partner: [
    {
      to: PATHS.partner.root,
      labelKey: 'pages.partner.dashboard',
      icon: FiHome,
      end: true,
      section: 'partner.dashboard',
    },
    {
      to: PATHS.partner.courses,
      labelKey: 'pages.partner.courses',
      icon: FiBookOpen,
      section: 'partner.courses',
    },
    {
      to: PATHS.partner.students,
      labelKey: 'pages.partner.students',
      icon: FiUsers,
      section: 'partner.students',
    },
    ...common('partner', PATHS.partner),
  ],
};

/** Разделы роли, которые можно включать / выключать (без уведомлений и настроек) */
export const toggleableSections = (role: Role) => MENUS[role].filter((m) => !m.common);
