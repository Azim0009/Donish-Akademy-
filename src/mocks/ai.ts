import type { AiQuestion } from '@/core/types/models';
import { db } from './db';

/**
 * Демо AI-ментора. Настоящая модель будет на backend (с промптом «ментор Donish»),
 * здесь — ответы по ключевым словам, чтобы проверить интерфейс.
 * Режим «только подсказки»: AI объясняет и наводит, но не пишет готовое решение.
 */
export const AI_DAILY_LIMIT = 20;
export const aiLog: AiQuestion[] = [];

const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const SEED_Q = [
  'Почему у меня flex не ставит карточки в ряд?',
  'Чем margin отличается от padding?',
  'Как сделать кнопку с hover-эффектом?',
  'Что значит ошибка «Uncaught TypeError: Cannot read properties of null»?',
  'Как подключить CSS-файл к HTML?',
  'Зачем нужен тег <section>?',
];
let seeded = false;
export function seedAiLog() {
  if (seeded) return;
  seeded = true;
  const g = db.groups.find((x) => x.aiMentor);
  if (!g) return;
  const students = db.users.filter((u) => u.role === 'student' && u.groupId === g.id);
  SEED_Q.forEach((q, i) => {
    const s = students[(i * 5) % students.length];
    if (s)
      aiLog.push({
        id: `ai_q_${i + 1}`,
        studentId: s.id,
        studentName: s.name,
        groupId: g.id,
        lessonTitle: null,
        question: q,
        at: ago(i * 9 + 2),
      });
  });
}

type Topic = { keys: RegExp; explain: string; hint: string; code?: string };
const TOPICS: Topic[] = [
  {
    keys: /flex|в ряд|ряд|выровн|justify|align/i,
    explain:
      'Flexbox раскладывает детей родителя в ряд. Свойство display: flex ставят на РОДИТЕЛЯ (контейнер), а не на сами карточки.',
    hint: 'Проверь: у какого элемента стоит display: flex? Если у карточек — перенеси на их общий контейнер. Для отступов между ними попробуй gap.',
    code: '.cards {\n  display: flex;\n  gap: 16px;\n  flex-wrap: wrap;\n}',
  },
  {
    keys: /margin|padding|отступ/i,
    explain:
      'padding — внутренний отступ (от рамки до содержимого), margin — внешний (от рамки до соседей).',
    hint: 'Включи в DevTools подсветку блока: зелёная зона — padding, оранжевая — margin. Какая из них у тебя лишняя?',
    code: '.card {\n  padding: 16px; /* внутри */\n  margin-bottom: 24px; /* снаружи */\n}',
  },
  {
    keys: /hover|наведен|кнопк|transition/i,
    explain: 'Псевдокласс :hover срабатывает при наведении. transition делает изменение плавным.',
    hint: 'Добавь кнопке transition, а в правиле .btn:hover поменяй background и transform. Что именно должно меняться по заданию?',
    code: '.btn { transition: .2s; }\n.btn:hover {\n  background: #167a3a;\n  transform: translateY(-2px);\n}',
  },
  {
    keys: /null|undefined|TypeError|ошибк|error/i,
    explain:
      '«Cannot read properties of null» значит: querySelector ничего не нашёл и вернул null, а ты обращаешься к нему дальше.',
    hint: 'Проверь селектор (точка для класса, # для id) и то, что скрипт подключён в конце <body> или с defer. Выведи элемент в console.log — что там?',
    code: "const btn = document.querySelector('.btn');\nconsole.log(btn); // null? проверь селектор\nbtn?.addEventListener('click', () => {});",
  },
  {
    keys: /css|подключ|link|stylesheet/i,
    explain: 'CSS подключают в <head> через тег <link rel="stylesheet" href="style.css">.',
    hint: 'Проверь путь в href: файл лежит рядом с index.html или в папке? Имя совпадает до буквы?',
    code: '<head>\n  <link rel="stylesheet" href="css/style.css" />\n</head>',
  },
  {
    keys: /section|семантик|тег|header|footer|main/i,
    explain:
      'Семантические теги (header, main, section, footer) описывают смысл блока. Браузеру, поиску и программам чтения экрана так проще понять страницу.',
    hint: 'Раздели страницу на смысловые части: шапка, основное, отдельные разделы, подвал. Какой тег подходит каждой?',
  },
];

export function aiAnswer(question: string, hintsOnly: boolean, lessonTitle: string | null) {
  const topic = TOPICS.find((t) => t.keys.test(question));
  const ctx = lessonTitle ? `По уроку «${lessonTitle}». ` : '';
  if (!topic)
    return `${ctx}Хороший вопрос! Опиши подробнее: что ты делаешь, что ожидаешь и что получается на самом деле. Если есть ошибка — скопируй её текст из консоли. Так я смогу подсказать точнее.`;
  if (hintsOnly)
    return `${ctx}${topic.explain}\n\nПодсказка: ${topic.hint}\n\nГотовое решение не пишу — ментор включил режим подсказок, чтобы ты разобрался сам 💪`;
  return `${ctx}${topic.explain}\n\n${topic.hint}${topic.code ? `\n\nПример:\n${topic.code}` : ''}`;
}
