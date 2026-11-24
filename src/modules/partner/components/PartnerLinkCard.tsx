import { useTranslation } from 'react-i18next';
import { FiCopy, FiExternalLink, FiLink, FiSend } from 'react-icons/fi';
import { Button, Card, toast } from '@/shared/ui';
import { partnerLink } from '@/shared/lib/partners';

/** Своя ссылка партнёра: скопировать, открыть, отправить в WhatsApp / Telegram */
export function PartnerLinkCard({ code, name }: { code: string; name: string }) {
  const { t } = useTranslation();
  const link = partnerLink(code);
  const text = t('partner.shareText', { name, link });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast(t('partner.linkCopied'), 'success');
    } catch {
      toast(t('credentials.copyFailed'));
    }
  };
  return (
    <Card className="flex flex-col gap-4 border-brand/30 bg-brand-soft/40 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-soft text-lg text-brand-strong">
          <FiLink aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{t('partner.yourLink')}</p>
          <p className="text-sm text-muted">{t('partner.yourLinkHint')}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 truncate rounded-ctl border border-line bg-surface px-3 py-2.5 text-sm">
          {link}
        </code>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" leftIcon={<FiCopy />} onClick={copy}>
            {t('partner.copy')}
          </Button>
          <a href={link} target="_blank" rel="noreferrer" className="inline-flex">
            <Button variant="secondary" leftIcon={<FiExternalLink />} tabIndex={-1}>
              {t('partner.open')}
            </Button>
          </a>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex"
        >
          <Button size="sm" variant="soft" leftIcon={<FiSend />} tabIndex={-1}>
            WhatsApp
          </Button>
        </a>
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(t('partner.shareShort', { name }))}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex"
        >
          <Button size="sm" variant="soft" leftIcon={<FiSend />} tabIndex={-1}>
            Telegram
          </Button>
        </a>
      </div>
    </Card>
  );
}
