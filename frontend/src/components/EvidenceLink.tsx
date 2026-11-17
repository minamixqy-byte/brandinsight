import { ArrowRight } from "@phosphor-icons/react";
import { Link, useLocation } from "react-router-dom";
import type { RecordItem } from "../types";

export function EvidenceLink({ record, dataset = "case", compact = false }: { record?: RecordItem | null; dataset?: string; compact?: boolean }) {
  const location = useLocation();
  if (!record) {
    return <span className="status-warn">对应反馈暂缺</span>;
  }
  const id = record.requested_record_id || record.record_id;
  if (record.missing) {
    return <span className="status-warn">对应��馈暂缺</span>;
  }
  const target = `/evidence?dataset=${dataset}&record=${encodeURIComponent(id)}&from=${encodeURIComponent(location.pathname + location.search)}`;
  if (compact) {
    return <Link className="btn-plain" to={target}>查看相关原文<ArrowRight size={14} /></Link>;
  }
  return (
    <Link to={target} className="group block rounded-lg bg-canvas px-4 py-3 transition hover:bg-rose-soft">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
        <span>{record.platform || "平台未知"}</span>
        <span>{record.content_type || "类型未知"}</span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-muted">{record.original_text || "原文缺失"}</p>
      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-rose">查看原文<ArrowRight size={12} /></span>
    </Link>
  );
}

