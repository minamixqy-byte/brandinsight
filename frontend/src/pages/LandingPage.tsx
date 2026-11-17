import {
  ArrowRight,
  ChartBar,
  CheckCircle,
  FileSearch,
  List,
  MagnifyingGlass,
  Strategy,
  X
} from "@phosphor-icons/react";
import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../api";
import type { AnalyticsData, OverviewData, RecordItem } from "../types";

type ActionsResponse = { items: Array<{ action_id: string; title: string; action_text: string; owner: string; metric: string; evidence: RecordItem[] }> };

const LandingTopicsChart = lazy(() => import("../components/LandingTopicsChart").then((module) => ({ default: module.LandingTopicsChart })));

const fallbackFindings = [
  { key: "experience", title: "产品体验", summary: "吸收、润泽和妆前体验获得部分认可，使用条件也带来不同意见。" },
  { key: "motives", title: "购买动机", summary: "试用、具体护肤问题和促销信息共同参与购买判断。" },
  { key: "needs", title: "改进机会", summary: "优先完善使用说明、试用衔接和服务规则。" }
];

const workflow = [
  { icon: MagnifyingGlass, title: "定位问题", text: "从官网表达、电商反馈和社媒讨论中找到具体问题。" },
  { icon: FileSearch, title: "核对原文", text: "区分品牌主张、消费者反馈和研究判断。" },
  { icon: ChartBar, title: "识别差异", text: "保留平台、肤质、季节和使用方式等条件。" },
  { icon: Strategy, title: "连接行动", text: "把结论交给负责团队，并写明后续验证指标。" }
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const overview = useApi<OverviewData>("/case/overview");
  const analytics = useApi<AnalyticsData>("/analytics/topics");
  const actions = useApi<ActionsResponse>("/case/recommendations");
  const findings = overview.data?.findings.slice(0, 3) || fallbackFindings;
  const selectedFinding = findings[previewIndex] || findings[0];
  const action = actions.data?.items[0];

  return (
    <div className="min-h-[100dvh] bg-white text-ink">
      <a href="#landing-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-4 focus:py-2">跳到主要内容</a>
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1280px] items-center px-4 md:px-7">
          <Link to="/" className="text-[18px] font-bold tracking-[-0.04em] text-plum">brandinsight</Link>
          <nav className="ml-auto hidden items-center gap-8 lg:flex" aria-label="公开首页导航">
            <a className="text-sm font-bold text-muted transition hover:text-rose" href="#capabilities">平台能力</a>
            <a className="text-sm font-bold text-muted transition hover:text-rose" href="#workflow">工作流程</a>
            <a className="text-sm font-bold text-muted transition hover:text-rose" href="#case-preview">案例预览</a>
          </nav>
          <Link className="btn-primary ml-8 hidden lg:inline-flex" to="/workspace">查看案例<ArrowRight size={17} /></Link>
          <button className="ml-auto rounded-xl border border-line p-2 text-plum lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "关闭导航" : "打开导航"} aria-expanded={menuOpen}>{menuOpen ? <X size={21} /> : <List size={21} />}</button>
        </div>
        {menuOpen ? <nav className="grid gap-1 border-t border-line bg-white px-4 py-4 lg:hidden" aria-label="公开首页移动导航"><a className="mobile-nav-link" href="#capabilities">平台能力</a><a className="mobile-nav-link" href="#workflow">工作流程</a><a className="mobile-nav-link" href="#case-preview">案例预览</a><Link className="btn-primary mt-2" to="/workspace">查看案例<ArrowRight size={17} /></Link></nav> : null}
      </header>

      <main id="landing-main">
        <section className="landing-halo overflow-hidden border-b border-line">
          <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-4 py-14 md:px-7 lg:min-h-[650px] lg:grid-cols-[0.86fr_1.14fr] lg:py-16">
            <div className="max-w-[590px]">
              <p className="text-sm font-bold text-rose">面向品牌营销与消费者洞察团队</p>
              <h1 className="mt-5 text-[40px] font-bold leading-[1.08] tracking-[-0.05em] text-plum sm:text-[50px] lg:text-[60px]">从消费者原文，走到下一步行动。</h1>
              <p className="mt-6 max-w-[50ch] text-lg leading-8 text-muted">统一查看品牌表达、真实反馈、研究判断和负责团队。</p>
              <div className="mt-8 flex flex-wrap gap-3"><Link className="btn-primary min-h-12 px-5" to="/workspace">查看案例<ArrowRight size={18} /></Link><a className="btn-secondary min-h-12 px-5" href="#workflow">了解方法</a></div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-lift" aria-label="小露珠案例洞察交互预览">
              <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
                <div className="flex min-w-0 items-center gap-3"><img className="h-11 w-11 rounded-xl object-cover" src="/assets/xiaoluzhu-official.jpg" alt="赫莲娜小露珠" /><div className="min-w-0"><p className="truncate text-sm font-bold text-ink">赫莲娜小露珠</p><p className="truncate text-xs text-muted">消费者决策简报</p></div></div>
                <span className="status-good shrink-0"><CheckCircle size={13} />数据已核对</span>
              </div>
              <div className="grid min-w-0 md:grid-cols-[210px_minmax(0,1fr)]">
                <div className="min-w-0 border-b border-line bg-canvas p-3 md:border-b-0 md:border-r">
                  <p className="px-3 pb-2 pt-1 text-[11px] font-bold text-muted">核心发现</p>
                  <div className="flex gap-2 overflow-x-auto md:block md:space-y-1">
                    {findings.map((finding, index) => <button key={finding.key} className={`min-w-[160px] rounded-xl px-3 py-3 text-left text-sm transition md:w-full ${previewIndex === index ? "bg-white font-bold text-plum shadow-sm" : "text-muted hover:bg-white"}`} onClick={() => setPreviewIndex(index)}><span className="block truncate">{finding.title}</span><span className="mt-1 hidden text-[11px] font-normal text-muted md:block">查看研究结论</span></button>)}
                  </div>
                </div>
                <div className="flex min-w-0 min-h-[360px] flex-col justify-between p-6 md:p-7">
                  <div className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-bold text-rose">研究结论</p><span className="status-neutral">当前案例</span></div><h2 className="mt-4 break-words text-[26px] font-bold leading-[1.25] tracking-[-0.03em] text-plum">{selectedFinding?.summary || "正在读取案例结论"}</h2><p className="mt-5 text-sm leading-7 text-muted">每条结论都保留数据范围、适用条件和后续动作，避免把少量反馈扩大成普遍判断。</p></div>
                  <div className="mt-8 grid gap-3 border-t border-line pt-5 sm:grid-cols-2"><div><p className="text-[11px] text-muted">分析范围</p><p className="mt-1 text-sm font-bold text-ink">4 个数据平台</p></div><div><p className="text-[11px] text-muted">优先动作</p><p className="mt-1 line-clamp-2 text-sm font-bold text-ink">{action?.title || "让使用说明更容易找到"}</p></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-canvas px-4 py-7 md:px-7" aria-label="小露珠案例数据概况">
          <dl className="mx-auto grid max-w-[1280px] gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="text-xs text-muted">数据来源</dt><dd className="mt-1 text-xl font-bold text-plum">4 个平台</dd></div>
            <div><dt className="text-xs text-muted">原始记录盘点</dt><dd className="mt-1 text-xl font-bold text-plum">6,611 条</dd></div>
            <div><dt className="text-xs text-muted">有效分析样本</dt><dd className="mt-1 text-xl font-bold text-plum">1,498 条</dd></div>
            <div><dt className="text-xs text-muted">研究原则</dt><dd className="mt-1 text-xl font-bold text-plum">结论可复核</dd></div>
          </dl>
        </section>

        <section id="capabilities" className="mx-auto max-w-[1280px] px-4 py-20 md:px-7 lg:py-24">
          <div className="max-w-[760px]"><h2 className="text-3xl font-bold tracking-[-0.04em] text-plum md:text-5xl">不仅看热度，更要知道该做什么。</h2><p className="mt-5 max-w-[62ch] text-base leading-8 text-muted">把统计结果、适用条件、消费者原文和行动建议放在同一条决策链上。</p></div>
          <div className="mt-12 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
            <article className="rounded-2xl border border-line bg-canvas p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-2xl font-bold text-plum">社媒反馈主题分布</h3><p className="mt-2 text-sm leading-6 text-muted">抖音与小红书有效分析样本</p></div><span className="status-warn">固定样本汇总</span></div>
              <div className="mt-7 h-[300px] w-full">{analytics.data ? <Suspense fallback={<div className="h-full animate-pulse rounded-2xl bg-rose-soft" />}><LandingTopicsChart data={analytics.data.topics} /></Suspense> : <div className="h-full animate-pulse rounded-2xl bg-rose-soft" />}</div>
              <p className="mt-4 text-xs leading-5 text-muted">主题为多标签，不能把各主题数量相加后解释为独立用户。</p>
            </article>
            <div className="grid gap-5">
              <article className="rounded-2xl border border-line bg-white p-6 md:p-8"><FileSearch size={25} className="text-rose" /><h3 className="mt-6 text-xl font-bold text-plum">从结论回到原文</h3><p className="mt-3 text-sm leading-7 text-muted">按关键词、记录号、平台和内容类型核对已有记录。</p><Link className="btn-secondary mt-6" to="/evidence">搜索反馈<ArrowRight size={16} /></Link></article>
              <article className="rounded-2xl bg-plum p-6 text-white md:p-8"><Strategy size={25} className="text-[#E7C9CF]" /><h3 className="mt-6 text-xl font-bold">把发现交给负责团队</h3><p className="mt-3 text-sm leading-7 text-white/75">{action?.title || "让使用说明更容易找到"}，负责人为 {action?.owner || "内容与电商运营"}。</p><Link className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white underline-offset-4 hover:underline" to="/actions">查看行动建议<ArrowRight size={16} /></Link></article>
            </div>
          </div>
        </section>

        <section id="workflow" className="border-y border-line bg-canvas px-4 py-20 md:px-7 lg:py-24">
          <div className="mx-auto max-w-[1280px]"><h2 className="text-3xl font-bold tracking-[-0.04em] text-plum md:text-5xl">一条结论，需要经过四次核对。</h2><p className="mt-5 max-w-[62ch] text-base leading-8 text-muted">页面保留研究边界，不把咨询、个体体验和固定汇总混为一谈。</p>
            <ol className="mt-12 grid border-y border-line md:grid-cols-4">
              {workflow.map(({ icon: Icon, title, text }, index) => <li key={title} className={`min-h-56 py-7 md:px-7 ${index ? "border-t border-line md:border-l md:border-t-0" : "md:pr-7"}`}><Icon size={24} className="text-rose" /><h3 className="mt-10 text-xl font-bold text-plum">{title}</h3><p className="mt-3 text-sm leading-7 text-muted">{text}</p></li>)}
            </ol>
          </div>
        </section>

        <section id="case-preview" className="mx-auto grid max-w-[1280px] items-stretch gap-8 px-4 py-20 md:px-7 lg:grid-cols-[0.72fr_1.28fr] lg:py-24">
          <div className="overflow-hidden rounded-2xl bg-slate-soft"><img className="h-full min-h-[420px] w-full object-cover" src="/assets/xiaoluzhu-official.jpg" alt="赫莲娜至美琉光恒采精萃露小露珠" /></div>
          <div className="flex flex-col justify-center lg:pl-10"><h2 className="text-3xl font-bold tracking-[-0.04em] text-plum md:text-5xl">用一个真实案例，检查完整决策链。</h2><p className="mt-5 max-w-[60ch] text-base leading-8 text-muted">查看品牌宣传、消费者洞察、体验差异、原文证据和负责团队。每项结论都注明当前材料能够支持到什么程度。</p>
            <dl className="mt-8 grid gap-5 sm:grid-cols-2"><div className="rounded-2xl bg-canvas p-5"><dt className="text-xs text-muted">首要行动</dt><dd className="mt-2 text-lg font-bold text-plum">{action?.title || "让使用说明更容易找到"}</dd></div><div className="rounded-2xl border border-line p-5"><dt className="text-xs text-muted">拟验证指标</dt><dd className="mt-2 text-sm font-bold leading-6 text-ink">{action?.metric || "观察相关咨询类型与重复问题数量"}</dd></div></dl>
            <Link className="btn-primary mt-8 self-start px-5" to="/workspace">查看案例<ArrowRight size={18} /></Link>
          </div>
        </section>

        <section className="border-t border-line bg-canvas px-4 py-16 md:px-7"><div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 lg:flex-row lg:items-center"><div><h2 className="max-w-[760px] text-3xl font-bold tracking-[-0.035em] text-plum md:text-4xl">从结论开始，再回到数据核对。</h2><p className="mt-3 text-sm leading-7 text-muted">进入小露珠案例，查看完整分析过程。</p></div><Link className="btn-primary shrink-0 px-5" to="/workspace">查看案例<ArrowRight size={18} /></Link></div></section>
      </main>

      <footer className="border-t border-line bg-white px-4 py-9 md:px-7"><div className="mx-auto flex max-w-[1280px] flex-col gap-5 text-sm text-muted md:flex-row md:items-center md:justify-between"><div><p className="font-bold text-plum">brandinsight</p><p className="mt-1 text-xs">面向品牌团队的消费者决策工作台</p></div><div className="flex flex-wrap gap-x-6 gap-y-2"><a href="#capabilities">平台能力</a><a href="#workflow">工作流程</a><Link to="/workspace">小露珠案例</Link></div><p className="text-xs">单案例，本地运行，原文可复核</p></div></footer>
      {overview.loading || analytics.loading || actions.loading ? <span className="sr-only" aria-live="polite">正在读取案例数据</span> : null}
    </div>
  );
}
