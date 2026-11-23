import React, { lazy, Suspense, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { LandingPage } from "./pages/LandingPage";
import "./index.css";

const OverviewPage = lazy(() => import("./pages/OverviewPage").then((module) => ({ default: module.OverviewPage })));
const ClaimsPage = lazy(() => import("./pages/ClaimsPage").then((module) => ({ default: module.ClaimsPage })));
const ConsumerPage = lazy(() => import("./pages/ConsumerPage").then((module) => ({ default: module.ConsumerPage })));
const ComparePage = lazy(() => import("./pages/ComparePage").then((module) => ({ default: module.ComparePage })));
const ActionsPage = lazy(() => import("./pages/ActionsPage").then((module) => ({ default: module.ActionsPage })));
const EvidencePage = lazy(() => import("./pages/EvidencePage").then((module) => ({ default: module.EvidencePage })));
const DataPage = lazy(() => import("./pages/DataPage").then((module) => ({ default: module.DataPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));

const pending = (element: React.ReactNode) => <Suspense fallback={<div className="h-36 animate-pulse rounded-xl border border-line bg-white" aria-label="正在加载页面" />}>{element}</Suspense>;

class AppErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Brand Insight 页面加载失败", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="grid min-h-screen place-items-center bg-canvas px-6 py-12 text-ink">
          <div className="w-full max-w-md text-center">
            <p className="mb-5 text-xl font-bold tracking-tight">brandinsight</p>
            <h1 className="text-xl font-semibold">页面暂时未能加载</h1>
            <p className="mt-3 text-sm leading-7 text-muted">浏览器可能仍在使用旧版资源，重新加载即可获取最新页面。</p>
            <button
              type="button"
              className="mt-6 rounded-lg bg-rose px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              onClick={() => window.location.reload()}
            >
              重新加载
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

function AppReady() {
  useEffect(() => {
    document.documentElement.dataset.appReady = "true";
  }, []);

  return null;
}

const router = createBrowserRouter([
  { path: "/", element: pending(<LandingPage />) },
  { path: "/case", element: <Navigate to="/workspace" replace /> },
  { path: "/workspace/hr", element: <Navigate to="/workspace" replace /> },
  {
    element: <AppShell />,
    children: [
      { path: "workspace", element: pending(<OverviewPage />) },
      { path: "claims", element: pending(<ClaimsPage />) },
      { path: "consumer", element: pending(<ConsumerPage />) },
      { path: "compare", element: pending(<ComparePage />) },
      { path: "compare/:topic", element: pending(<ComparePage />) },
      { path: "actions", element: pending(<ActionsPage />) },
      { path: "evidence", element: pending(<EvidencePage />) },
      { path: "data", element: pending(<DataPage />) }
    ]
  },
  { path: "*", element: pending(<NotFoundPage />) }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppReady />
      <RouterProvider router={router} />
    </AppErrorBoundary>
  </React.StrictMode>
);

