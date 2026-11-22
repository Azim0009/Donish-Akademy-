/**
 * In-memory «база данных» для моков. Живёт до перезагрузки страницы.
 * Когда появится backend — этот файл просто перестанет использоваться.
 */
import type {
  AppNotification,
  AuditLog,
  Branch,
  Contract,
  ContractRole,
  ContractTemplate,
  CodeFiles,
  Group,
  Lesson,
  LiveSession,
  LessonSummary,
  Submission,
  Track,
  TrackModule,
  UserListItem,
  CrossRequest,
  BranchReport,
  Task,
} from '@/core/types/models';
import { initFinance } from './finance';
import { seedReports } from './reports';
import type { Role } from '@/core/auth/roles';
import { MAIN_TRACK } from '@/core/config/course';
import { detectProvider } from '@/shared/lib/liveSession';
import { fillContract, todayRu } from '@/shared/lib/contracts';
import { DEMO_TEMPLATES } from './contractTemplates';

// --- детерминированный «рандом», чтобы данные не прыгали между перезагрузками ---
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
const int = (min: number, max: number) => Math.floor(min + rnd() * (max - min + 1));
const daysAgo = (d: number, h = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  date.setHours(h, int(0, 59), 0, 0);
  // не даём событиям «из будущего» (сегодня позже текущего часа)
  if (date.getTime() > Date.now()) date.setTime(Date.now() - int(15, 240) * 60000);
  return date.toISOString();
};

// ================= ФИЛИАЛЫ =================
const branchSeed: [string, string, string, Branch['status'], string][] = [
  ['branch_dushanbe', 'Душанбе', 'DSH', 'active', 'пр. Рудаки, 84'],
  ['branch_khujand', 'Худжанд', 'KHJ', 'active', 'ул. Ленина, 112'],
  ['branch_bokhtar', 'Бохтар', 'BKH', 'active', 'ул. Вахдат, 15'],
  ['branch_kulob', 'Куляб', 'KLB', 'active', 'ул. Сомони, 41'],
  ['branch_istaravshan', 'Истаравшан', 'IST', 'active', 'ул. Шарк, 7'],
  ['branch_khorog', 'Хорог', 'KHR', 'suspended', 'ул. Ленина, 20'],
  ['branch_panjakent', 'Пенджикент', 'PNJ', 'draft', 'ул. Рудаки, 3'],
];

const firstNames = [
  'Фаридун',
  'Мадина',
  'Сухроб',
  'Нигина',
  'Бехруз',
  'Зарина',
  'Фирдавс',
  'Шахзода',
  'Умед',
  'Тахмина',
  'Далер',
  'Парвина',
  'Исмоил',
  'Мехрона',
  'Рустам',
  'Сабрина',
  'Джамшед',
  'Манижа',
  'Комрон',
  'Ситора',
  'Амир',
  'Фарангис',
  'Хуршед',
  'Дилноза',
  'Шерзод',
  'Лола',
  'Азиз',
  'Гулноза',
  'Рахим',
  'Малика',
];
const lastNames = [
  'Рахимов',
  'Саидов',
  'Назаров',
  'Каримов',
  'Шарипов',
  'Юсупов',
  'Ахмедов',
  'Мирзоев',
  'Холов',
  'Набиев',
  'Иброгимов',
  'Гафуров',
  'Давлатов',
  'Сафаров',
  'Ашуров',
  'Раджабов',
  'Камолов',
  'Хасанов',
  'Бобоев',
  'Абдуллоев',
];
const femaleNames = new Set([
  'Мадина',
  'Нигина',
  'Зарина',
  'Шахзода',
  'Тахмина',
  'Парвина',
  'Мехрона',
  'Сабрина',
  'Манижа',
  'Ситора',
  'Фарангис',
  'Дилноза',
  'Лола',
  'Гулноза',
  'Малика',
]);
const translit: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sh',
  ы: 'y',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  ь: '',
  ъ: '',
};
const lat = (s: string) =>
  s
    .toLowerCase()
    .split('')
    .map((ch) => translit[ch] ?? ch)
    .join('');

let userCounter = 0;
function makePerson() {
  const first = firstNames[userCounter % firstNames.length];
  const last = pick(lastNames) + (femaleNames.has(first) ? 'а' : '');
  userCounter++;
  return {
    name: `${first} ${last}`,
    email: `${lat(first)}.${lat(last)}${userCounter}@mail.tj`,
    phone: `+992 9${int(0, 9)} ${int(100, 999)} ${int(10, 99)} ${int(10, 99)}`,
  };
}

export const db = {
  branches: [] as Branch[],
  users: [] as UserListItem[],
  groups: [] as Group[],
  tracks: [] as Track[],
  modules: [] as TrackModule[],
  submissions: [] as Submission[],
  liveSessions: [] as LiveSession[],
  contractTemplates: [] as ContractTemplate[],
  contracts: [] as Contract[],
  requests: [] as CrossRequest[],
  reports: [] as BranchReport[],
  tasks: [] as Task[],
  audit: [] as AuditLog[],
  notifications: {} as Record<Role, AppNotification[]>,
  settings: {
    platformName: 'Donish Academy',
    defaultLanguage: 'ru',
    registrationOpen: true,
    emailVerification: true,
    maintenanceMode: false,
    passwordMinLength: 8,
    sessionDays: 14,
    supportEmail: 'support@donish.tj',
  },
};

