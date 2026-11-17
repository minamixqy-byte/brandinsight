import { ArrowRight, ChartBar as BarChartIcon, Info, MagnifyingGlass } from "@phosphor-icons/react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link, useSearchParams } from "react-router-dom";
import { useApi } from "../api";
import { EvidenceLink } from "../components/EvidenceLink";
import { ErrorState, LoadingState, PageHeader } from "../components/UI";
import type { AnalyticsData, ConsumerData } from "../types";

const tabs = [
  { key: "experience", label: "产品体验" },
  { key: "motives", label: "购买动机" },
  { key: "needs", label: "改进机会" },
  { key: "competitors", label: "竞品分析" }
];

export function ConsumerPage() {
  const [params, setParams] = useSearchParams();
  const active = tabs.some((tab) => tab.key === params.get("tab")) ? params.get("tab")! : "experience";
  const { data, error, loading, retry } = useApi<ConsumerData>(`/case/consumer/${active}`);
  const analytics = useApi<AnalyticsData>("/analytics/topics");
  const setTab = (tab: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", tab);
    setParams(next);
  };

  return (
    <>
      <PageHeader title="消费者洞察" description="先看研究结论，再按需展开相关反馈与统计口径。" action={<Link className="btn-secondary" to="/evidence"><MagnifyingGlass size={18} />检索用户反馈</Link>} />
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="消费者体验分类">
        {tabs.map((tab) => <button key={tab.key} role="tab" aria-selected={active === tab.key} className={active === tab.key ? "btn-primary" : "btn-secondary"} onClick={() => setTab(tab.key)}>{tab.label}</button>)}
      </div>
      {loading ? <LoadingState rows={4} /> : null}
      {error ? <ErrorState message={error} retry={retry} /> : null}
      {data ? (
        <div className="space-y-8">
          <section>
            <div className="mb-4">
              <h2 className="section-title">{data.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{data.description}</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {data.items.map((item) => {
                const compareTopic = item.title.includes("保湿") ? "moisture" : item.title.includes("使用说明") ? "steps" : null;
                return (
                <article key={item.title} className="rounded-[16px] border border-line bg-white p-5 md:p-7">
                  <h3 className="text-xl font-black leading-tight tracking-[-0.025em] text-plum md:text-[26px]">{item.title}</h3>
                  <p className="mt-5 max-w-[62ch] text-base font-medium leading-7 text-ink">{item.summary}</p>
                  <div className="mt-6 border-t border-line pt-4">
                    <p className="mb-2 text-xs font-bold text-muted">相关用户反馈</p>
                    <div className="grid gap-2">{item.records.slice(0, 2).map((record) => <EvidenceLink key={record.requested_record_id || record.record_id} record={record} />)}</div>
                    {item.records.length > 2 ? <Link className="btn-plain mt-3" to="/evidence">查看更多反馈<ArrowRight size={14} /></Link> : null}
                  </div>
                  {compareTopic ? <details className="mt-5 rounded-lg bg-canvas p-4"><summary className="cursor-pointer text-sm font-bold text-plum">品牌表达与消费者反馈</summary><p className="mt-3 text-xs leading-5 text-muted">该议题已有官网主张与用户反馈对照，可继续查看研究判断和适用条件。</p><Link className="btn-plain mt-2" to={`/compare/${compareTopic}`}>展开完整对照<ArrowRight size={14} /></Link></details> : null}
                </article>
                );
              })}
            </div>
          </section>

          <section className="panel overflow-hidden">
            <div className="border-b border-line p-5 md:flex md:items-start md:justify-between md:gap-5">
              <div>
                <div className="flex items-center gap-2"><BarChartIcon size={20} className="text-rose" /><h2 className="text-lg font-bold text-ink">社媒反馈主题分布</h2></div>
                <p className="mt-2 text-sm leading-6 text-muted">抖音 791 条，小红书 707 条符合分析条件。主题为多标签，可重复计数。</p>
              </div>
              <span className="status-warn mt-3 md:mt-0">固定样本汇总</span>
            </div>
            <div className="p-4 md:p-6">
              {analytics.loading ? <div className="h-72 animate-pulse rounded-lg bg-canvas" /> : null}
              {analytics.error ? <ErrorState message={analytics.error} retry={analytics.retry} /> : null}
              {analytics.data ? (
                <>
                  <div className="h-[320px] min-h-[320px] w-full" aria-label="社媒反馈主题分布条形图">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.data.topics} margin={{ top: 8, right: 8, left: -18, bottom: 6 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EAE3E1" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#665B5D" }} axisLine={{ stroke: "#D8CFCD" }} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: "#665B5D" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ border: "1px solid #EAE3E1", borderRadius: 10, boxShadow: "0 10px 30px rgba(57,37,48,.08)" }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="抖音" fill="#884759" radius={[5, 5, 0, 0]} />
                        <Bar dataKey="小红书" fill="#C58D9B" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-canvas p-4 text-xs leading-5 text-muted"><Info size={17} className="mt-0.5 shrink-0 text-rose" /><span>{analytics.data.drilldown_note}</span></div>
                </>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

