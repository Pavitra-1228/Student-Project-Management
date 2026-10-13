import { LogoMark } from '../components/layout/Logo.jsx';
import { ThemeToggle } from '../components/layout/TopBar.jsx';

const RIBBONS = [
  { width: '72%', color: 'bg-on-brand', delay: '0s' },
  { width: '92%', color: 'bg-sun', delay: '-2s' },
  { width: '48%', color: 'bg-accent', delay: '-4s' },
  { width: '84%', color: 'bg-on-brand/45', delay: '-1s' },
  { width: '58%', color: 'bg-sun/70', delay: '-3s' }
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand p-12 text-on-brand lg:flex">
        <div className="flex items-center gap-3">
          <LogoMark className="h-10 w-10" />
          <span className="font-display text-2xl font-extrabold">ProjectFlow</span>
        </div>
        <div>
          <div className="relative mb-12 h-44 max-w-lg" aria-hidden="true">
            <div className="absolute left-0 top-0 w-52 animate-float rounded-card border border-on-brand/20 bg-surface/12 p-4 shadow-lift backdrop-blur-sm" style={{ animationDelay: '-1.5s' }}>
              <div className="flex items-center justify-between text-xs font-semibold opacity-80">
                <span>Research brief</span>
                <span className="h-2 w-2 rounded-full bg-sun" />
              </div>
              <div className="mt-3 h-2 w-3/4 rounded-full bg-on-brand/70" />
              <div className="mt-2 h-2 w-1/2 rounded-full bg-on-brand/30" />
            </div>
            <div className="absolute left-32 top-16 z-10 w-56 animate-float rounded-card border border-on-brand/20 bg-surface/15 p-4 shadow-lift backdrop-blur-sm" style={{ animationDelay: '-4s' }}>
              <div className="flex items-center justify-between text-xs font-semibold opacity-80">
                <span>Prototype review</span>
                <span className="rounded-full bg-sun px-2 py-0.5 text-[10px] text-ink">Today</span>
              </div>
              <div className="mt-3 flex gap-1.5">
                <span className="h-2 w-2/5 rounded-full bg-accent" />
                <span className="h-2 w-1/5 rounded-full bg-on-brand/50" />
                <span className="h-2 flex-1 rounded-full bg-on-brand/20" />
              </div>
            </div>
            <div className="absolute bottom-0 left-8 w-44 animate-float rounded-card border border-on-brand/20 bg-surface/10 p-3 shadow-lift backdrop-blur-sm" style={{ animationDelay: '-6s' }}>
              <div className="flex items-center gap-2 text-xs font-semibold opacity-80">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sun text-[10px] text-ink">✓</span>
                <span>Launch checklist</span>
              </div>
            </div>
          </div>
          <div className="space-y-3.5" aria-hidden="true">
            {RIBBONS.map((ribbon, index) => (
              <div key={index} className="h-4" style={{ width: ribbon.width }}>
                <div className={`h-full w-full animate-drift rounded-full ${ribbon.color}`} style={{ animationDelay: ribbon.delay }} />
              </div>
            ))}
          </div>
          <h2 className="max-w-md text-5xl font-extrabold leading-[1.05]">Plan together. Ship on time.</h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed opacity-90">
            One place for student teams and mentors to set deadlines, move tasks forward and see progress without asking around.
          </p>
        </div>
        <p className="text-sm opacity-80">Built for capstones, club projects and group assignments.</p>
      </aside>

      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end">
          <span className="inline-flex items-center gap-2.5 lg:hidden">
            <LogoMark />
            <span className="font-display text-xl font-extrabold">ProjectFlow</span>
          </span>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <h1 className="text-4xl font-extrabold leading-tight">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <p className="mt-8 text-center text-sm text-muted">{footer}</p>}
        </div>
      </main>
    </div>
  );
}
