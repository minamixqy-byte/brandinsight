import { ArrowRight, Target } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useApi } from "../api";
import { EvidenceLink } from "../components/EvidenceLink";
import { ErrorState, LoadingState, PageHeader } from "../components/UI";
import type { RecordItem } from "../types";

type ActionsResponse = { items: Array<{ action_id: string; title: string; action_text: string; owner: string; metric: string; topic: string; priority: number; evidence: RecordItem[] }> };

const findingByAction: Record<string, string> = {
  "action-usage": "消费者仍在确认产品类别、使用步骤、季节与搭配方式，信息入口需要统一。",
  "action-trial": "试用能够推动购买，但小样与正装的前后体验差异仍需要记录与核查。",
  "action-service": "赠品、价保和退换信息的展示方式会影响消费者对品牌服务的判断。",
  "action-package": "瓶盖、泵头、喷瓶与携带问题反复出现，取用体验需要原型测试。"
};

export function ActionsPage() {
  const { data, error, loading, retry } = useApi<ActionsResponse>("/case/recommendations");
  return (
    <>
      <PageHeader title="行动建议" description="按优先级查看品牌动作、负责团队与验证指标。" />
      {loading ? <LoadingState rows={4} /> : null}
      {error ? <ErrorState message={error} retry={retry} /> : null}
      {data ? (
        <div className="space-y-4">
          {data.items.map((action, index) => (
            <article id={action.action_id} key={action.action_id} className={`scroll-mt-24 rounded-xl border bg-white p-5 md:p-7 ${index === 0 ? "border-[#cfafb7] shadow-soft" : "border-line"}`}>
              <div className="flex items-center gap-2"><span className={index === 0 ? "status-good" : "status-neutral"}>{index === 0 ? "首要建议" : `优先级 ${action.priority}`}</span><Target size={19} className="text-rose" /></div>
              <h2 className="mt-3 text-xl font-bold text-ink">{action.title}</h2>
              <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <section className="rounded-xl bg-rose-soft p-5"><h3 className="text-xs font-bold text-rose">品牌动作</h3><p className="mt-3 text-sm font-bold leading-7 text-plum">{action.action_text}</p></section>
                  <dl className="grid gap-4 rounded-xl border border-line p-5 sm:grid-cols-2 lg:grid-cols-1">
                    <div><dt className="text-xs font-bold text-rose">负责团队</dt><dd className="mt-2 text-sm font-bold text-ink">{action.owner}</dd></div>
                    <div><dt className="text-xs font-bold text-rose">验证指标</dt><dd className="mt-2 text-sm font-bold leading-6 text-ink">{action.metric}</dd></div>
                  </dl>
                </div>
                <div className="space-y-4">
                  <section className="rounded-xl bg-canvas p-5"><h3 className="text-xs font-bold text-rose">数据发现</h3><p className="mt-3 text-sm leading-7 text-ink">{findingByAction[action.action_id]}</p></section>
                  <section className="rounded-xl bg-canvas p-5"><h3 className="text-xs font-bold text-muted">相关消费者原声</h3><blockquote className="mt-3 line-clamp-3 text-sm leading-6 text-muted">“{action.evidence[0]?.original_text || "暂无关联原文。"}”</blockquote><div className="mt-3 flex flex-wrap gap-2">{action.evidence.map((record) => <EvidenceLink key={record.requested_record_id || record.record_id} record={record} compact />)}</div></section>
                </div>
              </div>
              {action.topic === "steps" ? <Link className="btn-secondary mt-4" to="/compare/steps">查看宣传与体验对照<ArrowRight size={16} /></Link> : null}
            </article>
          ))}
        </div>
      ) : null}
    </>
  );
}

