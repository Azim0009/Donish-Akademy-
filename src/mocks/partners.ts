import type {
  Lesson,
  LessonSummary,
  Partner,
  PartnerCourse,
  PartnerModule,
  PartnerStudent,
} from '@/core/types/models';

/**
 * Преподаватели-партнёры: ведут свои курсы на платформе Donish Academy
 * и приводят учеников по своей ссылке /p/<код>. С оплат учеников получают долю.
 */
const ago = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const partners: Partner[] = [
  {
    id: 'partner_1',
    userId: 'user_partner',
    name: 'Фарход Назаров',
    phone: '+992 93 555 12 34',
    email: 'farhod.nazarov@donish.tj',
    code: 'farhod',
    specialty: 'UI/UX-дизайнер',
    bio: '6 лет в продуктовом дизайне, делал интерфейсы для банков и онлайн-магазинов Таджикистана. Учу проектировать понятные приложения в Figma — от идеи до прототипа.',
    sharePercent: 30,
    isActive: true,
    createdAt: ago(110),
    coursesCount: 0,
    studentsCount: 0,
    clicks: 214,
  },
  {
    id: 'partner_2',
    userId: 'user_partner_2',
    name: 'Нилуфар Каримова',
    phone: '+992 91 777 45 67',
    email: 'nilufar.karimova@donish.tj',
    code: 'nilufar',
    specialty: 'Преподаватель английского для IT',
    bio: 'IELTS 8.0, 5 лет преподаю. Английский для программистов: документация, собеседования, переписка с заказчиками.',
    sharePercent: 25,
    isActive: true,
    createdAt: ago(60),
    coursesCount: 0,
    studentsCount: 0,
    clicks: 96,
  },
];

export const partnerCourses: PartnerCourse[] = [
  {
    id: 'pcourse_1',
    partnerId: 'partner_1',
    title: 'UI/UX-дизайн в Figma',
    description:
      'Исследование пользователей, вайрфреймы, дизайн-система и кликабельный прототип. В конце — кейс в портфолио.',
    level: 'beginner',
    format: 'online',
    priceMonthly: 500,
    durationMonths: 3,
    lessonsCount: 36,
    status: 'published',
    studentsCount: 0,
    createdAt: ago(100),
  },
  {
    id: 'pcourse_2',
    partnerId: 'partner_1',
    title: 'Графический дизайн для соцсетей',
    description: 'Посты, сторис и обложки для Instagram и Telegram: композиция, цвет, шрифты.',
    level: 'beginner',
    format: 'offline',
    priceMonthly: 400,
    durationMonths: 2,
    lessonsCount: 24,
    status: 'draft',
    studentsCount: 0,
    createdAt: ago(12),
  },
  {
    id: 'pcourse_3',
    partnerId: 'partner_2',
    title: 'English for IT',
    description: 'Читаем документацию, пишем README и проходим собеседование на английском.',
    level: 'intermediate',
    format: 'online',
    priceMonthly: 350,
    durationMonths: 3,
    lessonsCount: 24,
    status: 'published',
    studentsCount: 0,
    createdAt: ago(55),
  },
];

const names = [
  'Шахноза Рахимова',
  'Далер Саидов',
  'Мадина Юсуфи',
  'Рустам Холов',
  'Зарина Ашурова',
  'Бехруз Каримов',
  'Сабина Мирзоева',
  'Фирдавс Шарипов',
];

export const partnerStudents: PartnerStudent[] = names.map((name, i) => {
  const course = i < 6 ? partnerCourses[0] : partnerCourses[2];
  return {
    id: `pstudent_${i + 1}`,
    partnerId: course.partnerId,
    name,
    phone: `+992 9${(i * 3) % 10} ${400 + i * 37} ${10 + i * 7} ${20 + i * 5}`,
    courseId: course.id,
    courseTitle: course.title,
    status: i === 0 || i === 6 ? 'new' : i === 3 ? 'rejected' : 'enrolled',
    createdAt: ago(i * 4 + 1),
  };
});

/** Пересчитать счётчики курсов и партнёров */
export function recountPartners() {
  partnerCourses.forEach((c) => {
    c.studentsCount = partnerStudents.filter(
      (s) => s.courseId === c.id && s.status === 'enrolled',
    ).length;
  });
  partners.forEach((p) => {
    p.coursesCount = partnerCourses.filter((c) => c.partnerId === p.id).length;
    p.studentsCount = partnerStudents.filter(
      (s) => s.partnerId === p.id && s.status === 'enrolled',
    ).length;
  });
}
recountPartners();

