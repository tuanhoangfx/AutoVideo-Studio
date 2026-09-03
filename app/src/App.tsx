import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { HubLazyScreenBoundary } from "@tool-workspace/hub-ui/loading/HubLazyScreenBoundary";
import { ClientProviders } from "@/components/workspace/ClientProviders";

const StudioPage = lazy(() => import("@/pages/StudioPage"));
const SystemScreen = lazy(() => import("@/pages/SystemScreen"));

export default function App() {
  return (
    <HubLazyScreenBoundary label="AutoVideo Studio">
      <ClientProviders>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Navigate to="/studio" replace />} />
            <Route path="/studio" element={<StudioPage />} />
            <Route path="/system" element={<SystemScreen />} />
            <Route path="*" element={<Navigate to="/studio" replace />} />
          </Routes>
        </Suspense>
      </ClientProviders>
    </HubLazyScreenBoundary>
  );
}
