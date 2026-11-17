import { ArrowRight, ChartBar as BarChartIcon, CheckCircle, Info, MagnifyingGlass, Target } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link, useSearchParams } from "react-router-dom";
import { useApi } from "../api";
import { EvidenceLink } from "../components/EvidenceLink";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../components/UI";
import type { AnalyticsData, ConsumerData } from "../types";

const tabs = [
  { key: "experience", label: "产品体验" },
  { key: "motives", label: "购买动机" },
  { key: "needs", label: "改进机会" },
  { key: "competitors", label: "竞品分析" }
];

export function ConsumerPage() {
  const [params, setParams] = useSearchParams();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const active = tabs.some((tab) => tab.key === params.get("tab")) ? params.get("tab")! : "experience";
  const { data, error, loading, retry } = useApi<ConsumerData>(`/case/consumer/${active}`);
  const analytics = useApi<AnalyticsData>("/analytics/topics");
  const setTab = (tab: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", tab);
    setParams(next);
  };

  useEffect(() => setSelectedIndex(0), [active]);

  const selectedItem = data?.items[selectedIndex] || data?.items[0];
  const validRecords = selectedItem?.records.filter((record) => !record.missing) || [];
  const linkedInsightCount = data?.items.filter((item) => item.records.some((record) => !record.missing)).length || 0;
  const compareTopic = selectedItem?.title.includes("保湿") ? "moisture" : selectedItem?.title.includes("使用说明") ? "steps" : null;
  const sampleTotal = analytics.data?.denominators?.["合计"] || 1498;

  return (
    <>
      <PageHeader title="消费者洞察" description="按优先级阅读结论，查看适用条件、研究建议和当前证据覆盖。" action={<Link className="btn-secondary" to="/evidence"><MagnifyingGlass size={18} />搜索用户反馈</Link>} />

      <div className="relative mb-6 overflow-hidden">
        <div className="tab-rail flex gap-2 overflow-x-auto pb-1 pr-10" role="tablist" aria-label="消费者体验分类">
          {tabs.map((tab) => <button key={tab.key} role="tab" aria-selected={active === tab.key} className={`min-w-max ${active === tab.key ? "btn-primary" : "btn-secondary"}`} onClick={() => setTab(tab.key)}>{tab.label}</button>)}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-canvas to-transparent md:hidden" aria-hidden="true" />
      </div>

      {loading ? <LoadingState rows={4} /> : null}
      {error ? <ErrorState message={error} retry={retry} /> : null}
      {data?.items.length === 0 ? <EmptyState title="洞察内容暂未就绪" description="当前主题没有可显示的研究结论，请切换其他分类或稍后重试。" /> : null}

      {data?.items.length ? (
        <div className="space-y-7">
          <section className="grid overflow-hidden rounded-2xl border border-line bg-white sm:grid-cols-3" aria-label="当前分析范围">
            <div className="p-5"><p className="text-xs text-muted">当前主题</p><p className="mt-2 text-xl font-bold text-plum">{data.title}</p></div>
            <div className="border-t border-line p-5 sm:border-l sm:border-t-0"><p className="text-xs text-muted">研究结论</p><p className="mt-2 text-xl font-bold text-plum">{data.items.length} 条</p></div>
            <div className="border-t border-line p-5 sm:border-l sm:border-t-0"><p className="text-xs text-muted">有效分析样本</p><p className="mt-2 text-xl font-bold text-plum">{sampleTotal.toLocaleString("zh-CN")} 条</p><p className="mt-1 text-[11px] text-muted">抖音与小红书固定汇总</p></div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]" aria-labelledby="insight-heading">
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="border-b border-line px-5 py-5"><h2 id="insight-heading" className="section-title">结论优先级</h2><p className="mt-2 text-sm leading-6 text-muted">选择一条结论，右侧显示研究解释与行动。</p></div>
              <div>
                {data.items.map((item, index) => {
                  const itemRecords = item.records.filter((record) => !record.missing);
                  const activeItem = selectedIndex === index;
                  return (
                    <button key={item.title} className={`insight-row flex w-full gap-4 border-b border-line px-5 py-5 text-left last:border-b-0 ${activeItem ? "bg-rose-soft" : "bg-white"}`} onClick={() => setSelectedIndex(index)} aria-pressed={activeItem}>
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${activeItem ? "bg-accent text-white" : "bg-canvas text-muted"}`}>{index + 1}</span>
                      <span className="min-w-0 flex-1"><span className={`block text-[15px] font-bold leading-6 ${activeItem ? "text-plum" : "text-ink"}`}>{item.title}</span><span className="mt-1.5 block text-xs leading-5 text-muted">{itemRecords.length ? `${itemRecords.length} 条原文已关联` : "逐条原文待关联"}</span></span>
                      <ArrowRight size={16} className={`mt-1 shrink-0 ${activeItem ? "text-rose" : "text-[#A79E9D]"}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedItem ? (
              <article className="rounded-2xl border border-line bg-white p-6 shadow-soft md:p-8 xl:sticky xl:top-24 xl:self-start">
                <div className="flex flex-wrap items-center justify-between gap-3"><span className="status-neutral">{data.title}</span><span className={validRecords.length ? "status-good" : "status-warn"}>{validRecords.length ? `${validRecords.length} 条原文已关联` : "逐条原文待关联"}</span></div>
                <h2 className="mt-5 max-w-[28ch] text-[24px] font-bold leading-[1.35] tracking-[-0.03em] text-plum md:text-[28px]">{selectedItem.title}</h2>
                <p className="mt-5 max-w-[66ch] text-[16px] font-medium leading-8 text-ink">{selectedItem.summary}</p>

                {selectedItem.action ? <div className="mt-7 rounded-2xl bg-canvas p-5"><div className="flex items-center gap-2 text-rose"><Target size={19} /><h3 className="text-sm font-bold">建议动作</h3></div><p className="mt-3 text-sm leading-7 text-muted">{selectedItem.action}</p></div> : null}

                <div className="mt-7 border-t border-line pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-base font-bold text-ink">相关用户反馈</h3><p className="mt-1 text-xs leading-5 text-muted">这里只显示当前线上案例已经关联的逐条原文。</p></div>{validRecords.length ? <Link className="btn-plain" to="/evidence">查看全部<ArrowRight size={14} /></Link> : null}</div>
                  {validRecords.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{validRecords.slice(0, 4).map((record) => <EvidenceLink key={record.requested_record_id || record.record_id} record={record} />)}</div> : <div className="mt-4 flex items-start gap-3 rounded-2xl border border-line bg-canvas p-5"><Info size={20} className="mt-0.5 shrink-0 text-rose" /><div><p className="text-sm font-bold text-ink">研究结论已发布，逐条原文关联仍待补充</p><p className="mt-1 text-xs leading-6 text-muted">当前页面保留研究摘要和行动建议，不用空白占位冒充证据。原始记录仍可在用户反馈页独立检索。</p><Link className="btn-plain mt-3" to="/evidence">搜索用户反馈<ArrowRight size={14} /></Link></div></div>}
                </div>

                {compareTopic ? <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-rose-soft p-5"><div><p className="text-sm font-bold text-plum">品牌表达与消费者体验已有对照</p><p className="mt-1 text-xs leading-5 text-muted">继续查看研究判断和适用条件。</p></div><Link className="btn-secondary" to={`/compare/${compareTopic}`}>查看对照<ArrowRight size={15} /></Link></div> : null}
              </article>
            ) : null}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.18fr_0.82fr]">
            <article className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="border-b border-line p-5 md:flex md:items-start md:justify-between md:gap-5"><div><div className="flex items-center gap-2"><BarChartIcon size={20} className="text-rose" /><h2 className="text-lg font-bold text-ink">社媒反馈主题分布</h2></div><p className="mt-2 text-sm leading-6 text-muted">抖音 791 条，小红书 707 条符合分析条件。</p></div><span className="status-warn mt-3 md:mt-0">固定样本汇总</span></div>
              <div className="p-4 md:p-6">{analytics.loading ? <div className="h-72 animate-pulse rounded-2xl bg-canvas" /> : null}{analytics.error ? <ErrorState message={analytics.error} retry={analytics.retry} /> : null}{analytics.data ? <div className="h-[320px] min-h-[320px] w-full" aria-label="社媒反馈主题分布条形图"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.data.topics} margin={{ top: 8, right: 8, left: -18, bottom: 6 }}><CartesianGrid strokeDasharray="3 3" stroke="#E2DCDA" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 12, fill: "#675F60" }} axisLine={{ stroke: "#CEC5C3" }} tickLine={false} /><YAxis tick={{ fontSize: 12, fill: "#675F60" }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ border: "1px solid #E2DCDA", borderRadius: 12, boxShadow: "0 10px 30px rgba(56,38,43,.08)" }} /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="抖音" fill="#8F4E5D" radius={[5, 5, 0, 0]} /><Bar dataKey="小红书" fill="#C58D9B" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div> : null}</div>
            </article>

            <aside className="rounded-2xl border border-line bg-canvas p-6 md:p-7" aria-label="统计口径说明"><div className="flex items-center gap-2 text-rose"><CheckCircle size={20} /><h2 className="text-lg font-bold text-ink">如何阅读这组数据</h2></div><dl className="mt-6 space-y-5"><div><dt className="text-xs font-bold text-muted">样本范围</dt><dd className="mt-1 text-sm leading-7 text-ink">抖音和小红书中符合分析条件的评论，共 {sampleTotal.toLocaleString("zh-CN")} 条。</dd></div><div><dt className="text-xs font-bold text-muted">统计方式</dt><dd className="mt-1 text-sm leading-7 text-ink">主题为多标签，同一条反馈可能同时进入多个主题。</dd></div><div><dt className="text-xs font-bold text-muted">证据覆盖</dt><dd className="mt-1 text-sm leading-7 text-ink">当前 {linkedInsightCount}/{data.items.length} 条结论已在生产环境关联逐条原文。</dd></div></dl><div className="mt-6 rounded-xl bg-white p-4 text-xs leading-6 text-muted"><Info size={17} className="mb-2 text-rose" />{analytics.data?.drilldown_note || "固定汇总用于观察主题分布，逐条原文需要在用户反馈页独立核对。"}</div></aside>
          </section>
        </div>
      ) : null}
    </>
  );
}
