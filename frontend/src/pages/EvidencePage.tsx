import { ArrowLeft, ArrowRight, DownloadSimple, MagnifyingGlass, X } from "@phosphor-icons/react";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApi } from "../api";
import { EvidenceDrawer } from "../components/EvidenceDrawer";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../components/UI";
import type { SearchData } from "../types";

export function EvidencePage() {
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(params.get("q") || "");
  const dataset = params.get("dataset") || "case";
  const page = Number(params.get("page") || 1);
  const query = new URLSearchParams();
  for (const key of ["dataset", "q", "platform", "content_type", "theme", "sentiment", "page"]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }
  if (!query.has("dataset")) query.set("dataset", dataset);
  const { data, error, loading, retry } = useApi<SearchData>(`/records?${query.toString()}`);
  useEffect(() => setDraft(params.get("q") || ""), [params]);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== "page") next.delete("page");
    next.delete("record");
    next.delete("from");
    setParams(next);
  };
  const submit = (event: FormEvent) => { event.preventDefault(); update("q", draft.trim()); };
  const clear = () => setParams(dataset === "sandbox" ? { dataset: "sandbox" } : {});
  const exportHref = `/api/records-export?${query.toString()}`;

  return (
    <>
      <PageHeader title="用户反馈" description="按关键词、记录号、平台、内容类型、主题与情绪查找采集原文。" action={<a className="btn-secondary" href={exportHref}><DownloadSimple size={17} />导出当前结果</a>} />
      <section className="panel mb-5 p-4 md:p-5">
        <div className="mb-4 flex gap-2">
          <button className={dataset === "case" ? "btn-primary" : "btn-secondary"} onClick={() => update("dataset", "case")}>案例数据集</button>
          <button className={dataset === "sandbox" ? "btn-primary" : "btn-secondary"} onClick={() => update("dataset", "sandbox")}>试验数据集</button>
        </div>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(250px,1fr)_150px_170px_160px_150px_auto]" onSubmit={submit}>
          <label><span className="mb-1.5 block text-xs font-bold text-muted">关键词或记录号</span><div className="relative"><MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input className="field pl-10" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="如 干皮单用 或 20261029_T00238" /></div></label>
          <label><span className="mb-1.5 block text-xs font-bold text-muted">平台</span><select className="field" value={params.get("platform") || ""} onChange={(event) => update("platform", event.target.value)}><option value="">全部平台</option>{data?.facets.platforms.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span className="mb-1.5 block text-xs font-bold text-muted">内容类型</span><select className="field" value={params.get("content_type") || ""} onChange={(event) => update("content_type", event.target.value)}><option value="">全部内容类型</option>{data?.facets.content_types.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span className="mb-1.5 block text-xs font-bold text-muted">主题</span><select className="field" value={params.get("theme") || ""} onChange={(event) => update("theme", event.target.value)}><option value="">全部主题</option>{data?.facets.themes.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span className="mb-1.5 block text-xs font-bold text-muted">情绪</span><select className="field" value={params.get("sentiment") || ""} onChange={(event) => update("sentiment", event.target.value)}><option value="">全部情绪</option>{data?.facets.sentiments?.map((item) => <option key={item}>{item}</option>)}</select></label>
          <div className="flex items-end gap-2"><button className="btn-primary" type="submit">搜索</button><button className="btn-secondary px-3" type="button" onClick={clear} aria-label="清除筛选"><X size={18} /></button></div>
        </form>
        <p className="mt-3 text-xs text-muted">日期字段在不同平台的可用性不一致，当前版本不提供跨平台日期范围筛选。</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted"><span>示例：</span><button className="font-bold text-rose hover:underline" onClick={() => { setDraft("干皮单用"); update("q", "干皮单用"); }}>干皮单用</button><button className="font-bold text-rose hover:underline" onClick={() => { setDraft("20261029_T00238"); update("q", "20261029_T00238"); }}>20261029_T00238</button><button className="font-bold text-rose hover:underline" onClick={() => { setDraft("XHS_N002"); update("q", "XHS_N002"); }}>XHS_N002</button></div>
      </section>

      {loading ? <LoadingState rows={5} /> : null}
      {error ? <ErrorState message={error} retry={retry} /> : null}
      {data && data.total === 0 ? <EmptyState description="当前关键词与筛选条件没有匹配记录。可以清除条件，或切换到另一数据集。" action={<button className="btn-secondary" onClick={clear}>清除全部条件</button>} /> : null}
      {data && data.total > 0 ? (
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 text-sm"><span className="font-bold text-ink">共 {data.total.toLocaleString("zh-CN")} 条</span><span className="text-xs text-muted">第 {data.page} / {data.pages} 页</span></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead className="bg-[#f7f3f2] text-xs text-muted"><tr><th className="px-4 py-3 font-bold">记录编号</th><th className="px-4 py-3 font-bold">平台</th><th className="px-4 py-3 font-bold">内容类型</th><th className="px-4 py-3 font-bold">主题</th><th className="px-4 py-3 font-bold">原文摘要</th><th className="px-4 py-3 font-bold">操作</th></tr></thead>
              <tbody>{data.items.map((record) => {
                const next = new URLSearchParams(params); next.set("record", record.record_id); next.delete("from");
                return <tr key={record.record_id} className="border-t border-line align-top hover:bg-[#fdfbfa]"><td className="px-4 py-4 font-bold text-rose">{record.record_id}</td><td className="px-4 py-4 text-muted">{record.platform}</td><td className="px-4 py-4 text-muted">{record.content_type}</td><td className="px-4 py-4">{record.theme ? <span className="status-neutral">{record.theme}</span> : <span className="status-warn">未标注</span>}</td><td className="max-w-[420px] px-4 py-4 leading-6 text-ink"><span className="line-clamp-2">{record.original_text || "原文缺失"}</span></td><td className="px-4 py-4"><button className="btn-plain" onClick={() => setParams(next)}>查看<ArrowRight size={14} /></button></td></tr>;
              })}</tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-line p-4">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => update("page", String(page - 1))}><ArrowLeft size={16} />上一页</button>
            <span className="text-xs text-muted">每页 {data.page_size} 条</span>
            <button className="btn-secondary" disabled={page >= data.pages} onClick={() => update("page", String(page + 1))}>下一页<ArrowRight size={16} /></button>
          </div>
        </section>
      ) : null}
      <EvidenceDrawer />
    </>
  );
}

