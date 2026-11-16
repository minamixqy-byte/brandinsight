import {
  ArrowRight,
  ChartBar,
  CheckCircle,
  FileSearch,
  Funnel,
  List,
  MagnifyingGlass,
  Strategy,
  X
} from "@phosphor-icons/react";
import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import { useApi } from "../api";
import type { AnalyticsData, OverviewData, RecordItem } from "../types";

type ActionsResponse = { items: Array<{ action_id: string; title: string; action_text: string; owner: string; metric: string; evidence: RecordItem[] }> };

const workflow = [
  { icon: MagnifyingGlass, title: "搜索", text: "在已接入的品牌表达和消费者原文中定位问题。" },
  { icon: Funnel, title: "分类", text: "按平台、主题、情绪与内容类型组织反馈。" },
  { icon: ChartBar, title: "分析", text: "查看统计口径、代表性原文与体验差异。" },
  { icon: Strategy, title: "行动", text: "把发现连接到负责团队和拟验证指标。" }
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const overview = useApi<OverviewData>("/case/overview");
  const analytics = useApi<AnalyticsData>("/analytics/topics");
  const actions = useApi<ActionsResponse>("/case/recommendations");
  const finding = overview.data?.findings[0];
  const evidence = finding?.records[1] || finding?.records[0];
  const action = actions.data?.items[0];

  return (
    <div className="min-h-[100dvh] bg-white text-ink">
      <a href="#landing-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2">跳到主要内容</a>
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center px-4 md:px-7">
          <Link to="/" className="text-[17px] font-bold tracking-[-0.035em] text-plum">brandinsight</Link>
          <nav className="ml-auto hidden items-center gap-8 lg:flex" aria-label="公开首页导航">
            <a className="text-sm font-bold text-muted hover:text-rose" href="#capabilities">平台能力</a>
            <a className="text-sm font-bold text-muted hover:text-rose" href="#workflow">工作流程</a>
            <a className="text-sm font-bold text-muted hover:text-rose" href="#case-preview">案例预览</a>
          </nav>
          <Link className="btn-primary ml-8 hidden lg:inline-flex" to="/workspace">查看案例<ArrowRight size={17} /></Link>
          <button className="ml-auto rounded-lg border border-line p-2 text-plum lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "关闭导航" : "打开导航"} aria-expanded={menuOpen}>{menuOpen ? <X size={21} /> : <List size={21} />}</button>
        </div>
        {menuOpen ? <nav className="grid gap-1 border-t border-line bg-white px-4 py-4 lg:hidden" aria-label="公开首页移动导航"><a className="mobile-nav-link" href="#capabilities">平台能力</a><a className="mobile-nav-link" href="#workflow">工作流程</a><a className="mobile-nav-link" href="#case-preview">案例预览</a><Link className="btn-primary mt-2" to="/workspace">查看案例<ArrowRight size={17} /></Link></nav> : null}
      </header>

      <main id="landing-main">
        <section className="relative overflow-hidden border-b border-line">
          <div className="landing-grid pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[1320px] items-center gap-12 px-4 py-16 md:px-7 lg:min-h-[690px] lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
            <div className="max-w-[620px]">
              <p className="text-sm font-bold text-rose">面向品牌营销与消费者洞察团队</p>
              <h1 className="mt-5 text-[40px] font-bold leading-[1.08] tracking-[-0.045em] text-plum sm:text-[50px] lg:text-[58px]">看懂消费者真实体验，找到品牌下一步行动。</h1>
              <p className="mt-6 max-w-[56ch] text-lg leading-8 text-muted">整合官网、电商与社媒反馈，让品牌主从搜索原文、识别差异到制定行动，在一处完成。</p>
              <div className="mt-8 flex flex-wrap gap-3"><Link className="btn-primary min-h-12 px-5" to="/workspace">进入小露珠案例<ArrowRight size={18} /></Link><a className="btn-secondary min-h-12 px-5" href="#capabilities">了解平台能力</a></div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]" aria-label="赫莲娜小露珠真实案例预览">
              <div className="overflow-hidden rounded-[18px] border border-line bg-[#F1ECEB]">
                <img className="h-full min-h-[420px] w-full object-cover object-center" src="/assets/xiaoluzhu-official.jpg" alt="赫莲娜至美琉光恒采精萃露小露珠" />
              </div>
              <div className="flex flex-col justify-between rounded-[18px] border border-line bg-white p-6 shadow-soft">
                <div><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-rose">案例洞察</p><span className="status-good">真实数据</span></div><h2 className="mt-4 text-2xl font-bold tracking-[-0.025em] text-plum">{finding?.title || "产品体验"}</h2><p className="mt-3 text-sm leading-7 text-muted">{finding?.summary || "正在读取小露珠案例发现。"}</p></div>
                <div className="mt-8 border-t border-line pt-5"><p className="text-xs font-bold text-muted">相关用户反馈</p><blockquote className="mt-3 line-clamp-3 text-sm leading-6 text-muted">“{evidence?.original_text || "真实原文正在加载"}”</blockquote></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-canvas px-4 py-7 md:px-7" aria-label="小露珠案例数据概况">
          <dl className="mx-auto grid max-w-[1320px] gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-xs text-muted">数据来源</dt><dd className="mt-1 text-xl font-bold text-plum">4 个平台</dd></div>
            <div><dt className="text-xs text-muted">原始记录盘点</dt><dd className="mt-1 text-xl font-bold text-plum">6,611 条</dd></div>
            <div><dt className="text-xs text-muted">只读案例种子</dt><dd className="mt-1 text-xl font-bold text-plum">6,610 条</dd></div>
            <div><dt className="text-xs text-muted">信息来源</dt><dd className="mt-1 text-xl font-bold text-plum">原文可追溯</dd></div>
          </dl>
        </section>

        <section id="capabilities" className="mx-auto max-w-[1320px] px-4 py-20 md:px-7 lg:py-28">
          <div className="max-w-[760px]"><p className="text-sm font-bold text-rose">平台能力</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-plum md:text-5xl">让每个判断回到原文，让每项建议连接行动。</h2><p className="mt-5 max-w-[64ch] text-base leading-8 text-muted">品牌表达、消费者反馈、研究判断与建议分开保存。团队既能快速看结论，也能核对统计口径和采集原文。</p></div>
          <div className="mt-12 grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
            <article className="rounded-[18px] border border-line bg-canvas p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold text-rose">主题分析</p><h3 className="mt-2 text-2xl font-bold text-plum">社媒反馈主题分布</h3></div><span className="status-warn">固定样本汇总</span></div>
              <div className="mt-7 h-[300px] w-full">
                {analytics.data ? <ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.data.topics} layout="vertical" margin={{ top: 0, right: 12, left: 4, bottom: 0 }}><XAxis type="number" hide /><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: "#817878" }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "#F5E8E9" }} contentStyle={{ border: "1px solid #EAE3E1", borderRadius: 10 }} /><Bar dataKey="total" fill="#B77D87" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer> : <div className="h-full animate-pulse rounded-xl bg-rose-soft" />}
              </div>
              <p className="mt-4 text-xs leading-5 text-muted">抖音有效分析样本 791 条，小红书有效分析样本 707 条。主题可多选，不能把总和视为独立用户数。</p>
            </article>
            <div className="grid gap-4">
              <article className="rounded-[18px] border border-line bg-white p-6 md:p-8"><FileSearch size={24} className="text-rose" /><h3 className="mt-6 text-xl font-bold text-plum">用户反馈检索</h3><p className="mt-3 text-sm leading-7 text-muted">按中文关键词、记录号、平台与内容类型找到现有记录，并打开来源页面。</p><Link className="btn-secondary mt-6" to="/evidence">搜索反馈<ArrowRight size={16} /></Link></article>
              <article className="rounded-[18px] bg-plum p-6 text-white md:p-8"><CheckCircle size={24} className="text-[#E7C9CF]" /><h3 className="mt-6 text-xl font-bold">从发现到负责团队</h3><p className="mt-3 text-sm leading-7 text-white/75">{action?.title || "让使用说明更容易找到"}，负责人为 {action?.owner || "内容与电商运营"}。</p><Link className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white underline-offset-4 hover:underline" to="/actions">查看行动建议<ArrowRight size={16} /></Link></article>
            </div>
          </div>
        </section>

        <section id="workflow" className="border-y border-line bg-canvas px-4 py-20 md:px-7 lg:py-24">
          <div className="mx-auto max-w-[1320px]"><p className="text-sm font-bold text-rose">工作流程</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-plum md:text-5xl">搜索、分类、分析、行动。</h2><p className="mt-5 max-w-[62ch] text-base leading-8 text-muted">每一步都有真实页面和操作结果，用户可以从一个宣传卖点一路追溯到原文和建议。</p>
            <ol className="mt-10 grid overflow-hidden rounded-[18px] border border-line bg-white md:grid-cols-4">
              {workflow.map(({ icon: Icon, title, text }, index) => <li key={title} className={`min-h-60 p-6 md:p-7 ${index ? "border-t border-line md:border-l md:border-t-0" : ""} ${index === 2 ? "bg-rose-soft" : index === 3 ? "bg-plum text-white" : ""}`}><Icon size={25} className={index === 3 ? "text-white" : "text-rose"} /><h3 className="mt-12 text-xl font-bold">{title}</h3><p className={`mt-3 text-sm leading-6 ${index === 3 ? "text-white/72" : "text-muted"}`}>{text}</p></li>)}
            </ol>
          </div>
        </section>

        <section id="case-preview" className="mx-auto grid max-w-[1320px] items-center gap-10 px-4 py-20 md:px-7 lg:grid-cols-[0.85fr_1.15fr] lg:py-28">
          <div><p className="text-sm font-bold text-rose">小露珠案例</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-plum md:text-5xl">先看结论，再按需查看原文。</h2><p className="mt-5 text-base leading-8 text-muted">案例总览在一屏内呈现品牌、数据规模、核心发现、主题分布和优先行动。进入任一议题后，可继续查看消费者原文与来源。</p><Link className="btn-primary mt-8 min-h-12 px-5" to="/workspace">打开案例总览<ArrowRight size={18} /></Link></div>
          <div className="rounded-[18px] border border-line bg-white p-6 shadow-soft md:p-8"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold text-rose">优先行动</p><h3 className="mt-2 text-2xl font-bold text-plum">{action?.title || "让使用说明更容易找到"}</h3></div><span className="status-good">P1</span></div><p className="mt-5 text-sm leading-7 text-muted">{action?.action_text || "统一商品页、FAQ、直播和客服中的使用说明。"}</p><dl className="mt-7 grid gap-5 border-t border-line pt-6 sm:grid-cols-2"><div><dt className="text-xs text-muted">负责团队</dt><dd className="mt-2 text-sm font-bold text-ink">{action?.owner || "内容与电商运营"}</dd></div><div><dt className="text-xs text-muted">拟验证指标</dt><dd className="mt-2 text-sm font-bold leading-6 text-ink">{action?.metric || "观察相关咨询类型与重复问题数量"}</dd></div></dl></div>
        </section>

        <section className="bg-plum px-4 py-20 text-white md:px-7"><div className="mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-8 lg:flex-row lg:items-center"><div><h2 className="max-w-[760px] text-3xl font-bold tracking-[-0.035em] md:text-5xl">从真实案例开始一次品牌分析。</h2><p className="mt-4 max-w-[62ch] text-sm leading-7 text-white/70">进入赫莲娜小露珠案例，查看品牌宣传、消费者洞察、用户反馈和行动建议。</p></div><Link className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-plum hover:bg-rose-soft" to="/workspace">查看案例<ArrowRight size={18} /></Link></div></section>
      </main>

      <footer className="border-t border-line bg-white px-4 py-10 md:px-7"><div className="mx-auto flex max-w-[1320px] flex-col gap-5 text-sm text-muted md:flex-row md:items-center md:justify-between"><div><p className="font-bold text-plum">brandinsight</p><p className="mt-1 text-xs">面向品牌团队的消费者洞察平台</p></div><div className="flex flex-wrap gap-x-6 gap-y-2"><a href="#capabilities">平台能力</a><a href="#workflow">工作流程</a><Link to="/workspace">小露珠案例</Link></div><p className="text-xs">单案例、本地运行、原文可复核</p></div></footer>
      {overview.loading || analytics.loading || actions.loading ? <span className="sr-only" aria-live="polite">正在读取案例数据</span> : null}
    </div>
  );
}
