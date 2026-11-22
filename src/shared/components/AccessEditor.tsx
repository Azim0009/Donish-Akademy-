import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FiLock } from 'react-icons/fi';
import type { UserListItem } from '@/core/types/models';
import type { Role } from '@/core/auth/roles';
import { accessPayload, ASSIGNABLE_ROLES, userRoles, type AccessValue } from '@/core/auth/access';
import { toggleableSections } from '@/core/navigation/menus';
import { getApiErrorMessage } from '@/core/api/axiosClient';
import type { accessPayload as toPayload } from '@/core/auth/access';
import { Badge, Button, Modal, toast } from '@/shared/ui';

/**
 * Редактор мульти-доступа: роли сотрудника + галочки разделов по каждой роли.
 * Используется в окне «Доступ» и прямо в форме назначения директора.
 */
export function AccessEditor({ primary, value, onChange, allowedRoles = ASSIGNABLE_ROLES }: { primary: Role; value: AccessValue; onChange: (v: AccessValue) => void; allowedRoles?: Role[] }) {
  const { t } = useTranslation();
  const { roles, denied } = value;

  const toggleRole = (r: Role) => onChange({ ...value, roles: roles.includes(r) ? roles.filter((x) => x !== r) : [...roles, r] });
  const toggleSection = (key: string) => {
    const next = new Set(denied);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange({ ...value, denied: next });
  };
  const setAll = (r: Role, on: boolean) => {
    const next = new Set(denied);
    toggleableSections(r).forEach((s) => (on ? next.delete(s.section) : next.add(s.section)));
    onChange({ ...value, denied: next });
  };
  const roleList = [...new Set([...allowedRoles, primary])].sort((a, b) => ASSIGNABLE_ROLES.indexOf(a) - ASSIGNABLE_ROLES.indexOf(b));

  return (
    <div className="flex flex-col gap-5">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t('access.roles')}</legend>
        <div className="flex flex-wrap gap-2">
          {roleList.map((r) => {
            const isPrimary = r === primary;
            const on = roles.includes(r);
            return (
              <label
                key={r}
                className={clsx(
                  'flex cursor-pointer items-center gap-2 rounded-ctl border px-3 py-2 text-sm transition-colors',
                  on ? 'border-brand/50 bg-brand-soft text-brand-strong' : 'border-line hover:bg-sunken',
                  isPrimary && 'cursor-default',
                )}
              >
                <input type="checkbox" className="h-4 w-4 accent-brand" checked={on} disabled={isPrimary} onChange={() => toggleRole(r)} />
                {t(`roles.${r}`)}
                {isPrimary && <FiLock className="text-xs" aria-label={t('access.primary')} />}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-[13px] text-muted">{t('access.rolesHint')}</p>
      </fieldset>

      {roles.map((r) => {
        const sections = toggleableSections(r);
        const onCount = sections.filter((s) => !denied.has(s.section)).length;
        return (
          <fieldset key={r} className="rounded-card border border-line p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <legend className="flex items-center gap-2 text-sm font-semibold">
                {t(`roles.${r}`)} <Badge>{onCount}/{sections.length}</Badge>
              </legend>
              <div className="flex gap-3 text-[13px]">
                <button type="button" className="font-medium text-brand-strong hover:underline" onClick={() => setAll(r, true)}>{t('access.all')}</button>
                <button type="button" className="font-medium text-muted hover:underline" onClick={() => setAll(r, false)}>{t('access.none')}</button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {sections.map(({ section, labelKey, icon: Icon }) => (
                <label key={section} className="flex cursor-pointer items-center gap-2.5 rounded-ctl px-2 py-1.5 text-sm hover:bg-sunken">
                  <input type="checkbox" className="h-4 w-4 accent-brand" checked={!denied.has(section)} onChange={() => toggleSection(section)} />
                  <Icon className="text-muted" />
                  {t(labelKey)}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

/**
 * Окно «Доступ» сотрудника. Основную роль снять нельзя.
 * Разделы по умолчанию включены — снимите галочку, чтобы скрыть.
 */
export function AccessModal({
  user,
  onClose,
  onSave,
  allowedRoles = ASSIGNABLE_ROLES,
}: {
  user: UserListItem;
  onClose: () => void;
  /** сохранение — у SuperAdmin и директора разные адреса API */
  onSave: (body: ReturnType<typeof toPayload>) => Promise<unknown>;
  allowedRoles?: Role[];
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState<AccessValue>({ roles: userRoles(user), denied: new Set(user.deniedSections ?? []) });

  const submit = async () => {
    setSaving(true);
    try {
      await onSave(accessPayload(value));
      toast(t('access.saved', { name: user.name }), 'success');
      onClose();
    } catch (e) {
      toast(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('access.title', { name: user.name })}
      description={t('access.description')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={submit} loading={saving}>{t('common.saveChanges')}</Button>
        </>
      }
    >
      <AccessEditor primary={user.role} value={value} onChange={setValue} allowedRoles={allowedRoles} />
    </Modal>
  );
}

/** Коротко: «Полный доступ» или «Выключено: 2» + доп. роли */
export function AccessSummary({ user }: { user: UserListItem }) {
  const { t } = useTranslation();
  const off = (user.deniedSections ?? []).length;
  const extra = userRoles(user).slice(1);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {off ? <Badge tone="amber">{t('access.offCount', { count: off })}</Badge> : <Badge tone="green">{t('access.full')}</Badge>}
      {extra.map((r) => <Badge key={r} tone="blue">+{t(`roles.${r}`)}</Badge>)}
    </div>
  );
}