// ================= ЛЮДИ =================
function addUser(
  role: Role,
  branchId: string | null,
  extra: Partial<UserListItem> = {},
): UserListItem {
  const p = makePerson();
  const branch = branchSeed.find((b) => b[0] === branchId);
  const u: UserListItem = {
    id: `u_${role}_${userCounter}`,
    ...p,
    role,
    branchId,
    branchName: branch?.[1] ?? null,
    groupId: null,
    groupName: null,
    progress: 0,
    xp: 0,
    groupsCount: 0,
    studentsCount: 0,
    lastActiveAt: daysAgo(int(0, 6), int(8, 21)),
    createdAt: daysAgo(int(20, 200)),
    isBlocked: false,
    ...extra,
  };
  // Сотрудники входят по логину @donish.tj, ученики — по номеру телефона
  if (role !== 'student') u.email = u.email.replace('@mail.tj', '@donish.tj');
  db.users.push(u);
  return u;
}

// Директора филиалов
for (const [id, , , status] of branchSeed) if (status !== 'draft') addUser('director', id);
// Администраторы филиалов (ресепшн)
for (const [id, , , status] of branchSeed) if (status === 'active') addUser('administrator', id);
// Сотрудники филиалов: бухгалтер, уборщица, 2 продажника
for (const [id, , , status] of branchSeed)
  if (status === 'active')
    (['accountant', 'cleaner', 'sales', 'sales'] as const).forEach((r) => addUser(r, id));

// Менторы и группы Душанбе (детально), остальные филиалы — агрегатами
const schedules = [
  'Пн/Ср/Пт · 14:00–16:00',
  'Пн/Ср/Пт · 09:00–11:00',
  'Вт/Чт/Сб · 16:30–18:30',
  'Вт/Чт/Сб · 10:00–12:00',
];
const dshMentors = [0, 1, 2, 3].map(() => addUser('mentor', 'branch_dushanbe'));
['FS-01', 'FS-02', 'FS-03', 'FS-04'].forEach((name, i) => {
  db.groups.push({
    id: `group_${i + 1}`,
    branchId: 'branch_dushanbe',
    trackId: MAIN_TRACK.id,
    trackTitle: MAIN_TRACK.title,
    name,
    schedule: schedules[i],
    mentorId: dshMentors[i % 3].id,
    mentorName: dshMentors[i % 3].name,
    studentsCount: 0,
    capacity: 16,
    avgProgress: 0,
    pendingReviews: 0,
    startDate: daysAgo(90 - i * 20),
  });
});
// 4-й ментор пока без группы
for (let i = 0; i < 46; i++) {
  const g = db.groups[i % 4];
  const progress = Math.max(4, Math.min(100, Math.round(80 - (i % 4) * 14 + (rnd() - 0.5) * 40)));
  addUser('student', 'branch_dushanbe', {
    groupId: g.id,
    groupName: g.name,
    progress,
    xp: progress * 31 + int(0, 120),
    isBlocked: i === 13 || i === 37,
  });
}
db.groups.forEach((g) => {
  const members = db.users.filter((u) => u.groupId === g.id);
  g.studentsCount = members.length;
  g.avgProgress = Math.round(members.reduce((s, u) => s + u.progress, 0) / members.length);
});
dshMentors.forEach((m) => {
  const groups = db.groups.filter((g) => g.mentorId === m.id);
  m.groupsCount = groups.length;
  m.studentsCount = groups.reduce((s, g) => s + g.studentsCount, 0);
});
// Менторы других филиалов (для общей таблицы пользователей)
for (const [id, , , status] of branchSeed)
  if (id !== 'branch_dushanbe' && status === 'active')
    [0, 1].forEach(() =>
      addUser('mentor', id, { groupsCount: int(1, 3), studentsCount: int(12, 40) }),
    );

