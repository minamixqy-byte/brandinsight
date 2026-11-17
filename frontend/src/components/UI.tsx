import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <header className="mb-7 flex flex-col gap-5 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-2 text-[11px] font-bold text-rose">赫莲娜 / 小露珠消费者研究</p>
        <h1 className="page-title">{title}</h1>
        {description ? <p className="mt-2 max-w-[68ch] text-[15px] leading-7 text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-4" aria-live="polite" aria-label="正在加载">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-2xl border border-line bg-white" />
      ))}
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="panel flex flex-col items-start gap-3 p-6" role="alert">
      <div className="flex items-center gap-2 font-bold text-ink"><WarningCircle size={20} className="text-rose" />数据暂时无法读取</div>
      <p className="text-sm leading-6 text-muted">{message}。已加载的本地页面仍可浏览，恢复服务后可重试。</p>
      {retry ? <button className="btn-secondary" onClick={retry}><ArrowClockwise size={18} />带当前条件重试</button> : null}
    </div>
  );
}

export function EmptyState({ title = "没有匹配记录", description, action }: { title?: string; description: string; action?: ReactNode }) {
  return (
    <div className="panel px-6 py-12 text-center">
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

