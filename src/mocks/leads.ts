import type { Lead, LeadSource, LeadStatus } from '@/core/types/models';
import { db } from './db';

/** Демо-лиды филиала Душанбе: заявки из Instagram, сайта, звонков */
const BRANCH = 'branch_dushanbe';
const ago = (h: number) => new Date(Date.now() - h * 3600000).toISOString();
const inH = (h: number) => {
  const d = new Date(Date.now() + h * 3600000);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
};

const RAW: [
  string,
  string,
  LeadSource,
  LeadStatus,
  number,
  number | null,
  string | null,
  [string, Lead['notes'][number]['kind'], string][],
][] = [
  ['Сайдалиев Акрам', '+992 90 111 22 33', 'instagram', 'new', 0.6, null, null, []],
  ['Нозимова Фарангис', '+992 93 222 33 44', 'site', 'new', 1.3, null, null, []],
  ['Юлдашев Комил', '+992 98 333 44 55', 'telegram', 'new', 3, null, null, []],
  [
    'Мирзоева Лола',
    '+992 92 444 55 66',
    'call',
    'contacted',
    23,
    null,
    null,
    [['call', 'call', 'Интересуется вечерней группой, перезвонить в пятницу.']],
  ],
  [
    'Шарипов Далер',
    '+992 91 555 66 77',
    'instagram',
    'contacted',
    48,
    null,
    null,
    [
      ['call', 'call', 'Не взял трубку.'],
      ['call', 'note', 'Написали в WhatsApp, ждём ответ.'],
    ],
  ],
  [
    'Каримова Мадина',
    '+992 90 666 77 88',
    'referral',
    'trial',
    30,
    3,
    null,
    [['call', 'call', 'Записали на пробный урок сегодня.']],
  ],
  [
    'Рахимов Бехруз',
    '+992 93 777 88 99',
    'site',
    'trial',
    52,
    26,
    null,
    [['call', 'call', 'Записали на пробный урок завтра.']],
  ],
  [
    'Назарова Сабрина',
    '+992 98 888 99 00',
    'walk_in',
    'won',
    120,
    null,
    null,
    [['call', 'note', 'Оплатила первый месяц, группа FS-03.']],
  ],
  ['Ахмедов Фаррух', '+992 92 999 00 11', 'instagram', 'won', 170, null, null, []],
  [
    'Холов Исмоил',
    '+992 91 000 11 22',
    'telegram',
    'lost',
    200,
    null,
    'Дорого',
    [['call', 'call', 'Сказал, что пока дорого. Вернуться через месяц.']],
  ],
  ['Бобоева Зарина', '+992 90 121 21 21', 'call', 'lost', 260, null, 'Выбрал другую школу', []],
];

export function seedLeads(): Lead[] {
  const branch = db.branches.find((b) => b.id === BRANCH);
  const sales = db.users.filter((u) => u.role === 'sales' && u.branchId === BRANCH);
  return RAW.map(([name, phone, source, status, ageH, trialIn, lostReason, notes], i) => {
    const who = sales[i % Math.max(1, sales.length)];
    return {
      id: `lead_${i + 1}`,
      name,
      phone,
      source,
      course: 'Fullstack + AI',
      status,
      trialAt: trialIn === null ? null : inH(trialIn),
      lostReason,
      assignedToId: status === 'new' ? null : (who?.id ?? null),
      assignedToName: status === 'new' ? null : (who?.name ?? null),
      branchId: BRANCH,
      branchName: branch?.name ?? 'Душанбе',
      notes: notes.map(([, kind, text], j) => ({
        id: `ln_${i}_${j}`,
        authorName: who?.name ?? 'Продажи',
        kind,
        text,
        createdAt: ago(ageH / 2 - j),
      })),
      createdAt: ago(ageH),
      updatedAt: ago(ageH / 3),
    };
  });
}

let seeded = false;
/** Лиды с ленивым заполнением (демо-данные создаются при первом обращении) */
export function allLeads(): Lead[] {
  if (!seeded) {
    db.leads = seedLeads();
    seeded = true;
  }
  return db.leads;
}
