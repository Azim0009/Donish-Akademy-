import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { FiArrowRight, FiCheck, FiCode, FiLock, FiMapPin, FiPlayCircle, FiVideo } from 'react-icons/fi';
import { PATHS } from '@/core/config/paths';
import { MAIN_TRACK } from '@/core/config/course';
import { Button, Logo } from '@/shared/ui';

// 3 месяца курса Fullstack + AI
const modules: ['month1' | 'month2' | 'month3', 'done' | 'current' | 'locked'][] = [
  ['month1', 'current'],
  ['month2', 'locked'],
  ['month3', 'locked'],
];
const branches = ['Душанбе', 'Худжанд', 'Бохтар', 'Куляб', 'Истаравшан'];

export default function LandingPage() {
  const { t } = useTranslation();
  const steps = [
    { icon: FiVideo, title: t('landing.step1'), text: t('landing.step1Text') },
    { icon: FiPlayCircle, title: t('landing.step2'), text: t('landing.step2Text') },
    { icon: FiCode, title: t('landing.step3'), text: t('landing.step3Text') },
  ];

  return (
    <>
      {/* Hero: обещание + Road Map, который ученик увидит в кабинете */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <div>
          <h1 className="h-display text-[38px] leading-[1.08] sm:text-[52px]">{t('landing.title')}</h1>
          <p className="mt-5 max-w-lg text-lg text-muted">{t('landing.subtitle')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={PATHS.register}>
              <Button size="lg" rightIcon={<FiArrowRight />} tabIndex={-1}>{t('landing.start')}</Button>
            </Link>
            <Link to={PATHS.login}>
              <Button size="lg" variant="secondary" tabIndex={-1}>{t('landing.haveAccount')}</Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted">{t('landing.free')}</p>
        </div>

        <div className="rounded-[28px] border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold">{MAIN_TRACK.title}</span>
            <span className="text-sm text-muted">{t('landing.roadmap')}</span>
          </div>
          <ol className="mt-6 flex flex-col">
            {modules.map(([name, state], i) => (
              <li key={name} className="relative flex items-center gap-4 pb-5 last:pb-0">
                {i < modules.length - 1 && <span className={clsx('absolute left-[19px] top-10 h-[calc(100%-28px)] w-[3px] rounded-full', state === 'done' ? 'bg-brand' : 'bg-line')} />}
                <span
                  className={clsx(
                    'relative z-10 flex h-10 w-10 items-center justify-center rounded-full font-semibold',
                    state === 'done' && 'bg-brand text-brand-ink',
                    state === 'current' && 'animate-pulse-ring border-[3px] border-brand bg-surface text-brand-strong',
                    state === 'locked' && 'border-2 border-dashed border-line text-muted',
                  )}
                >
                  {state === 'done' ? <FiCheck /> : state === 'locked' ? <FiLock className="text-sm" /> : i + 1}
                </span>
                <span className="flex-1">
                  <span className={clsx('block font-medium', state === 'locked' && 'text-muted')}>{t(`landing.${name}`)}</span>
                  <span className="block text-[13px] text-muted">{t(`landing.${name}Text`)}</span>
                </span>
                {state === 'current' && <span className="rounded-full bg-amber-soft px-2.5 py-0.5 text-xs font-medium text-amber">{t('landing.youAreHere')}</span>}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="h-display max-w-xl text-[28px] leading-tight">{t('landing.howTitle')}</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title}>
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-card bg-brand-soft text-xl text-brand-strong"><Icon /></span>
                  <span className="text-sm text-muted">{t('landing.stepN', { n: i + 1 })}</span>
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
        <div>
          <h2 className="h-display text-[28px] leading-tight">{t('landing.branchesTitle')}</h2>
          <p className="mt-3 max-w-md text-muted">{t('landing.branchesText')}</p>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {branches.map((b) => (
            <li key={b} className="flex items-center gap-2.5 rounded-card border border-line bg-surface px-4 py-3.5 font-medium">
              <FiMapPin className="text-brand" /> {b}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="flex flex-col items-start gap-6 rounded-[28px] bg-brand p-8 text-brand-ink sm:p-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="h-display text-[28px] leading-tight">{t('landing.ctaTitle')}</h2>
            <p className="mt-2 opacity-85">{t('landing.ctaText')}</p>
          </div>
          <Link to={PATHS.register}>
            <Button size="lg" className="bg-white !text-brand-strong hover:bg-white/90" tabIndex={-1}>{t('landing.start')}</Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:px-6">
          <Logo />
          <span>© {new Date().getFullYear()} Donish Academy</span>
        </div>
      </footer>
    </>
  );
}
