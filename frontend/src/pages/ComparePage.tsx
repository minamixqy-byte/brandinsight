import { ArrowLeft, ArrowRight, CheckCircle, Warning } from "@phosphor-icons/react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "../api";
import { EvidenceLink } from "../components/EvidenceLink";
import { ErrorState, LoadingState, PageHeader } from "../components/UI";
import type { RecordItem } from "../types";

type ComparisonIndex = { items: Array<{ topic: string; title: string; judgment: string; conditions: string; status: string; claim_quote: string }> };
type ComparisonDetail = {
  topic: string; title: string; judgment: string; conditions: string; status: string;
  claim_title: string; claim_quote: string; claim_record_id: string; source_name: string; collected_at: string; claim_summary: string;
  evidence: Array<{ role: string; record: RecordItem }>;
  action: { action_id: string; title: string; action_text: string; owner: string; metric: string } | null;
};

export function ComparePage() {
  const { topic } = useParams();
  if (topic) return <CompareDetail topic={topic} />;
  return <CompareIndexPage />;
}

function CompareIndexPage() {
  const { data, error, loading, retry } = useApi<ComparisonIndex>("/case/comparisons");
  return (
    <>
      <PageHeader title="宣传与体验对照" description="先选择议题，再查看品牌表达、相关反馈、研究判断、适用条件与行动建议。" />
      {loading ? <LoadingState rows={3} /> : null}
      {error ? <ErrorState message={error} retry={retry} /> : null}
      {data ? (
        <div className="grid gap-4 md:grid-cols-3">
          {data.items.map((item) => (
            <article key={item.topic} className="card flex flex-col">
              <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-ink">{item.title}</h2>{item.status === "reviewed" ? <CheckCircle size={21} weight="fill" className="text-success" /> : <Warning size={21} weight="fill" className="text-warning" />}</div>
              <p className="mt-3 text-sm font-bold leading-6 text-plum">“{item.claim_quote}”</p>
              <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted">{item.judgment}</p>
              <Link className="btn-secondary mt-5 self-start" to={`/compare/${item.topic}`}>查看对照<ArrowRight size={16} /></Link>
            </article>
          ))}
        </div>
      ) : null}
    </>
  );
}

function CompareDetail({ topic }: { topic: string }) {
  const { data, error, loading, retry } = useApi<ComparisonDetail>(`/case/comparisons/${topic}`);
  return (
    <>
      <PageHeader title={data?.title || "对照详情"} description="对照品牌表达与消费者实际体验。" action={<Link className="btn-secondary" to="/compare"><ArrowLeft size={17} />返回议题目录</Link>} />
      {loading ? <LoadingState rows={4} /> : null}
      {error ? <ErrorState message={error} retry={retry} /> : null}
      {data ? (
        <div className="space-y-6">
          <section className={`rounded-xl border p-5 md:p-6 ${data.status === "reviewed" ? "border-[#cfe0d7] bg-[#f2f8f5]" : "border-[#ead4b7] bg-[#fff7ec]"}`}>
            <div className="flex items-center gap-2">{data.status === "reviewed" ? <CheckCircle size={21} weight="fill" className="text-success" /> : <Warning size={21} weight="fill" className="text-warning" />}<h2 className="text-lg font-bold text-ink">研究判断</h2></div>
            <p className="mt-3 text-[15px] leading-7 text-ink">{data.judgment}</p>
            <p className="mt-3 text-xs leading-5 text-muted"><strong>适用条件：</strong>{data.conditions}</p>
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <article className="card">
              <p className="text-xs font-bold text-rose">品牌宣传</p>
              <h2 className="mt-2 text-lg font-bold text-ink">{data.claim_title}</h2>
              <blockquote className="mt-4 rounded-lg bg-rose-soft p-5 text-xl font-bold leading-8 text-plum">“{data.claim_quote}”</blockquote>
              <p className="mt-4 text-sm leading-6 text-muted">{data.claim_summary}</p>
              <p className="mt-3 text-xs text-muted">{data.source_name}，采集于 {data.collected_at}</p>
              <Link className="btn-plain mt-3" to={`/evidence?record=${encodeURIComponent(data.claim_record_id)}&from=${encodeURIComponent(`/compare/${topic}`)}`}>查看官网摘录<ArrowRight size={15} /></Link>
            </article>
            <article className="card">
              <p className="text-xs font-bold text-muted">消费者原声</p>
              <div className="mt-3 grid gap-3">{data.evidence.map((item) => <div key={`${item.role}-${item.record.record_id}`}><span className="mb-2 inline-block text-xs font-bold text-muted">分析角色：{item.role}</span><EvidenceLink record={item.record} /></div>)}</div>
            </article>
          </section>
          {data.action ? (
            <section className="panel p-5 md:flex md:items-center md:justify-between md:gap-6 md:p-6">
              <div>
                <p className="text-xs font-bold text-rose">相关行动</p>
                <h2 className="mt-1 text-lg font-bold text-ink">{data.action.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{data.action.action_text}</p>
                <p className="mt-2 text-xs text-muted">{data.action.metric}</p>
              </div>
              <Link className="btn-primary mt-4 md:mt-0" to={`/actions#${data.action.action_id}`}>查看完整建议<ArrowRight size={17} /></Link>
            </section>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

