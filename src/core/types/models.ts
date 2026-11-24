/**
 * TypeScript-типы = JSON-контракты между frontend и backend.
 * Когда появится backend — сверяем со Swagger.
 */
import type { Role } from '@/core/auth/roles';

export type ID = string;

// ---------- Пользователи и филиалы ----------
export interface User {
  id: ID;
  email: string;
  name: string;
  role: Role;
  branchId: ID | null; // у SuperAdmin = null
  branchName?: string | null;
  avatarUrl: string | null;
  level: number;
  xp: number;
  language: 'ru' | 'tg' | 'en';
  theme: 'light' | 'dark';
  createdAt: string;
  isBlocked: boolean;
  /** Мульти-роль: все роли сотрудника (основная — role). Пусто — только role */
  roles?: Role[];
  /** Выключенные разделы, например ['director.statistics'] */
  deniedSections?: string[];
  /** Функции филиала сотрудника (что включил SuperAdmin) */
  branchFeatures?: string[];
}

/** Пользователь в списках панелей управления */
export interface UserListItem {
  id: ID;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  /** второй номер (необязательно) */
  phone2?: string;
  /** фото паспорта: лицевая и обратная сторона (ссылки на файлы) */
  passportFront?: string;
  passportBack?: string;
  role: Role;
  branchId: ID | null;
  branchName: string | null;
  groupId: ID | null;
  groupName: string | null;
  progress: number; // %
  xp: number;
  groupsCount: number;
  studentsCount: number;
  lastActiveAt: string;
  createdAt: string;
  isBlocked: boolean;
  roles?: Role[];
  deniedSections?: string[];
}

export type BranchStatus = 'draft' | 'active' | 'suspended' | 'archived';

export interface Branch {
  id: ID;
  name: string;
  code: string;
  status: BranchStatus;
  address: string;
  phone: string;
  /** второй номер филиала (необязательно) */
  phone2?: string;
  email: string;
  timeZone: string;
  description: string;
  /** фото филиала (здание / вход), чтобы сразу узнать его в списке */
  photoUrl?: string | null;
  /** включённые функции филиала (ключи из core/navigation/branchFeatures.ts). Нет — всё включено */
  features?: string[];
  createdAt: string;
  directorName: string | null;
  studentsCount: number;
  mentorsCount: number;
  groupsCount: number;
  completionRate: number; // % завершённых модулей
  /** сколько курсов идёт в филиале */
  coursesCount?: number;
}

// ---------- Межфилиальные запросы ----------
export type CrossRequestType = 'transfer' | 'courseAccess' | 'mentorMove' | 'newBranch';
export type CrossRequestStatus = 'new' | 'approved' | 'rejected';
export interface CrossRequest {
  id: ID;
  type: CrossRequestType;
  fromBranch: string;
  toBranch: string | null;
  /** о ком / о чём запрос: «Шахзода Каримова», «Fullstack + AI» */
  subject: string;
  comment: string;
  createdBy: string;
  createdAt: string;
  status: CrossRequestStatus;
}

// ---------- Финансы ----------
export interface BranchFinance {
  branchId: ID;
  name: string;
  status: BranchStatus;
  revenue: number;
  previous: number;
  /** % изменения к прошлому такому же периоду */
  delta: number;
  students: number;
  paidStudents: number;
}

// ---------- Обучение ----------
export interface Track {
  id: ID;
  title: string;
  description: string;
  icon: string;
  isActive: boolean;
  modulesCount: number;
  lessonsCount: number;
  studentsCount: number;
  stack: string[];
  progress?: { completedModules: number; totalModules: number; percent: number };
}

export type ModuleStatus = 'locked' | 'in_progress' | 'completed';
export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export interface LessonSummary {
  id: ID;
  title: string;
  order: number;
  durationMinutes: number;
  status: LessonStatus;
  hasVideo: boolean;
  hasExercise: boolean;
  quizCount: number;
}

export interface TrackModule {
  id: ID;
  trackId: ID;
  title: string;
  description: string;
  order: number;
  isLocked: boolean;
  status: ModuleStatus;
  lessonsCount: number;
  completedLessons: number;
  lessons: LessonSummary[];
}

/**
 * Шаги урока: онлайн-урок с ментором → запись урока → домашнее задание → тест.
 * Уроки идут вживую по видеосвязи, после урока ментор добавляет запись.
 */
/** Шаги урока: теория → видео → пример → онлайн-урок → запись → домашнее задание → тест */
export const LESSON_STEPS = [
  'theory',
  'video',
  'example',
  'live',
  'recording',
  'practice',
  'quiz',
] as const;
export type LessonStep = (typeof LESSON_STEPS)[number];

