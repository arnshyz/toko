import { ReactNode } from "react";

export type SellerAuthLayoutProps = {
  badge: string;
  title: string;
  description?: string;
  heroTitle: string;
  heroSubtitle?: string;
  heroDescription: string;
  heroHighlights: string[];
  children: ReactNode;
  footer?: ReactNode;
};

export function SellerAuthLayout({
  badge,
  title,
  description,
  heroTitle,
  heroSubtitle,
  heroDescription,
  heroHighlights,
  children,
  footer,
}: SellerAuthLayoutProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-12">
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-sky-400 to-sky-600 p-8 text-white shadow-2xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl font-bold text-white">
              A
            </div>
            <div>
              <p className="text-3xl font-semibold leading-tight">{heroTitle}</p>
              {heroSubtitle ? (
                <p className="text-lg font-medium text-white/80">{heroSubtitle}</p>
              ) : null}
            </div>
          </div>
          <p className="max-w-sm text-base text-white/80">{heroDescription}</p>
        </div>
        <div className="mt-8 space-y-3 text-sm text-white/80">
          {heroHighlights.map((highlight, index) => (
            <div key={highlight} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <span>{highlight}</span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute -left-16 bottom-12 hidden h-40 w-40 rounded-full bg-white/20 blur-3xl lg:block" />
        <div className="pointer-events-none absolute -right-20 top-10 hidden h-48 w-48 rounded-full bg-white/10 blur-3xl lg:block" />
      </div>
      <div className="w-full max-w-lg self-center rounded-3xl border border-sky-100 bg-white/80 p-6 shadow-xl shadow-sky-200/50 backdrop-blur lg:self-stretch lg:p-10">
        <div className="space-y-6">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
              {badge}
            </span>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
              {description ? (
                <p className="mt-2 text-sm text-slate-600">{description}</p>
              ) : null}
            </div>
          </div>
          {children}
        </div>
        {footer ? <div className="mt-8 border-t border-sky-100 pt-6 text-sm text-slate-600">{footer}</div> : null}
      </div>
    </div>
  );
}
