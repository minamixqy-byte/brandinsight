import React, { lazy, Suspense } from "react";
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
  <React.StrictMode><RouterProvider router={router} /></React.StrictMode>
);

