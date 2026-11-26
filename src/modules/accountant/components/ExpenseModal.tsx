import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import type { ExpenseCategory, ExpenseEntry, ExpenseMethod } from '@/core/types/models';
import { EXPENSE_CATEGORIES } from '@/shared/lib/reports';
import { Button, Input, Modal, Select, Textarea, toast } from '@/shared/ui';
import { useBranchEmployees, useSaveExpense, type ExpenseForm } from '../api/accountingApi';
import { EXPENSE_METHODS, isoDay } from '../lib/expenses';

/** Добавить или изменить запись в журнале расходов */
export function ExpenseModal({
  entry,
  onClose,
}: {
  /** null — новая запись */
  entry: ExpenseEntry | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const save = useSaveExpense();
  const { data: staff = [] } = useBranchEmployees();
  const today = isoDay(new Date());
  const [f, setF] = useState<ExpenseForm>(
    entry
      ? {
          date: entry.date,
          category: entry.category,
          amount: entry.amount,
          description: entry.description,
          method: entry.method,
          employeeId: entry.employeeId,
        }
      : {
          date: today,
          category: 'salary',
          amount: 0,
          description: '',
          method: 'cash',
          employeeId: null,
        },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof ExpenseForm>(k: K, v: ExpenseForm[K]) =>
    setF((x) => ({ ...x, [k]: v }));
  const isSalary = f.category === 'salary';

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.date) e.date = t('expenses.errDate');
    else if (f.date > today) e.date = t('expenses.errFuture');
    if (!(Number(f.amount) > 0)) e.amount = t('expenses.errAmount');
    if (isSalary && !f.employeeId) e.employeeId = t('expenses.errEmployee');
    if (!isSalary && f.description.trim().length < 2) e.description = t('expenses.errDescription');
    setErrors(e);
    if (Object.keys(e).length) return;
    save.mutate(
      { ...f, id: entry?.id, employeeId: isSalary ? f.employeeId : null },
      {
        onSuccess: () => {
          toast(entry ? t('expenses.updated') : t('expenses.added'), 'success');
          onClose();
        },
        onError: (err) => toast(getApiErrorMessage(err), 'error'),
      },
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={entry ? t('expenses.edit') : t('expenses.add')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button loading={save.isPending} onClick={submit}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label={t('reports.category')}
          value={f.category}
          onChange={(e) => set('category', e.target.value as ExpenseCategory)}
          options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: t(`reports.cat.${c}`) }))}
        />
        <Input
          label={t('expenses.date')}
          type="date"
          max={today}
          value={f.date}
          onChange={(e) => set('date', e.target.value)}
          error={errors.date}
        />
        {isSalary && (
          <Select
            label={t('accReports.employee')}
            value={f.employeeId ?? ''}
            onChange={(e) => set('employeeId', e.target.value || null)}
            error={errors.employeeId}
            className="sm:col-span-2"
            options={[
              { value: '', label: t('expenses.pickEmployee') },
              ...staff.map((s) => ({ value: s.id, label: `${s.name} · ${t(`roles.${s.role}`)}` })),
            ]}
          />
        )}
        <Input
          label={t('reports.amount')}
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="TJS"
          value={f.amount || ''}
          onChange={(e) => set('amount', Number(e.target.value))}
          error={errors.amount}
        />
        <Select
          label={t('expenses.method')}
          value={f.method}
          onChange={(e) => set('method', e.target.value as ExpenseMethod)}
          options={EXPENSE_METHODS.map((m) => ({ value: m, label: t(`expenses.m.${m}`) }))}
        />
        <Textarea
          label={isSalary ? t('expenses.noteSalary') : t('expenses.description')}
          placeholder={isSalary ? t('accReports.salaryNotePh') : t('expenses.descriptionPh')}
          value={f.description}
          maxLength={200}
          rows={2}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
          className="sm:col-span-2"
        />
      </div>
    </Modal>
  );
}
