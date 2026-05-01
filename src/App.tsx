import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MenuProvider, useMenu } from "./contexts/MenuContext";
import { AppProvider, useApp } from "./contexts/AppContext";
import { TableProvider } from "./contexts/TableContext";
import { SplitProvider, useSplit } from "./contexts/SplitContext";
import { useBreakpoint } from "./hooks/useBreakpoint";
import { TablesView } from "./views/TablesView";
import { OrderView } from "./views/OrderView";
import { TicketView } from "./views/TicketView";
import { SplitEqualView } from "./views/SplitEqualView";
import { SplitItemView } from "./views/SplitItemView";
import { SplitConfirmView } from "./views/SplitConfirmView";
import { SplitDoneView } from "./views/SplitDoneView";
import { DailySalesView } from "./views/DailySalesView";
import LoginView from "./views/LoginView";
import { Toast } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ConflictResolutionModal } from "./components/ConflictResolutionModal";
import { useTable } from "./contexts/TableContext";
import { S } from "./styles/appStyles";

function LoadingScreen() {
  const { isTabletLandscape, isTablet, isDesktop } = useBreakpoint();
  const rootStyle = isDesktop || isTabletLandscape ? S.rootTabletLandscape : isTablet ? S.rootTablet : S.root;

  return (
    <div style={rootStyle}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: "20px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #f3f3f3",
            borderTop: "3px solid #000",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

function Router() {
  const { view, toast } = useApp();
  const { menuLoading } = useMenu();
  const { isAuthenticated } = useAuth();
  const { syncError, conflicts, resolveConflict } = useTable();
  const { isTabletLandscape, isTablet, isDesktop } = useBreakpoint();

  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  if (menuLoading) return <LoadingScreen />;

  // Auth guard: show login if not authenticated
  if (!isAuthenticated) return <LoginView />;

  const rootStyle = isDesktop || isTabletLandscape ? S.rootTabletLandscape : isTablet ? S.rootTablet : S.root;

  return (
    <div style={rootStyle}>
      {syncError && (
        <div
          style={{
            background: "#b45309",
            color: "#fff",
            padding: "6px 12px",
            fontSize: 13,
            textAlign: "center",
            fontWeight: 500,
          }}
        >
          Sync offline — table changes may not save
        </div>
      )}
      {toast && <Toast message={toast} />}

      {conflicts.length > 0 && (
        <ConflictResolutionModal
          conflict={conflicts[0]}
          conflictIndex={1}
          totalConflicts={conflicts.length}
          onResolve={(resolution) => resolveConflict(conflicts[0], resolution)}
        />
      )}

      {view === "tables" && <TablesView />}
      {view === "order" && <OrderView />}
      {view === "ticket" && <TicketView />}
      {view === "split" && <SplitRouter />}
      {view === "splitConfirm" && <SplitConfirmView />}
      {view === "splitDone" && <SplitDoneView />}
      {view === "dailySales" && (
        <ErrorBoundary inline>
          <DailySalesView />
        </ErrorBoundary>
      )}
    </div>
  );
}

function SplitRouter() {
  const { state } = useSplit();

  if (state.mode === "equal") return <SplitEqualView />;
  if (state.mode === "item") return <SplitItemView />;

  // Fallback: no mode set yet — shouldn't happen, but handle gracefully
  return <SplitItemView />;
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <MenuProvider>
        <AuthProvider>
          <AppProvider>
            <TableProvider>
              <SplitProvider>
                <Router />
              </SplitProvider>
            </TableProvider>
          </AppProvider>
        </AuthProvider>
      </MenuProvider>
    </ErrorBoundary>
    </QueryClientProvider>
  );
}
