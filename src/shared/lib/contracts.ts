import type { ContractRole } from '@/core/types/models';

/**
 * Поля договора. В тексте шаблона пишутся как {{fullName}} — при создании сотрудника
 * они заменяются его данными автоматически.
 */
export const CONTRACT_FIELDS = [
  'fullName',
  'lastName',
  'firstName',
  'position',
  'branch',
  'branchAddress',
  'phone',
  'login',
  'date',
  'city',
] as const;
export type ContractField = (typeof CONTRACT_FIELDS)[number];
export type ContractData = Partial<Record<ContractField, string>>;

/** Подставить данные. Незаполненные поля остаются как [поле] — их видно в предпросмотре */
export function fillContract(
  body: string,
  data: ContractData,
  emptyLabel: (f: string) => string = (f) => `[${f}]`,
) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const v = data[key as ContractField];
    return v && v.trim() ? v.trim() : emptyLabel(key);
  });
}

export const todayRu = () =>
  new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** HTML договора для печати и Word */
function contractHtml(title: string, body: string) {
  const paras = body
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>body{font-family:'Times New Roman',serif;font-size:14pt;line-height:1.5;margin:2cm}h1{font-size:16pt;text-align:center;margin-bottom:24pt}p{margin:0 0 10pt;text-align:justify}</style>
</head><body><h1>${escapeHtml(title)}</h1>${paras}</body></html>`;
}

/** Скачать как Word (.doc) — открывается в Microsoft Word и Google Docs */
export function downloadContractDoc(title: string, body: string, fileName: string) {
  const blob = new Blob(['﻿', contractHtml(title, body)], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${fileName.replace(/[\\/:*?"<>|]+/g, ' ').trim()}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Напечатать / сохранить в PDF */
export function printContract(title: string, body: string) {
  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) return false;
  w.document.write(contractHtml(title, body));
  w.document.close();
  w.focus();
  w.print();
  return true;
}

export const CONTRACT_ROLES: ContractRole[] = ['director', 'administrator', 'mentor'];