export interface CodeFiles {
  html: string;
  css: string;
  js: string;
}

/** Тип задания закладываем сразу под будущие направления (V1) */
export type ExerciseType = 'code' | 'design_upload' | 'terminal' | 'quiz_only';

export interface Exercise {
  id: ID;
  type: ExerciseType;
  title: string;
  description: string;
  criteria: string[];
  starterCode: CodeFiles;
  solutionCode?: CodeFiles;
}

export type QuizQuestionType = 'single_choice' | 'multiple_choice' | 'short_answer';

export interface QuizQuestion {
  id: ID;
  type: QuizQuestionType;
  question: string;
  options: string[];
  correctAnswerIndex?: number;
}

export interface Lesson {
  id: ID;
  moduleId: ID;
  moduleTitle: string;
  trackId: ID;
  title: string;
  order: number;
  theoryContent: string; // markdown (конспект урока)
  /** Видеоурок от директора (YouTube / Google Drive / Vimeo). Пусто — видео нет */
  videoUrl: string;
  /** Запись онлайн-урока группы ученика. Пусто — записи ещё нет */
  recordingUrl: string;
  /** Онлайн-урок группы ученика по этому уроку (null — ещё не назначен) */
  liveSession: LiveSession | null;
  exampleCode: CodeFiles;
  durationMinutes: number;
  xpReward: number;
  status: LessonStatus;
  exercise: Exercise;
  quiz: QuizQuestion[];
  nextLessonId: ID | null;
}

export type SubmissionStatus = 'pending' | 'passed' | 'failed';

export interface Submission {
  id: ID;
  userId: ID;
  studentName: string;
  groupName: string;
  exerciseId: ID;
  exerciseTitle: string;
  lessonTitle: string;
  moduleTitle: string;
  code: CodeFiles;
  status: SubmissionStatus;
  submittedAt: string;
  feedback?: string;
  attempt: number;
}

export interface Progress {
  userId: ID;
  trackId: ID;
  xpEarned: number;
  level: number;
  xpForNextLevel: number;
  xpInLevel: number;
  completedLessons: number;
  totalLessons: number;
  streakDays: number;
  quizAverage: number;
  activityCalendar: { date: string; count: number }[];
  currentLesson: { id: ID; title: string; moduleTitle: string } | null;
}

// ---------- Договоры ----------
/** Для кого шаблон договора */
export type ContractRole = 'director' | 'administrator' | 'mentor';

export interface ContractTemplate {
  id: ID;
  role: ContractRole;
  title: string;
  /** текст с полями {{fullName}}, {{branch}} … — подставляются автоматически */
  body: string;
  updatedAt: string;
  updatedBy: string;
}

/** Договор конкретного сотрудника — шаблон, уже заполненный его данными */
export interface Contract {
  id: ID;
  userId: ID;
  userName: string;
  role: ContractRole;
  branchId: ID | null;
  branchName: string | null;
  title: string;
  body: string;
  createdAt: string;
}

// ---------- Онлайн-уроки ----------
/** Где проходит звонок. Ментор вставляет ссылку — сервис определяется сам */
export type MeetingProvider = 'google_meet' | 'zoom' | 'telegram' | 'jitsi' | 'other';

export interface LiveSession {
  id: ID;
  groupId: ID;
  groupName: string;
  lessonId: ID;
  lessonTitle: string;
  lessonOrder: number; // номер урока в курсе (1–36)
  moduleTitle: string;
  mentorName: string;
  startsAt: string; // ISO
  durationMinutes: number;
  joinUrl: string;
  provider: MeetingProvider;
  /** Запись после урока (YouTube / Google Drive / Vimeo) */
  recordingUrl: string | null;
  isCancelled: boolean;
}

/** Что ментор отправляет при создании / изменении онлайн-урока */
export interface LiveSessionInput {
  groupId: ID;
  lessonId: ID;
  startsAt: string;
  durationMinutes: number;
  joinUrl: string;
  recordingUrl: string | null;
}

// ---------- Группы ----------
/** online — уроки по видеосвязи, offline — в кабинете филиала */
export type GroupFormat = 'online' | 'offline';

export interface Group {
  id: ID;
  branchId: ID;
  trackId: ID;
  trackTitle: string;
  name: string;
  schedule: string;
  format: GroupFormat;
  /** Для офлайн-группы: кабинет и адрес */
  room: string | null;
  /** AI-ментор включён ментором для группы */
  aiMentor: boolean;
  /** AI только подсказывает и не пишет готовое решение */
  aiHintsOnly: boolean;
  mentorId: ID | null;
  mentorName: string | null;
  studentsCount: number;
  capacity: number;
  avgProgress: number;
  pendingReviews: number;
  startDate: string;
}

