import { CheckCircle, FileCsv, FileXls, UploadSimple, WarningCircle, X } from "@phosphor-icons/react";
import { ChangeEvent, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, useApi } from "../api";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../components/UI";

type Issue = { severity: "blocking" | "warning"; code: string; message: string; row?: number; field?: string; record_id?: string };
type Preview = {
  token: string; original_name: string; file_type: "csv" | "xlsx"; file_size: number; sheets: string[]; selected_sheet: string | null;
  headers: string[]; mapping: Record<string, string>; preview: Array<Record<string, unknown>>;
  validation: { issues: Issue[]; summary: Record<string, number>; has_blocking: boolean };
};
type Validation = { token: string; headers: string[]; preview: Array<Record<string, unknown>>; selected_sheet: string | null; mapping: Record<string, string>; issues: Issue[]; summary: Record<string, number>; has_blocking: boolean };
type CommitResult = { token: string; status: string; inserted: number; skipped: number; conflicts: number; inserted_ids: string[]; idempotent_replay: boolean };
type ImportHistory = { items: Array<{ token: string; original_name: string; file_type: string; status: string; inserted_rows: number; skipped_rows: number; conflict_rows: number; created_at: string; committed_at: string | null }> };

const fields = [
  { key: "platform", label: "平台", required: true },
  { key: "content_type", label: "内容类型", required: true },
  { key: "original_text", label: "原文", required: true },
  { key: "source_record_id", label: "原始编号", required: false },
  { key: "source_url", label: "来源 HTTP(S)", required: false },
  { key: "published_at_raw", label: "日期", required: false },
  { key: "theme", label: "主题", required: false },
  { key: "sentiment", label: "情感", required: false }
];

