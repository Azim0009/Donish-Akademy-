import type { PaymentMethod, PaymentState } from '@/core/types/models';
import type { BadgeTone } from '@/shared/ui';

/** Стоимость курса в месяц (TJS). Потом — настройка филиала */
export const MONTHLY_FEE = 600;
export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'card', 'transfer'];
export const paymentStateTone: Record<PaymentState, BadgeTone> = {
  paid: 'green',
  partial: 'amber',
  unpaid: 'red',
};