// Агрегаты филиалов
const branchAgg: Record<string, [number, number, number, number]> = {
  branch_dushanbe: [0, 0, 0, 64],
  branch_khujand: [182, 9, 12, 58],
  branch_bokhtar: [126, 7, 8, 52],
  branch_kulob: [94, 5, 6, 47],
  branch_istaravshan: [61, 4, 4, 41],
  branch_khorog: [38, 3, 3, 33],
  branch_panjakent: [0, 0, 0, 0],
};
db.branches = branchSeed.map(([id, name, code, status, address], i) => {
  const director = db.users.find((u) => u.role === 'director' && u.branchId === id);
  const isDsh = id === 'branch_dushanbe';
  const [s, m, g, c] = branchAgg[id];
  return {
    id,
    name,
    code,
    status,
    address: `г. ${name}, ${address}`,
    phone: `+992 ${37 + i} ${int(200, 899)} ${int(10, 99)} ${int(10, 99)}`,
    email: `${code.toLowerCase()}@donish.tj`,
    timeZone: 'Asia/Dushanbe',
    description: isDsh ? 'Головной филиал Donish Academy' : `Филиал Donish Academy в г. ${name}`,
    createdAt: daysAgo(400 - i * 45),
    directorName: director?.name ?? null,
    studentsCount: isDsh
      ? db.users.filter((u) => u.role === 'student' && u.branchId === id).length * 5
      : s,
    mentorsCount: isDsh ? dshMentors.length * 3 : m,
    groupsCount: isDsh ? db.groups.length * 4 : g,
    completionRate: c,
    coursesCount: isDsh ? 8 : s ? Math.max(1, Math.round(g / 2)) : 0,
  };
});
initFinance(db.branches);

// ================= ОБУЧЕНИЕ =================
// Курс Fullstack + AI: 3 месяца = 3 модуля, 36 уроков по 120 минут (онлайн с ментором)
const moduleData: [string, string, string[]][] = [
  [
    'Месяц 1 · Frontend',
    'HTML, CSS, JavaScript и Git — делаем сайты',
    [
      'Мир IT и программирование',
      'HTML: каркас страницы',
      'HTML: ссылки, изображения и медиа',
      'HTML: формы',
      'CSS: подключение и базовые стили',
      'CSS: блочная модель',
      'CSS: Flexbox',
      'CSS: Grid и адаптивность',
      'CSS: визуальная полировка',
      'JavaScript: основы языка',
      'JavaScript: условия и функции',
      'JavaScript: массивы и объекты. AI как помощник',
      'JavaScript: DOM',
      'JavaScript: события и формы',
      'JavaScript: мини-проект',
      'Git и GitHub: основы',
    ],
  ],
  [
    'Месяц 2 · React и Backend',
    'React, Node.js, Express, база данных и API',
    [
      'React: зачем нужен компонентный подход',
      'React: props и композиция',
      'React: state и события',
      'React: эффекты и работа с API',
      'React: маршрутизация',
      'Node.js: серверная среда',
      'Express: первый API',
      'REST API и CRUD',
      'Базы данных: основы',
      'Подключение базы данных',
      'Связка React + Express',
      'Авторизация: концепция',
      'Внешние API и AI API',
      'Подготовка к проекту',
    ],
  ],
  [
    'Месяц 3 · Свой проект',
    'Собственный проект с AI-функцией — от идеи до защиты',
    [
      'Проект: архитектура и старт',
      'Проект: интерфейс',
      'Проект: backend и данные',
      'Проект: интеграции и AI-функция',
      'Проект: тестирование и подготовка защиты',
      'Защита проекта',
    ],
  ],
];
const LESSON_MINUTES = 120;
const lessonNumber = (mi: number, li: number) =>
  moduleData.slice(0, mi).reduce((n, m) => n + m[2].length, 0) + li + 1;

// Прогресс текущего ученика: в 1-м месяце пройдено 4 урока (HTML), сейчас — урок 5 (CSS)
const STUDENT_DONE = { 0: 4 } as Record<number, number>;

db.modules = moduleData.map(([title, description, lessons], mi) => {
  const done = STUDENT_DONE[mi] ?? 0;
  const status =
    done === lessons.length
      ? 'completed'
      : mi === 0 || (STUDENT_DONE[mi - 1] ?? 0) === moduleData[mi - 1][2].length
        ? 'in_progress'
        : 'locked';
  const summaries: LessonSummary[] = lessons.map((lt, li) => ({
    id: `lesson_m${mi + 1}_${li + 1}`,
    title: lt,
    order: li + 1,
    durationMinutes: LESSON_MINUTES,
    status:
      li < done
        ? 'completed'
        : li === done && status === 'in_progress'
          ? 'in_progress'
          : 'not_started',
    hasVideo: true,
    hasExercise: true,
    quizCount: 3 + (li % 3),
  }));
  return {
    id: `module_${mi + 1}`,
    trackId: MAIN_TRACK.id,
    title,
    description,
    order: mi + 1,
    isLocked: status === 'locked',
    status,
    lessonsCount: lessons.length,
    completedLessons: done,
    lessons: summaries,
  };
});

const totalLessons = db.modules.reduce((s, m) => s + m.lessonsCount, 0);
const doneLessons = db.modules.reduce((s, m) => s + m.completedLessons, 0);

const comingTracks: [string, string, string[]][] = [
  ['Backend Developer', 'API, базы данных и серверная логика', ['C#', 'ASP.NET Core', 'SQL']],
  ['React Developer', 'Современные интерфейсы на React', ['TypeScript', 'React', 'Zustand']],
  ['React Native Developer', 'Мобильные приложения для iOS и Android', ['React Native', 'Expo']],
  ['UI/UX Designer', 'Исследования, прототипы и дизайн интерфейсов', ['Figma', 'UX']],
  ['QA Engineer', 'Ручное и автоматизированное тестирование', ['Тест-дизайн', 'Playwright']],
  ['Data Analyst', 'Данные, SQL и визуализация', ['SQL', 'Python', 'pandas']],
];