export const partnerByUser = (userId: string | null) =>
  partners.find((p) => p.userId === userId) ?? partners[0];

/** Доход партнёра в месяц: его доля с оплат записанных учеников */
export const monthlyIncome = (p: Partner) =>
  Math.round(
    partnerStudents
      .filter((s) => s.partnerId === p.id && s.status === 'enrolled')
      .reduce(
        (sum, s) => sum + (partnerCourses.find((c) => c.id === s.courseId)?.priceMonthly ?? 0),
        0,
      ) *
      (p.sharePercent / 100),
  );

// ---------- Модули и уроки курсов партнёра ----------

type ModuleRow = Omit<PartnerModule, 'lessons'>;
export const partnerModules: ModuleRow[] = [];
export const partnerLessons: Lesson[] = [];

/** Пустой урок с правильной структурой — партнёр заполняет его в конструкторе */
export function newPartnerLesson(
  mod: ModuleRow,
  title: string,
  durationMinutes: number,
  order: number,
): Lesson {
  const id = `plesson_${Date.now()}_${Math.round(Math.random() * 1e4)}`;
  return {
    id,
    moduleId: mod.id,
    moduleTitle: mod.title,
    trackId: mod.courseId,
    title,
    order,
    theoryContent: `## ${title}\n\nНапишите здесь конспект урока.`,
    videoUrl: '',
    recordingUrl: '',
    liveSession: null,
    exampleCode: { html: '<h1>Пример</h1>', css: 'h1 { color: #16803c; }', js: '' },
    durationMinutes,
    xpReward: 50,
    status: 'not_started',
    exercise: {
      id: `${id}_ex`,
      type: 'code',
      title: 'Домашнее задание',
      description: '',
      criteria: [],
      starterCode: { html: '', css: '', js: '' },
    },
    quiz: [],
    nextLessonId: null,
  };
}

export const lessonSummary = (l: Lesson): LessonSummary => ({
  id: l.id,
  title: l.title,
  order: l.order,
  durationMinutes: l.durationMinutes,
  status: 'not_started',
  hasVideo: !!l.videoUrl,
  hasExercise: !!l.exercise.description.trim(),
  quizCount: l.quiz.length,
});

/** Курс с модулями и уроками — по порядку */
export function courseModules(courseId: string): PartnerModule[] {
  return partnerModules
    .filter((m) => m.courseId === courseId)
    .sort((a, b) => a.order - b.order)
    .map((m) => ({
      ...m,
      lessons: partnerLessons
        .filter((l) => l.moduleId === m.id)
        .sort((a, b) => a.order - b.order)
        .map(lessonSummary),
    }));
}

/** Количество уроков курса = реальные уроки в конструкторе (если они уже есть) */
export function syncLessonsCount(courseId: string) {
  const c = partnerCourses.find((x) => x.id === courseId);
  const ids = new Set(partnerModules.filter((m) => m.courseId === courseId).map((m) => m.id));
  const n = partnerLessons.filter((l) => ids.has(l.moduleId)).length;
  if (c && n > 0) c.lessonsCount = n;
}

// демо: у курса «UI/UX-дизайн в Figma» уже есть 2 модуля
(() => {
  const seed: [string, string, string[]][] = [
    [
      'Основы UI/UX',
      'Что такое интерфейс, пользователь и его задачи',
      ['Что такое UX и UI', 'Исследование пользователей', 'Пользовательские сценарии'],
    ],
    [
      'Figma с нуля',
      'Фреймы, компоненты, автолэйаут',
      ['Интерфейс Figma', 'Фреймы и сетки', 'Компоненты и варианты'],
    ],
  ];
  seed.forEach(([title, description, lessons], i) => {
    const mod: ModuleRow = {
      id: `pmodule_${i + 1}`,
      courseId: 'pcourse_1',
      title,
      description,
      order: i + 1,
    };
    partnerModules.push(mod);
    lessons.forEach((lt, j) => {
      const l = newPartnerLesson(mod, lt, 90, j + 1);
      l.id = `plesson_${i + 1}_${j + 1}`;
      l.exercise.id = `${l.id}_ex`;
      l.theoryContent = `## ${lt}\n\nКонспект урока «${lt}» курса «UI/UX-дизайн в Figma».`;
      partnerLessons.push(l);
    });
  });
})();
