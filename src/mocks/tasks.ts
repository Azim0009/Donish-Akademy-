import type { Role } from '@/core/auth/roles';
import type { Task, TaskAssignee, TaskPriority, TaskStatus } from '@/core/types/models';
import { db } from './db';

/** Демо-филиал, под которым входят dev-пользователи */
const DEMO_BRANCH = 'branch_dushanbe';

export interface Me {
  id: string;
  name: string;
  role: Role;
  branchId: string | null;
  branchName: string | null;
}

const SUPER: Me = {
  id: 'user_sa',
  name: 'Super Admin',
  role: 'super_admin',
  branchId: null,
  branchName: null,
};

/**
 * Кто делает запрос. Dev-пользователи (user_director, user_mentor…) не лежат в базе —
 * сопоставляем их с первым сотрудником этой роли в демо-филиале
 */
export function resolveMe(id: string | null, role: Role): Me {
  if (role === 'super_admin') return SUPER;
  const real = id ? db.users.find((u) => u.id === id) : undefined;
  const u =
    real ?? db.users.find((x) => x.role === role && x.branchId === DEMO_BRANCH && !x.isBlocked);
  if (!u) return { id: id ?? 'unknown', name: '—', role, branchId: null, branchName: null };
  return { id: u.id, name: u.name, role: u.role, branchId: u.branchId, branchName: u.branchName };
}

export const toAssignee = (u: Me): TaskAssignee => ({
  id: u.id,
  name: u.name,
  role: u.role,
  branchName: u.branchName,
});

const dateIn = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const ago = (h: number) => new Date(Date.now() - h * 3600000).toISOString();

let n = 0;
function make(
  from: Me,
  to: Me,
  title: string,
  description: string,
  status: TaskStatus,
  priority: TaskPriority,
  due: number | null,
  ageH: number,
  comments: [string, string][] = [],
): Task {
  n += 1;
  return {
    id: `task_${n}`,
    title,
    description,
    status,
    priority,
    dueDate: due === null ? null : dateIn(due),
    assigneeId: to.id,
    assigneeName: to.name,
    assigneeRole: to.role,
    branchId: to.branchId,
    branchName: to.branchName,
    createdById: from.id,
    createdByName: from.name,
    createdByRole: from.role,
    createdAt: ago(ageH),
    updatedAt: ago(Math.max(1, ageH / 3)),
    comments: comments.map(([who, text], i) => ({
      id: `tc_${n}_${i}`,
      authorName: who,
      text,
      createdAt: ago(Math.max(1, ageH / 2 - i)),
    })),
  };
}

export function seedTasks(): Task[] {
  const dir = resolveMe(null, 'director');
  const adm = resolveMe(null, 'administrator');
  const men = resolveMe(null, 'mentor');
  const acc = resolveMe(null, 'accountant');
  const cln = resolveMe(null, 'cleaner');
  const sal = resolveMe(null, 'sales');
  const khujand = db.users.find((u) => u.role === 'director' && u.branchId === 'branch_khujand');
  const kh: Me | null = khujand
    ? {
        id: khujand.id,
        name: khujand.name,
        role: 'director',
        branchId: khujand.branchId,
        branchName: khujand.branchName,
      }
    : null;

  const list: Task[] = [
    make(
      SUPER,
      dir,
      'Сдать отчёт за ноябрь',
      'Отчёт с финансами — в разделе «Отчёты». Расходы распишите по статьям.',
      'in_progress',
      'high',
      9,
      30,
    ),
    make(
      SUPER,
      dir,
      'Найти помещение для второго класса',
      'Нужно ещё 1 помещение на 16 мест рядом с филиалом. Пришлите 2–3 варианта с ценой аренды.',
      'todo',
      'medium',
      14,
      50,
    ),
    make(
      SUPER,
      dir,
      'Провести день открытых дверей',
      'Цель — 40 гостей и 10 записей.',
      'done',
      'medium',
      -5,
      300,
      [
        [dir.name, 'Пришли 46 человек, записались 11.'],
        ['Super Admin', 'Отлично, спасибо!'],
      ],
    ),
    make(
      dir,
      adm,
      'Обзвонить должников за ноябрь',
      'Список — в разделе учеников, фильтр «Не оплатили». Записать, кто когда обещал оплатить.',
      'in_progress',
      'high',
      1,
      20,
      [[adm.name, 'Обзвонила 6 из 11, остальные не берут трубку.']],
    ),
    make(
      dir,
      men,
      'Проверить домашние работы группы до пятницы',
      'В очереди висят работы с прошлой недели.',
      'todo',
      'high',
      -1,
      70,
    ),
    make(
      dir,
      men,
      'Подготовить урок для открытого дня',
      'Короткий урок на 30 минут: сделать страницу с ИИ за полчаса.',
      'review',
      'medium',
      3,
      90,
      [[men.name, 'Готово, презентация и демо в папке группы.']],
    ),
    make(
      dir,
      acc,
      'Сверить оплаты за октябрь',
      'Сравнить оплаты в CRM и в банке, найти расхождения.',
      'done',
      'medium',
      -10,
      400,
    ),
    make(
      dir,
      acc,
      'Посчитать зарплаты менторов за ноябрь',
      'По количеству проведённых уроков.',
      'todo',
      'medium',
      8,
      10,
    ),
    make(
      dir,
      cln,
      'Генеральная уборка класса 2',
      'Перед открытым уроком в субботу. Протереть столы и мониторы.',
      'todo',
      'low',
      2,
      6,
    ),
    make(
      dir,
      sal,
      'Провести 10 пробных уроков',
      'Записывать каждого гостя в лиды с телефоном.',
      'in_progress',
      'high',
      6,
      60,
      [[sal.name, 'Пока 4 из 10.']],
    ),
    make(
      adm,
      cln,
      'Купить маркеры для досок',
      '10 штук, чёрные и синие. Чек — бухгалтеру.',
      'done',
      'low',
      -2,
      100,
    ),
    make(
      adm,
      sal,
      'Ответить на заявки из Instagram',
      '8 непрочитанных заявок в директе.',
      'todo',
      'medium',
      0,
      3,
    ),
  ];
  if (kh)
    list.push(
      make(
        SUPER,
        kh,
        'Запустить рекламу перед новым потоком',
        'Бюджет до 2 000 TJS. Отчёт по заявкам через неделю.',
        'review',
        'medium',
        4,
        120,
        [[kh.name, 'Реклама идёт 5 дней, 37 заявок.']],
      ),
    );
  return list;
}