db.tracks = [
  {
    id: MAIN_TRACK.id,
    title: MAIN_TRACK.title,
    description: '3 месяца онлайн с ментором: frontend, backend и собственный проект с AI',
    icon: 'fullstack',
    isActive: true,
    modulesCount: db.modules.length,
    lessonsCount: totalLessons,
    studentsCount: 46,
    stack: ['HTML', 'CSS', 'JavaScript', 'Git', 'React', 'Node.js', 'Express', 'SQL', 'AI API'],
    progress: {
      completedModules: db.modules.filter((m) => m.status === 'completed').length,
      totalModules: db.modules.length,
      percent: Math.round((doneLessons / totalLessons) * 100),
    },
  },
  ...comingTracks.map(([title, description, stack], i) => ({
    id: `track_${lat(title.split(' ')[0])}_${i}`,
    title,
    description,
    icon: 'soon',
    isActive: false,
    modulesCount: 0,
    lessonsCount: 0,
    studentsCount: 0,
    stack,
  })),
];

const demoCode: CodeFiles = {
  html: '<div class="card">\n  <h1>Привет, Donish!</h1>\n  <p>Моя первая страница</p>\n  <button class="btn">Начать</button>\n</div>',
  css: 'body {\n  font-family: system-ui;\n  display: grid;\n  place-items: center;\n  min-height: 90vh;\n  background: #f4f7f4;\n}\n.card {\n  padding: 32px;\n  border-radius: 16px;\n  background: white;\n  box-shadow: 0 8px 30px rgba(0,0,0,.08);\n}\n.btn {\n  background: #1f9d4c;\n  color: white;\n  border: 0;\n  padding: 10px 18px;\n  border-radius: 10px;\n}',
  js: "document.querySelector('.btn').addEventListener('click', () => {\n  alert('Поехали!');\n});",
};

function lessonLive(lessonId: string): Pick<Lesson, 'videoUrl' | 'liveSession'> {
  const live =
    db.liveSessions.find(
      (x) => x.groupId === STUDENT_GROUP && x.lessonId === lessonId && !x.isCancelled,
    ) ?? null;
  return { videoUrl: live?.recordingUrl ?? '', liveSession: live };
}

export function getLesson(id: string): Lesson | null {
  for (const m of db.modules) {
    const idx = m.lessons.findIndex((l) => l.id === id);
    if (idx === -1) continue;
    const s = m.lessons[idx];
    const next = m.lessons[idx + 1] ?? db.modules[m.order]?.lessons[0] ?? null;
    return {
      id: s.id,
      moduleId: m.id,
      moduleTitle: m.title,
      trackId: m.trackId,
      title: s.title,
      order: s.order,
      durationMinutes: s.durationMinutes,
      xpReward: 50,
      status: s.status,
      theoryContent: `## ${s.title}\n\nВ этом уроке разберём тему «${s.title}» модуля ${m.title}. Сначала короткая теория, потом пример, который можно поменять прямо здесь, и практическое задание.\n\n### Главное\n\n- Каждая веб-страница — это HTML (структура), CSS (внешний вид) и JavaScript (поведение).\n- Пиши код маленькими шагами и сразу смотри результат в превью.\n- Если что-то не работает — проверь, закрыты ли все теги и скобки.\n\n### Попробуй сам\n\nОткрой пример ниже, поменяй текст и цвет кнопки и посмотри, как меняется страница.`,
      // Запись и онлайн-урок берём из расписания группы ученика (FS-01)
      ...lessonLive(s.id),
      exampleCode: demoCode,
      exercise: {
        id: `exercise_${s.id}`,
        type: 'code',
        title: 'Кнопка с hover-эффектом',
        description:
          'Создай кнопку «Записаться», которая при наведении меняет цвет фона и слегка приподнимается.',
        criteria: [
          'Есть элемент <button> с текстом «Записаться»',
          'При наведении меняется цвет фона',
          'Используется transition для плавности',
        ],
        starterCode: {
          html: '<button class="btn">Записаться</button>',
          css: '.btn {\n  \n}',
          js: '',
        },
        solutionCode: {
          html: '<button class="btn">Записаться</button>',
          css: '.btn { background:#1f9d4c; color:#fff; border:0; padding:12px 20px; border-radius:10px; transition:.2s }\n.btn:hover { background:#167a3a; transform:translateY(-2px) }',
          js: '',
        },
      },
      quiz: [
        {
          id: 'q1',
          type: 'single_choice',
          question: 'Какой тег создаёт ссылку?',
          options: ['<a>', '<link>', '<href>', '<url>'],
          correctAnswerIndex: 0,
        },
        {
          id: 'q2',
          type: 'single_choice',
          question: 'Какое CSS-свойство делает переход плавным?',
          options: ['animation-delay', 'transition', 'transform', 'smooth'],
          correctAnswerIndex: 1,
        },
        {
          id: 'q3',
          type: 'single_choice',
          question: 'Где лучше подключать JavaScript-файл?',
          options: [
            'В начале <head> без атрибутов',
            'В конце <body> или с defer',
            'Внутри <title>',
            'Только в CSS',
          ],
          correctAnswerIndex: 1,
        },
      ],
      nextLessonId: next?.id ?? null,
    };
  }
  return null;
}

