import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiDownload, FiImage, FiPrinter, FiSend } from 'react-icons/fi';
import type { Payment } from '@/core/types/models';
import { whatsappLink } from '@/shared/lib/credentials';
import { Button, Modal, toast } from '@/shared/ui';
import { Receipt } from './Receipt';
import { receiptPng } from './receiptImage';

/** Печать только квитанции: копия в скрытом iframe со стилями страницы */
function printNode(node: HTMLElement, title: string) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  const styles = [...document.querySelectorAll('style, link[rel="stylesheet"]')]
    .map((n) => n.outerHTML)
    .join('');
  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>${styles}` +
      `<style>@page{size:A5;margin:12mm}body{background:#fff!important;padding:0;margin:0}.receipt{border:0!important;max-width:none!important}</style>` +
      `</head><body>${node.outerHTML}</body></html>`,
  );
  doc.close();
  const go = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 1000);
  };
  // ждём картинку логотипа
  const img = doc.querySelector('img');
  if (img && !img.complete) img.onload = img.onerror = go;
  else setTimeout(go, 150);
}

/**
 * Квитанция об оплате: печать (или «Сохранить как PDF»), картинка PNG,
 * отправка ученику — на телефоне как файл через «Поделиться», на компьютере: скачать + WhatsApp.
 */
export function ReceiptModal({
  payment,
  fee,
  paidTotal,
  phone,
  onClose,
}: {
  payment: Payment;
  fee: number;
  paidTotal: number;
  phone: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const fileName = `kvitanciya_${payment.receiptNo}.png`;

  const png = () => receiptPng(t, payment, { fee, paidTotal });
  const download = async () => {
    setBusy(true);
    try {
      const blob = await png();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch {
      toast(t('receipt.imageError'), 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };
  const send = async () => {
    setBusy(true);
    try {
      const file = new File([await png()], fileName, { type: 'image/png' });
      // телефон: системное «Поделиться» — сразу в WhatsApp / Telegram как фото
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t('receipt.title', { no: payment.receiptNo }),
        });
        return;
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    } finally {
      setBusy(false);
    }
    // компьютер: скачиваем картинку и открываем чат — её остаётся перетащить в WhatsApp
    if (await download()) {
      toast(t('receipt.attachHint'), 'success');
      const wa = whatsappLink(
        phone,
        t('receipt.waText', { name: payment.studentName, no: payment.receiptNo }),
      );
      if (wa) window.open(wa, '_blank', 'noopener');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={t('receipt.modalTitle')}
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            leftIcon={<FiPrinter />}
            onClick={() => ref.current && printNode(ref.current, payment.receiptNo)}
          >
            {t('receipt.print')}
          </Button>
          <Button variant="secondary" leftIcon={<FiDownload />} onClick={download} loading={busy}>
            {t('receipt.download')}
          </Button>
          <Button leftIcon={<FiSend />} onClick={send} loading={busy}>
            {t('receipt.send')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="rounded-card bg-sunken p-3">
          <Receipt ref={ref} payment={payment} fee={fee} paidTotal={paidTotal} />
        </div>
        <p className="text-xs text-muted">{t('receipt.printHint')}</p>
        {payment.checkPhoto && (
          <div>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<FiImage />}
              onClick={() => setShowCheck((v) => !v)}
            >
              {showCheck ? t('receipt.hideCheck') : t('receipt.showCheck')}
            </Button>
            {showCheck && (
              <img
                src={payment.checkPhoto}
                alt={t('receipt.checkAlt', { no: payment.receiptNo })}
                className="mt-2 max-h-[420px] rounded-ctl border border-line object-contain"
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
