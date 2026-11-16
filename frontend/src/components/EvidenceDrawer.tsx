import { ArrowLeft, ArrowSquareOut, CalendarBlank, Copy, X } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useApi } from "../api";
import type { RecordItem } from "../types";
import { ErrorState, LoadingState } from "./UI";

export function EvidenceDrawer() {
  const [params] = useSearchParams();
  const recordId = params.get("record");
  const dataset = params.get("dataset") || "case";
  const from = params.get("from");
  const navigate = useNavigate();
  const location = useLocation();
  const closeRef = useRef<HTMLButtonElement>(null);
  const { data, error, loading, retry } = useApi<RecordItem>(recordId ? `/records/${dataset}/${encodeURIComponent(recordId)}` : null);

  const close = () => {
    if (from) navigate(from);
    else {
      const next = new URLSearchParams(params);
      next.delete("record");
      next.delete("from");
      navigate({ pathname: "/evidence", search: next.toString() }, { replace: false });
    }
  };

  useEffect(() => {
    if (!recordId) return;
    const prior = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prior?.focus?.();
    };
  }, [recordId, location.key]);

  if (!recordId) return null;
  return (
    <div className="fixed inset-0 z-40 bg-plum/25" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) close(); }}>
      <aside role="dialog" aria-modal="true" aria-labelledby="evidence-title" className="ml-auto h-full w-full overflow-y-auto border-l border-line bg-white shadow-2xl md:max-w-[620px]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <button ref={closeRef} className="btn-secondary" onClick={close}><ArrowLeft size={18} />返回</button>
          <button className="rounded-lg p-2 text-muted hover:bg-rose-soft hover:text-rose" onClick={close} aria-label="关闭原文详情"><X size={22} /></button>
        </div>
        <div className="p-5 md:p-7">
          {loading ? <LoadingState rows={3} /> : null}
          {error ? <ErrorState message={error} retry={retry} /> : null}
          {data ? (
            <>
              <p className="text-xs font-bold text-rose">采集原文</p>
              <h2 id="evidence-title" className="mt-2 text-2xl font-bold text-ink">{data.requested_record_id || data.record_id}</h2>
              {data.resolved_alias ? <p className="mt-2 text-xs text-muted">已核对别名，统一明细主键为 {data.record_id}</p> : null}
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="status-neutral">{data.platform || "平台未知"}</span>
                <span className="status-neutral">{data.content_type || "类型未知"}</span>
                <span className={data.theme ? "status-good" : "status-warn"}>{data.theme || "未标注主题"}</span>
                <span className={data.sentiment ? "status-good" : "status-warn"}>{data.sentiment || "未标注情感"}</span>
              </div>
              <blockquote className="mt-6 whitespace-pre-wrap rounded-xl bg-canvas p-5 text-[15px] leading-7 text-ink">{data.original_text || "此记录在源表中没有可显示的采集原文。"}</blockquote>
              <dl className="mt-7 grid gap-4 border-t border-line pt-6 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-muted">记录编号</dt><dd className="mt-1 font-bold text-ink">{data.record_id}</dd></div>
                <div><dt className="text-xs text-muted">来源类型</dt><dd className="mt-1 font-bold text-ink">{data.source_type || data.content_type || "缺失"}</dd></div>
                <div><dt className="text-xs text-muted">作者类别</dt><dd className="mt-1 font-bold text-ink">{data.author_type || "未知"}</dd></div>
                <div><dt className="text-xs text-muted">可用日期</dt><dd className="mt-1 flex items-center gap-1.5 font-bold text-ink"><CalendarBlank size={16} />{data.published_at_raw || data.collected_at || "缺失"}</dd></div>
              </dl>
              <div className="mt-7 flex flex-wrap gap-3">
                <button className="btn-secondary" onClick={() => navigator.clipboard?.writeText(data.original_text || "")}><Copy size={18} />复制原文</button>
                {data.source_url ? <a className="btn-primary" href={data.source_url} target="_blank" rel="noreferrer"><ArrowSquareOut size={18} />{data.platform === "天猫" ? "打开商品页" : data.platform === "抖音" ? "打开父视频" : data.platform === "小红书" ? "打开父笔记" : "打开来源"}</a> : <span className="status-warn">来源链接缺失</span>}
              </div>
              {data.actions?.length ? (
                <div className="mt-8 border-t border-line pt-6">
                  <h3 className="text-base font-bold text-ink">相关建议</h3>
                  <div className="mt-3 flex flex-col gap-2">{data.actions.map((action) => <Link key={action.action_id} className="btn-plain" to={`/#${action.action_id}`}>{action.title}</Link>)}</div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