export const studentProgress = () => {
  const current = db.modules
    .flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title })))
    .find((l) => l.status === 'in_progress');
  const xp = 1280;
  return {
    userId: 'user_student',
    trackId: MAIN_TRACK.id,
    xpEarned: xp,
    level: 4,
    xpForNextLevel: 1500,
    xpInLevel: xp - 1000,
    completedLessons: doneLessons,
    totalLessons,
    streakDays: 6,
    quizAverage: 86,
    activityCalendar: Array.from({ length: 112 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (111 - i));
      const recent = i > 60;
      const count = rnd() < (recent ? 0.75 : 0.35) ? int(1, 5) : 0;
      return { date: d.toISOString().slice(0, 10), count };
    }),
    currentLesson: current
      ? { id: current.id, title: current.title, moduleTitle: current.moduleTitle }
      : null,
  };
};

// ================= ОНЛАЙН-УРОКИ =================
// Уроки идут вживую по видеосвязи (Google Meet), после урока ментор добавляет запись.
export const STUDENT_GROUP = 'group_1'; // группа демо-ученика
const allLessons = db.modules.flatMap((m, mi) =>
  m.lessons.map((l, li) => ({ ...l, moduleTitle: m.title, number: lessonNumber(mi, li) })),
);
const at = (dayOffset: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
const meetCode = () => {
  const l = () => String.fromCharCode(97 + int(0, 25));
  return `${l()}${l()}${l()}-${l()}${l()}${l()}${l()}-${l()}${l()}${l()}`;
};
const demoRecordings = [
  'https://www.youtube.com/watch?v=UB1O30fR-EE',
  'https://www.youtube.com/watch?v=qz0aGYrrlhU',
  'https://www.youtube.com/watch?v=yfoY53QXEnI',
];
db.groups.slice(0, 2).forEach((g, gi) => {
  // Уроки 1–4 прошли, урок 5 начинается через 10 минут (можно подключаться), 6–7 — на этой неделе
  const plan: [number, string][] = [
    [-9, 'ended'],
    [-7, 'ended'],
    [-5, 'ended'],
    [-2, 'ended'],
    [0, 'soon'],
    [2, 'next'],
    [4, 'next'],
  ];
  plan.forEach(([day], li) => {
    const lesson = allLessons[li];
    const now = new Date();
    // урок группы FS-01 — через 10 минут (чтобы сразу видеть кнопку «Подключиться»), FS-02 — через ~2,5 часа (ровно по 15 минут)
    const later = new Date(now.getTime() + 150 * 60_000);
    later.setMinutes(Math.ceil(later.getMinutes() / 15) * 15, 0, 0);
    const startsAt =
      day === 0
        ? (gi === 0 ? new Date(now.getTime() + 10 * 60_000) : later).toISOString()
        : at(day, gi === 0 ? 14 : 9);
    const joinUrl = `https://meet.google.com/${meetCode()}`;
    db.liveSessions.push({
      id: `live_${g.id}_${li + 1}`,
      groupId: g.id,
      groupName: g.name,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      lessonOrder: lesson.number,
      moduleTitle: lesson.moduleTitle,
      mentorName: g.mentorName ?? '—',
      startsAt,
      durationMinutes: LESSON_MINUTES,
      joinUrl,
      provider: detectProvider(joinUrl),
      // у последнего прошедшего урока записи ещё нет — ментор должен её добавить
      recordingUrl: day < 0 && li < 3 ? demoRecordings[li % demoRecordings.length] : null,
      isCancelled: false,
    });
  });
});

export const findLesson = (lessonId: string) => allLessons.find((l) => l.id === lessonId) ?? null;
export const courseLessons = () =>
  allLessons.map(({ id, title, number, moduleTitle }) => ({ id, title, number, moduleTitle }));

// ================= СДАЧИ (проверка ментором) =================
const students = db.users.filter(
  (u) => u.role === 'student' && (u.groupId === 'group_1' || u.groupId === 'group_2'),
);
const M1 = 'Месяц 1 · Frontend';
const exerciseTitles: [string, string, string][] = [
  ['Страница «О себе» с header, main, footer', 'HTML: каркас страницы', M1],
  ['Мини-галерея и меню', 'HTML: ссылки, изображения и медиа', M1],
  ['Форма заявки на курс', 'HTML: формы', M1],
  ['Форма обратной связи с required', 'HTML: формы', M1],
  ['3 картинки с правильным alt', 'HTML: ссылки, изображения и медиа', M1],
  ['Идея учебного проекта', 'Мир IT и программирование', M1],
];
db.submissions = Array.from({ length: 14 }, (_, i) => {
  const s = students[(i * 3) % students.length];
  const [exerciseTitle, lessonTitle, moduleTitle] = exerciseTitles[i % exerciseTitles.length];
  const status: Submission['status'] = i < 8 ? 'pending' : i % 3 === 0 ? 'failed' : 'passed';
  return {
    id: `submission_${i + 1}`,
    userId: s.id,
    studentName: s.name,
    groupName: s.groupName ?? '',
    exerciseId: `exercise_${i}`,
    exerciseTitle,
    lessonTitle,
    moduleTitle,
    code: {
      html: '<button class="btn">Записаться</button>',
      css: '.btn {\n  background: #1f9d4c;\n  color: white;\n  padding: 12px 20px;\n  border: 0;\n  border-radius: 10px;\n  transition: .2s;\n}\n.btn:hover {\n  background: #167a3a;\n}',
      js: '',
    },
    status,
    submittedAt: daysAgo(i < 8 ? Math.floor(i / 3) : int(2, 9), int(9, 20)),
    feedback:
      status === 'pending'
        ? undefined
        : status === 'passed'
          ? 'Отлично, всё по критериям.'
          : 'Нет transition — добавь плавность и пришли снова.',
    attempt: i % 4 === 1 ? 2 : 1,
  };
});
db.groups.forEach(
  (g) =>
    (g.pendingReviews = db.submissions.filter(
      (s) => s.status === 'pending' && s.groupName === g.name,
    ).length),
);

// ================= АУДИТ =================
const sa = 'Super Admin';
const directorOf = (id: string) =>
  db.users.find((u) => u.role === 'director' && u.branchId === id)?.name ?? '—';
const auditSeed: [
  string,
  AuditLog['userRole'],
  string | null,
  AuditLog['action'],
  string,
  string,
][] = [
  [sa, 'super_admin', 'Пенджикент', 'Create', 'Branch', 'Создан филиал «Пенджикент» (черновик)'],
  [sa, 'super_admin', 'Хорог', 'ChangeStatus', 'Branch', 'Филиал «Хорог» приостановлен'],
  [directorOf('branch_dushanbe'), 'director', 'Душанбе', 'Create', 'Group', 'Создана группа FS-04'],
  [
    sa,
    'super_admin',
    'Бохтар',
    'AssignRole',
    'User',
    `Назначен директор филиала: ${directorOf('branch_bokhtar')}`,
  ],
  [
    directorOf('branch_khujand'),
    'director',
    'Худжанд',
    'Update',
    'Lesson',
    'Обновлён урок «CSS: Flexbox»',
  ],
  [sa, 'super_admin', null, 'Login', 'Session', 'Вход в панель SuperAdmin'],
  [
    directorOf('branch_dushanbe'),
    'director',
    'Душанбе',
    'Block',
    'User',
    'Заблокирован ученик за нарушение правил',
  ],
  [sa, 'super_admin', null, 'Update', 'Settings', 'Изменены глобальные настройки: длина пароля'],
  [directorOf('branch_kulob'), 'director', 'Куляб', 'Create', 'User', 'Добавлен ментор'],
  [
    directorOf('branch_dushanbe'),
    'director',
    'Душанбе',
    'Delete',
    'Lesson',
    'Удалён черновик урока',
  ],
  [sa, 'super_admin', 'Истаравшан', 'ChangeStatus', 'Branch', 'Филиал «Истаравшан» активирован'],
  [
    directorOf('branch_bokhtar'),
    'director',
    'Бохтар',
    'Update',
    'Group',
    'Сменён ментор группы BK-02',
  ],
];
db.audit = auditSeed.map(
  ([userName, userRole, branchName, action, entityType, description], i) => ({
    id: `audit_${i + 1}`,
    userName,
    userRole,
    branchName,
    action,
    entityType,
    description,
    ipAddress: `10.0.${int(0, 20)}.${int(2, 250)}`,
    createdAt: daysAgo(Math.floor(i / 2), 18 - i),
  }),
);

// ================= УВЕДОМЛЕНИЯ =================
const n = (
  id: string,
  title: string,
  body: string,
  kind: AppNotification['kind'],
  d: number,
  isRead = false,
  link?: string,
): AppNotification => ({
  id,
  title,
  body,
  kind,
  isRead,
  link,
  createdAt: daysAgo(d, 12 - d),
});
db.notifications = {
  super_admin: [
    n(
      'n1',
      'Филиал ждёт запуска',
      '«Пенджикент» в статусе черновика уже 5 дней.',
      'warning',
      0,
      false,
      '/super-admin/branches/branch_panjakent',
    ),
    n('n2', 'Новый директор назначен', 'Бохтар получил нового директора.', 'success', 1),
    n(
      'n3',
      'Еженедельный отчёт готов',
      'Рост учеников за неделю: +6,1%.',
      'info',
      2,
      true,
      '/super-admin/statistics',
    ),
  ],
  director: [
    n(
      'n1',
      'Группа FS-01 почти заполнена',
      'Свободно 3 места из 16.',
      'warning',
      0,
      false,
      '/director/groups/group_1',
    ),
    n(
      'n2',
      '5 новых регистраций',
      'Новые ученики ждут распределения по группам.',
      'info',
      0,
      false,
      '/director/students',
    ),
    n(
      'n3',
      'Запись урока добавлена',
      '«HTML: формы» — запись доступна ученикам.',
      'success',
      3,
      true,
    ),
  ],
  administrator: [
    n(
      'n1',
      'Новые заявки',
      '3 человека записались на пробный урок — позвоните им.',
      'warning',
      0,
      false,
      '/administrator/students',
    ),
    n(
      'n2',
      'Сегодня 2 группы',
      'FS-01 в 14:00 и FS-03 в 16:30 — проверьте, что кабинет свободен.',
      'info',
      0,
      false,
      '/administrator',
    ),
    n('n3', 'Добро пожаловать', 'Это ваша панель администратора филиала.', 'success', 2, true),
  ],
  accountant: [
    n(
      'n1',
      'Добро пожаловать',
      'Это ваша панель бухгалтера. Раздел финансов появится здесь.',
      'success',
      0,
      false,
    ),
  ],
  cleaner: [
    n(
      'n1',
      'Сегодня занятия в филиале',
      'Расписание групп — на главной странице.',
      'info',
      0,
      false,
      '/cleaner',
    ),
  ],
  sales: [
    n(
      'n1',
      'Добро пожаловать',
      'Это ваша панель отдела продаж. Заявки и клиенты появятся здесь.',
      'success',
      0,
      false,
    ),
  ],
  mentor: [
    n(
      'n1',
      '8 работ ждут проверки',
      'Самая старая отправлена 2 дня назад.',
      'warning',
      0,
      false,
      '/mentor/submissions',
    ),
    n(
      'n2',
      'Добавьте запись урока',
      '«HTML: формы» прошёл — ученики ждут запись.',
      'info',
      1,
      false,
      '/mentor/live',
    ),
    n('n3', 'Группа FS-02 прошла HTML', 'Все ученики сдали мини-тест.', 'success', 4, true),
  ],
  student: [
    n(
      'n1',
      'Скоро онлайн-урок',
      '«CSS: подключение и базовые стили» — подключайся по ссылке в расписании.',
      'warning',
      0,
      false,
      '/student/live',
    ),
    n(
      'n2',
      'Ментор проверил задание',
      '«Форма заявки на курс» — зачтено, +50 XP.',
      'success',
      0,
      false,
      '/student/profile',
    ),
    n(
      'n3',
      'Запись урока доступна',
      '«HTML: ссылки, изображения и медиа» — можно пересмотреть.',
      'info',
      3,
      true,
      '/student/live',
    ),
  ],
};

// ================= СТАТИСТИКА =================
const weekLabel = (w: number) => {
  const d = new Date();
  d.setDate(d.getDate() - w * 7);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};
export const stats = {
  growth: Array.from({ length: 12 }, (_, i) => ({
    label: weekLabel(11 - i),
    students: Math.round(520 + i * 38 + (rnd() - 0.4) * 40),
  })),
  daily: Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      label: d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      active: Math.round(20 + i * 0.6 + rnd() * 12),
    };
  }),
};

