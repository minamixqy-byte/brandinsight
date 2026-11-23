import { ArrowRight, ArrowSquareOut } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useApi } from "../api";
import { EvidenceLink } from "../components/EvidenceLink";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../components/UI";
import type { RecordItem } from "../types";

type ClaimsResponse = { source: string; collected_at: string; items: Array<{ claim_id: string; topic: string; title: string; quote: string; summary: string; source_name: string; collected_at: string; record: RecordItem }> };

export function ClaimsPage() {
  const { data, error, loading, retry } = useApi<ClaimsResponse>("/case/claims");
  const featuredClaim = data?.items[0];
  return (
    <>
      <PageHeader title="品牌宣传" description="将官网采集原文、研究归纳和消费者体验分开呈现，并保留来源入口。" />
      {loading ? <LoadingState rows={3} /> : null}
      {error ? <ErrorState message={error} retry={retry} /> : null}
      {data?.items.length ? (
        <div className="space-y-7">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted"><span className="status-good">官方来源</span><span>{data.source}</span><span>采集日期 {data.collected_at}</span></div>
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-xl bg-plum p-6 text-white md:p-8">
              <p className="text-xs font-bold text-[#e8ccd3]">官方宣传原文示例</p>
              <blockquote className="mt-6 text-3xl font-bold leading-tight tracking-[-0.03em]">“{featuredClaim?.quote}”</blockquote>
              <p className="mt-5 text-sm leading-6 text-[#eadfe3]">{featuredClaim?.source_name}，记录编号 {featuredClaim?.record?.record_id || "原始记录暂缺"}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <EvidenceLink record={featuredClaim?.record} compact />
                {featuredClaim?.record?.source_url ? <a className="inline-flex items-center gap-1 text-sm font-bold text-white underline-offset-4 hover:underline" href={featuredClaim.record.source_url} target="_blank" rel="noreferrer">打开官网商品页<ArrowSquareOut size={16} /></a> : null}
              </div>
            </article>
            <div className="card">
              <h2 className="text-lg font-bold text-ink">字段说明</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div><dt className="text-xs text-muted">宣传原文</dt><dd className="mt-1 text-ink">保留官网采集文字，不替换为研究判断。</dd></div>
                <div><dt className="text-xs text-muted">研究归纳</dt><dd className="mt-1 text-ink">用于组织主题，不作为品牌原话。</dd></div>
                <div><dt className="text-xs text-muted">消费者原声</dt><dd className="mt-1 text-ink">在对照页查看支持、分歧与咨询内容。</dd></div>
              </dl>
            </div>
          </section>
          <section>
            <h2 className="section-title">宣传主题</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {data.items.map((claim) => (
                <article className="card flex flex-col" key={claim.claim_id}>
                  <h3 className="text-lg font-bold text-ink">{claim.title}</h3>
                  <p className="mt-3 text-sm font-bold leading-6 text-plum">“{claim.quote}”</p>
                  <p className="mt-3 text-sm leading-6 text-muted">{claim.summary}</p>
                  <div className="mt-5 flex flex-col items-start gap-2">
                    <Link className="btn-secondary" to={`/compare/${claim.topic}`}>查看对应体验<ArrowRight size={16} /></Link>
                    <EvidenceLink record={claim.record} compact />
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : data ? <EmptyState title="品牌宣传内容暂未就绪" description="页面没有可展示的公开宣传内容，请稍后重试。" /> : null}
    </>
  );
}

