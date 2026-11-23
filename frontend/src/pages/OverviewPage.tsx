import { ArrowRight, CheckCircle, MagnifyingGlass, Target } from "@phosphor-icons/react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import { useApi } from "../api";
import { EvidenceLink } from "../components/EvidenceLink";
import { ErrorState, LoadingState, PageHeader } from "../components/UI";
import type { AnalyticsData, OverviewData, RecordItem } from "../types";

type Action = { action_id: string; title: string; action_text: string; owner: string; metric: string; evidence: RecordItem[] };
type ActionsResponse = { items: Action[] };

const insightTabs = [
  { key: "experience", label: "产品体验" },
  { key: "motives", label: "购买动机" },
  { key: "needs", label: "改进机会" },
  { key: "competitors", label: "竞品分析" }
];

export function OverviewPage() {
  const { data, error, loading, retry } = useApi<OverviewData>("/case/overview");
  const actions = useApi<ActionsResponse>("/case/recommendations");
  const analytics = useApi<AnalyticsData>("/analytics/topics");
  const priority = actions.data?.items[0];
  const recentRecords = data?.findings[0]?.records.filter((record) => !record.missing).slice(0, 4) || [];

  return (
    <>
      <PageHeader title="品牌消费者洞察总览" description="查看核心发现、体验差异与优先建议。" action={<Link className="btn-secondary" to="/evidence"><MagnifyingGlass size={18} />搜索消费者原声</Link>} />
      {loading ? <LoadingState rows={4} /> : null}
      {error ? <ErrorState message={error} retry={retry} /> : null}
      {data ? (
        <div className="space-y-7">
          <section className="overflow-hidden rounded-[16px] border border-line bg-white" aria-label="小露珠项目信息">
            <div className="grid lg:grid-cols-[1fr_300px]">
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-center gap-3"><span className="text-xs font-bold text-rose">HELENA RUBINSTEIN</span><span className="status-good"><CheckCircle size={13} />案例数据可用</span></div>
                <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-plum md:text-[38px]">小露珠品牌消费者洞察</h2>
                <p className="mt-3 max-w-[70ch] text-sm leading-7 text-muted">对照品牌表达、购买评价与社媒反馈，识别体验差异和品牌机会。</p>
                <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6 sm:grid-cols-4">
                  <div><dt className="text-[11px] text-muted">原始记录盘点</dt><dd className="mt-1 font-metric text-2xl font-bold text-plum">6,611</dd></div>
                  <div><dt className="text-[11px] text-muted">只读种子记录</dt><dd className="mt-1 font-metric text-2xl font-bold text-plum">{data.record_count.toLocaleString("zh-CN")}</dd></div>
                  <div><dt className="text-[11px] text-muted">数据平台</dt><dd className="mt-1 font-metric text-2xl font-bold text-plum">4</dd></div>
                  <div><dt className="text-[11px] text-muted">核心发现</dt><dd className="mt-1 font-metric text-2xl font-bold text-plum">3</dd></div>
                </dl>
              </div>
              <div className="border-t border-line bg-[#F2ECEB] p-5 lg:border-l lg:border-t-0"><img className="h-full max-h-[280px] w-full rounded-[12px] object-cover" src="/assets/xiaoluzhu-official.jpg" alt="赫莲娜至美琉光恒采精萃露项目图" /></div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]" aria-labelledby="brief-heading">
            <article className="rounded-[16px] border border-[#D9C4C8] bg-rose-soft p-6 md:p-8"><div className="flex items-center gap-2 text-rose"><Target size={20} /><p className="text-xs font-bold">优先建议</p></div>{actions.loading ? <div className="mt-5 h-28 animate-pulse rounded-xl bg-white" /> : priority ? <><h2 id="brief-heading" className="mt-4 text-xl font-bold text-plum">{priority.title}</h2><p className="mt-3 text-sm leading-6 text-muted">{priority.action_text}</p><Link className="btn-primary mt-5" to={`/actions#${priority.action_id}`}>查看负责团队</Link></> : null}</article>
            <article className="rounded-[16px] bg-plum p-6 text-white md:p-8"><p className="text-xs font-bold text-[#E7C9CF]">关键判断</p><h2 className="mt-3 text-2xl font-bold tracking-[-0.03em]">吸收与妆前体验获得认可，保湿、油感和取用体验存在分歧。</h2><p className="mt-5 max-w-[65ch] text-sm leading-7 text-white/78">肤质、季节、单用或搭配会改变体验，试用、赠品和促销也参与购买判断。</p></article>
          </section>

          <section aria-labelledby="findings-heading">
            <div className="flex items-end justify-between gap-4"><h2 id="findings-heading" className="section-title">核心发现</h2><Link className="btn-plain" to="/consumer">查看全部洞察<ArrowRight size={14} /></Link></div>
            <div className="mt-4 grid overflow-hidden rounded-[16px] border border-line bg-white lg:grid-cols-3">
              {data.findings.slice(0, 3).map((finding, index) => <article key={finding.key} className={`p-6 ${index ? "border-t border-line lg:border-l lg:border-t-0" : ""}`}><p className="text-xs font-bold text-rose">{finding.title}</p><h3 className="mt-3 text-lg font-bold leading-7 text-plum">{index === 0 ? "体验优势与使用条件同时存在" : index === 1 ? "试用与具体护肤需求推动考虑" : "说明、服务和包装都有优化入口"}</h3><p className="mt-3 text-sm leading-6 text-muted">{finding.summary}</p><Link className="btn-plain mt-4" to={`/consumer?tab=${finding.key}`}>查看分析<ArrowRight size={14} /></Link></article>)}
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <article className="rounded-[16px] border border-line bg-white p-5 md:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="section-title">核心主题分布</h2><p className="mt-2 text-sm text-muted">抖音与小红书符合分析条件的用户反馈</p></div><span className="status-warn">固定样本汇总</span></div>{analytics.data ? <><div className="mt-5 h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.data.topics} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}><CartesianGrid stroke="#EAE3E1" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11, fill: "#817878" }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 11, fill: "#817878" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ border: "1px solid #EAE3E1", borderRadius: 10 }} /><Bar dataKey="抖音" fill="#9D6671" radius={[4, 4, 0, 0]} /><Bar dataKey="小红书" fill="#D1A6AE" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><p className="mt-3 text-xs leading-5 text-muted">分析样本为抖音 791 条、小红书 707 条。主题可多标签，因此不能把各主题数量相加后解释为独立用户。</p></> : <div className="mt-5 h-[300px] animate-pulse rounded-xl bg-canvas" />}</article>
            <article className="rounded-[16px] border border-line bg-white p-5 md:p-7"><h2 className="section-title">品牌宣传与体验差异</h2><p className="mt-2 text-sm text-muted">当前已交付 3 个可对照议题。</p><div className="mt-5 space-y-3"><Link to="/compare/moisture" className="block rounded-xl bg-rose-soft p-4 hover:bg-[#F0DCDF]"><div className="flex items-center justify-between gap-3"><strong className="text-sm text-plum">保湿与润泽</strong><span className="status-warn">体验分歧</span></div><p className="mt-2 text-xs leading-5 text-muted">干皮单用略干、叠加精华更合适，使用条件需要区分。</p></Link><Link to="/compare/steps" className="block rounded-xl border border-line p-4 hover:bg-canvas"><div className="flex items-center justify-between gap-3"><strong className="text-sm text-plum">品类与搭配</strong><span className="status-good">需求明确</span></div><p className="mt-2 text-xs leading-5 text-muted">消费者仍在确认产品类别、步骤与后续搭配。</p></Link><Link to="/compare/radiance" className="block rounded-xl border border-line p-4 hover:bg-canvas"><div className="flex items-center justify-between gap-3"><strong className="text-sm text-plum">饱满与透亮</strong><span className="status-neutral">材料不足</span></div><p className="mt-2 text-xs leading-5 text-muted">保留官方主张，不生成覆盖率或一致性结论。</p></Link></div></article>
          </section>

          <section aria-labelledby="tabs-heading"><h2 id="tabs-heading" className="section-title">按业务问题继续分析</h2><nav className="mt-4 grid overflow-hidden rounded-[16px] border border-line bg-white sm:grid-cols-2 lg:grid-cols-4" aria-label="小露珠洞察主题">{insightTabs.map((tab, index) => <Link key={tab.key} className={`flex min-h-16 items-center justify-between px-5 text-sm font-bold text-plum hover:bg-rose-soft ${index ? "border-t border-line sm:border-l sm:border-t-0" : ""}`} to={`/consumer?tab=${tab.key}`}><span>{tab.label}</span><ArrowRight size={16} className="text-rose" /></Link>)}</nav></section>

          {data.findings[0] ? <section className="rounded-2xl border border-line bg-white p-5 md:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><h2 className="section-title">近期消费者原声</h2><Link className="btn-plain" to="/evidence">查看全部反馈<ArrowRight size={14} /></Link></div>{recentRecords.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{recentRecords.map((record) => <EvidenceLink key={record.requested_record_id || record.record_id} record={record} />)}</div> : <div className="mt-5 rounded-2xl border border-line bg-canvas p-5"><p className="text-sm font-bold text-ink">暂无关联原文</p><Link className="btn-plain mt-3" to="/evidence">搜索消费者原声</Link></div>}</section> : null}
        </div>
      ) : null}
    </>
  );
}
