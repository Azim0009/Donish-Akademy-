import type { Payment, PaymentMethod } from '@/core/types/models';
import { MONTHLY_FEE } from '@/shared/lib/payments';
import { db } from './db';
import { monthKey } from './reports';

/** Демо-оплаты учеников Душанбе: прошлый месяц почти все оплатили, текущий — часть */
const BRANCH = 'branch_dushanbe';
let seeded = false;
const list: Payment[] = [];
let receiptSeq = 0;
/** Сквозной номер квитанции филиала */
export const nextReceiptNo = () => `DA-${new Date().getFullYear()}-${String(++receiptSeq).padStart(5, '0')}`;
const METHODS: PaymentMethod[] = ['cash', 'cash', 'card', 'transfer'];

export function allPayments(): Payment[] {
  if (seeded) return list;
  seeded = true;
  const students = db.users.filter((u) => u.branchId === BRANCH && u.role === 'student');
  const admin =
    db.users.find((u) => u.role === 'administrator' && u.branchId === BRANCH)?.name ??
    'Администратор';
  students.forEach((s, i) => {
    const group = db.groups.find((g) => g.id === s.groupId)?.name ?? null;
    // прошлый месяц: 9 из 10 оплатили
    if (i % 10 !== 3)
      list.push(pay(s.id, s.name, group, monthKey(1), MONTHLY_FEE, i, 25 + (i % 5), admin));
    // текущий: ~60% полностью, ~15% частично
    if (i % 7 < 4) list.push(pay(s.id, s.name, group, monthKey(0), MONTHLY_FEE, i, 1 + (i % 9), admin));
    else if (i % 7 === 4) list.push(pay(s.id, s.name, group, monthKey(0), 300, i, 3, admin));
  });
  return list;
}

function pay(
  studentId: string,
  studentName: string,
  groupName: string | null,
  month: string,
  amount: number,
  i: number,
  dayOfMonth: number,
  admin: string,
): Payment {
  const [y, m] = month.split('-').map(Number);
  const at = new Date(
    y,
    m - 1,
    Math.min(dayOfMonth, new Date().getDate() || 1),
    10 + (i % 8),
    (i * 7) % 60,
  );
  const when = at > new Date() ? new Date(Date.now() - (i + 1) * 3600000) : at;
  return {
    id: `pay_${month}_${studentId}`,
    studentId,
    studentName,
    month,
    amount,
    method: METHODS[i % METHODS.length],
    note: '',
    receivedByName: admin,
    createdAt: when.toISOString(),
    receiptNo: nextReceiptNo(),
    branchName: 'Душанбе',
    groupName,
    checkPhoto: null,
  };
}