export function DataPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [sheet, setSheet] = useState("");
  const [result, setResult] = useState<CommitResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const history = useApi<ImportHistory>("/imports");

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setMessage(null); setResult(null); setValidation(null);
    try {
      const body = new FormData(); body.append("file", file);
      const response = await apiFetch<Preview>("/imports/preview", { method: "POST", body });
      setPreview(response); setMapping(response.mapping); setSheet(response.selected_sheet || "");
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  };
  const validate = async () => {
    if (!preview) return; setBusy(true); setMessage(null);
    try {
      const response = await apiFetch<Validation>(`/imports/${preview.token}/validate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mapping, sheet: sheet || null }) });
      setValidation(response);
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  };
  const commit = async () => {
    if (!preview) return; setBusy(true); setMessage(null);
    try {
      const response = await apiFetch<CommitResult>(`/imports/${preview.token}/commit`, { method: "POST" });
      setResult(response); history.retry();
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  };
  const cancel = () => { setPreview(null); setValidation(null); setResult(null); setMapping({}); setSheet(""); setMessage(null); };

  return (
    <>
      <PageHeader title="数据管理" description="案例数据只读。CSV 或 XLSX 预览、校验并确认后，只写入试验数据集。" />
      <section className="mb-6 grid gap-4 md:grid-cols-2">
        <article className="card"><div className="flex items-center justify-between"><div><p className="text-xs text-muted">案例数据集</p><h2 className="mt-1 text-lg font-bold text-ink">xlz-case-v1</h2></div><span className="status-good">只读</span></div><p className="mt-3 text-sm leading-6 text-muted">源自统一明细表与反馈 CSV，种子脚本可重复执行。</p></article>
        <article className="card"><div className="flex items-center justify-between"><div><p className="text-xs text-muted">试验数据集</p><h2 className="mt-1 text-lg font-bold text-ink">xlz-sandbox-v1</h2></div><span className="status-neutral">可导入</span></div><p className="mt-3 text-sm leading-6 text-muted">导入记录与案例数据隔离，可按编号检索验证。</p></article>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-4 text-xs font-bold text-muted">
          <span className={!preview ? "status-good" : "status-neutral"}>选择文件</span><span>→</span><span className={preview && !validation ? "status-good" : "status-neutral"}>字段映射</span><span>→</span><span className={validation && !result ? "status-good" : "status-neutral"}>确认写入</span><span>→</span><span className={result ? "status-good" : "status-neutral"}>导入结果</span>
        </div>
        <div className="p-5 md:p-6">
          {!preview ? (
            <div className="rounded-xl border-2 border-dashed border-[#d8c8ca] bg-canvas px-5 py-12 text-center">
              <UploadSimple size={36} className="mx-auto text-rose" />
              <h2 className="mt-4 text-lg font-bold text-ink">选择一个 CSV 或 XLSX 文件</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">最大 20 MB。CSV 支持 UTF-8、UTF-8 BOM 和 GB18030。XLSX 可选择 Sheet，预览前 20 行。</p>
              <button className="btn-primary mt-5" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? "正在读取" : "浏览文件"}</button>
              <input ref={inputRef} className="sr-only" type="file" accept=".csv,.xlsx" onChange={upload} />
            </div>
          ) : result ? (
            <div>
              <div className="flex items-start gap-3"><CheckCircle size={28} weight="fill" className="shrink-0 text-success" /><div><h2 className="text-xl font-bold text-ink">导入完成</h2><p className="mt-1 text-sm leading-6 text-muted">新增 {result.inserted} 条，跳过重复 {result.skipped} 条，冲突 {result.conflicts} 条。{result.idempotent_replay ? "这是同一批次的幂等重放。" : "写入事务已完成。"}</p></div></div>
              <div className="mt-6 flex flex-wrap gap-3">{result.inserted_ids?.[0] ? <Link className="btn-primary" to={`/evidence?dataset=sandbox&q=${encodeURIComponent(result.inserted_ids[0])}`}>检索新增记录</Link> : <Link className="btn-secondary" to="/evidence?dataset=sandbox">查看试验数据集</Link>}<button className="btn-secondary" onClick={cancel}>导入另一个文件</button></div>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3">{preview.file_type === "csv" ? <FileCsv size={27} className="text-rose" /> : <FileXls size={27} className="text-rose" />}<div><h2 className="font-bold text-ink">{preview.original_name}</h2><p className="text-xs text-muted">{(preview.file_size / 1024).toFixed(1)} KB</p></div></div><button className="btn-secondary" onClick={cancel}><X size={17} />取消</button></div>
              {preview.sheets.length ? <label className="mt-5 block max-w-sm"><span className="mb-1.5 block text-xs font-bold text-muted">选择 Sheet</span><select className="field" value={sheet} onChange={(event) => { setSheet(event.target.value); setValidation(null); }}>{preview.sheets.map((name) => <option key={name}>{name}</option>)}</select></label> : null}
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {fields.map((field) => <label key={field.key}><span className="mb-1.5 block text-xs font-bold text-muted">{field.label}{field.required ? <span className="text-rose"> *</span> : null}</span><select className="field" value={mapping[field.key] || ""} onChange={(event) => { setMapping((current) => ({ ...current, [field.key]: event.target.value })); setValidation(null); }}><option value="">不映射</option>{preview.headers.map((header) => <option key={header} value={header}>{header || "未命名列"}</option>)}</select></label>)}
              </div>
              <div className="mt-6 overflow-x-auto rounded-lg border border-line"><table className="min-w-full border-collapse text-left text-xs"><thead className="bg-[#f7f3f2]"><tr>{preview.headers.map((header, index) => <th key={`${header}-${index}`} className="whitespace-nowrap px-3 py-2 font-bold text-muted">{header || `未命名列 ${index + 1}`}</th>)}</tr></thead><tbody>{(validation?.preview || preview.preview).slice(0, 20).map((row, rowIndex) => <tr key={rowIndex} className="border-t border-line">{preview.headers.map((header, index) => <td key={`${header}-${index}`} className="max-w-[260px] truncate px-3 py-2 text-ink">{String(row[header] ?? "")}</td>)}</tr>)}</tbody></table></div>
              <p className="mt-2 text-xs text-muted">预览最多显示 20 行。表格内容按纯文本渲染。</p>
              {validation ? <ValidationReport validation={validation} /> : null}
              <div className="mt-6 flex flex-wrap gap-3"><button className="btn-secondary" onClick={validate} disabled={busy}>{busy ? "正在校验" : validation ? "重新校验" : "校验字段与记录"}</button><button className="btn-primary" onClick={commit} disabled={busy || !validation || validation.has_blocking}>{busy ? "正在处理" : "确认写入试验数据集"}</button></div>
            </div>
          )}
          {message ? <div className="mt-5 flex items-start gap-2 rounded-lg bg-[#fff1ee] p-4 text-sm text-[#7a302f]" role="alert"><WarningCircle size={19} className="mt-0.5 shrink-0" />{message}</div> : null}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="section-title">导入记录</h2>
        <div className="mt-4">{history.loading ? <LoadingState rows={2} /> : history.error ? <ErrorState message={history.error} retry={history.retry} /> : history.data?.items.length ? <div className="panel overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-[#f7f3f2] text-xs text-muted"><tr><th className="px-4 py-3">文件名</th><th className="px-4 py-3">状态</th><th className="px-4 py-3">新增</th><th className="px-4 py-3">重复</th><th className="px-4 py-3">冲突</th><th className="px-4 py-3">创建时间</th></tr></thead><tbody>{history.data.items.map((item) => <tr key={item.token} className="border-t border-line"><td className="px-4 py-3 font-bold text-ink">{item.original_name}</td><td className="px-4 py-3"><span className={item.status === "committed" ? "status-good" : item.status === "failed" ? "status-warn" : "status-neutral"}>{item.status}</span></td><td className="px-4 py-3">{item.inserted_rows}</td><td className="px-4 py-3">{item.skipped_rows}</td><td className="px-4 py-3">{item.conflict_rows}</td><td className="px-4 py-3 text-muted">{item.created_at}</td></tr>)}</tbody></table></div> : <EmptyState title="尚无导入记录" description="选择一份 CSV 或 XLSX 文件后，预览、校验和提交状态会显示在这里。" />}</div>
      </section>
    </>
  );
}

function ValidationReport({ validation }: { validation: Validation }) {
  return (
    <div className="mt-6 rounded-lg border border-line bg-canvas p-4">
      <div className="flex flex-wrap items-center gap-3 text-sm"><strong className="text-ink">校验结果</strong><span>有效 {validation.summary.valid || 0}</span><span>空行 {validation.summary.blank || 0}</span><span>重复 {validation.summary.duplicates || 0}</span><span>冲突 {validation.summary.conflicts || 0}</span></div>
      {validation.issues.length ? <ul className="mt-3 max-h-52 space-y-2 overflow-y-auto text-xs leading-5">{validation.issues.map((issue, index) => <li key={`${issue.code}-${issue.row || index}`} className={issue.severity === "blocking" ? "text-[#8a2f35]" : "text-warning"}><strong>{issue.severity === "blocking" ? "阻断" : "提示"}：</strong>{issue.message}</li>)}</ul> : <p className="mt-3 text-sm text-success">没有发现阻断错误，可以确认写入。</p>}
    </div>
  );
}