// ================= ИЗМЕНЕНИЕ / УДАЛЕНИЕ ЛЮДЕЙ =================
export function updatePerson(
  id: string,
  body: { firstName?: string; lastName?: string; name?: string; phone?: string; phone2?: string },
) {
  const u = db.users.find((x) => x.id === id);
  if (!u) return null;
  Object.assign(u, {
    ...(body.name ? { name: body.name } : {}),
    ...(body.firstName ? { firstName: body.firstName } : {}),
    ...(body.lastName ? { lastName: body.lastName } : {}),
    ...(body.phone ? { phone: body.phone } : {}),
    phone2: body.phone2 ?? u.phone2,
  });
  // пароль в моках не храним — настоящий backend сохранит его хэш
  return u;
}

export function deletePerson(id: string) {
  const u = db.users.find((x) => x.id === id);
  if (!u) return null;
  db.users = db.users.filter((x) => x.id !== id);
  if (u.role === 'director') {
    const branch = db.branches.find((b) => b.id === u.branchId);
    if (branch && branch.directorName === u.name)
      branch.directorName =
        db.users.find((x) => x.role === 'director' && x.branchId === branch.id)?.name ?? null;
  }
  if (u.role === 'student' && u.groupId) {
    const g = db.groups.find((x) => x.id === u.groupId);
    if (g) g.studentsCount = Math.max(0, g.studentsCount - 1);
  }
  return u;
}