export interface GroupMember {
  id: ID;
  name: string;
  email: string;
  progress: number;
  xp: number;
  currentModule: string;
  quizAverage: number;
  lastActiveAt: string;
  isBlocked: boolean;
}

// ---------- Аудит и уведомления ----------
export type AuditAction =
  | 'Create'
  | 'Update'
  | 'Delete'
  | 'AssignRole'
  | 'Login'
  | 'ChangeStatus'
  | 'Block';

export interface AuditLog {
  id: ID;
  userName: string;
  userRole: Role;
  branchName: string | null;
  action: AuditAction;
  entityType: string;
  description: string;
  ipAddress: string;
  createdAt: string;
}

export interface AppNotification {
  id: ID;
  title: string;
  body: string;
  isRead: boolean;
  kind: 'info' | 'success' | 'warning';
  link?: string;
  createdAt: string;
}

// ---------- Отчёты филиала (директор → SuperAdmin) ----------
export type ReportStatus = 'draft' | 'sent' | 'accepted' | 'returned';
export type ExpenseCategory = 'rent' | 'salary' | 'utilities' | 'ads' | 'equipment' | 'other';
export interface ReportExpense {
  id: ID;
  category: ExpenseCategory;
  amount: number;
  note: string;
}
export interface ReportMetrics {
  students: number;
  newStudents: number;
  leftStudents: number;
  groups: number;
  mentors: number;
  avgProgress: number;
  /** сколько учеников оплатили за месяц */
  paidStudents: number;
}
export interface BranchReport {
  id: ID;
  branchId: ID;
  branchName: string;
  directorName: string;
  /** месяц отчёта: «2026-11» */
  month: string;
  status: ReportStatus;
  metrics: ReportMetrics;
  /** доход за месяц — из оплат (TJS) */
  income: number;
  expenses: ReportExpense[];
  achievements: string;
  problems: string;
  plans: string;
  /** комментарий SuperAdmin при возврате / принятии */
  reviewComment: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  reviewedAt: string | null;
}

// ---------- Задачи сотрудникам ----------
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export interface TaskComment {
  id: ID;
  authorName: string;
  text: string;
  createdAt: string;
}
export interface Task {
  id: ID;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** срок: «2026-11-25» */
  dueDate: string | null;
  assigneeId: ID;
  assigneeName: string;
  assigneeRole: Role;
  branchId: ID | null;
  branchName: string | null;
  createdById: ID;
  createdByName: string;
  createdByRole: Role;
  createdAt: string;
  updatedAt: string;
  comments: TaskComment[];
}
export interface TaskAssignee {
  id: ID;
  name: string;
  role: Role;
  branchName: string | null;
}

// ---------- Лиды отдела продаж ----------
export type LeadStatus = 'new' | 'contacted' | 'trial' | 'won' | 'lost';
export type LeadSource = 'instagram' | 'site' | 'telegram' | 'call' | 'walk_in' | 'referral';
export interface LeadNote {
  id: ID;
  authorName: string;
  /** call — звонок, note — заметка, status — смена статуса (пишется автоматически) */
  kind: 'call' | 'note' | 'status';
  text: string;
  createdAt: string;
}
export interface Lead {
  id: ID;
  name: string;
  phone: string;
  source: LeadSource;
  course: string;
  status: LeadStatus;
  /** когда пробный урок: ISO-время */
  trialAt: string | null;
  lostReason: string | null;
  assignedToId: ID | null;
  assignedToName: string | null;
  branchId: ID;
  branchName: string;
  /** когда администратор создал ученику аккаунт */
  studentId?: ID | null;
  notes: LeadNote[];
  createdAt: string;
  updatedAt: string;
}
export interface LeadStats {
  byStatus: Record<LeadStatus, number>;
  bySource: Record<LeadSource, number>;
  /** % лидов, которые записались (won) от всех закрытых и открытых за период */
  conversion: number;
  newToday: number;
  trialsToday: number;
}

// ---------- Оплаты учеников (администратор) ----------
export type PaymentMethod = 'cash' | 'card' | 'transfer';
export interface Payment {
  id: ID;
  studentId: ID;
  studentName: string;
  /** за какой месяц: «2026-11» */
  month: string;
  amount: number;
  method: PaymentMethod;
  note: string;
  receivedByName: string;
  createdAt: string;
}
export type PaymentState = 'paid' | 'partial' | 'unpaid';
export interface PaymentRow {
  studentId: ID;
  name: string;
  phone: string;
  groupName: string | null;
  paid: number;
  state: PaymentState;
  payments: Payment[];
}
export interface PaymentsMonth {
  month: string;
  fee: number;
  rows: PaymentRow[];
  collected: number;
  expected: number;
}

