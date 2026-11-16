import { Link } from "react-router-dom";
import { EmptyState, PageHeader } from "../components/UI";

export function NotFoundPage() {
  return <><PageHeader title="页面不存在" /><EmptyState description="这个地址不属于当前项目。可以返回小露珠项目总览继续浏览。" action={<Link className="btn-primary" to="/case">返回项目总览</Link>} /></>;
}