// ================= ДОГОВОРЫ =================
const POSITION: Record<ContractRole, string> = {
  director: 'Директор филиала',
  administrator: 'Администратор',
  mentor: 'Ментор',
};
db.contractTemplates = (Object.keys(DEMO_TEMPLATES) as ContractRole[]).map((role) => ({
  id: `tpl_${role}`,
  role,
  ...DEMO_TEMPLATES[role],
  updatedAt: daysAgo(30),
  updatedBy: 'Super Admin',
}));

/** Создать договор сотрудника из текущего шаблона его роли (имя и фамилия подставляются сами) */
export function makeContract(u: UserListItem): Contract | null {
  if (u.role !== 'director' && u.role !== 'administrator' && u.role !== 'mentor') return null;
  const tpl = db.contractTemplates.find((x) => x.role === u.role)!;
  const branch = db.branches.find((b) => b.id === u.branchId);
  const [first, ...rest] = u.name.split(' ');
  const date = new Date(u.createdAt).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const body = fillContract(tpl.body, {
    fullName: u.name,
    firstName: u.firstName ?? first,
    lastName: u.lastName ?? rest.join(' '),
    position: POSITION[u.role],
    branch: branch?.name ?? '',
    branchAddress: branch?.address ?? '',
    city: branch?.name ?? 'Душанбе',
    phone: u.phone,
    login: u.email,
    date: date || todayRu(),
  });
  const c: Contract = {
    id: `contract_${u.id}`,
    userId: u.id,
    userName: u.name,
    role: u.role,
    branchId: u.branchId,
    branchName: u.branchName,
    title: tpl.title,
    body,
    createdAt: u.createdAt,
  };
  db.contracts = [c, ...db.contracts.filter((x) => x.userId !== u.id)];
  return c;
}
db.users
  .filter((u) => ['director', 'administrator', 'mentor'].includes(u.role))
  .forEach((u) => makeContract(u));

