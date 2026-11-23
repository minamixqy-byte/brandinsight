import { ChartBar, FileSearch, List, Target, X } from "@phosphor-icons/react";
import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../api";
import type { AnalyticsData, OverviewData, RecordItem } from "../types";

type ActionsResponse = { items: Array<{ action_id: string; title: string; action_text: string; owner: string; metric: string; evidence: RecordItem[] }> };

const LandingTopicsChart = lazy(() => import("../components/LandingTopicsChart").then((module) => ({ default: module.LandingTopicsChart })));

const fallbackFindings = [
  { key: "experience", title: "产品体验", summary: "吸收、润泽和妆前体验获得部分认可，单用保湿、油感、气味和取用体验存在分歧。" },
  { key: "motives", title: "购买动机", summary: "试用、具体护肤问题、促销与赠品共同影响消费者的购买判断。" },
  { key: "needs", title: "改进机会", summary: "优先统一使用说明，优化试用衔接、服务规则和包装取用体验。" }
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const overview = useApi<OverviewData>("/case/overview");
  const analytics = useApi<AnalyticsData>("/analytics/topics");
  const actions = useApi<ActionsResponse>("/case/recommendations");
  const findings = overview.data?.findings.slice(0, 3) || fallbackFindings;
  const action = actions.data?.items[0];

  return (
    <div className="min-h-[100dvh] bg-white text-ink">
      <a href="#landing-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2">跳到主要内容</a>
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1280px] items-center px-4 md:px-7">
          <Link to="/" className="text-[18px] font-bold tracking-[-0.04em] text-plum">brandinsight</Link>
          <nav className="ml-auto hidden items-center gap-8 lg:flex" aria-label="公开首页导航">
            <a className="text-sm font-bold text-muted transition hover:text-rose" href="#insights">核心发现</a>
            <a className="text-sm font-bold text-muted transition hover:text-rose" href="#actions">行动建议</a>
            <a className="text-sm font-bold text-muted transition hover:text-rose" href="#case-preview">案例数据</a>
          </nav>
          <Link className="btn-primary ml-8 hidden lg:inline-flex" to="/workspace">进入工作台</Link>
          <button className="ml-auto rounded-xl border border-line p-2 text-plum lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "关闭导航" : "打开导航"} aria-expanded={menuOpen}>{menuOpen ? <X size={21} /> : <List size={21} />}</button>
        </div>
        {menuOpen ? <nav className="grid gap-1 border-t border-line bg-white px-4 py-4 lg:hidden" aria-label="公开首页移动导航"><a className="mobile-nav-link" href="#insights">核心发现</a><a className="mobile-nav-link" href="#actions">行动建议</a><a className="mobile-nav-link" href="#case-preview">案例数据</a><Link className="btn-primary mt-2" to="/workspace">进入工作台</Link></nav> : null}
      </header>

      <main id="landing-main">
        <section className="landing-halo border-b border-line">
          <div className="mx-auto flex min-h-[540px] max-w-[1280px] items-center px-4 py-14 md:px-7 lg:py-20">
            <div className="max-w-[880px]">
              <p className="text-sm font-bold text-rose">品牌消费者洞察平台</p>
              <h1 className="mt-5 max-w-[18ch] text-[42px] font-bold leading-[1.08] tracking-[-0.05em] text-plum sm:text-[54px] lg:text-[64px]">看清消费者体验，确定下一步品牌动作。</h1>
              <p className="mt-6 max-w-[42ch] text-lg leading-8 text-muted">聚合品牌表达、社媒反馈和购买评价，识别体验差异与优先机会。</p>
              <div className="mt-8 flex flex-wrap gap-3"><Link className="btn-primary min-h-12 px-5" to="/workspace">查看核心洞察</Link><Link className="btn-secondary min-h-12 px-5" to="/actions">查看行动建议</Link></div>
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-canvas px-4 py-7 md:px-7" aria-label="小露珠案例数据概况">
          <dl className="mx-auto grid max-w-[1280px] grid-cols-2 gap-5 lg:grid-cols-4">
            <div><dt className="text-xs text-muted">数据来源</dt><dd className="mt-1 text-xl font-bold text-plum">4 个平台</dd></div>
            <div><dt className="text-xs text-muted">原始记录</dt><dd className="mt-1 text-xl font-bold text-plum">6,611 条</dd></div>
            <div><dt className="text-xs text-muted">有效分析样本</dt><dd className="mt-1 text-xl font-bold text-plum">1,498 条</dd></div>
            <div><dt className="text-xs text-muted">核心结论</dt><dd className="mt-1 text-xl font-bold text-plum">3 类</dd></div>
          </dl>
        </section>

        <section id="insights" className="mx-auto max-w-[1280px] px-4 py-16 md:px-7 lg:py-20">
          <div className="max-w-[760px]"><h2 className="text-3xl font-bold tracking-[-0.04em] text-plum md:text-5xl">核心分析结果</h2><p className="mt-4 max-w-[58ch] text-base leading-8 text-muted">集中查看体验分歧、购买动机与品牌改进机会。</p></div>
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <article className="rounded-2xl border border-line bg-canvas p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-3"><ChartBar size={24} className="text-rose" /><div><h3 className="text-xl font-bold text-plum">社媒反馈主题分布</h3><p className="mt-1 text-sm text-muted">抖音 791 条，小红书 707 条</p></div></div><span className="status-neutral">多标签统计</span></div>
              <div className="mt-7 h-[300px] w-full">{analytics.data ? <Suspense fallback={<div className="h-full animate-pulse rounded-2xl bg-rose-soft" />}><LandingTopicsChart data={analytics.data.topics} /></Suspense> : <div className="h-full animate-pulse rounded-2xl bg-rose-soft" />}</div>
            </article>
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              {findings.map((finding, index) => <article key={finding.key} className={`p-6 md:p-7 ${index ? "border-t border-line" : ""}`}><p className="text-xs font-bold text-rose">{finding.title}</p><p className="mt-2 text-base font-bold leading-7 text-plum">{finding.summary}</p><Link className="btn-plain mt-3" to={`/consumer?tab=${finding.key}`}>查看数据</Link></article>)}
            </div>
          </div>
        </section>

        <section id="actions" className="border-y border-line bg-plum px-4 py-16 text-white md:px-7 lg:py-20">
          <div className="mx-auto grid max-w-[1280px] gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div><Target size={28} className="text-[#E7C9CF]" /><h2 className="mt-5 text-3xl font-bold tracking-[-0.04em] md:text-5xl">优先建议</h2><p className="mt-4 text-base leading-8 text-white/75">把消费者反馈转化为产品、内容、电商和客服的具体动作。</p></div>
            <div className="rounded-2xl bg-white p-6 text-ink md:p-8">
              <p className="text-xs font-bold text-rose">当前首要行动</p>
              <h3 className="mt-3 text-2xl font-bold text-plum">{action?.title || "统一产品定位与使用说明"}</h3>
              <p className="mt-4 text-sm leading-7 text-muted">{action?.action_text || "统一商品页、FAQ、直播与客服中的产品类别、护肤步骤、季节和搭配说明。"}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-5"><p className="text-sm"><span className="text-muted">负责团队</span><strong className="ml-2 text-plum">{action?.owner || "内容与电商运营"}</strong></p><Link className="btn-secondary" to="/actions">查看全部建议</Link></div>
            </div>
          </div>
        </section>

        <section id="case-preview" className="mx-auto grid max-w-[1280px] items-stretch gap-8 px-4 py-16 md:px-7 lg:grid-cols-[0.78fr_1.22fr] lg:py-20">
          <div className="overflow-hidden rounded-2xl bg-slate-soft"><img className="h-full min-h-[380px] w-full object-cover" src="/assets/xiaoluzhu-official.jpg" alt="赫莲娜至美琉光恒采精萃露小露珠" /></div>
          <div className="flex flex-col justify-center lg:pl-10"><div className="flex items-center gap-3 text-rose"><FileSearch size={23} /><p className="text-sm font-bold">赫莲娜小露珠案例</p></div><h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-plum md:text-5xl">从体验差异到品牌动作</h2><p className="mt-5 max-w-[58ch] text-base leading-8 text-muted">查看产品体验、购买动机、宣传对照、消费者原声和行动建议。</p>
            <dl className="mt-8 grid gap-5 sm:grid-cols-2"><div className="rounded-2xl bg-canvas p-5"><dt className="text-xs text-muted">优先建议</dt><dd className="mt-2 text-lg font-bold text-plum">{action?.title || "统一产品定位与使用说明"}</dd></div><div className="rounded-2xl border border-line p-5"><dt className="text-xs text-muted">验证指标</dt><dd className="mt-2 text-sm font-bold leading-6 text-ink">{action?.metric || "相关咨询类型与重复问题数量"}</dd></div></dl>
            <Link className="btn-primary mt-8 self-start px-5" to="/workspace">进入案例</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white px-4 py-8 md:px-7"><div className="mx-auto flex max-w-[1280px] flex-col gap-4 text-sm text-muted md:flex-row md:items-center md:justify-between"><div><p className="font-bold text-plum">brandinsight</p><p className="mt-1 text-xs">品牌消费者洞察平台</p></div><div className="flex flex-wrap gap-x-6 gap-y-2"><a href="#insights">核心发现</a><a href="#actions">行动建议</a><Link to="/workspace">小露珠案例</Link></div></div></footer>
      {overview.loading || analytics.loading || actions.loading ? <span className="sr-only" aria-live="polite">正在读取案例数据</span> : null}
    </div>
  );
}
