import {
  ArrowLeft,
  CaretDown,
  ChartDonut,
  Database,
  FileSearch,
  House,
  List,
  Megaphone,
  Strategy,
  Target,
  X
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

const navItems = [
  { to: "/workspace", label: "总览", icon: House, end: true },
  { to: "/actions", label: "行动建议", icon: Target },
  { to: "/consumer", label: "消费者洞察", icon: ChartDonut },
  { to: "/claims", label: "品牌宣传", icon: Megaphone },
  { to: "/compare", label: "宣传与体验对照", icon: Strategy },
  { to: "/evidence", label: "消费者原声", icon: FileSearch },
  { to: "/data", label: "数据管理", icon: Database }
];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2">跳到主要内容</a>

      <aside className="hidden min-h-[100dvh] border-r border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:flex-col" aria-label="案例分析导航">
        <div className="border-b border-line px-5 py-5">
          <Link to="/" className="block text-[18px] font-bold tracking-[-0.04em] text-plum">brandinsight</Link>
          <p className="mt-1 text-[11px] font-medium text-muted">消费者决策工作台</p>
        </div>
        <div className="px-3 py-4">
          <button className="flex w-full items-center gap-3 rounded-xl border border-line bg-canvas px-3 py-3 text-left transition hover:border-[#CFAFB6]" type="button" aria-label="当前案例为赫莲娜小露珠">
            <img className="h-10 w-10 rounded-lg object-cover" src="/assets/xiaoluzhu-official.jpg" alt="赫莲娜小露珠" />
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-ink">赫莲娜</span><span className="mt-0.5 block truncate text-[11px] text-muted">小露珠消费者研究</span></span>
            <CaretDown size={14} className="text-muted" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 px-2.5">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] transition ${isActive ? "bg-rose-soft font-bold text-plum" : "font-medium text-muted hover:bg-canvas hover:text-ink"}`}>
              <Icon size={18} weight="regular" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <div className="rounded-xl bg-canvas px-3 py-3"><p className="text-[11px] leading-5 text-muted">案例数据范围</p><p className="text-xs font-bold text-ink">4 个平台，6,610 条记录</p></div>
          <Link to="/" className="mt-2 flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-muted hover:bg-canvas hover:text-ink"><ArrowLeft size={16} />返回平台首页</Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
          <div className="flex h-[64px] items-center gap-3 px-4 md:px-7">
            <button className="rounded-xl border border-line p-2 text-plum lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "关闭导航" : "打开导航"}>
              {open ? <X size={21} /> : <List size={21} />}
            </button>
            <Link to="/" className="font-bold tracking-[-0.03em] text-plum lg:hidden">brandinsight</Link>
            <div className="ml-auto flex min-w-0 items-center gap-3">
              <div className="hidden text-right sm:block"><p className="text-xs font-bold text-ink">Helena Rubinstein</p><p className="text-[11px] text-muted">Powercell Skinmunity Essence</p></div>
              <span className="status-good">数据已核对</span>
            </div>
          </div>
          <div id="mobile-nav" className={`${open ? "block" : "hidden"} border-t border-line bg-white p-3 lg:hidden`}>
            <nav className="grid gap-1 sm:grid-cols-2" aria-label="移动端案例分析导航">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm ${isActive ? "bg-rose-soft font-bold text-plum" : "text-muted hover:bg-canvas"}`}><Icon size={18} /><span>{label}</span></NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main id="main-content" className="min-w-0 px-4 py-6 md:px-7 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[1280px]"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
