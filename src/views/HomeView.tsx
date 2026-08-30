import React from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronDown,
  Database,
  FileSpreadsheet,
  LogIn,
  MonitorCheck,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react';

interface HomeViewProps {
  onNavigate: (path: string) => void;
  currentUser?: any;
}

const features = [
  { icon: MonitorCheck, title: 'POS Terminal', detail: 'Barcode & Print', color: 'text-blue-400' },
  { icon: Boxes, title: 'FIFO Inventory', detail: 'Batch Costing', color: 'text-emerald-400' },
  { icon: Building2, title: 'Multi-Branch', detail: 'Stock Transfer', color: 'text-purple-400' },
  { icon: FileSpreadsheet, title: 'Sales Reports', detail: 'Profit & COGS', color: 'text-amber-400' },
  { icon: Database, title: 'PostgreSQL', detail: 'Prisma Schema', color: 'text-cyan-400' },
  { icon: ShieldCheck, title: 'Better Auth', detail: 'Secure Sessions', color: 'text-rose-400' },
];

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, currentUser }) => {
  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden overflow-y-auto bg-slate-950 font-sans text-slate-100 selection:bg-blue-500 selection:text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-600/15 blur-[120px] sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-indigo-600/15 blur-[140px]" />

      <header className="relative z-20 flex items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-950/80 px-3 py-3 backdrop-blur-md sm:gap-3 sm:px-6 sm:py-4">
        <button className="flex min-w-0 items-center gap-2.5 text-left sm:gap-3" onClick={() => onNavigate('/')} aria-label="Go to DreamsPOS home">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 sm:h-10 sm:w-10">
            <Store className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-base font-black tracking-tight text-white sm:gap-2 sm:text-lg">
              Dreams<span className="text-blue-500">POS</span>
            </span>
            <span className="block truncate text-[10px] font-medium text-slate-400 sm:text-[11px]">Local Shop Inventory Engine</span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {!currentUser && (
            <button onClick={() => onNavigate('/login')} className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-[11px] font-bold text-slate-200 transition-all hover:border-slate-700 sm:px-4 sm:text-xs">
              <LogIn className="h-3.5 w-3.5 text-blue-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-16">
          <section className="text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-[10px] font-bold text-slate-300 shadow-xl backdrop-blur-md sm:text-xs">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-blue-400 sm:h-4 sm:w-4" />
              <span>Local Shop Inventory & POS Management</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>

            <h1 className="mx-auto max-w-3xl text-[clamp(2.35rem,8vw,4.75rem)] font-black leading-[1.05] tracking-[-0.04em] text-white lg:mx-0">
              Smart control for your <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">retail business.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm font-medium leading-7 text-slate-400 sm:text-base lg:mx-0">
              High-performance point of sale, FIFO batch costing, multi-branch stock transfers, and automated inventory alerts—all backed by secure, reliable infrastructure.
            </p>

            <div className="mx-auto mt-7 flex w-full max-w-md flex-col gap-3 sm:flex-row lg:mx-0">
              <button onClick={() => onNavigate('/dashboard')} className="group flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-black text-white shadow-xl shadow-blue-600/25 transition-all hover:from-blue-500 hover:to-indigo-500">
                <LogIn className="h-4 w-4 text-blue-200" />
                <span>Get started</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

          </section>

          <section className="relative mx-auto w-full max-w-lg" aria-label="A modern workspace preview">
            <div className="absolute -right-8 top-8 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#19223d] via-[#111a32] to-[#0a1124] p-3 shadow-2xl shadow-black/40 sm:p-5">
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border border-cyan-300/10 bg-cyan-300/5" />
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border border-fuchsia-300/10 bg-fuchsia-300/5" />
              <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
                <div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-300/70">A clearer way forward</p><h2 className="mt-1 text-lg font-black tracking-tight text-white sm:text-xl">Make space for better work.</h2></div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-fuchsia-200"><Sparkles className="h-4 w-4" /></span>
              </div>
              <div className="relative grid gap-3 py-5 sm:grid-cols-[1.05fr_0.95fr] sm:gap-4">
                <div className="rounded-2xl border border-white/10 bg-[#080f22]/80 p-4 sm:p-5"><div className="mb-6 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9]" /><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Flow state</span></div><div className="space-y-3"><div className="h-3 w-4/5 rounded-full bg-gradient-to-r from-cyan-300/80 to-blue-500/30" /><div className="h-3 w-3/5 rounded-full bg-white/10" /><div className="h-3 w-2/3 rounded-full bg-white/10" /></div><div className="mt-8 flex items-end gap-1.5">{[45, 64, 52, 78, 62, 88].map((height, index) => <span key={index} className={`flex-1 rounded-t-md ${index === 5 ? 'bg-gradient-to-t from-fuchsia-500 to-cyan-300' : 'bg-blue-400/25'}`} style={{ height: `${height}px` }} />)}</div><p className="mt-3 text-[9px] font-medium text-slate-500">Small steps. Visible progress.</p></div>
                <div className="flex flex-col gap-3"><div className="flex-1 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-300/15 text-cyan-200"><CheckCircle2 className="h-4 w-4" /></span><p className="mt-5 text-sm font-black text-white">Focus</p><p className="mt-1 text-[10px] leading-5 text-slate-400">Keep the important things within reach.</p></div><div className="flex-1 rounded-2xl border border-fuchsia-300/15 bg-fuchsia-300/10 p-4"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-300/15 text-fuchsia-200"><ArrowRight className="h-4 w-4" /></span><p className="mt-5 text-sm font-black text-white">Move forward</p><p className="mt-1 text-[10px] leading-5 text-slate-400">Turn momentum into meaningful results.</p></div></div>
              </div>
              <div className="relative flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"><div><p className="text-[10px] font-bold text-white">Designed around your rhythm</p><p className="mt-1 text-[9px] text-slate-500">Simple tools. Clear direction.</p></div><span className="rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-bold text-cyan-200">Explore more <ArrowRight className="ml-1 inline h-3 w-3" /></span></div>
            </div>
          </section>

          <section className="hidden" aria-hidden="true">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-cyan-500/10 blur-3xl" />
            <div className="relative rounded-[1.75rem] border border-slate-700/80 bg-[#101b31] p-3 shadow-2xl shadow-black/40 sm:p-5">
              <div className="flex items-center justify-between border-b border-slate-700/70 pb-4">
                <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300"><Boxes className="h-4 w-4" /></span><div><p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Inventory command center</p><p className="mt-1 text-sm font-black text-white">Main Warehouse</p></div><ChevronDown className="h-3.5 w-3.5 text-slate-500" /></div>
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-bold text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Synced</span>
              </div>
              <div className="grid grid-cols-[0.92fr_1.08fr] gap-3 py-4 sm:gap-4">
                <div className="flex flex-col justify-between rounded-2xl border border-slate-700/70 bg-[#071023] p-3 sm:p-4"><div><p className="text-[10px] font-semibold text-slate-500">Stock health</p><div className="relative mx-auto my-4 flex h-28 w-28 items-center justify-center rounded-full bg-[conic-gradient(#38bdf8_0_78%,#1e3a5f_78%_100%)] p-2"><div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#071023]"><span className="text-2xl font-black text-white">78%</span><span className="text-[8px] text-slate-500">healthy</span></div></div></div><div className="flex items-center justify-between text-[9px]"><span className="text-slate-500">In stock</span><span className="font-bold text-cyan-300">1,248 items</span></div></div>
                <div className="rounded-2xl border border-slate-700/70 bg-[#071023] p-3 sm:p-4"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-semibold text-slate-500">Inventory value</p><ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" /></div><p className="text-2xl font-black text-white sm:text-3xl">৳8.42L</p><p className="mt-1 text-[9px] font-bold text-emerald-400">+8.6% from last month</p><div className="mt-6 flex h-12 items-end gap-1.5">{[35, 46, 40, 62, 56, 76, 68, 92].map((height, index) => <span key={index} className={`flex-1 rounded-t-sm ${index === 7 ? 'bg-cyan-400' : 'bg-blue-500/40'}`} style={{ height: `${height}%` }} />)}</div></div>
              </div>
              <div className="rounded-2xl border border-slate-700/70 bg-[#071023] p-3 sm:p-4"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent stock movement</p><span className="text-[9px] text-blue-400">View all</span></div><div className="space-y-3"><div className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400"><TrendingUp className="h-3.5 w-3.5" /></span><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold text-slate-200">New batch received</p><p className="text-[9px] text-slate-500">Beverages · 42 units</p></div><span className="text-[9px] font-semibold text-emerald-400">+42</span></div><div className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-400/10 text-blue-400"><MonitorCheck className="h-3.5 w-3.5" /></span><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold text-slate-200">POS sale completed</p><p className="text-[9px] text-slate-500">SKU-2048 · 2 units</p></div><span className="text-[9px] font-semibold text-blue-400">-2</span></div></div></div>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2.5"><AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" /><p className="flex-1 text-[9px] font-semibold text-amber-100"><span className="font-black">12 products</span> need restocking soon.</p><ArrowRight className="h-3.5 w-3.5 text-amber-300" /></div>
            </div>
          </section>

          <section className="hidden" aria-hidden="true">
            <div className="absolute -inset-4 rounded-[2rem] bg-blue-500/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-3 shadow-2xl shadow-black/30 sm:p-4">
              <div className="flex items-center justify-between border-b border-slate-800 px-1 pb-3">
                <div><p className="text-[10px] font-bold text-slate-400">OVERVIEW</p><p className="mt-1 text-sm font-black text-white">Today's performance</p></div>
                <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[9px] font-bold text-emerald-400">Live data</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 py-3 sm:gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] text-slate-500">Total sales</p><p className="mt-1 text-xl font-black text-white sm:text-2xl">৳24,860</p><p className="mt-1 text-[9px] font-bold text-emerald-400">+12.8% this week</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] text-slate-500">Orders</p><p className="mt-1 text-xl font-black text-white sm:text-2xl">186</p><p className="mt-1 text-[9px] font-bold text-blue-400">24 pending sync</p></div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-950 to-slate-900 p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold text-slate-400">Sales activity</p><span className="text-[9px] text-slate-500">Last 7 days</span></div>
                <div className="flex h-28 items-end gap-2 sm:h-36 sm:gap-3">
                  {[42, 58, 48, 76, 62, 89, 72].map((height, index) => <div key={index} className="flex h-full flex-1 items-end"><div className={`w-full rounded-t-md ${index === 5 ? 'bg-gradient-to-t from-blue-600 to-cyan-400' : 'bg-blue-500/25'}`} style={{ height: `${height}%` }} /></div>)}
                </div>
                <div className="mt-2 flex justify-between text-[8px] text-slate-600"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center"><div className="rounded-lg bg-blue-500/10 p-2"><p className="text-sm font-black text-blue-300">98.4%</p><p className="text-[8px] text-slate-500">Stock accuracy</p></div><div className="rounded-lg bg-emerald-500/10 p-2"><p className="text-sm font-black text-emerald-300">৳8.2k</p><p className="text-[8px] text-slate-500">Net profit</p></div><div className="rounded-lg bg-amber-500/10 p-2"><p className="text-sm font-black text-amber-300">12</p><p className="text-[8px] text-slate-500">Low stock</p></div></div>
            </div>
          </section>
        </div>
      </main>

      <footer className="relative z-20 mt-auto border-t border-slate-800/80 bg-slate-950 px-4 py-3 text-center text-[10px] font-medium text-slate-500 shrink-0">
        <span>© 2026 DreamsPOS. All rights reserved.</span>
      </footer>
    </div>
  );
};