// ---------- Баллы (как в CRM Donish) ----------
/** Баллы ученика за неделю (3 урока). a — посещение 0/1/2, h — ДЗ 0–10, bonus 0–14, exam 0–50 */
export interface WeekScore {
  studentId: ID;
  month: number;
  week: number;
  a1: number | null;
  a2: number | null;
  a3: number | null;
  h1: number | null;
  h2: number | null;
  h3: number | null;
  bonus: number | null;
  exam: number | null;
  updatedAt?: string;
}
export interface ExtraExam {
  studentId: ID;
  month: number;
  passed: boolean;
}
export interface ScoreStudent {
  id: ID;
  name: string;
  phone: string;
  isBlocked: boolean;
}
export interface GroupScores {
  group: { id: ID; name: string; trackTitle: string; schedule: string };
  month: number;
  /** Текущий месяц курса группы (1–3) и неделя (1–4) */
  currentMonth: number;
  currentWeek: number;
  students: ScoreStudent[];
  weeks: WeekScore[];
  extra: ExtraExam[];
}
export interface MyScores {
  groupName: string;
  mentorName: string | null;
  currentMonth: number;
  currentWeek: number;
  months: { month: number; weeks: (WeekScore | null)[]; extra: ExtraExam | null }[];
}

/** Группа ученика: формат, расписание, кабинет */
export interface MyGroup {
  id: ID;
  name: string;
  format: GroupFormat;
  room: string | null;
  schedule: string;
  mentorName: string | null;
  aiMentor: boolean;
  aiHintsOnly: boolean;
}

// ---------- Партнёры-преподаватели ----------
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type PartnerCourseStatus = 'draft' | 'published';

/** Курс партнёра: своё направление, цена и формат */
export interface PartnerCourse {
  id: ID;
  partnerId: ID;
  title: string;
  description: string;
  level: CourseLevel;
  format: GroupFormat;
  /** Цена в месяц, TJS */
  priceMonthly: number;
  durationMonths: number;
  lessonsCount: number;
  status: PartnerCourseStatus;
  studentsCount: number;
  createdAt: string;
}
export type PartnerCourseInput = Pick<
  PartnerCourse,
  'title' | 'description' | 'level' | 'format' | 'priceMonthly' | 'durationMonths' | 'lessonsCount'
>;

export interface Partner {
  id: ID;
  userId: ID;
  name: string;
  phone: string;
  email: string;
  /** Код ссылки: /p/<code> */
  code: string;
  specialty: string;
  bio: string;
  /** Доля партнёра с оплат его учеников, % */
  sharePercent: number;
  isActive: boolean;
  createdAt: string;
  coursesCount: number;
  studentsCount: number;
  clicks: number;
}

export type PartnerStudentStatus = 'new' | 'enrolled' | 'rejected';
/** Ученик (заявка), пришедший по ссылке партнёра */
export interface PartnerStudent {
  id: ID;
  partnerId: ID;
  name: string;
  phone: string;
  courseId: ID;
  courseTitle: string;
  status: PartnerStudentStatus;
  createdAt: string;
}

export interface PartnerDashboard {
  partner: Partner;
  clicks: number;
  applications: number;
  enrolled: number;
  /** Доход партнёра в месяц: ученики × цена × доля */
  monthlyIncome: number;
  recent: PartnerStudent[];
}

/** Публичная страница партнёра */
export interface PartnerPublic {
  name: string;
  specialty: string;
  bio: string;
  code: string;
  courses: PartnerCourse[];
}

// ---------- AI-ментор ----------
export interface AiMessage {
  id: ID;
  role: 'user' | 'assistant';
  text: string;
  at: string;
}
/** Вопрос ученика AI-ментору — ментор видит, о чём спрашивают */
export interface AiQuestion {
  id: ID;
  studentId: ID;
  studentName: string;
  groupId: ID;
  lessonTitle: string | null;
  question: string;
  at: string;
}
export interface GroupAiInfo {
  aiMentor: boolean;
  aiHintsOnly: boolean;
  weekCount: number;
  askedStudents: number;
  recent: AiQuestion[];
}
export interface AiAnswer {
  answer: AiMessage;
  /** Сколько вопросов осталось сегодня */
  left: number;
}
