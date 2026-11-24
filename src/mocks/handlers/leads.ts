import { http } from 'msw';
import type { Lead, LeadNote, LeadSource, LeadStatus } from '@/core/types/models';
import { ENDPOINTS } from '@/core/api/endpoints';
import { LEAD_SOURCES, LEAD_STATUSES, isToday } from '@/shared/lib/leads';
import { db } from '../db';
import { allLeads } from '../leads';
import { resolveMe } from '../tasks';
import { fail, matches, ok, query, roleOf, url } from './utils';

/** Лиды видят: отдел продаж и администратор — свой филиал, директор — свой филиал, SuperAdmin — все */
const CAN_SEE = ['sales', 'administrator', 'director', 'super_admin'];
const meOf = (request: Request) => resolveMe(request.headers.get('X-Mock-User'), roleOf(request));
const leads = allLeads;
const visible = (request: Request) => {
  const me = meOf(request);
  if (!CAN_SEE.includes(me.role)) return null;
  return {
    me,
    list: leads().filter((l) => me.role === 'super_admin' || l.branchId === me.branchId),
  };
};
const note = (authorName: string, kind: LeadNote['kind'], text: string): LeadNote => ({
  id: `ln_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  authorName,
  kind,
  text,
  createdAt: new Date().toISOString(),
});
const STATUS_RU: Record<LeadStatus, string> = {
  new: 'Новый',
  contacted: 'Связались',
  trial: 'Пробный урок',
  won: 'Записался',
  lost: 'Отказ',
};

export const leadHandlers = [
  http.get(url(ENDPOINTS.leads.stats), ({ request }) => {
    const v = visible(request);
    if (!v) return fail(403, 'FORBIDDEN', 'Нет доступа к лидам');
    const byStatus = Object.fromEntries(
      LEAD_STATUSES.map((s) => [s, v.list.filter((l) => l.status === s).length]),
    ) as Record<LeadStatus, number>;
    const bySource = Object.fromEntries(
      LEAD_SOURCES.map((s) => [s, v.list.filter((l) => l.source === s).length]),
    ) as Record<LeadSource, number>;
    return ok({
      byStatus,
      bySource,
      conversion: v.list.length ? Math.round((byStatus.won / v.list.length) * 100) : 0,
      newToday: v.list.filter((l) => isToday(l.createdAt)).length,
      trialsToday: v.list.filter((l) => l.status === 'trial' && isToday(l.trialAt)).length,
    });
  }),

  http.get(url(ENDPOINTS.leads.list), ({ request }) => {
    const v = visible(request);
    if (!v) return fail(403, 'FORBIDDEN', 'Нет доступа к лидам');
    const q = query(request);
    const status = q.get('status');
    const list = v.list
      .filter((l) => !status || status === 'all' || l.status === status)
      .filter((l) => matches(`${l.name} ${l.phone} ${l.course}`, q.get('search')))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return ok(list);
  }),

  http.post(url(ENDPOINTS.leads.list), async ({ request }) => {
    const v = visible(request);
    if (!v || v.me.role === 'super_admin') return fail(403, 'FORBIDDEN', 'Лида добавляет филиал');
    const b = (await request.json()) as Pick<Lead, 'name' | 'phone' | 'source' | 'course'> & {
      comment?: string;
    };
    if (!b.name?.trim() || !/^\+?[\d\s()-]{9,20}$/.test(b.phone ?? ''))
      return fail(422, 'VALIDATION_ERROR', 'Проверьте имя и телефон');
    const digits = b.phone.replace(/\D/g, '').slice(-9);
    if (v.list.some((l) => l.phone.replace(/\D/g, '').slice(-9) === digits && l.status !== 'lost'))
      return fail(409, 'CONFLICT', 'Лид с этим телефоном уже есть');
    const now = new Date().toISOString();
    const lead: Lead = {
      id: `lead_${Date.now()}`,
      name: b.name.trim(),
      phone: b.phone.trim(),
      source: b.source,
      course: b.course || 'Fullstack + AI',
      status: 'new',
      trialAt: null,
      lostReason: null,
      assignedToId: v.me.role === 'sales' ? v.me.id : null,
      assignedToName: v.me.role === 'sales' ? v.me.name : null,
      branchId: v.me.branchId!,
      branchName: v.me.branchName ?? '',
      notes: b.comment?.trim() ? [note(v.me.name, 'note', b.comment.trim())] : [],
      createdAt: now,
      updatedAt: now,
    };
    leads().unshift(lead);
    return ok(lead);
  }),

  // смена статуса / пробного урока / причины отказа / ответственного
  http.patch(url('/leads/:id'), async ({ params, request }) => {
    const v = visible(request);
    if (!v) return fail(403, 'FORBIDDEN', 'Нет доступа к лидам');
    const lead = v.list.find((l) => l.id === params.id);
    if (!lead) return fail(404, 'ENTITY_NOT_FOUND', 'Лид не найден');
    const b = (await request.json()) as Partial<
      Pick<Lead, 'status' | 'trialAt' | 'lostReason' | 'name' | 'phone' | 'course' | 'source'>
    > & { takeMe?: boolean };
    if (b.status === 'trial' && !(b.trialAt ?? lead.trialAt))
      return fail(422, 'VALIDATION_ERROR', 'Укажите время пробного урока');
    if (b.status === 'lost' && !(b.lostReason ?? '').trim())
      return fail(422, 'VALIDATION_ERROR', 'Укажите причину отказа');
    const prev = lead.status;
    const { takeMe, ...rest } = b;
    Object.assign(lead, rest, { updatedAt: new Date().toISOString() });
    if (b.status && b.status !== 'lost') lead.lostReason = null;
    if ((takeMe || (b.status && !lead.assignedToId)) && v.me.role === 'sales')
      Object.assign(lead, { assignedToId: v.me.id, assignedToName: v.me.name });
    if (b.status && b.status !== prev) {
      const extra =
        b.status === 'trial' && lead.trialAt
          ? ` (${new Date(lead.trialAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })})`
          : b.status === 'lost'
            ? `: ${lead.lostReason}`
            : '';
      lead.notes.push(
        note(v.me.name, 'status', `${STATUS_RU[prev]} → ${STATUS_RU[b.status]}${extra}`),
      );
      // записался — администратору: создать ученику аккаунт и взять оплату
      if (b.status === 'won')
        (db.notifications.administrator ??= []).unshift({
          id: `n_${Date.now()}`,
          title: 'Новый ученик от отдела продаж',
          body: `${lead.name}, ${lead.phone} — создайте аккаунт и примите оплату.`,
          kind: 'success',
          isRead: false,
          link: '/administrator/students',
          createdAt: new Date().toISOString(),
        });
    }
    return ok(lead);
  }),

  http.post(url('/leads/:id/notes'), async ({ params, request }) => {
    const v = visible(request);
    if (!v) return fail(403, 'FORBIDDEN', 'Нет доступа к лидам');
    const lead = v.list.find((l) => l.id === params.id);
    if (!lead) return fail(404, 'ENTITY_NOT_FOUND', 'Лид не найден');
    const { text, kind } = (await request.json()) as { text: string; kind: 'call' | 'note' };
    if (!text?.trim()) return fail(422, 'VALIDATION_ERROR', 'Пустая заметка');
    lead.notes.push(note(v.me.name, kind === 'call' ? 'call' : 'note', text.trim()));
    lead.updatedAt = new Date().toISOString();
    return ok(lead);
  }),
];
