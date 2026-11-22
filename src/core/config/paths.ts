/**
 * Все пути приложения в одном месте.
 * Для ссылок с параметрами используй generatePath из react-router:
 *   generatePath(PATHS.student.track, { trackId: 'track_fullstack' })
 */
export const PATHS = {
  // Публичные
  home: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password/:token',
  app: '/app',
  forbidden: '/403',

  // Student — кабинет ученика
  student: {
    root: '/student',
    tracks: '/student/tracks',
    track: '/student/tracks/:trackId',
    live: '/student/live',
    lesson: '/student/lessons/:lessonId',
    lessonEditor: '/student/lessons/:lessonId/editor',
    profile: '/student/profile',
    notifications: '/student/notifications',
    settings: '/student/settings',
  },

  // Mentor — панель ментора
  mentor: {
    root: '/mentor',
    groups: '/mentor/groups',
    group: '/mentor/groups/:groupId',
    live: '/mentor/live',
    studentProgress: '/mentor/students/:studentId',
    reviewQueue: '/mentor/submissions',
    submission: '/mentor/submissions/:submissionId',
    tasks: '/mentor/tasks',
    notifications: '/mentor/notifications',
    settings: '/mentor/settings',
  },

  // Director — панель директора филиала
  director: {
    root: '/director',
    tracks: '/director/tracks',
    trackModules: '/director/tracks/:trackId/modules',
    moduleLessons: '/director/modules/:moduleId/lessons',
    lessonEdit: '/director/lessons/:lessonId/edit',
    groups: '/director/groups',
    group: '/director/groups/:groupId',
    mentors: '/director/mentors',
    students: '/director/students',
    user: '/director/users/:userId',
    statistics: '/director/statistics',
    contracts: '/director/contracts',
    reports: '/director/reports',
    report: '/director/reports/:reportId',
    tasks: '/director/tasks',
    notifications: '/director/notifications',
    settings: '/director/settings',
  },

  // Administrator — администратор филиала (ресепшн)
  administrator: {
    root: '/administrator',
    students: '/administrator/students',
    tasks: '/administrator/tasks',
    notifications: '/administrator/notifications',
    settings: '/administrator/settings',
  },

  // Сотрудники филиала: бухгалтер, уборщица, отдел продаж
  accountant: {
    root: '/accountant',
    tasks: '/accountant/tasks',
    notifications: '/accountant/notifications',
    settings: '/accountant/settings',
  },
  cleaner: {
    root: '/cleaner',
    tasks: '/cleaner/tasks',
    notifications: '/cleaner/notifications',
    settings: '/cleaner/settings',
  },
  sales: {
    root: '/sales',
    tasks: '/sales/tasks',
    notifications: '/sales/notifications',
    settings: '/sales/settings',
  },

  // SuperAdmin — панель управления всеми филиалами
  superAdmin: {
    root: '/super-admin',
    branches: '/super-admin/branches',
    branchCreate: '/super-admin/branches/new',
    branch: '/super-admin/branches/:branchId',
    branchEdit: '/super-admin/branches/:branchId/edit',
    branchDirectors: '/super-admin/branch-directors',
    users: '/super-admin/users',
    statistics: '/super-admin/statistics',
    auditLog: '/super-admin/audit-log',
    globalSettings: '/super-admin/global-settings',
    contracts: '/super-admin/contracts',
    courses: '/super-admin/courses',
    requests: '/super-admin/requests',
    finance: '/super-admin/finance',
    reports: '/super-admin/reports',
    report: '/super-admin/reports/:reportId',
    tasks: '/super-admin/tasks',
    notifications: '/super-admin/notifications',
    settings: '/super-admin/settings',
  },
} as const;
