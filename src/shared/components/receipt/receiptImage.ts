import type { TFunction } from 'i18next';
import type { Payment } from '@/core/types/models';
import mark from '@/assets/logo-mark.png';
import { receiptRows } from './receiptData';

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

/** Квитанция картинкой PNG — чтобы отправить в WhatsApp / Telegram как фото */
export async function receiptPng(
  t: TFunction,
  p: Payment,
  ctx: { fee: number; paidTotal: number },
): Promise<Blob> {
  const r = receiptRows(t, p, ctx);
  const S = 2; // чёткость
  const W = 560;
  const rowH = 38;
  const H = 190 + r.rows.length * rowH + 250; // строки + сумма + подпись + «спасибо»
  const c = document.createElement('canvas');
  c.width = W * S;
  c.height = H * S;
  const g = c.getContext('2d')!;
  g.scale(S, S);
  const font = (size: number, weight = 400) => `${weight} ${size}px Onest, Arial, sans-serif`;
  const GREEN = '#16803c';
  const MUTED = '#6b7470';
  const INK = '#1b1f1d';

  g.fillStyle = '#fff';
  g.fillRect(0, 0, W, H);
  // шапка
  try {
    g.drawImage(await loadImg(mark), 32, 30, 52, 52);
  } catch {
    /* без логотипа */
  }
  g.fillStyle = GREEN;
  g.font = font(22, 700);
  g.fillText('DONISH', 96, 56);
  g.fillStyle = MUTED;
  g.font = font(11, 600);
  g.fillText('A C A D E M Y', 97, 74);
  g.textAlign = 'right';
  g.fillText('donishacademy.tj', W - 32, 52);
  g.fillText('+992 90 123 45 67', W - 32, 70);
  g.textAlign = 'left';
  g.fillStyle = GREEN;
  g.fillRect(32, 100, W - 64, 3);

  // заголовок
  g.fillStyle = INK;
  g.font = font(20, 700);
  g.fillText(r.title, 32, 146);
  g.fillStyle = MUTED;
  g.font = font(13);
  g.textAlign = 'right';
  g.fillText(r.date, W - 32, 146);

  // строки
  let y = 190;
  r.rows.forEach(([k, v]) => {
    g.textAlign = 'left';
    g.fillStyle = MUTED;
    g.font = font(14);
    g.fillText(k, 32, y);
    g.textAlign = 'right';
    g.fillStyle = INK;
    g.font = font(14, 600);
    g.fillText(v.length > 34 ? `${v.slice(0, 33)}…` : v, W - 32, y);
    g.strokeStyle = '#d6dcd8';
    g.setLineDash([4, 4]);
    g.beginPath();
    g.moveTo(32, y + 13);
    g.lineTo(W - 32, y + 13);
    g.stroke();
    g.setLineDash([]);
    y += rowH;
  });

  // сумма
  y += 6;
  g.fillStyle = '#eaf6ee';
  g.beginPath();
  g.roundRect(32, y, W - 64, 60, 12);
  g.fill();
  g.textAlign = 'left';
  g.fillStyle = INK;
  g.font = font(15, 600);
  g.fillText(t('receipt.amount'), 50, y + 37);
  g.textAlign = 'right';
  g.fillStyle = GREEN;
  g.font = font(26, 700);
  g.fillText(r.amount, W - 50, y + 40);

  // принял + печать
  y += 100;
  g.textAlign = 'left';
  g.fillStyle = MUTED;
  g.font = font(13);
  g.fillText(t('receipt.receivedBy'), 32, y);
  g.fillStyle = INK;
  g.font = font(14, 600);
  g.fillText(r.receivedBy, 32, y + 20);
  g.strokeStyle = INK;
  g.beginPath();
  g.moveTo(32, y + 56);
  g.lineTo(220, y + 56);
  g.stroke();
  g.fillStyle = MUTED;
  g.font = font(11);
  g.fillText(t('receipt.signature'), 32, y + 72);

  g.save();
  g.translate(W - 90, y + 20);
  g.rotate(-0.2);
  g.strokeStyle = 'rgba(22,128,60,.75)';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, 0, 46, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = 'rgba(22,128,60,.85)';
  g.textAlign = 'center';
  g.font = font(13, 800);
  g.fillText(t('receipt.stamp').toUpperCase(), 0, -2);
  g.fillText('DONISH', 0, 16);
  g.restore();

  g.textAlign = 'center';
  g.fillStyle = MUTED;
  g.font = font(12);
  g.fillText(t('receipt.thanks'), W / 2, H - 28);

  return new Promise((res, rej) =>
    c.toBlob((b) => (b ? res(b) : rej(new Error('png'))), 'image/png'),
  );
}