// ================= МЕЖФИЛИАЛЬНЫЕ ЗАПРОСЫ =================
// Директора просят SuperAdmin: перевести ученика, открыть курс, перевести ментора
const reqSeed: [
  CrossRequest['type'],
  string,
  string | null,
  string,
  string,
  number,
  CrossRequest['status'],
][] = [
  [
    'transfer',
    'Душанбе',
    'Худжанд',
    'Шахзода Каримова',
    'Семья переезжает в Худжанд, хочет продолжить в той же группе по уровню.',
    0,
    'new',
  ],
  [
    'transfer',
    'Бохтар',
    'Душанбе',
    'Комрон Назаров',
    'Поступил в университет в Душанбе.',
    0,
    'new',
  ],
  [
    'courseAccess',
    'Куляб',
    'Душанбе',
    'Fullstack + AI · Месяц 3',
    'Нужен доступ к урокам 3-го месяца для новой группы.',
    1,
    'new',
  ],
  [
    'mentorMove',
    'Истаравшан',
    'Худжанд',
    'Рустам Сафаров',
    'Ментор на 2 недели заменит заболевшего коллегу.',
    1,
    'new',
  ],
  ['transfer', 'Худжанд', 'Истаравшан', 'Ситора Юсупова', 'Ближе к дому.', 2, 'new'],
  [
    'courseAccess',
    'Бохтар',
    null,
    'Записи онлайн-уроков',
    'Просим открыть записи всех уроков для отстающих учеников.',
    3,
    'new',
  ],
  [
    'newBranch',
    'Пенджикент',
    null,
    'Запуск филиала «Пенджикент»',
    'Помещение готово, директор назначен — просим включить филиал.',
    4,
    'new',
  ],
  ['transfer', 'Душанбе', 'Бохтар', 'Амир Холов', 'Переезд.', 6, 'approved'],
  [
    'mentorMove',
    'Худжанд',
    'Душанбе',
    'Мехрона Бобоева',
    'Нужен ментор на вечернюю группу.',
    9,
    'rejected',
  ],
];
const reqAuthor = (branch: string) =>
  db.users.find((u) => u.role === 'director' && u.branchName === branch)?.name ??
  `Директор ${branch}`;
db.requests = reqSeed.map(([type, from, to, subject, comment, d, status], i) => ({
  id: `req_${i + 1}`,
  type,
  fromBranch: from,
  toBranch: to,
  subject,
  comment,
  createdBy: reqAuthor(from),
  createdAt: daysAgo(d, 18 - i),
  status,
}));

// ================= ОТЧЁТЫ ФИЛИАЛОВ =================
{
  const dStudents = db.users.filter(
    (u) => u.branchId === 'branch_dushanbe' && u.role === 'student',
  );
  db.reports = seedReports(db.branches, {
    branch_dushanbe: {
      students: dStudents.length,
      groups: db.groups.filter((g) => g.branchId === 'branch_dushanbe').length,
      mentors: db.users.filter((u) => u.branchId === 'branch_dushanbe' && u.role === 'mentor')
        .length,
      avgProgress: Math.round(
        dStudents.reduce((s, u) => s + u.progress, 0) / Math.max(1, dStudents.length),
      ),
    },
  });
}
