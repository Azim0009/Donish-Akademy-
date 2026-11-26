import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Payment } from '@/core/types/models';
import mark from '@/assets/logo-mark.png';
import { receiptRows } from './receiptData';

/** Квитанция об оплате с логотипом Donish Academy (экран и печать) */
export const Receipt = forwardRef<
  HTMLDivElement,
  { payment: Payment; fee: number; paidTotal: number }
>(({ payment, fee, paidTotal }, ref) => {
  const { t } = useTranslation();
  const r = receiptRows(t, payment, { fee, paidTotal });
  return (
    <div
      ref={ref}
      className="receipt relative mx-auto w-full max-w-[460px] overflow-hidden rounded-card border border-line bg-white p-6 text-[#1b1f1d]"
    >
      <div className="flex items-center gap-3 border-b-2 border-[#16803c] pb-4">
        <img src={mark} alt="" width={44} height={44} />
        <div className="leading-none">
          <p className="text-[18px] font-bold uppercase tracking-[0.14em] text-[#16803c]">Donish</p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.42em] text-[#6b7470]">
            Academy
          </p>
        </div>
        <div className="ml-auto text-right text-[11px] text-[#6b7470]">
          <p>donishacademy.tj</p>
          <p>+992 90 123 45 67</p>
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h2 className="text-[17px] font-bold">{r.title}</h2>
        <span className="text-[12px] text-[#6b7470]">{r.date}</span>
      </div>
      <dl className="mt-3 flex flex-col">
        {r.rows.map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between gap-4 border-b border-dashed border-[#d6dcd8] py-2 text-[13px]"
          >
            <dt className="text-[#6b7470]">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex items-center justify-between rounded-[10px] bg-[#eaf6ee] px-4 py-3">
        <span className="text-[13px] font-medium">{t('receipt.amount')}</span>
        <span className="text-[22px] font-bold text-[#16803c]">{r.amount}</span>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4 text-[12px]">
        <div>
          <p className="text-[#6b7470]">{t('receipt.receivedBy')}</p>
          <p className="font-medium">{r.receivedBy}</p>
          <p className="mt-4 w-40 border-t border-[#1b1f1d] pt-1 text-[10px] text-[#6b7470]">
            {t('receipt.signature')}
          </p>
        </div>
        <div
          aria-hidden
          className="grid h-[86px] w-[86px] -rotate-12 place-items-center rounded-full border-[3px] border-[#16803c]/70 text-center text-[11px] font-bold uppercase leading-tight text-[#16803c]/80"
        >
          {t('receipt.stamp')}
          <br />
          Donish
        </div>
      </div>
      <p className="mt-4 text-center text-[11px] text-[#6b7470]">{t('receipt.thanks')}</p>
    </div>
  );
});
Receipt.displayName = 'Receipt';
